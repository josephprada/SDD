import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { applyAbonoRecalc } from "../credits";
import {
	insertGeneratedPayments,
	cancelPendingPayments,
} from "./creditsHelpers";
import { generateDueDates } from "./creditDates";
import {
	generateScheduleCapitalConstant,
	generateScheduleCuotaFija,
	toMonthlyRate,
} from "./creditAmortization";
import { resolveFixedInstallmentForCredit } from "./creditRecalc";

async function sumPaidPrincipal(
	ctx: MutationCtx,
	creditId: Id<"credits">,
): Promise<number> {
	const payments = await ctx.db
		.query("creditPayments")
		.withIndex("by_credit", (q) => q.eq("creditId", creditId))
		.collect();
	return payments
		.filter((payment) => payment.status === "paid")
		.reduce((sum, payment) => sum + payment.principal, 0);
}

async function regeneratePendingScheduleForCredit(
	ctx: MutationCtx,
	credit: Doc<"credits">,
) {
	if (credit.outstandingBalance <= 0) {
		await ctx.db.patch(credit._id, {
			outstandingBalance: 0,
			status: "paid_off",
			updatedAt: Date.now(),
		});
		return;
	}

	const all = await ctx.db
		.query("creditPayments")
		.withIndex("by_credit", (q) => q.eq("creditId", credit._id))
		.collect();
	const paidCount = all.filter((payment) => payment.status === "paid").length;

	if (credit.scheduleMode === "manual") {
		return;
	}

	const allDueDates = generateDueDates(
		credit.startDate,
		credit.paymentDay,
		credit.termMonths,
	);
	const dueDates = allDueDates.slice(paidCount);
	if (dueDates.length === 0) {
		return;
	}

	const monthlyRate = toMonthlyRate(credit.rateType, credit.interestRate);
	const fixedInstallment =
		credit.fixedInstallment ??
		resolveFixedInstallmentForCredit({
			principal: credit.outstandingBalance,
			monthlyRate,
			termMonths: dueDates.length,
			scheduleMode: credit.scheduleMode,
		});

	const schedule =
		credit.scheduleMode === "capital_constant"
			? generateScheduleCapitalConstant({
					outstandingBalance: credit.outstandingBalance,
					monthlyRate,
					termMonths: dueDates.length,
					dueDates,
					insuranceMonthly: credit.insuranceMonthly,
					startInstallmentNumber: paidCount + 1,
				})
			: generateScheduleCuotaFija({
					outstandingBalance: credit.outstandingBalance,
					monthlyRate,
					dueDates,
					insuranceMonthly: credit.insuranceMonthly,
					fixedInstallment,
					startInstallmentNumber: paidCount + 1,
				});

	await insertGeneratedPayments(ctx, credit._id, schedule, true);
	await ctx.db.patch(credit._id, {
		termMonths: paidCount + schedule.length,
		status: "active",
		updatedAt: Date.now(),
	});
}

export async function replayCreditAbonos(
	ctx: MutationCtx,
	credit: Doc<"credits">,
): Promise<void> {
	const abonos = await ctx.db
		.query("creditCapitalAbonos")
		.withIndex("by_credit", (q) => q.eq("creditId", credit._id))
		.collect();
	abonos.sort(
		(a, b) => a.paidAt - b.paidAt || a.createdAt - b.createdAt,
	);

	const paidPrincipal = await sumPaidPrincipal(ctx, credit._id);
	const baseBalance = Math.max(0, credit.principal - paidPrincipal);

	await cancelPendingPayments(ctx, credit._id);

	if (credit.scheduleMode === "manual") {
		const abonoTotal = abonos.reduce((sum, abono) => sum + abono.amount, 0);
		const balance = Math.max(0, baseBalance - abonoTotal);
		await ctx.db.patch(credit._id, {
			outstandingBalance: balance,
			status: balance <= 0 ? "paid_off" : "active",
			updatedAt: Date.now(),
		});
		return;
	}

	await ctx.db.patch(credit._id, {
		outstandingBalance: baseBalance,
		status: baseBalance <= 0 ? "paid_off" : "active",
		updatedAt: Date.now(),
	});

	if (abonos.length === 0) {
		const refreshed = await ctx.db.get(credit._id);
		if (!refreshed) return;
		if (refreshed.outstandingBalance > 0) {
			await regeneratePendingScheduleForCredit(ctx, refreshed);
		}
		return;
	}

	let current = await ctx.db.get(credit._id);
	if (!current) return;

	for (const abono of abonos) {
		if (current.outstandingBalance <= 0) break;
		if (abono.amount > current.outstandingBalance) {
			throw new Error("Un abono supera el saldo pendiente al recalcular");
		}
		await applyAbonoRecalc(ctx, current, abono.amount, abono.recalcEffect);
		current = await ctx.db.get(credit._id);
		if (!current) return;
	}
}
