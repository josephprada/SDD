import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireAccountOwnership, requireCategoryOwnership, requireUserId } from "./lib/auth";
import { getBalanceDeltas } from "./lib/balance";
import {
	dateKeyFromTimestamp,
	dueTimestampForPeriodKey,
	dueTimestampsInRange,
	nextDueTimestamp,
	reminderDatesForMonth,
} from "./lib/fixedExpenses";
import {
	hasValidPaymentTransaction,
	reconcileFixedExpensePayment,
} from "./lib/fixedExpensePayments";
import { periodKeyFromTimestamp, periodKeyToMonthRange } from "./lib/period";
import { resolveUserPreferences } from "./lib/preferences";
import {
	MAX_FIXED_EXPENSE_NAME_LENGTH,
	validateDayOfMonth,
	validatePositiveCopAmount,
	validateReminderOffsets,
} from "./lib/validators";
import { internal } from "./_generated/api";

export type FixedExpenseListItem = {
	_id: Id<"fixedExpenses">;
	name: string;
	amount: number;
	categoryId: Id<"categories">;
	categoryName: string;
	categoryColor: string;
	categoryIcon: string;
	dayOfMonth: number;
	reminderOffsets: number[];
	emailReminders: boolean;
	pushReminders: boolean;
	active: boolean;
	nextDueDate: number;
	lastPaidPeriodKey?: string;
	isPaidCurrentPeriod: boolean;
	notes?: string;
};

async function enrichFixedExpense(
	ctx: { db: QueryCtx["db"] },
	item: Doc<"fixedExpenses">,
	periodKey?: string,
): Promise<FixedExpenseListItem> {
	const category = await ctx.db.get(item.categoryId);
	const viewPeriodKey =
		periodKey ?? periodKeyFromTimestamp(Date.now());
	const isPaidCurrentPeriod = await hasValidPaymentTransaction(
		ctx,
		item,
		viewPeriodKey,
	);
	return {
		_id: item._id,
		name: item.name,
		amount: item.amount,
		categoryId: item.categoryId,
		categoryName: category?.name ?? "Categoría",
		categoryColor: category?.color ?? "#7F8C8D",
		categoryIcon: category?.icon ?? "package",
		dayOfMonth: item.dayOfMonth,
		reminderOffsets: item.reminderOffsets,
		emailReminders: item.emailReminders,
		pushReminders: item.pushReminders,
		active: item.active,
		nextDueDate: periodKey
			? dueTimestampForPeriodKey(item.dayOfMonth, periodKey)
			: nextDueTimestamp(item.dayOfMonth),
		lastPaidPeriodKey: item.lastPaidPeriodKey,
		isPaidCurrentPeriod,
		notes: item.notes,
	};
}

export const list = query({
	args: {
		includeInactive: v.optional(v.boolean()),
		periodKey: v.optional(v.string()),
	},
	handler: async (ctx, { includeInactive, periodKey }) => {
		const userId = await requireUserId(ctx);
		let items = await ctx.db
			.query("fixedExpenses")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();

		if (!includeInactive) {
			items = items.filter((i) => i.active);
		}

		if (periodKey) {
			const { end } = periodKeyToMonthRange(periodKey);
			items = items.filter((i) => i.createdAt <= end);
		}

		const enriched = await Promise.all(
			items.map((i) => enrichFixedExpense(ctx, i, periodKey)),
		);
		return enriched.sort((a, b) => a.nextDueDate - b.nextDueDate);
	},
});

export const listUpcomingForPeriod = query({
	args: {
		periodStart: v.number(),
		periodEnd: v.number(),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, { periodStart, periodEnd, limit = 3 }) => {
		const userId = await requireUserId(ctx);
		const items = await ctx.db
			.query("fixedExpenses")
			.withIndex("by_user_active", (q) =>
				q.eq("userId", userId).eq("active", true),
			)
			.collect();

		type UpcomingEntry = FixedExpenseListItem & {
			dueDate: number;
			isOverdue: boolean;
		};

		const now = Date.now();
		const upcoming: UpcomingEntry[] = [];
		let pendingTotal = 0;

		for (const item of items) {
			const dues = dueTimestampsInRange(
				item.dayOfMonth,
				periodStart,
				periodEnd,
			);

			for (const dueTs of dues) {
				const periodKey = periodKeyFromTimestamp(dueTs);
				if (await hasValidPaymentTransaction(ctx, item, periodKey)) continue;

				pendingTotal += item.amount;
				const enriched = await enrichFixedExpense(ctx, item);
				upcoming.push({
					...enriched,
					dueDate: dueTs,
					isOverdue: dueTs < now,
					nextDueDate: dueTs,
					isPaidCurrentPeriod: false,
				});
			}
		}

		upcoming.sort((a, b) => a.dueDate - b.dueDate);

		return {
			items: upcoming.slice(0, Math.max(1, Math.min(limit, 10))),
			pendingTotal,
		};
	},
});

export const create = mutation({
	args: {
		name: v.string(),
		amount: v.number(),
		categoryId: v.id("categories"),
		dayOfMonth: v.number(),
		reminderOffsets: v.optional(v.array(v.number())),
		emailReminders: v.optional(v.boolean()),
		pushReminders: v.optional(v.boolean()),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const name = args.name.trim();
		if (!name || name.length > MAX_FIXED_EXPENSE_NAME_LENGTH) {
			throw new Error("Invalid name");
		}
		const amount = validatePositiveCopAmount(args.amount);
		const dayOfMonth = validateDayOfMonth(args.dayOfMonth);
		const reminderOffsets = validateReminderOffsets(
			args.reminderOffsets ?? [2, 0],
		);

		const category = await requireCategoryOwnership(
			ctx,
			userId,
			args.categoryId,
		);
		if (category.type !== "expense") {
			throw new Error("Only expense categories allowed");
		}

		const now = Date.now();
		return await ctx.db.insert("fixedExpenses", {
			userId,
			name,
			amount,
			categoryId: args.categoryId,
			dayOfMonth,
			reminderOffsets,
			emailReminders: args.emailReminders ?? false,
			pushReminders: args.pushReminders ?? true,
			active: true,
			notes: args.notes?.trim().slice(0, 200) || undefined,
			createdAt: now,
			updatedAt: now,
		});
	},
});

export const update = mutation({
	args: {
		id: v.id("fixedExpenses"),
		name: v.optional(v.string()),
		amount: v.optional(v.number()),
		categoryId: v.optional(v.id("categories")),
		dayOfMonth: v.optional(v.number()),
		reminderOffsets: v.optional(v.array(v.number())),
		emailReminders: v.optional(v.boolean()),
		pushReminders: v.optional(v.boolean()),
		active: v.optional(v.boolean()),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const item = await ctx.db.get(args.id);
		if (!item || item.userId !== userId) {
			throw new Error("Fixed expense not found");
		}

		const patch: Partial<Doc<"fixedExpenses">> = { updatedAt: Date.now() };

		if (args.name !== undefined) {
			const name = args.name.trim();
			if (!name) throw new Error("Name is required");
			patch.name = name;
		}
		if (args.amount !== undefined) {
			patch.amount = validatePositiveCopAmount(args.amount);
		}
		if (args.categoryId !== undefined) {
			const cat = await requireCategoryOwnership(ctx, userId, args.categoryId);
			if (cat.type !== "expense") throw new Error("Only expense categories");
			patch.categoryId = args.categoryId;
		}
		if (args.dayOfMonth !== undefined) {
			patch.dayOfMonth = validateDayOfMonth(args.dayOfMonth);
		}
		if (args.reminderOffsets !== undefined) {
			patch.reminderOffsets = validateReminderOffsets(args.reminderOffsets);
		}
		if (args.emailReminders !== undefined) patch.emailReminders = args.emailReminders;
		if (args.pushReminders !== undefined) patch.pushReminders = args.pushReminders;
		if (args.active !== undefined) patch.active = args.active;
		if (args.notes !== undefined) {
			patch.notes = args.notes.trim().slice(0, 200) || undefined;
		}

		await ctx.db.patch(args.id, patch);
		return null;
	},
});

export const remove = mutation({
	args: { id: v.id("fixedExpenses") },
	handler: async (ctx, { id }) => {
		const userId = await requireUserId(ctx);
		const item = await ctx.db.get(id);
		if (!item || item.userId !== userId) {
			throw new Error("Fixed expense not found");
		}
		await ctx.db.delete(id);
		return null;
	},
});

export const markPaid = mutation({
	args: {
		id: v.id("fixedExpenses"),
		accountId: v.id("accounts"),
		periodKey: v.optional(v.string()),
		dueDate: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const item = await ctx.db.get(args.id);
		if (!item || item.userId !== userId) {
			throw new Error("Fixed expense not found");
		}

		const paymentDate = args.dueDate ?? Date.now();
		const periodKey = args.periodKey ?? periodKeyFromTimestamp(paymentDate);

		if (item.lastPaidPeriodKey === periodKey) {
			throw new Error("Already paid for this period");
		}

		const account = await requireAccountOwnership(ctx, userId, args.accountId);
		if (account.archived) {
			throw new Error("Account is archived");
		}

		const category = await requireCategoryOwnership(
			ctx,
			userId,
			item.categoryId,
		);
		if (category.archived || category.type !== "expense") {
			throw new Error("Invalid category for expense");
		}

		const amount = validatePositiveCopAmount(item.amount);
		const deltas = getBalanceDeltas({
			type: "expense",
			amount,
			accountId: args.accountId,
		});
		const now = Date.now();

		for (const { accountId, delta } of deltas) {
			const acc = await requireAccountOwnership(ctx, userId, accountId);
			if (acc.archived && delta < 0) {
				throw new Error("Cannot debit archived account");
			}
			await ctx.db.patch(accountId, {
				balance: acc.balance + delta,
				updatedAt: now,
			});
		}

		const transactionId = await ctx.db.insert("transactions", {
			userId,
			type: "expense",
			amount,
			date: paymentDate,
			accountId: args.accountId,
			categoryId: item.categoryId,
			notes: item.name,
			sourceFixedExpenseId: args.id,
			sortOrder: now,
			createdAt: now,
			updatedAt: now,
		});

		await ctx.db.patch(args.id, {
			lastPaidPeriodKey: periodKey,
			lastPaidTransactionId: transactionId,
			updatedAt: now,
		});

		await ctx.scheduler.runAfter(
			0,
			internal.budgets.checkThresholdAfterTransaction,
			{
				userId,
				categoryId: item.categoryId,
				date: paymentDate,
			},
		);

		return null;
	},
});

export const unmarkPaid = mutation({
	args: { id: v.id("fixedExpenses") },
	handler: async (ctx, { id }) => {
		const userId = await requireUserId(ctx);
		const item = await ctx.db.get(id);
		if (!item || item.userId !== userId) {
			throw new Error("Fixed expense not found");
		}
		await ctx.db.patch(id, {
			lastPaidPeriodKey: undefined,
			lastPaidTransactionId: undefined,
			updatedAt: Date.now(),
		});
		return null;
	},
});

export const reconcilePayments = mutation({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);
		const items = await ctx.db
			.query("fixedExpenses")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();

		let repaired = 0;
		for (const item of items) {
			if (await reconcileFixedExpensePayment(ctx, item)) {
				repaired += 1;
			}
		}

		return { repaired };
	},
});

export const processReminders = internalMutation({
	args: {},
	handler: async (ctx) => {
		const now = new Date();
		const todayKey = dateKeyFromTimestamp(now.getTime());
		const year = now.getFullYear();
		const monthIndex = now.getMonth();

		const items = await ctx.db.query("fixedExpenses").collect();

		for (const item of items) {
			if (!item.active) continue;

			const prefsDoc = await ctx.db
				.query("userPreferences")
				.withIndex("by_user", (q) => q.eq("userId", item.userId))
				.unique();
			const prefs = resolveUserPreferences(prefsDoc);
			if (!prefs.notificationsEnabled) continue;

			const reminderDates = reminderDatesForMonth(
				year,
				monthIndex,
				item.dayOfMonth,
				item.reminderOffsets,
			);

			for (const reminderTs of reminderDates) {
				if (dateKeyFromTimestamp(reminderTs) !== todayKey) continue;

				const offset = item.reminderOffsets.find((o) => {
					const d = reminderDatesForMonth(
						year,
						monthIndex,
						item.dayOfMonth,
						[o],
					)[0];
					return dateKeyFromTimestamp(d) === todayKey;
				});

				const channels: Array<"email" | "push" | "in_app"> = ["in_app"];
				if (item.emailReminders) channels.push("email");
				if (item.pushReminders && prefs.pushEnabled) channels.push("push");

				await ctx.scheduler.runAfter(0, internal.notifications.dispatch, {
					userId: item.userId,
					type: "fixed_expense_reminder",
					referenceId: `${item._id}:${offset ?? 0}`,
					channels,
					payload: {
						title: `Recordatorio: ${item.name}`,
						body: `Pago de $${item.amount.toLocaleString("es-CO")} — vence el día ${item.dayOfMonth}`,
						url: "/budgets",
						emailSubject: `Recordatorio — ${item.name}`,
						emailHtml: `<p>Recuerda pagar <strong>${item.name}</strong>: <strong>$${item.amount.toLocaleString("es-CO")}</strong> (día ${item.dayOfMonth}).</p>`,
					},
					dateKey: todayKey,
					dedupeSuffix: String(offset ?? 0),
				});
			}
		}

		return null;
	},
});
