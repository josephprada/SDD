import { describe, expect, test } from "bun:test";
import { buildTaxSuggestions, taxYearBounds } from "./taxSuggest";

describe("taxSuggest", () => {
	test("taxYearBounds covers calendar year in Bogotá", () => {
		const { start, end } = taxYearBounds(2025);
		expect(start).toBe(Date.UTC(2025, 0, 1, 5, 0, 0, 0));
		expect(end).toBe(Date.UTC(2026, 0, 1, 5, 0, 0, 0));
	});

	test("suggests accounts and credits", () => {
		const { suggestions, skippedAlreadyAccepted } = buildTaxSuggestions({
			taxYear: 2025,
			accounts: [
				{
					_id: "acc1",
					name: "Ahorros",
					type: "bank",
					balance: 2_000_000,
					archived: false,
				},
				{
					_id: "acc2",
					name: "TC",
					type: "credit",
					balance: -100,
					archived: false,
				},
			],
			credits: [
				{
					_id: "cr1",
					name: "Hipoteca",
					status: "active",
					outstandingBalance: 40_000_000,
				},
			],
			transactions: [],
			acceptedSources: [],
		});

		expect(skippedAlreadyAccepted).toBe(0);
		expect(suggestions.some((s) => s.sourceType === "account")).toBe(true);
		expect(suggestions.some((s) => s.sourceType === "credit")).toBe(true);
	});

	test("skips already accepted sources", () => {
		const { suggestions, skippedAlreadyAccepted } = buildTaxSuggestions({
			taxYear: 2025,
			accounts: [
				{
					_id: "acc1",
					name: "Ahorros",
					type: "bank",
					balance: 1_000_000,
					archived: false,
				},
			],
			credits: [],
			transactions: [],
			acceptedSources: [{ sourceType: "account", sourceId: "acc1" }],
		});

		expect(skippedAlreadyAccepted).toBe(1);
		expect(suggestions).toHaveLength(0);
	});

	test("aggregates income by category in year", () => {
		const { start } = taxYearBounds(2025);
		const { suggestions } = buildTaxSuggestions({
			taxYear: 2025,
			accounts: [],
			credits: [],
			transactions: [
				{
					type: "income",
					amount: 3_000_000,
					date: start + 86_400_000,
					categoryId: "cat1",
					categoryName: "Salario",
				},
				{
					type: "income",
					amount: 1_000_000,
					date: start + 172_800_000,
					categoryId: "cat1",
					categoryName: "Salario",
				},
			],
			acceptedSources: [],
		});

		const income = suggestions.find((s) => s.sourceType === "income_category");
		expect(income?.amount).toBe(4_000_000);
		expect(income?.category).toBe("salarios");
	});
});
