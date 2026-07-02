import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireUserId } from "./lib/auth";
import { compareAccounts } from "./lib/accounts";
import { compareTransactions } from "./lib/transactions";
import { enrichTransaction } from "./transactions";

export const overview = query({
	args: {
		monthStart: v.number(),
		monthEnd: v.number(),
		recentLimit: v.optional(v.number()),
	},
	handler: async (ctx, { monthStart, monthEnd, recentLimit }) => {
		const userId = await requireUserId(ctx);

		const accounts = await ctx.db
			.query("accounts")
			.withIndex("by_user_archived", (q) =>
				q.eq("userId", userId).eq("archived", false),
			)
			.collect();

		const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

		const activeAccounts = accounts.sort(compareAccounts).map((a) => ({
				_id: a._id,
				name: a.name,
				type: a.type,
				balance: a.balance,
			}));

		const transactions = await ctx.db
			.query("transactions")
			.withIndex("by_user_date", (q) => q.eq("userId", userId))
			.collect();

		const monthly = transactions.filter(
			(t) => t.date >= monthStart && t.date <= monthEnd,
		);

		let monthlyIncome = 0;
		let monthlyExpense = 0;
		for (const t of monthly) {
			if (t.type === "income") monthlyIncome += t.amount;
			if (t.type === "expense") monthlyExpense += t.amount;
		}

		const sorted = [...monthly].sort(compareTransactions);
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
		};
	},
});
