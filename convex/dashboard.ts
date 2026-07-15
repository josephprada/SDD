import { v } from "convex/values";
import { query } from "./_generated/server";
import { compareAccounts } from "./lib/accounts";
import { requireUserId } from "./lib/auth";
import {
	countsForPersonalFinance,
	excludedPersonalFinanceAccountIds,
	isAccountExcludedFromPersonalFinance,
} from "./lib/personalFinance";
import { compareTransactions } from "./lib/transactions";
import { enrichTransaction } from "./transactions";

export const overview = query({
	args: {
		periodStart: v.number(),
		periodEnd: v.number(),
		recentLimit: v.optional(v.number()),
	},
	handler: async (ctx, { periodStart, periodEnd, recentLimit }) => {
		const userId = await requireUserId(ctx);

		const accounts = await ctx.db
			.query("accounts")
			.withIndex("by_user_archived", (q) =>
				q.eq("userId", userId).eq("archived", false),
			)
			.collect();

		const personalAccounts = accounts.filter(
			(a) => !isAccountExcludedFromPersonalFinance(a),
		);
		const totalBalance = personalAccounts.reduce(
			(sum, a) => sum + a.balance,
			0,
		);

		const activeAccounts = personalAccounts.sort(compareAccounts).map((a) => ({
			_id: a._id,
			name: a.name,
			type: a.type,
			balance: a.balance,
		}));

		const credits = await ctx.db
			.query("credits")
			.withIndex("by_user_status", (q) =>
				q.eq("userId", userId).eq("status", "active"),
			)
			.collect();

		const creditFundCards = [];
		for (const credit of credits) {
			if (!credit.disbursementAccountId) continue;
			const disbursementAccount = accounts.find(
				(a) => a._id === credit.disbursementAccountId,
			);
			if (disbursementAccount) {
				const available = disbursementAccount.balance;
				creditFundCards.push({
					creditId: credit._id,
					name: credit.name,
					principal: credit.principal,
					escrowBalance: available,
					spentFromDisbursement: Math.max(0, credit.principal - available),
					availableFromDisbursement: available,
				});
			}
		}

		const transactions = await ctx.db
			.query("transactions")
			.withIndex("by_user_date", (q) => q.eq("userId", userId))
			.collect();

		const excludedAccountIds = await excludedPersonalFinanceAccountIds(
			ctx,
			userId,
		);
		const allTransactions = transactions.filter((t) =>
			countsForPersonalFinance(t, excludedAccountIds),
		);
		const sorted = [...allTransactions].sort(compareTransactions);

		const periodTransactions = sorted.filter(
			(t) => t.date >= periodStart && t.date <= periodEnd,
		);

		let monthlyIncome = 0;
		let monthlyExpense = 0;
		for (const t of periodTransactions) {
			if (t.type === "income") monthlyIncome += t.amount;
			if (t.type === "expense") monthlyExpense += t.amount;
		}

		const limit = Math.min(Math.max(recentLimit ?? 5, 1), 30);
		const recentSlice = sorted.slice(0, limit);
		const recentTransactions = await Promise.all(
			recentSlice.map((t) => enrichTransaction(ctx, t)),
		);

		return {
			totalBalance,
			monthlyIncome,
			monthlyExpense,
			activeAccounts,
			recentTransactions,
			recentTotal: allTransactions.length,
			creditFundCards,
		};
	},
});
