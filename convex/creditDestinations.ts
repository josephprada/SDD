import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireCreditOwnership, requireUserId } from "./lib/auth";
import {
	destinationStatusValidator,
	validateCreditName,
	validateCreditNotes,
	validatePositiveCopAmount,
} from "./lib/validators";

export const list = query({
	args: { creditId: v.id("credits") },
	handler: async (ctx, { creditId }) => {
		const userId = await requireUserId(ctx);
		const credit = await requireCreditOwnership(ctx, userId, creditId);
		const destinations = await ctx.db
			.query("creditDestinations")
			.withIndex("by_credit", (q) => q.eq("creditId", creditId))
			.collect();
		const transactions = await ctx.db
			.query("transactions")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();
		const spentByDestination = new Map<string, number>();
		for (const transaction of transactions) {
			if (
				transaction.type !== "expense" ||
				!transaction.creditDestinationId
			) {
				continue;
			}
			const key = transaction.creditDestinationId;
			spentByDestination.set(
				key,
				(spentByDestination.get(key) ?? 0) + transaction.amount,
			);
		}
		const totalAllocated = destinations.reduce((s, d) => s + d.amount, 0);
		return {
			destinations: destinations
				.sort((a, b) => a.createdAt - b.createdAt)
				.map((destination) => ({
					...destination,
					spentTotal: spentByDestination.get(destination._id) ?? 0,
				})),
			totalAllocated,
			unallocated: credit.principal - totalAllocated,
			overAllocated: totalAllocated > credit.principal,
		};
	},
});

export const create = mutation({
	args: {
		creditId: v.id("credits"),
		name: v.string(),
		amount: v.number(),
		status: v.optional(destinationStatusValidator),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireCreditOwnership(ctx, userId, args.creditId);
		const name = validateCreditName(args.name);
		const amount = validatePositiveCopAmount(args.amount);
		const notes = validateCreditNotes(args.notes);
		const now = Date.now();

		return await ctx.db.insert("creditDestinations", {
			creditId: args.creditId,
			name,
			amount,
			status: args.status ?? "planned",
			notes,
			createdAt: now,
			updatedAt: now,
		});
	},
});

export const update = mutation({
	args: {
		destinationId: v.id("creditDestinations"),
		name: v.optional(v.string()),
		amount: v.optional(v.number()),
		status: v.optional(destinationStatusValidator),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const destination = await ctx.db.get(args.destinationId);
		if (!destination) throw new Error("Destination not found");
		await requireCreditOwnership(ctx, userId, destination.creditId);

		const patch: Record<string, unknown> = { updatedAt: Date.now() };
		if (args.name !== undefined) patch.name = validateCreditName(args.name);
		if (args.amount !== undefined)
			patch.amount = validatePositiveCopAmount(args.amount);
		if (args.status !== undefined) patch.status = args.status;
		if (args.notes !== undefined) patch.notes = validateCreditNotes(args.notes);

		await ctx.db.patch(args.destinationId, patch);
		return null;
	},
});

export const remove = mutation({
	args: { destinationId: v.id("creditDestinations") },
	handler: async (ctx, { destinationId }) => {
		const userId = await requireUserId(ctx);
		const destination = await ctx.db.get(destinationId);
		if (!destination) throw new Error("Destination not found");
		await requireCreditOwnership(ctx, userId, destination.creditId);
		if (destination.status === "completed") {
			throw new Error("Cannot delete completed destination");
		}
		await ctx.db.delete(destinationId);
		return null;
	},
});
