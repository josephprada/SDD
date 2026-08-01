import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { dueTimestampForPeriodKey } from "./fixedExpenses";
import { hasValidPaymentTransaction } from "./fixedExpensePayments";
import { appliesToPeriodKey } from "./fixedExpensePeriod";
import { periodKeyFromTimestamp, periodKeyToMonthRange } from "./period";

type DbCtx = { db: QueryCtx["db"] | MutationCtx["db"] };

export type UpcomingFixedExpenseRow = {
	id: Id<"fixedExpenses">;
	name: string;
	amount: number;
	categoryId: Id<"categories">;
	categoryName: string;
	dayOfMonth: number;
	dueDate: number;
	isOverdue: boolean;
	onlyPeriodKey?: string;
};

export type UpcomingFixedExpensesResult = {
	periodStart: number;
	periodEnd: number;
	pendingTotal: number;
	items: UpcomingFixedExpenseRow[];
};

/**
 * Shared pending-fixed logic for dashboard + MCP (ownership via userId).
 * `limit` only truncates `items`; `pendingTotal` is always the full sum.
 */
export async function listUpcomingFixedExpensesForUser(
	ctx: DbCtx,
	userId: Id<"users">,
	periodStart: number,
	periodEnd: number,
	limit = 50,
): Promise<UpcomingFixedExpensesResult> {
	const items = await ctx.db
		.query("fixedExpenses")
		.withIndex("by_user_active", (q) =>
			q.eq("userId", userId).eq("active", true),
		)
		.collect();

	const now = Date.now();
	const upcoming: UpcomingFixedExpenseRow[] = [];
	let pendingTotal = 0;
	const viewingPeriodKey = periodKeyFromTimestamp(periodStart);

	for (const item of items) {
		if (item.onlyPeriodKey) {
			const { start, end } = periodKeyToMonthRange(item.onlyPeriodKey);
			if (end < periodStart || start > periodEnd) continue;
			const dueTs = dueTimestampForPeriodKey(
				item.dayOfMonth,
				item.onlyPeriodKey,
			);
			if (dueTs < periodStart || dueTs > periodEnd) continue;
			if (await hasValidPaymentTransaction(ctx, item, item.onlyPeriodKey)) {
				continue;
			}

			pendingTotal += item.amount;
			upcoming.push(await toRow(ctx, item, dueTs, now));
			continue;
		}

		if (!appliesToPeriodKey(item, viewingPeriodKey)) continue;

		const dueTs = dueTimestampForPeriodKey(item.dayOfMonth, viewingPeriodKey);
		if (dueTs < periodStart || dueTs > periodEnd) continue;

		if (await hasValidPaymentTransaction(ctx, item, viewingPeriodKey)) {
			continue;
		}

		pendingTotal += item.amount;
		upcoming.push(await toRow(ctx, item, dueTs, now));
	}

	upcoming.sort((a, b) => a.dueDate - b.dueDate);
	const capped = Math.max(1, Math.min(limit, 100));

	return {
		periodStart,
		periodEnd,
		pendingTotal,
		items: upcoming.slice(0, capped),
	};
}

async function toRow(
	ctx: DbCtx,
	item: Doc<"fixedExpenses">,
	dueTs: number,
	now: number,
): Promise<UpcomingFixedExpenseRow> {
	const category = await ctx.db.get(item.categoryId);
	return {
		id: item._id,
		name: item.name,
		amount: item.amount,
		categoryId: item.categoryId,
		categoryName: category?.name ?? "Categoría",
		dayOfMonth: item.dayOfMonth,
		dueDate: dueTs,
		isOverdue: dueTs < now,
		onlyPeriodKey: item.onlyPeriodKey,
	};
}
