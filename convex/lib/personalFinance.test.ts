import { describe, expect, it } from "bun:test";
import type { Doc, Id } from "../_generated/dataModel";
import {
	countsForPersonalFinance,
	isAccountExcludedFromPersonalFinance,
} from "./personalFinance";

function account(
	overrides: Partial<
		Pick<Doc<"accounts">, "excludeFromPersonalFinance" | "isCreditEscrow">
	>,
) {
	return {
		excludeFromPersonalFinance: overrides.excludeFromPersonalFinance,
		isCreditEscrow: overrides.isCreditEscrow,
	};
}

function tx(
	overrides: Partial<
		Pick<
			Doc<"transactions">,
			"accountId" | "isCreditFundMovement" | "isCreditInstallmentPayment"
		>
	>,
): Doc<"transactions"> {
	return {
		_id: "tx1" as Id<"transactions">,
		_creationTime: 0,
		userId: "u1" as Id<"users">,
		type: "expense",
		amount: 1000,
		date: 0,
		accountId: (overrides.accountId ?? "acc1") as Id<"accounts">,
		categoryId: "cat1" as Id<"categories">,
		isCreditFundMovement: overrides.isCreditFundMovement,
		isCreditInstallmentPayment: overrides.isCreditInstallmentPayment,
		createdAt: 0,
		updatedAt: 0,
	};
}

describe("isAccountExcludedFromPersonalFinance", () => {
	it("honors explicit exclude flag", () => {
		expect(
			isAccountExcludedFromPersonalFinance(
				account({ excludeFromPersonalFinance: true }),
			),
		).toBe(true);
		expect(
			isAccountExcludedFromPersonalFinance(
				account({ excludeFromPersonalFinance: false, isCreditEscrow: true }),
			),
		).toBe(false);
	});

	it("falls back to escrow when flag is unset", () => {
		expect(
			isAccountExcludedFromPersonalFinance(account({ isCreditEscrow: true })),
		).toBe(true);
		expect(isAccountExcludedFromPersonalFinance(account({}))).toBe(false);
	});
});

describe("countsForPersonalFinance", () => {
	const excluded = new Set<Id<"accounts">>(["escrow" as Id<"accounts">]);

	it("always counts installment payments", () => {
		expect(
			countsForPersonalFinance(
				tx({
					accountId: "escrow" as Id<"accounts">,
					isCreditInstallmentPayment: true,
				}),
				excluded,
			),
		).toBe(true);
	});

	it("excludes fund movements and isolated accounts", () => {
		expect(
			countsForPersonalFinance(tx({ isCreditFundMovement: true }), excluded),
		).toBe(false);
		expect(
			countsForPersonalFinance(
				tx({ accountId: "escrow" as Id<"accounts"> }),
				excluded,
			),
		).toBe(false);
		expect(
			countsForPersonalFinance(
				tx({ accountId: "payroll" as Id<"accounts"> }),
				excluded,
			),
		).toBe(true);
	});
});
