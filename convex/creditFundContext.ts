import { v } from "convex/values";
import { query } from "./_generated/server";
import {
	requireCategoryOwnership,
	requireCreditOwnership,
	requireUserId,
} from "./lib/auth";
import { isFundExpenseCategory } from "./lib/creditCategories";

export const getContextForCategory = query({
	args: { categoryId: v.id("categories") },
	handler: async (ctx, { categoryId }) => {
		const userId = await requireUserId(ctx);
		const category = await requireCategoryOwnership(ctx, userId, categoryId);
		if (!category.linkedCreditId) return null;

		const credit = await requireCreditOwnership(
			ctx,
			userId,
			category.linkedCreditId,
		);
		if (!isFundExpenseCategory(category, credit.fundExpenseCategoryIds)) {
			return null;
		}
		if (!credit.disbursementAccountId) {
			return null;
		}

		const disbursementAccount = await ctx.db.get(credit.disbursementAccountId);
		const operatingAccount = credit.operatingAccountId
			? await ctx.db.get(credit.operatingAccountId)
			: null;
		const destinations = await ctx.db
			.query("creditDestinations")
			.withIndex("by_credit", (q) => q.eq("creditId", credit._id))
			.collect();

		const activeDestinations = destinations.sort((a, b) =>
			a.name.localeCompare(b.name, "es"),
		);

		return {
			creditId: credit._id,
			creditName: credit.name,
			disbursementAccountId: credit.disbursementAccountId,
			operatingAccountId: credit.operatingAccountId,
			disbursementAccountName: disbursementAccount?.name,
			operatingAccountName: operatingAccount?.name,
			escrowBalance: disbursementAccount?.balance ?? 0,
			defaultDestinationId: activeDestinations[0]?._id,
			destinations: activeDestinations.map((d) => ({
				_id: d._id,
				name: d.name,
				amount: d.amount,
				status: d.status,
			})),
		};
	},
});
