import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireCategoryOwnership, requireUserId } from "./lib/auth";
import { listUnpaidFixedExpensesForCategory } from "./lib/fixedExpenseTransaction";

export const getContextForCategory = query({
	args: {
		categoryId: v.id("categories"),
		periodKey: v.string(),
	},
	handler: async (ctx, { categoryId, periodKey }) => {
		const userId = await requireUserId(ctx);
		const category = await requireCategoryOwnership(ctx, userId, categoryId);
		if (category.type !== "expense") return null;

		const unpaidItems = await listUnpaidFixedExpensesForCategory(
			ctx,
			userId,
			categoryId,
			periodKey,
		);
		if (unpaidItems.length === 0) return null;

		return {
			defaultFixedExpenseId: unpaidItems[0]._id,
			unpaidItems,
		};
	},
});
