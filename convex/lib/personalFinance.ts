import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";

export async function excludedPersonalFinanceCreditIds(
	ctx: { db: QueryCtx["db"] },
	userId: Id<"users">,
): Promise<Set<Id<"credits">>> {
	const credits = await ctx.db
		.query("credits")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.collect();

	return new Set(
		credits
			.filter((credit) => credit.excludeFromPersonalFinance === true)
			.map((credit) => credit._id),
	);
}

/** Whether a transaction should count in personal income/expense summaries. */
export function countsForPersonalFinance(
	transaction: Doc<"transactions">,
	excludedCreditIds: Set<Id<"credits">>,
): boolean {
	if (transaction.isCreditFundMovement) {
		return false;
	}
	if (
		transaction.creditId &&
		excludedCreditIds.has(transaction.creditId)
	) {
		return false;
	}
	return true;
}
