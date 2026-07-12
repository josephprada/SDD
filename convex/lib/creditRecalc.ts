import type { Doc } from "../_generated/dataModel";
import {
	type AbonoRecalcEffect,
	type GeneratedPayment,
	type ScheduleMode,
	computeFixedInstallment,
	generateScheduleCapitalConstant,
	generateScheduleCuotaFija,
	recalcShortenTerm,
	recalcShortenTermCapitalConstant,
	toMonthlyRate,
} from "./creditAmortization";

type PendingPaymentRow = Pick<
	Doc<"creditPayments">,
	"principal" | "interest"
>;

export function resolveShortenTermBaseline(params: {
	credit: Pick<
		Doc<"credits">,
		| "fixedInstallment"
		| "principal"
		| "termMonths"
		| "scheduleMode"
		| "rateType"
		| "interestRate"
	>;
	pendingRows: PendingPaymentRow[];
}): { fixedInstallment?: number; monthlyPrincipal?: number } {
	const { credit, pendingRows } = params;

	if (credit.scheduleMode === "capital_constant") {
		const fromPending = pendingRows[0]?.principal;
		if (fromPending && fromPending > 0) {
			return { monthlyPrincipal: fromPending };
		}
		return {
			monthlyPrincipal: Math.round(credit.principal / credit.termMonths),
		};
	}

	if (credit.fixedInstallment && credit.fixedInstallment > 0) {
		return { fixedInstallment: credit.fixedInstallment };
	}

	const firstPending = pendingRows[0];
	if (firstPending) {
		const installment = firstPending.principal + firstPending.interest;
		if (installment > 0) {
			return { fixedInstallment: installment };
		}
	}

	const monthlyRate = toMonthlyRate(credit.rateType, credit.interestRate);
	return {
		fixedInstallment: computeFixedInstallment(
			credit.principal,
			monthlyRate,
			credit.termMonths,
		),
	};
}

export function recalcAfterAbono(
	effect: AbonoRecalcEffect,
	params: {
		outstandingBalance: number;
		monthlyRate: number;
		fixedInstallment: number;
		monthlyPrincipal?: number;
		insuranceMonthly: number;
		dueDates: number[];
		scheduleMode: ScheduleMode;
		startInstallmentNumber: number;
		originalTermMonths?: number;
	},
): GeneratedPayment[] {
	if (params.outstandingBalance <= 0 || params.dueDates.length === 0) {
		return [];
	}

	if (effect === "shorten_term") {
		if (params.scheduleMode === "capital_constant") {
			const monthlyPrincipal =
				params.monthlyPrincipal ??
				Math.round(params.outstandingBalance / params.dueDates.length);
			return recalcShortenTermCapitalConstant({
				outstandingBalance: params.outstandingBalance,
				monthlyRate: params.monthlyRate,
				monthlyPrincipal,
				insuranceMonthly: params.insuranceMonthly,
				dueDates: params.dueDates,
				startInstallmentNumber: params.startInstallmentNumber,
			});
		}

		return recalcShortenTerm({
			outstandingBalance: params.outstandingBalance,
			monthlyRate: params.monthlyRate,
			fixedInstallment: params.fixedInstallment,
			insuranceMonthly: params.insuranceMonthly,
			dueDates: params.dueDates,
			startInstallmentNumber: params.startInstallmentNumber,
		});
	}

	if (params.scheduleMode === "capital_constant") {
		return generateScheduleCapitalConstant({
			outstandingBalance: params.outstandingBalance,
			monthlyRate: params.monthlyRate,
			termMonths: params.dueDates.length,
			dueDates: params.dueDates,
			insuranceMonthly: params.insuranceMonthly,
			startInstallmentNumber: params.startInstallmentNumber,
		});
	}

	return generateScheduleCuotaFija({
		outstandingBalance: params.outstandingBalance,
		monthlyRate: params.monthlyRate,
		dueDates: params.dueDates,
		insuranceMonthly: params.insuranceMonthly,
		startInstallmentNumber: params.startInstallmentNumber,
	});
}

export function resolveFixedInstallmentForCredit(params: {
	principal: number;
	monthlyRate: number;
	termMonths: number;
	scheduleMode: ScheduleMode;
	fixedInstallment?: number;
}): number {
	if (params.fixedInstallment !== undefined) return params.fixedInstallment;
	if (params.scheduleMode === "capital_constant") {
		const fixedPrincipal = Math.round(params.principal / params.termMonths);
		const firstInterest = Math.round(params.principal * params.monthlyRate);
		return fixedPrincipal + firstInterest;
	}
	return computeFixedInstallment(
		params.principal,
		params.monthlyRate,
		params.termMonths,
	);
}
