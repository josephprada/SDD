import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { requireSavingsGoalOwnership, requireUserId } from "./lib/auth";
import {
	validateCreditNotes,
	validatePositiveCopAmount,
} from "./lib/validators";

const ANNUAL_ABONO_THRESHOLD = 5_000_000;

export const create = mutation({
	args: {
		goalId: v.id("savingsGoals"),
		amount: v.number(),
		contributedAt: v.number(),
		transactionId: v.optional(v.id("transactions")),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const goal = await requireSavingsGoalOwnership(ctx, userId, args.goalId);
		if (goal.status === "paused") {
			throw new Error("Goal is paused");
		}
		const amount = validatePositiveCopAmount(args.amount);
		const notes = validateCreditNotes(args.notes);
		const now = Date.now();

		const contributionId = await ctx.db.insert("savingsContributions", {
			goalId: args.goalId,
			amount,
			contributedAt: args.contributedAt,
			transactionId: args.transactionId,
			notes,
			createdAt: now,
		});

		const newAmount = goal.currentAmount + amount;
		const completed = newAmount >= goal.targetAmount;
		await ctx.db.patch(args.goalId, {
			currentAmount: newAmount,
			status: completed ? "completed" : goal.status,
			updatedAt: now,
		});

		const suggestAbono =
			Boolean(goal.linkedCreditId) && newAmount >= ANNUAL_ABONO_THRESHOLD;

		return { contributionId, suggestAbono, linkedCreditId: goal.linkedCreditId };
	},
});
