import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireCreditOwnership, requireUserId } from "./lib/auth";
import {
	abonoRecalcEffectValidator,
	validateCreditNotes,
	validatePositiveCopAmount,
} from "./lib/validators";
import { applyAbonoRecalc } from "./credits";

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

		const abonoId = await ctx.db.insert("creditCapitalAbonos", {
			creditId: args.creditId,
			amount,
			paidAt: args.paidAt,
			recalcEffect,
			transactionId: args.transactionId,
			notes,
			createdAt: now,
		});

		await applyAbonoRecalc(ctx, credit, amount, recalcEffect);
		return abonoId;
	},
});
