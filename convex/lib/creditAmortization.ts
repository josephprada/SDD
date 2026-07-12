export type RateType = "EA" | "NAMV" | "MV";
export type ScheduleMode = "cuota_fija" | "capital_constant" | "manual";
export type AbonoRecalcEffect = "shorten_term" | "lower_installment";

export type GeneratedPayment = {
	installmentNumber: number;
	dueDate: number;
	principal: number;
	interest: number;
	insuranceAmount: number;
	otherFees: number;
	totalDue: number;
};

export function toMonthlyRate(
	rateType: RateType,
	interestRatePercent: number,
): number {
	const r = interestRatePercent / 100;
	if (rateType === "EA") return Math.pow(1 + r, 1 / 12) - 1;
	if (rateType === "NAMV") return r / 12;
	return r;
}

export function computeFixedInstallment(
	principal: number,
	monthlyRate: number,
	termMonths: number,
): number {
	if (termMonths <= 0) throw new Error("termMonths must be positive");
	if (principal <= 0) throw new Error("principal must be positive");
	if (monthlyRate <= 0) return Math.round(principal / termMonths);
	const pow = Math.pow(1 + monthlyRate, termMonths);
	return Math.round((principal * monthlyRate * pow) / (pow - 1));
}

export function generateScheduleCuotaFija(params: {
	outstandingBalance: number;
	monthlyRate: number;
	dueDates: number[];
	insuranceMonthly?: number;
	fixedInstallment?: number;
	startInstallmentNumber?: number;
}): GeneratedPayment[] {
	const insurance = params.insuranceMonthly ?? 0;
	let balance = params.outstandingBalance;
	const installment =
		params.fixedInstallment ??
		computeFixedInstallment(
			balance,
			params.monthlyRate,
			params.dueDates.length,
		);
	const startNum = params.startInstallmentNumber ?? 1;

	const rows: GeneratedPayment[] = [];
	for (let i = 0; i < params.dueDates.length && balance > 0; i++) {
		const interest = Math.round(balance * params.monthlyRate);
		let principal = installment - interest;
		if (principal <= 0) principal = Math.min(balance, 1);
		if (principal > balance) principal = balance;
		const totalDue = principal + interest + insurance;
		rows.push({
			installmentNumber: startNum + i,
			dueDate: params.dueDates[i],
			principal,
			interest,
			insuranceAmount: insurance,
			otherFees: 0,
			totalDue,
		});
		balance -= principal;
	}
	return rows;
}

export function generateScheduleCapitalConstant(params: {
	outstandingBalance: number;
	monthlyRate: number;
	termMonths: number;
	dueDates: number[];
	insuranceMonthly?: number;
	startInstallmentNumber?: number;
}): GeneratedPayment[] {
	const insurance = params.insuranceMonthly ?? 0;
	const fixedPrincipal = Math.round(
		params.outstandingBalance / params.termMonths,
	);
	let balance = params.outstandingBalance;
	const startNum = params.startInstallmentNumber ?? 1;
	const rows: GeneratedPayment[] = [];

	for (let i = 0; i < params.dueDates.length && balance > 0; i++) {
		const isLast = i === params.dueDates.length - 1;
		const principal = isLast || balance <= fixedPrincipal ? balance : fixedPrincipal;
		const interest = Math.round(balance * params.monthlyRate);
		const totalDue = principal + interest + insurance;
		rows.push({
			installmentNumber: startNum + i,
			dueDate: params.dueDates[i],
			principal,
			interest,
			insuranceAmount: insurance,
			otherFees: 0,
			totalDue,
		});
		balance -= principal;
	}
	return rows;
}

/** shorten_term: keep fixed installment (capital+interest), fewer months. */
export function recalcShortenTerm(params: {
	outstandingBalance: number;
	monthlyRate: number;
	fixedInstallment: number;
	insuranceMonthly: number;
	dueDates: number[];
	startInstallmentNumber: number;
}): GeneratedPayment[] {
	let balance = params.outstandingBalance;
	const rows: GeneratedPayment[] = [];
	const insurance = params.insuranceMonthly;

	for (let i = 0; i < params.dueDates.length && balance > 0; i++) {
		const interest = Math.round(balance * params.monthlyRate);
		let principal = params.fixedInstallment - interest;
		if (principal <= 0) principal = Math.min(balance, 1);
		if (principal > balance) principal = balance;
		rows.push({
			installmentNumber: params.startInstallmentNumber + i,
			dueDate: params.dueDates[i],
			principal,
			interest,
			insuranceAmount: insurance,
			otherFees: 0,
			totalDue: principal + interest + insurance,
		});
		balance -= principal;
	}
	return rows;
}

/** shorten_term + capital_constant: keep monthly principal, fewer months. */
export function recalcShortenTermCapitalConstant(params: {
	outstandingBalance: number;
	monthlyRate: number;
	monthlyPrincipal: number;
	insuranceMonthly: number;
	dueDates: number[];
	startInstallmentNumber: number;
}): GeneratedPayment[] {
	let balance = params.outstandingBalance;
	const rows: GeneratedPayment[] = [];
	const insurance = params.insuranceMonthly;
	const monthlyPrincipal = Math.max(1, params.monthlyPrincipal);

	for (let i = 0; i < params.dueDates.length && balance > 0; i++) {
		const principal = Math.min(monthlyPrincipal, balance);
		const interest = Math.round(balance * params.monthlyRate);
		rows.push({
			installmentNumber: params.startInstallmentNumber + i,
			dueDate: params.dueDates[i],
			principal,
			interest,
			insuranceAmount: insurance,
			otherFees: 0,
			totalDue: principal + interest + insurance,
		});
		balance -= principal;
	}
	return rows;
}

export type PayoffSimulationResult = {
	projectedPayoffDate: number;
	monthsRemaining: number;
	totalInterestPaid: number;
	totalPrincipalPaid: number;
};

export function simulatePayoffWithAnnualAbonos(params: {
	outstandingBalance: number;
	monthlyRate: number;
	fixedInstallment: number;
	insuranceMonthly: number;
	dueDates: number[];
	annualAbonoAmount: number;
	annualAbonoMonth: number;
	maxYears?: number;
}): PayoffSimulationResult {
	let balance = params.outstandingBalance;
	let totalInterest = 0;
	let totalPrincipal = 0;
	const maxMonths = (params.maxYears ?? 50) * 12;
	let monthsRemaining = 0;
	let payoffDate = params.dueDates[params.dueDates.length - 1] ?? Date.now();

	for (let i = 0; i < Math.min(params.dueDates.length, maxMonths) && balance > 0; i++) {
		monthsRemaining += 1;
		const dueDate = params.dueDates[i] ?? params.dueDates[params.dueDates.length - 1];
		const d = new Date(dueDate);
		if (d.getMonth() === params.annualAbonoMonth && i > 0) {
			const abono = Math.min(params.annualAbonoAmount, balance);
			balance -= abono;
			totalPrincipal += abono;
		}
		if (balance <= 0) {
			payoffDate = dueDate;
			break;
		}
		const interest = Math.round(balance * params.monthlyRate);
		let principal = params.fixedInstallment - interest;
		if (principal <= 0) principal = Math.min(balance, 1);
		if (principal > balance) principal = balance;
		totalInterest += interest;
		totalPrincipal += principal;
		balance -= principal;
		payoffDate = dueDate;
	}

	return {
		projectedPayoffDate: payoffDate,
		monthsRemaining,
		totalInterestPaid: totalInterest,
		totalPrincipalPaid: totalPrincipal,
	};
}
