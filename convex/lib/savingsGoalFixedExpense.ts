import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { removeSavingsGoalLinkedTransaction } from "./savingsGoalTransaction";

type DbCtx = { db: QueryCtx["db"] };

export async function findSavingsGoalForFixedExpense(
	ctx: DbCtx,
	userId: Id<"users">,
	fixedExpenseId: Id<"fixedExpenses">,
	fixedExpense?: Doc<"fixedExpenses"> | null,
): Promise<Doc<"savingsGoals"> | null> {
	const expense =
		fixedExpense ?? (await ctx.db.get(fixedExpenseId));
	if (!expense || expense.userId !== userId) return null;

	if (expense.linkedSavingsGoalId) {
		const linkedGoal = await ctx.db.get(expense.linkedSavingsGoalId);
		if (linkedGoal && linkedGoal.userId === userId) {
			return linkedGoal;
		}
	}

	const byLink = await ctx.db
		.query("savingsGoals")
		.withIndex("by_linked_fixed_expense", (q) =>
			q.eq("linkedFixedExpenseId", fixedExpenseId),
		)
		.first();
	if (byLink && byLink.userId === userId) {
		return byLink;
	}

	const goals = await ctx.db
		.query("savingsGoals")
		.withIndex("by_user", (q) => q.eq("userId", userId))
		.collect();
	return goals.find((g) => g.linkedFixedExpenseId === fixedExpenseId) ?? null;
}

async function findContributionForTransaction(
	ctx: DbCtx,
	transactionId: Id<"transactions">,
) {
	const byLinked = await ctx.db
		.query("savingsContributions")
		.withIndex("by_transaction", (q) => q.eq("transactionId", transactionId))
		.first();
	if (byLinked) return byLinked;

	return await ctx.db
		.query("savingsContributions")
		.withIndex("by_source_transaction", (q) =>
			q.eq("sourceTransactionId", transactionId),
		)
		.first();
}

export async function recordSavingsContributionForFixedExpense(
	ctx: MutationCtx,
	params: {
		userId: Id<"users">;
		goal: Doc<"savingsGoals">;
		amount: number;
		contributedAt: number;
		transactionId: Id<"transactions">;
		fixedExpenseName: string;
	},
): Promise<Id<"savingsContributions">> {
	const existing = await findContributionForTransaction(
		ctx,
		params.transactionId,
	);
	if (existing) return existing._id;

	const goal = await ctx.db.get(params.goal._id);
	if (!goal) {
		throw new Error("Savings goal not found");
	}

	const now = Date.now();
	const contributionId = await ctx.db.insert("savingsContributions", {
		goalId: goal._id,
		amount: params.amount,
		contributedAt: params.contributedAt,
		transactionId: params.transactionId,
		notes: `Aporte automático — gasto fijo «${params.fixedExpenseName}»`,
		createdAt: now,
	});

	const newAmount = goal.currentAmount + params.amount;
	const completed = newAmount >= goal.targetAmount;
	await ctx.db.patch(goal._id, {
		currentAmount: newAmount,
		status:
			goal.status === "paused"
				? "paused"
				: completed
					? "completed"
					: "active",
		updatedAt: now,
	});

	return contributionId;
}

export async function ensureSavingsContributionForPaidFixedExpense(
	ctx: MutationCtx,
	params: {
		userId: Id<"users">;
		fixedExpense: Doc<"fixedExpenses">;
	},
): Promise<void> {
	if (!params.fixedExpense.lastPaidTransactionId) return;

	const transaction = await ctx.db.get(params.fixedExpense.lastPaidTransactionId);
	if (!transaction || transaction.userId !== params.userId) return;

	const linkedGoal = await findSavingsGoalForFixedExpense(
		ctx,
		params.userId,
		params.fixedExpense._id,
		params.fixedExpense,
	);
	if (!linkedGoal) return;

	await recordSavingsContributionForFixedExpense(ctx, {
		userId: params.userId,
		goal: linkedGoal,
		amount: transaction.amount,
		contributedAt: transaction.date,
		transactionId: transaction._id,
		fixedExpenseName: params.fixedExpense.name,
	});
}

export async function revertSavingsContributionForTransaction(
	ctx: MutationCtx,
	userId: Id<"users">,
	transactionId: Id<"transactions">,
): Promise<void> {
	const contribution = await findContributionForTransaction(ctx, transactionId);
	if (!contribution) return;

	const goal = await ctx.db.get(contribution.goalId);
	if (!goal || goal.userId !== userId) return;

	const linkedTransactionId = contribution.transactionId;
	const sourceTransactionId = contribution.sourceTransactionId;
	const revertingLinked =
		linkedTransactionId !== undefined && transactionId === linkedTransactionId;
	const revertingSource =
		sourceTransactionId !== undefined && transactionId === sourceTransactionId;

	await ctx.db.delete(contribution._id);

	const newAmount = Math.max(0, goal.currentAmount - contribution.amount);
	const status =
		goal.status === "paused"
			? "paused"
			: newAmount >= goal.targetAmount
				? "completed"
				: "active";

	await ctx.db.patch(goal._id, {
		currentAmount: newAmount,
		status,
		updatedAt: Date.now(),
	});

	if (
		revertingSource &&
		linkedTransactionId &&
		linkedTransactionId !== transactionId
	) {
		await removeSavingsGoalLinkedTransaction(ctx, userId, linkedTransactionId);
	}

	if (revertingLinked && sourceTransactionId) {
		// Legacy paired expense kept when only the destination movement is removed.
	}
}
