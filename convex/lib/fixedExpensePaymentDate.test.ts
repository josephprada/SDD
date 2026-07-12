import { describe, expect, test } from "bun:test";
import {
	resolveFixedExpensePaymentDate,
	resolveFixedExpensePaymentPeriodKey,
} from "./fixedExpensePaymentDate";

describe("resolveFixedExpensePaymentDate", () => {
	test("uses the payment moment, not the fixed expense due date", () => {
		const now = Date.UTC(2026, 6, 5, 18, 30, 0);
		expect(resolveFixedExpensePaymentDate({ now })).toBe(now);
	});
});

describe("resolveFixedExpensePaymentPeriodKey", () => {
	test("prefers explicit period key from UI", () => {
		expect(
			resolveFixedExpensePaymentPeriodKey({
				periodKey: "2026-06",
				dueDate: Date.UTC(2026, 6, 1),
			}),
		).toBe("2026-06");
	});
});
