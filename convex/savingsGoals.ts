import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
	requireAccountOwnership,
	requireCreditOwnership,
	requireSavingsGoalOwnership,
	requireUserId,
} from "./lib/auth";
import {
	savingsGoalStatusValidator,
	validateCreditName,
	validateCreditNotes,
	validatePositiveCopAmount,
} from "./lib/validators";

export const list = query({
	args: { status: v.optional(savingsGoalStatusValidator) },
	handler: async (ctx, { status }) => {
		const userId = await requireUserId(ctx);
		let goals = await ctx.db
			.query("savingsGoals")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();
		if (status) goals = goals.filter((g) => g.status === status);

		return goals.map((g) => ({
			_id: g._id,
			name: g.name,
			targetAmount: g.targetAmount,
			currentAmount: g.currentAmount,
			percent: g.targetAmount > 0 ? g.currentAmount / g.targetAmount : 0,
			remaining: Math.max(0, g.targetAmount - g.currentAmount),
			deadline: g.deadline,
			linkedCreditId: g.linkedCreditId,
			status: g.status,
			icon: g.icon,
			color: g.color,
		}));
	},
});

export const get = query({
	args: { goalId: v.id("savingsGoals") },
	handler: async (ctx, { goalId }) => {
		const userId = await requireUserId(ctx);
		const goal = await requireSavingsGoalOwnership(ctx, userId, goalId);
		const contributions = await ctx.db
			.query("savingsContributions")
			.withIndex("by_goal", (q) => q.eq("goalId", goalId))
			.collect();
		return {
			...goal,
			percent: goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0,
			remaining: Math.max(0, goal.targetAmount - goal.currentAmount),
			contributions: contributions.sort((a, b) => b.contributedAt - a.contributedAt),
		};
	},
});

export const create = mutation({
	args: {
		name: v.string(),
		targetAmount: v.number(),
		deadline: v.optional(v.number()),
		accountId: v.optional(v.id("accounts")),
		linkedCreditId: v.optional(v.id("credits")),
		icon: v.optional(v.string()),
		color: v.optional(v.string()),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const name = validateCreditName(args.name);
		const targetAmount = validatePositiveCopAmount(args.targetAmount);
		const notes = validateCreditNotes(args.notes);
		if (args.accountId) {
			await requireAccountOwnership(ctx, userId, args.accountId);
		}
		if (args.linkedCreditId) {
			await requireCreditOwnership(ctx, userId, args.linkedCreditId);
		}
		const now = Date.now();
		return await ctx.db.insert("savingsGoals", {
			userId,
			name,
			targetAmount,
			currentAmount: 0,
			deadline: args.deadline,
			accountId: args.accountId,
			linkedCreditId: args.linkedCreditId,
			icon: args.icon,
			color: args.color,
			status: "active",
			notes,
			createdAt: now,
			updatedAt: now,
		});
	},
});

export const update = mutation({
	args: {
		goalId: v.id("savingsGoals"),
		name: v.optional(v.string()),
		targetAmount: v.optional(v.number()),
		deadline: v.optional(v.number()),
		accountId: v.optional(v.id("accounts")),
		linkedCreditId: v.optional(v.id("credits")),
		icon: v.optional(v.string()),
		color: v.optional(v.string()),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireSavingsGoalOwnership(ctx, userId, args.goalId);
		const patch: Record<string, unknown> = { updatedAt: Date.now() };
		if (args.name !== undefined) patch.name = validateCreditName(args.name);
		if (args.targetAmount !== undefined)
			patch.targetAmount = validatePositiveCopAmount(args.targetAmount);
		if (args.deadline !== undefined) patch.deadline = args.deadline;
		if (args.accountId !== undefined) {
			await requireAccountOwnership(ctx, userId, args.accountId);
			patch.accountId = args.accountId;
		}
		if (args.linkedCreditId !== undefined) {
			await requireCreditOwnership(ctx, userId, args.linkedCreditId);
			patch.linkedCreditId = args.linkedCreditId;
		}
		if (args.icon !== undefined) patch.icon = args.icon;
		if (args.color !== undefined) patch.color = args.color;
		if (args.notes !== undefined) patch.notes = validateCreditNotes(args.notes);
		await ctx.db.patch(args.goalId, patch);
		return null;
	},
});

export const pause = mutation({
	args: { goalId: v.id("savingsGoals") },
	handler: async (ctx, { goalId }) => {
		const userId = await requireUserId(ctx);
		await requireSavingsGoalOwnership(ctx, userId, goalId);
		await ctx.db.patch(goalId, { status: "paused", updatedAt: Date.now() });
		return null;
	},
});

export const resume = mutation({
	args: { goalId: v.id("savingsGoals") },
	handler: async (ctx, { goalId }) => {
		const userId = await requireUserId(ctx);
		const goal = await requireSavingsGoalOwnership(ctx, userId, goalId);
		const status =
			goal.currentAmount >= goal.targetAmount ? "completed" : "active";
		await ctx.db.patch(goalId, { status, updatedAt: Date.now() });
		return null;
	},
});

export const archive = mutation({
	args: { goalId: v.id("savingsGoals") },
	handler: async (ctx, { goalId }) => {
		const userId = await requireUserId(ctx);
		await requireSavingsGoalOwnership(ctx, userId, goalId);
		await ctx.db.patch(goalId, { status: "paused", updatedAt: Date.now() });
		return null;
	},
});
