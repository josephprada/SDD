import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
	generateScheduleCapitalConstant,
	generateScheduleCuotaFija,
	toMonthlyRate,
	type GeneratedPayment,
	type ScheduleMode,
} from "./creditAmortization";
import { generateDueDates, markOverdueStatus } from "./creditDates";

export async function insertGeneratedPayments(
	ctx: MutationCtx,
	creditId: Id<"credits">,
	rows: GeneratedPayment[],
	isProjected: boolean,
) {
	const now = Date.now();
	for (const row of rows) {
		await ctx.db.insert("creditPayments", {
			creditId,
			installmentNumber: row.installmentNumber,
			dueDate: row.dueDate,
			principal: row.principal,
			interest: row.interest,
			insuranceAmount: row.insuranceAmount,
			otherFees: row.otherFees,
			totalDue: row.totalDue,
			status: "pending",
			isProjected,
			createdAt: now,
			updatedAt: now,
		});
	}
}

export async function cancelPendingPayments(
	ctx: MutationCtx,
	creditId: Id<"credits">,
) {
	const pending = await ctx.db
		.query("creditPayments")
		.withIndex("by_credit_status", (q) =>
			q.eq("creditId", creditId).eq("status", "pending"),
		)
		.collect();
	const overdue = await ctx.db
		.query("creditPayments")
		.withIndex("by_credit_status", (q) =>
			q.eq("creditId", creditId).eq("status", "overdue"),
		)
		.collect();
	const now = Date.now();
	for (const payment of [...pending, ...overdue]) {
		await ctx.db.patch(payment._id, {
			status: "cancelled",
			updatedAt: now,
		});
	}
}

/** Manual mode: installment numbers and due dates only; amounts filled by user. */
export function generateManualScheduleSkeleton(params: {
	startDate: number;
	paymentDay: number;
	termMonths: number;
	insuranceMonthly?: number;
}): GeneratedPayment[] {
	const dueDates = generateDueDates(
		params.startDate,
		params.paymentDay,
		params.termMonths,
	);
	const insurance = params.insuranceMonthly ?? 0;
	return dueDates.map((dueDate, index) => ({
		installmentNumber: index + 1,
		dueDate,
		principal: 0,
		interest: 0,
		insuranceAmount: insurance,
		otherFees: 0,
		totalDue: insurance,
	}));
}

export function buildScheduleForCredit(credit: {
	principal: number;
	rateType: Doc<"credits">["rateType"];
	interestRate: number;
	termMonths: number;
	startDate: number;
	paymentDay: number;
	scheduleMode: ScheduleMode;
	fixedInstallment?: number;
	insuranceMonthly?: number;
	outstandingBalance?: number;
}): GeneratedPayment[] {
	const monthlyRate = toMonthlyRate(credit.rateType, credit.interestRate);
	const balance = credit.outstandingBalance ?? credit.principal;
	const dueDates = generateDueDates(
		credit.startDate,
		credit.paymentDay,
		credit.termMonths,
	);
	const insurance = credit.insuranceMonthly ?? 0;

	if (credit.scheduleMode === "capital_constant") {
		return generateScheduleCapitalConstant({
			outstandingBalance: balance,
			monthlyRate,
			termMonths: credit.termMonths,
			dueDates,
			insuranceMonthly: insurance,
		});
	}

	return generateScheduleCuotaFija({
		outstandingBalance: balance,
		monthlyRate,
		dueDates,
		insuranceMonthly: insurance,
		fixedInstallment: credit.fixedInstallment,
	});
}

export async function getNextPendingPayment(
	ctx: MutationCtx,
	creditId: Id<"credits">,
) {
	const payments = await ctx.db
		.query("creditPayments")
		.withIndex("by_credit", (q) => q.eq("creditId", creditId))
		.collect();
	const now = Date.now();
	const active = payments
		.filter((p) => p.status === "pending" || p.status === "overdue")
		.map((p) => ({
			...p,
			status: markOverdueStatus(p.status, p.dueDate, now),
		}))
		.sort((a, b) => a.installmentNumber - b.installmentNumber);
	return active[0] ?? null;
}

export async function sumDestinationAllocated(
	ctx: QueryCtx | MutationCtx,
	creditId: Id<"credits">,
): Promise<number> {
	const destinations = await ctx.db
		.query("creditDestinations")
		.withIndex("by_credit", (q) => q.eq("creditId", creditId))
		.collect();
	return destinations.reduce((sum, d) => sum + d.amount, 0);
}
