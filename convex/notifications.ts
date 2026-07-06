import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireUserId } from "./lib/auth";
import {
	buildDedupeKey,
	shouldSendEmail,
	shouldSendPush,
	type NotificationChannel,
	type NotificationType,
} from "./lib/notifications";
import { resolveUserPreferences } from "./lib/preferences";
import { internal } from "./_generated/api";

const channelValidator = v.union(
	v.literal("email"),
	v.literal("push"),
	v.literal("in_app"),
);

const typeValidator = v.union(
	v.literal("fixed_expense_reminder"),
	v.literal("budget_threshold"),
	v.literal("period_report"),
	v.literal("credit_due"),
);

export const subscribePush = mutation({
	args: {
		endpoint: v.string(),
		p256dh: v.string(),
		auth: v.string(),
		userAgent: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const existing = await ctx.db
			.query("pushSubscriptions")
			.withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
			.unique();

		if (existing) {
			if (existing.userId !== userId) {
				await ctx.db.delete(existing._id);
			} else {
				return existing._id;
			}
		}

		const id = await ctx.db.insert("pushSubscriptions", {
			userId,
			endpoint: args.endpoint,
			p256dh: args.p256dh,
			auth: args.auth,
			userAgent: args.userAgent,
			createdAt: Date.now(),
		});

		const prefs = await ctx.db
			.query("userPreferences")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.unique();
		if (prefs) {
			await ctx.db.patch(prefs._id, { pushEnabled: true, updatedAt: Date.now() });
		}

		return id;
	},
});

export const unsubscribePush = mutation({
	args: { endpoint: v.string() },
	handler: async (ctx, { endpoint }) => {
		const userId = await requireUserId(ctx);
		const existing = await ctx.db
			.query("pushSubscriptions")
			.withIndex("by_endpoint", (q) => q.eq("endpoint", endpoint))
			.unique();
		if (existing && existing.userId === userId) {
			await ctx.db.delete(existing._id);
		}
		return null;
	},
});

export const dispatch = internalMutation({
	args: {
		userId: v.id("users"),
		type: typeValidator,
		referenceId: v.string(),
		channels: v.array(channelValidator),
		payload: v.object({
			title: v.string(),
			body: v.string(),
			url: v.optional(v.string()),
			emailSubject: v.optional(v.string()),
			emailHtml: v.optional(v.string()),
			reportSummary: v.optional(
				v.object({
					totalIncome: v.number(),
					totalExpense: v.number(),
					net: v.number(),
					byCategory: v.array(
						v.object({
							name: v.string(),
							amount: v.number(),
						}),
					),
				}),
			),
		}),
		dateKey: v.string(),
		dedupeSuffix: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const prefsDoc = await ctx.db
			.query("userPreferences")
			.withIndex("by_user", (q) => q.eq("userId", args.userId))
			.unique();
		const prefs = resolveUserPreferences(prefsDoc);

		const refId = args.dedupeSuffix
			? `${args.referenceId}:${args.dedupeSuffix}`
			: args.referenceId;

		for (const channel of args.channels as NotificationChannel[]) {
			if (channel === "email" && !shouldSendEmail(prefs, args.type as NotificationType)) {
				continue;
			}
			if (channel === "push" && !shouldSendPush(prefs)) {
				continue;
			}

			const dedupeKey = buildDedupeKey(
				args.userId,
				args.type as NotificationType,
				refId,
				channel,
				args.dateKey,
			);

			const existing = await ctx.db
				.query("notificationLog")
				.withIndex("by_dedupeKey", (q) => q.eq("dedupeKey", dedupeKey))
				.unique();
			if (existing) continue;

			if (channel === "in_app") {
				await ctx.db.insert("notificationLog", {
					userId: args.userId,
					dedupeKey,
					type: args.type,
					referenceId: refId,
					channel,
					sentAt: Date.now(),
				});
				continue;
			}

			if (channel === "email") {
				const user = await ctx.db.get(args.userId);
				if (!user?.email) continue;

				if (
					args.type === "period_report" &&
					args.payload.reportSummary
				) {
					await ctx.scheduler.runAfter(
						0,
						internal.notificationActions.sendEmailWithReport,
						{
							to: user.email,
							subject: args.payload.emailSubject ?? args.payload.title,
							html:
								args.payload.emailHtml ?? `<p>${args.payload.body}</p>`,
							label: args.dateKey,
							summary: args.payload.reportSummary,
						},
					);
				} else {
					await ctx.scheduler.runAfter(
						0,
						internal.notificationActions.sendEmail,
						{
							to: user.email,
							subject: args.payload.emailSubject ?? args.payload.title,
							html:
								args.payload.emailHtml ?? `<p>${args.payload.body}</p>`,
						},
					);
				}
			}

			if (channel === "push") {
				const subs = await ctx.db
					.query("pushSubscriptions")
					.withIndex("by_user", (q) => q.eq("userId", args.userId))
					.collect();
				if (subs.length === 0) continue;

				await ctx.scheduler.runAfter(0, internal.notificationActions.sendPush, {
					subscriptions: subs.map((s) => ({
						endpoint: s.endpoint,
						p256dh: s.p256dh,
						auth: s.auth,
					})),
					title: args.payload.title,
					body: args.payload.body,
					url: args.payload.url ?? "/",
				});
			}

			await ctx.db.insert("notificationLog", {
				userId: args.userId,
				dedupeKey,
				type: args.type,
				referenceId: refId,
				channel,
				sentAt: Date.now(),
			});
		}

		return null;
	},
});

export const processDaily = internalMutation({
	args: {},
	handler: async (ctx) => {
		await ctx.scheduler.runAfter(0, internal.fixedExpenses.processReminders, {});
		await ctx.scheduler.runAfter(0, internal.reports.processPeriodClosures, {});
		await ctx.scheduler.runAfter(0, internal.credits.processReminders, {});
		return null;
	},
});

export const listRecentInApp = query({
	args: { limit: v.optional(v.number()) },
	handler: async (ctx, { limit }) => {
		const userId = await requireUserId(ctx);
		const cap = Math.min(limit ?? 10, 30);
		const logs = await ctx.db
			.query("notificationLog")
			.withIndex("by_user_sent", (q) => q.eq("userId", userId))
			.order("desc")
			.take(cap * 3);

		return logs
			.filter((l) => l.channel === "in_app")
			.slice(0, cap)
			.map((l) => ({
				type: l.type,
				referenceId: l.referenceId,
				sentAt: l.sentAt,
			}));
	},
});
