import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireUserId } from "./lib/auth";
import { buildTaxSuggestions } from "./lib/taxSuggest";

export const generate = query({
	args: { documentId: v.id("taxDocuments") },
	handler: async (ctx, { documentId }) => {
		const userId = await requireUserId(ctx);
		const document = await ctx.db.get(documentId);
		if (!document || document.userId !== userId) {
			return {
				suggestions: [],
				skippedAlreadyAccepted: 0,
				generatedAt: Date.now(),
			};
		}

		const [accounts, credits, categories, existingItems, transactions] =
			await Promise.all([
				ctx.db
					.query("accounts")
					.withIndex("by_user", (q) => q.eq("userId", userId))
					.collect(),
				ctx.db
					.query("credits")
					.withIndex("by_user", (q) => q.eq("userId", userId))
					.collect(),
				ctx.db
					.query("categories")
					.withIndex("by_user", (q) => q.eq("userId", userId))
					.collect(),
				ctx.db
					.query("taxItems")
					.withIndex("by_document", (q) => q.eq("documentId", documentId))
					.collect(),
				ctx.db
					.query("transactions")
					.withIndex("by_user", (q) => q.eq("userId", userId))
					.collect(),
			]);

		const categoryName = new Map(
			categories.map((c) => [c._id as string, c.name] as const),
		);

		const { suggestions, skippedAlreadyAccepted } = buildTaxSuggestions({
			taxYear: document.taxYear,
			accounts: accounts.map((a) => ({
				_id: a._id,
				name: a.name,
				type: a.type,
				balance: a.balance,
				archived: a.archived,
			})),
			credits: credits.map((c) => ({
				_id: c._id,
				name: c.name,
				status: c.status,
				outstandingBalance: c.outstandingBalance,
				creditProfile: c.creditProfile,
			})),
			transactions: transactions.map((t) => ({
				type: t.type,
				amount: t.amount,
				date: t.date,
				categoryId: t.categoryId,
				categoryName: categoryName.get(t.categoryId) ?? "Sin categoría",
				creditId: t.creditId,
				isCreditInstallmentPayment: t.isCreditInstallmentPayment,
			})),
			acceptedSources: existingItems
				.filter((i) => i.sourceType && i.sourceId)
				.map((i) => ({
					sourceType: i.sourceType as string,
					sourceId: i.sourceId as string,
				})),
		});

		return {
			suggestions,
			skippedAlreadyAccepted,
			generatedAt: Date.now(),
		};
	},
});
