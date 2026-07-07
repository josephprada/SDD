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
	options?: { markFirstPaidCount?: number },
) {
	const now = Date.now();
	const markPaidUpTo = options?.markFirstPaidCount ?? 0;
	for (const row of rows) {
		const isHistoricalPaid =
			markPaidUpTo > 0 && row.installmentNumber <= markPaidUpTo;
		await ctx.db.insert("creditPayments", {
			creditId,
			installmentNumber: row.installmentNumber,
			dueDate: row.dueDate,
			principal: row.principal,
			interest: row.interest,
			insuranceAmount: row.insuranceAmount,
			otherFees: row.otherFees,
			totalDue: row.totalDue,
			status: isHistoricalPaid ? "paid" : "pending",
			paidDate: isHistoricalPaid ? row.dueDate : undefined,
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
	dueDates?: number[];
	startInstallmentNumber?: number;
	/** For capital_constant when generating remaining installments only */
	remainingTermMonths?: number;
}): GeneratedPayment[] {
	const monthlyRate = toMonthlyRate(credit.rateType, credit.interestRate);
	const balance = credit.outstandingBalance ?? credit.principal;
	const dueDates =
		credit.dueDates ??
		generateDueDates(credit.startDate, credit.paymentDay, credit.termMonths);
	const insurance = credit.insuranceMonthly ?? 0;
	const startInstallmentNumber = credit.startInstallmentNumber ?? 1;

	if (credit.scheduleMode === "capital_constant") {
		const termMonths = credit.remainingTermMonths ?? credit.termMonths;
		return generateScheduleCapitalConstant({
			outstandingBalance: balance,
			monthlyRate,
			termMonths,
			dueDates,
			insuranceMonthly: insurance,
			startInstallmentNumber,
		});
	}

	return generateScheduleCuotaFija({
		outstandingBalance: balance,
		monthlyRate,
		dueDates,
		insuranceMonthly: insurance,
		fixedInstallment: credit.fixedInstallment,
		startInstallmentNumber,
	});
}

export function computeOutstandingAfterPaidInstallments(params: {
	principal: number;
	monthlyRate: number;
	scheduleMode: ScheduleMode;
	termMonths: number;
	paidInstallmentsCount: number;
	startDate: number;
	paymentDay: number;
	fixedInstallment?: number;
}): number {
	if (params.paidInstallmentsCount <= 0) return params.principal;
	if (params.scheduleMode === "manual") return params.principal;

	const allDueDates = generateDueDates(
		params.startDate,
		params.paymentDay,
		params.termMonths,
	);
	const paidDueDates = allDueDates.slice(0, params.paidInstallmentsCount);

	if (params.scheduleMode === "capital_constant") {
		const rows = generateScheduleCapitalConstant({
			outstandingBalance: params.principal,
			monthlyRate: params.monthlyRate,
			termMonths: params.termMonths,
			dueDates: paidDueDates,
		});
		return params.principal - rows.reduce((sum, row) => sum + row.principal, 0);
	}

	const rows = generateScheduleCuotaFija({
		outstandingBalance: params.principal,
		monthlyRate: params.monthlyRate,
		dueDates: paidDueDates,
		fixedInstallment: params.fixedInstallment,
	});
	return params.principal - rows.reduce((sum, row) => sum + row.principal, 0);
}

export type InProgressCreditScheduleInput = {
	principal: number;
	rateType: Doc<"credits">["rateType"];
	interestRate: number;
	termMonths: number;
	startDate: number;
	paymentDay: number;
	scheduleMode: ScheduleMode;
	fixedInstallment?: number;
	insuranceMonthly?: number;
	paidInstallmentsCount: number;
	trackRemainingOnly: boolean;
	outstandingBalanceOverride?: number;
};

export function resolveInProgressCreditSchedule(
	params: InProgressCreditScheduleInput,
): {
	schedule: GeneratedPayment[];
	outstandingBalance: number;
	isProjected: boolean;
	markFirstPaidCount?: number;
} {
	const paid = params.paidInstallmentsCount;
	const monthlyRate = toMonthlyRate(params.rateType, params.interestRate);
	const allDueDates = generateDueDates(
		params.startDate,
		params.paymentDay,
		params.termMonths,
	);
	const computedBalance = computeOutstandingAfterPaidInstallments({
		principal: params.principal,
		monthlyRate,
		scheduleMode: params.scheduleMode,
		termMonths: params.termMonths,
		paidInstallmentsCount: paid,
		startDate: params.startDate,
		paymentDay: params.paymentDay,
		fixedInstallment: params.fixedInstallment,
	});
	const outstandingBalance =
		params.outstandingBalanceOverride ?? computedBalance;

	if (params.trackRemainingOnly) {
		const remainingMonths = params.termMonths - paid;
		const remainingDueDates = allDueDates.slice(paid);

		if (params.scheduleMode === "manual") {
			const insurance = params.insuranceMonthly ?? 0;
			return {
				schedule: remainingDueDates.map((dueDate, index) => ({
					installmentNumber: paid + 1 + index,
					dueDate,
					principal: 0,
					interest: 0,
					insuranceAmount: insurance,
					otherFees: 0,
					totalDue: insurance,
				})),
				outstandingBalance,
				isProjected: false,
			};
		}

		return {
			schedule: buildScheduleForCredit({
				principal: params.principal,
				rateType: params.rateType,
				interestRate: params.interestRate,
				termMonths: params.termMonths,
				startDate: params.startDate,
				paymentDay: params.paymentDay,
				scheduleMode: params.scheduleMode,
				fixedInstallment: params.fixedInstallment,
				insuranceMonthly: params.insuranceMonthly,
				outstandingBalance,
				dueDates: remainingDueDates,
				startInstallmentNumber: paid + 1,
				remainingTermMonths:
					params.scheduleMode === "capital_constant"
						? remainingMonths
						: undefined,
			}),
			outstandingBalance,
			isProjected: true,
		};
	}

	if (params.scheduleMode === "manual") {
		return {
			schedule: generateManualScheduleSkeleton({
				startDate: params.startDate,
				paymentDay: params.paymentDay,
				termMonths: params.termMonths,
				insuranceMonthly: params.insuranceMonthly,
			}),
			outstandingBalance,
			isProjected: false,
			markFirstPaidCount: paid,
		};
	}

	return {
		schedule: buildScheduleForCredit({
			principal: params.principal,
			rateType: params.rateType,
			interestRate: params.interestRate,
			termMonths: params.termMonths,
			startDate: params.startDate,
			paymentDay: params.paymentDay,
			scheduleMode: params.scheduleMode,
			fixedInstallment: params.fixedInstallment,
			insuranceMonthly: params.insuranceMonthly,
		}),
		outstandingBalance,
		isProjected: true,
		markFirstPaidCount: paid,
	};
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
