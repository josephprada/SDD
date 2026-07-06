import {
	type AbonoRecalcEffect,
	type GeneratedPayment,
	type ScheduleMode,
	computeFixedInstallment,
	generateScheduleCapitalConstant,
	generateScheduleCuotaFija,
	recalcShortenTerm,
} from "./creditAmortization";

export function recalcAfterAbono(
	effect: AbonoRecalcEffect,
	params: {
		outstandingBalance: number;
		monthlyRate: number;
		fixedInstallment: number;
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
