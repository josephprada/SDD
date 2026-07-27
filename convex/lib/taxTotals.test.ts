import { describe, expect, test } from "bun:test";
import { computeSectionTotals, emptySectionTotals } from "./taxTotals";

describe("taxTotals", () => {
	test("empty totals", () => {
		expect(emptySectionTotals()).toEqual({
			assets: 0,
			liabilities: 0,
			income: 0,
			deductions: 0,
			exempt: 0,
			grandTotal: 0,
		});
	});

	test("sums by section", () => {
		const totals = computeSectionTotals([
			{ section: "income", amount: 1_000_000 },
			{ section: "income", amount: 500_000 },
			{ section: "deductions", amount: 200_000 },
			{ section: "assets", amount: 3_000_000 },
		]);
		expect(totals.income).toBe(1_500_000);
		expect(totals.deductions).toBe(200_000);
		expect(totals.assets).toBe(3_000_000);
		expect(totals.grandTotal).toBe(4_700_000);
	});
});
