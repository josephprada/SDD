import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { mutation, query } from "./_generated/server";
import { requireCreditOwnership, requireUserId } from "./lib/auth";
import { replayCreditAbonos } from "./lib/creditAbonoReplay";
import {
	consumeSavingsGoalForAbono,
	restoreSavingsGoalFromSnapshot,
} from "./lib/savingsGoalAbono";
import { applyAbonoRecalc } from "./credits";
import {
	abonoRecalcEffectValidator,
	validateCreditNotes,
	validatePositiveCopAmount,
} from "./lib/validators";

async function requireAbonoOwnership(
	ctx: MutationCtx | QueryCtx,
	userId: Id<"users">,
	abonoId: Id<"creditCapitalAbonos">,
) {
	const abono = await ctx.db.get(abonoId);
	if (!abono) {
		throw new Error("Abono not found");
	}
	await requireCreditOwnership(ctx, userId, abono.creditId);
	return abono;
}

export const list = query({
	args: { creditId: v.id("credits") },
	handler: async (ctx, { creditId }) => {
		const userId = await requireUserId(ctx);
		await requireCreditOwnership(ctx, userId, creditId);
		const abonos = await ctx.db
			.query("creditCapitalAbonos")
			.withIndex("by_credit", (q) => q.eq("creditId", creditId))
			.collect();
		return abonos.sort((a, b) => b.paidAt - a.paidAt);
	},
});

export const create = mutation({
	args: {
		creditId: v.id("credits"),
		amount: v.number(),
		paidAt: v.number(),
		recalcEffect: abonoRecalcEffectValidator,
		transactionId: v.optional(v.id("transactions")),
		notes: v.optional(v.string()),
		savingsGoalId: v.optional(v.id("savingsGoals")),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const credit = await requireCreditOwnership(ctx, userId, args.creditId);
		if (credit.status !== "active") {
			throw new Error("Credit is not active");
		}
		const amount = validatePositiveCopAmount(args.amount);
		if (amount > credit.outstandingBalance) {
			throw new Error("Abono exceeds outstanding balance");
		}
		const notes = validateCreditNotes(args.notes);
		const recalcEffect = args.recalcEffect;
		const now = Date.now();

		let savingsGoalSnapshot;
		if (args.savingsGoalId) {
			savingsGoalSnapshot = await consumeSavingsGoalForAbono(
				ctx,
				userId,
				args.savingsGoalId,
				args.creditId,
			);
		}

		const abonoId = await ctx.db.insert("creditCapitalAbonos", {
			creditId: args.creditId,
			amount,
			paidAt: args.paidAt,
			recalcEffect,
			transactionId: args.transactionId,
			notes,
			savingsGoalSnapshot,
			createdAt: now,
		});

		await applyAbonoRecalc(ctx, credit, amount, recalcEffect);
		return abonoId;
	},
});

export const update = mutation({
	args: {
		abonoId: v.id("creditCapitalAbonos"),
		amount: v.optional(v.number()),
		paidAt: v.optional(v.number()),
		recalcEffect: v.optional(abonoRecalcEffectValidator),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const abono = await requireAbonoOwnership(ctx, userId, args.abonoId);
		const credit = await requireCreditOwnership(ctx, userId, abono.creditId);
		if (credit.status !== "active" && credit.status !== "paid_off") {
			throw new Error("Credit is not active");
		}

		const patch: {
			amount?: number;
			paidAt?: number;
			recalcEffect?: typeof abono.recalcEffect;
			notes?: string;
		} = {};

		if (args.amount !== undefined) {
			patch.amount = validatePositiveCopAmount(args.amount);
		}
		if (args.paidAt !== undefined) {
			patch.paidAt = args.paidAt;
		}
		if (args.recalcEffect !== undefined) {
			patch.recalcEffect = args.recalcEffect;
		}
		if (args.notes !== undefined) {
			patch.notes = validateCreditNotes(args.notes);
		}

		await ctx.db.patch(args.abonoId, patch);

		const refreshedCredit = await ctx.db.get(abono.creditId);
		if (!refreshedCredit) {
			throw new Error("Credit not found");
		}
		await replayCreditAbonos(ctx, refreshedCredit);
		return null;
	},
});

export const remove = mutation({
	args: { abonoId: v.id("creditCapitalAbonos") },
	handler: async (ctx, { abonoId }) => {
		const userId = await requireUserId(ctx);
		const abono = await requireAbonoOwnership(ctx, userId, abonoId);
		const snapshot = abono.savingsGoalSnapshot;

		await ctx.db.delete(abonoId);

		if (snapshot) {
			await restoreSavingsGoalFromSnapshot(ctx, userId, snapshot);
		}

		const refreshedCredit = await ctx.db.get(abono.creditId);
		if (!refreshedCredit) {
			return null;
		}
		await replayCreditAbonos(ctx, refreshedCredit);
		return null;
	},
});
