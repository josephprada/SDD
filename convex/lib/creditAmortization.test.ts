import { describe, expect, test } from "bun:test";
import {
	computeFixedInstallment,
	generateScheduleCuotaFija,
	simulatePayoffWithAnnualAbonos,
	toMonthlyRate,
} from "./creditAmortization";
import { generateDueDates } from "./creditDates";

describe("creditAmortization QA case", () => {
	const principal = 40_000_000;
	const rateType = "MV" as const;
	const interestRate = 1.08;
	const termMonths = 120;
	const monthlyRate = toMonthlyRate(rateType, interestRate);
	const startDate = new Date(2024, 0, 15).getTime();
	const paymentDay = 15;
	const dueDates = generateDueDates(startDate, paymentDay, termMonths);

	test("fixed installment for $40M at 1.08% MV / 120 months", () => {
		const installment = computeFixedInstallment(
			principal,
			monthlyRate,
			termMonths,
		);
		expect(installment).toBe(596_300);
	});

	test("known cuota ~625.958 can be passed explicitly", () => {
		const schedule = generateScheduleCuotaFija({
			outstandingBalance: principal,
			monthlyRate,
			dueDates,
			fixedInstallment: 625_958,
		});
		expect(schedule[0]?.totalDue).toBe(625_958);
	});

	test("schedule pays off principal", () => {
		const installment = computeFixedInstallment(
			principal,
			monthlyRate,
			termMonths,
		);
		const schedule = generateScheduleCuotaFija({
			outstandingBalance: principal,
			monthlyRate,
			dueDates,
			fixedInstallment: installment,
		});
		const totalPrincipal = schedule.reduce((s, r) => s + r.principal, 0);
		expect(totalPrincipal).toBe(principal);
		expect(schedule.length).toBeLessThanOrEqual(termMonths);
	});

	test("annual $6M abono shortens payoff vs baseline", () => {
		const installment = computeFixedInstallment(
			principal,
			monthlyRate,
			termMonths,
		);
		const baseline = generateScheduleCuotaFija({
			outstandingBalance: principal,
			monthlyRate,
			dueDates,
			fixedInstallment: installment,
		});
		const simulated = simulatePayoffWithAnnualAbonos({
			outstandingBalance: principal,
			monthlyRate,
			fixedInstallment: installment,
			insuranceMonthly: 0,
			dueDates,
			annualAbonoAmount: 6_000_000,
			annualAbonoMonth: 11,
		});
		expect(simulated.monthsRemaining).toBeLessThan(baseline.length);
		expect(simulated.monthsRemaining).toBeLessThan(120);
	});
});
