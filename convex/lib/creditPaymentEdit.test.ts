import { describe, expect, test } from "bun:test";
import { applyPaymentTotalOverride } from "./creditPaymentEdit";

describe("applyPaymentTotalOverride", () => {
	test("manual mode stores total as principal", () => {
		const result = applyPaymentTotalOverride(
			{ principal: 0, interest: 0, insuranceAmount: 0, otherFees: 0 },
			625_958,
			"manual",
		);
		expect(result.totalDue).toBe(625_958);
		expect(result.principal).toBe(625_958);
		expect(result.interest).toBe(0);
	});

	test("cuota_fija keeps capital/interest ratio when overriding total", () => {
		const result = applyPaymentTotalOverride(
			{ principal: 400_000, interest: 225_958, insuranceAmount: 0, otherFees: 0 },
			650_000,
			"cuota_fija",
		);
		expect(result.totalDue).toBe(650_000);
		expect(result.principal + result.interest).toBe(650_000);
		expect(result.principal).toBeGreaterThan(result.interest);
	});
});
