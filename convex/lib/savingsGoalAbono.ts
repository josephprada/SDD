import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import {
	requireSavingsGoalOwnership,
} from "./auth";
import type { savingsGoalSnapshotValidator } from "./validators";
import type { Infer } from "convex/values";

export type SavingsGoalSnapshot = Infer<typeof savingsGoalSnapshotValidator>;

export async function buildSavingsGoalSnapshot(
	ctx: MutationCtx,
	goal: Doc<"savingsGoals">,
): Promise<SavingsGoalSnapshot> {
	const contributions = await ctx.db
		.query("savingsContributions")
		.withIndex("by_goal", (q) => q.eq("goalId", goal._id))
		.collect();

	return {
		name: goal.name,
		targetAmount: goal.targetAmount,
		currentAmount: goal.currentAmount,
		deadline: goal.deadline,
		accountId: goal.accountId,
		linkedCreditId: goal.linkedCreditId,
		linkedFixedExpenseId: goal.linkedFixedExpenseId,
		icon: goal.icon,
		color: goal.color,
		status: goal.status,
		notes: goal.notes,
		createdAt: goal.createdAt,
		contributions: contributions.map((contribution) => ({
			amount: contribution.amount,
			contributedAt: contribution.contributedAt,
			transactionId: contribution.transactionId,
			sourceTransactionId: contribution.sourceTransactionId,
			notes: contribution.notes,
			createdAt: contribution.createdAt,
		})),
	};
}

export function isSavingsGoalReadyForAbono(goal: Doc<"savingsGoals">): boolean {
	return (
		goal.status === "completed" || goal.currentAmount >= goal.targetAmount
	);
}

export async function consumeSavingsGoalForAbono(
	ctx: MutationCtx,
	userId: Id<"users">,
	goalId: Id<"savingsGoals">,
	creditId: Id<"credits">,
): Promise<SavingsGoalSnapshot> {
	const goal = await requireSavingsGoalOwnership(ctx, userId, goalId);
	if (goal.linkedCreditId !== creditId) {
		throw new Error("La meta no está vinculada a este crédito");
	}
	if (!isSavingsGoalReadyForAbono(goal)) {
		throw new Error("La meta de ahorro aún no está cumplida");
	}

	const snapshot = await buildSavingsGoalSnapshot(ctx, goal);

	const contributions = await ctx.db
		.query("savingsContributions")
		.withIndex("by_goal", (q) => q.eq("goalId", goalId))
		.collect();
	for (const contribution of contributions) {
		await ctx.db.delete(contribution._id);
	}

	if (goal.linkedFixedExpenseId) {
		const fixedExpense = await ctx.db.get(goal.linkedFixedExpenseId);
		if (fixedExpense && fixedExpense.userId === userId) {
			await ctx.db.patch(goal.linkedFixedExpenseId, {
				linkedSavingsGoalId: undefined,
				updatedAt: Date.now(),
			});
		}
	}

	await ctx.db.delete(goalId);
	return snapshot;
}

export async function restoreSavingsGoalFromSnapshot(
	ctx: MutationCtx,
	userId: Id<"users">,
	snapshot: SavingsGoalSnapshot,
): Promise<Id<"savingsGoals">> {
	const now = Date.now();
	const goalId = await ctx.db.insert("savingsGoals", {
		userId,
		name: snapshot.name,
		targetAmount: snapshot.targetAmount,
		currentAmount: snapshot.currentAmount,
		deadline: snapshot.deadline,
		accountId: snapshot.accountId,
		linkedCreditId: snapshot.linkedCreditId,
		linkedFixedExpenseId: snapshot.linkedFixedExpenseId,
		icon: snapshot.icon,
		color: snapshot.color,
		status: "completed",
		notes: snapshot.notes,
		createdAt: snapshot.createdAt,
		updatedAt: now,
	});

	for (const contribution of snapshot.contributions) {
		await ctx.db.insert("savingsContributions", {
			goalId,
			amount: contribution.amount,
			contributedAt: contribution.contributedAt,
			transactionId: contribution.transactionId,
			sourceTransactionId: contribution.sourceTransactionId,
			notes: contribution.notes,
			createdAt: contribution.createdAt,
		});
	}

	if (snapshot.linkedFixedExpenseId) {
		const fixedExpense = await ctx.db.get(snapshot.linkedFixedExpenseId);
		if (fixedExpense && fixedExpense.userId === userId) {
			await ctx.db.patch(snapshot.linkedFixedExpenseId, {
				linkedSavingsGoalId: goalId,
				updatedAt: now,
			});
		}
	}

	return goalId;
}
