import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { internalMutation, query } from "./_generated/server";
import { requireUserId } from "./lib/auth";
import {
	type GroupingId,
	periodKeyForClosedPeriod,
	periodRangeForGrouping,
} from "./lib/period";
import {
	countsForPersonalFinance,
	excludedPersonalFinanceAccountIds,
} from "./lib/personalFinance";
import { groupingValidator } from "./lib/preferences";
import { resolveUserPreferences } from "./lib/preferences";
import { aggregateTransactions } from "./lib/reports";

async function loadReportData(
	ctx: QueryCtx,
	userId: Id<"users">,
	filters: {
		periodStart: number;
		periodEnd: number;
		categoryId?: Id<"categories">;
		accountId?: Id<"accounts">;
	},
	grouping: GroupingId,
) {
	const transactions = await ctx.db
		.query("transactions")
		.withIndex("by_user_date", (q) => q.eq("userId", userId))
		.collect();

	const excludedAccountIds = await excludedPersonalFinanceAccountIds(
		ctx,
		userId,
	);
	const personalTransactions = transactions.filter((t) =>
		countsForPersonalFinance(t, excludedAccountIds),
	);

	const categories = await ctx.db
		.query("categories")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.collect();

	const catMap = new Map(categories.map((c) => [c._id, c]));

	return aggregateTransactions(
		personalTransactions,
		catMap,
		filters,
		grouping,
		excludedAccountIds,
	);
}

export const summary = query({
	args: {
		periodStart: v.number(),
		periodEnd: v.number(),
		categoryId: v.optional(v.id("categories")),
		accountId: v.optional(v.id("accounts")),
		grouping: v.optional(groupingValidator),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const grouping = (args.grouping ?? "month") as GroupingId;

		return loadReportData(
			ctx,
			userId,
			{
				periodStart: args.periodStart,
				periodEnd: args.periodEnd,
				categoryId: args.categoryId,
				accountId: args.accountId,
			},
			grouping,
		);
	},
});

export const processPeriodClosures = internalMutation({
	args: {},
	handler: async (ctx) => {
		const prefsList = await ctx.db.query("userPreferences").collect();

		for (const doc of prefsList) {
			const prefs = resolveUserPreferences(doc);
			if (!prefs.reportEmailEnabled || !prefs.notificationsEnabled) continue;

			const periodKey = periodKeyForClosedPeriod(
				prefs.defaultGrouping as GroupingId,
			);
			if (!periodKey) continue;

			let periodStart: number;
			let periodEnd: number;
			let label: string;

			if (prefs.defaultGrouping === "month") {
				const anchor = new Date();
				anchor.setMonth(anchor.getMonth() - 1);
				const range = periodRangeForGrouping("month", anchor);
				periodStart = range.start;
				periodEnd = range.end;
				label = periodKey;
			} else {
				const parts = periodKey.split(":");
				periodStart = Number.parseInt(parts[1], 10);
				periodEnd = Number.parseInt(parts[2], 10);
				label = `${prefs.defaultGrouping} ${periodKey}`;
			}

			const summary = await loadReportData(
				ctx,
				doc.userId,
				{ periodStart, periodEnd },
				prefs.defaultGrouping as GroupingId,
			);

			const user = await ctx.db.get(doc.userId);
			if (!user?.email) continue;

			await ctx.scheduler.runAfter(0, internal.notifications.dispatch, {
				userId: doc.userId,
				type: "period_report",
				referenceId: periodKey,
				channels: ["email"],
				payload: {
					title: `Resumen ${label}`,
					body: `Ingresos: $${summary.totalIncome.toLocaleString("es-CO")} — Gastos: $${summary.totalExpense.toLocaleString("es-CO")}`,
					url: "/reports",
					emailSubject: `Tu resumen financiero — ${label}`,
					emailHtml: buildReportEmailHtml(summary, label),
					reportSummary: summary,
				},
				dateKey: periodKey,
				dedupeSuffix: "report",
			});
		}

		return null;
	},
});

function buildReportEmailHtml(
	summary: Awaited<ReturnType<typeof aggregateTransactions>>,
	label: string,
): string {
	const rows = summary.byCategory
		.map(
			(c) =>
				`<tr><td>${c.name}</td><td>$${c.amount.toLocaleString("es-CO")}</td></tr>`,
		)
		.join("");
	return `
		<h2>Resumen ${label}</h2>
		<p>Ingresos: <strong>$${summary.totalIncome.toLocaleString("es-CO")}</strong></p>
		<p>Gastos: <strong>$${summary.totalExpense.toLocaleString("es-CO")}</strong></p>
		<p>Neto: <strong>$${summary.net.toLocaleString("es-CO")}</strong></p>
		<table border="1" cellpadding="6"><thead><tr><th>Categoría</th><th>Gasto</th></tr></thead><tbody>${rows}</tbody></table>
	`;
}
