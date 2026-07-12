import { describe, expect, test } from "bun:test";
import {
	computeFixedInstallment,
	generateScheduleCuotaFija,
	toMonthlyRate,
} from "./creditAmortization";
import { generateDueDates } from "./creditDates";
import {
	recalcAfterAbono,
	resolveShortenTermBaseline,
} from "./creditRecalc";

describe("shorten_term abono recalc", () => {
	const principal = 40_000_000;
	const rateType = "MV" as const;
	const interestRate = 1.08;
	const termMonths = 120;
	const monthlyRate = toMonthlyRate(rateType, interestRate);
	const startDate = new Date(2024, 0, 15).getTime();
	const paymentDay = 15;
	const dueDates = generateDueDates(startDate, paymentDay, termMonths);
	const fixedInstallment = computeFixedInstallment(
		principal,
		monthlyRate,
		termMonths,
	);

	test("keeps installment amount and reduces pending count after abono", () => {
		const schedule = generateScheduleCuotaFija({
			outstandingBalance: principal,
			monthlyRate,
			dueDates,
			fixedInstallment,
		});
		const abonoAmount = 6_000_000;
		const newBalance = principal - abonoAmount;
		const pendingRows = schedule.slice(12);

		const baseline = resolveShortenTermBaseline({
			credit: {
				fixedInstallment: undefined,
				principal,
				termMonths,
				scheduleMode: "cuota_fija",
				rateType,
				interestRate,
			},
			pendingRows,
		});

		expect(baseline.fixedInstallment).toBe(fixedInstallment);

		const rows = recalcAfterAbono("shorten_term", {
			outstandingBalance: newBalance,
			monthlyRate,
			fixedInstallment: baseline.fixedInstallment!,
			insuranceMonthly: 0,
			dueDates: pendingRows.map((row) => row.dueDate),
			scheduleMode: "cuota_fija",
			startInstallmentNumber: pendingRows[0]!.installmentNumber,
		});

		expect(rows.length).toBeLessThan(pendingRows.length);
		expect(rows[0]!.principal + rows[0]!.interest).toBe(fixedInstallment);
		expect(rows[1]!.principal + rows[1]!.interest).toBe(fixedInstallment);
	});

	test("does not shrink installment when using outstanding balance fallback", () => {
		const reducedBalance = 32_000_000;
		const wrongInstallment = computeFixedInstallment(
			reducedBalance,
			monthlyRate,
			termMonths,
		);
		expect(wrongInstallment).toBeLessThan(fixedInstallment);

		const baseline = resolveShortenTermBaseline({
			credit: {
				fixedInstallment: undefined,
				principal,
				termMonths,
				scheduleMode: "cuota_fija",
				rateType,
				interestRate,
			},
			pendingRows: [
				{
					principal: fixedInstallment - Math.round(reducedBalance * monthlyRate),
					interest: Math.round(reducedBalance * monthlyRate),
				},
			],
		});

		expect(baseline.fixedInstallment).toBe(fixedInstallment);
		expect(baseline.fixedInstallment).toBeGreaterThan(wrongInstallment);
	});
});
