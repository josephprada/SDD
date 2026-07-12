import { describe, expect, test } from "bun:test";
import type { Doc } from "../_generated/dataModel";
import { appliesToPeriodKey } from "./fixedExpensePeriod";
import { periodKeyToMonthRange } from "./period";

function item(
	overrides: Partial<Pick<Doc<"fixedExpenses">, "onlyPeriodKey" | "createdAt">>,
): Pick<Doc<"fixedExpenses">, "onlyPeriodKey" | "createdAt"> {
	return {
		onlyPeriodKey: undefined,
		createdAt: periodKeyToMonthRange("2026-06").start,
		...overrides,
	};
}

describe("appliesToPeriodKey", () => {
	test("single-month expense only appears in that month", () => {
		const fixed = item({ onlyPeriodKey: "2026-07" });
		expect(appliesToPeriodKey(fixed, "2026-07")).toBe(true);
		expect(appliesToPeriodKey(fixed, "2026-08")).toBe(false);
	});

	test("monthly expense appears in months after creation", () => {
		const fixed = item({
			createdAt: periodKeyToMonthRange("2026-06").start,
		});
		expect(appliesToPeriodKey(fixed, "2026-06")).toBe(true);
		expect(appliesToPeriodKey(fixed, "2026-07")).toBe(true);
		expect(appliesToPeriodKey(fixed, "2026-05")).toBe(false);
	});
});
