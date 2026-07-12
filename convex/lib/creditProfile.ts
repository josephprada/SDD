import type { Doc } from "../_generated/dataModel";

export type CreditProfile =
	| "free_purpose"
	| "housing_improvement"
	| "debt_consolidation"
	| "tangible_product"
	| "intangible_service"
	| "p2p_agreement";

export type SetupStatus = "draft" | "ready" | "active";

export const SCHEDULE_REQUIRED_FIELDS = [
	"principal",
	"rateType",
	"interestRate",
	"termMonths",
	"paymentDay",
	"scheduleMode",
] as const;

export type ScheduleFieldKey = (typeof SCHEDULE_REQUIRED_FIELDS)[number];

export function resolveSetupStatus(
	credit: Pick<
		Doc<"credits">,
		| "setupStatus"
		| "principal"
		| "rateType"
		| "interestRate"
		| "termMonths"
		| "paymentDay"
		| "scheduleMode"
	>,
	hasPayments: boolean,
): SetupStatus {
	if (credit.setupStatus === "active" || hasPayments) {
		return "active";
	}
	if (hasMinimumScheduleFields(credit)) {
		return "ready";
	}
	return credit.setupStatus ?? "draft";
}

export function hasMinimumScheduleFields(
	credit: Partial<
		Pick<
			Doc<"credits">,
			| "principal"
			| "rateType"
			| "interestRate"
			| "termMonths"
			| "paymentDay"
			| "scheduleMode"
		>
	>,
): boolean {
	return (
		typeof credit.principal === "number" &&
		credit.principal > 0 &&
		credit.rateType !== undefined &&
		typeof credit.interestRate === "number" &&
		credit.interestRate >= 0 &&
		typeof credit.termMonths === "number" &&
		credit.termMonths >= 1 &&
		typeof credit.paymentDay === "number" &&
		credit.paymentDay >= 1 &&
		credit.paymentDay <= 31 &&
		credit.scheduleMode !== undefined
	);
}

export function getMissingScheduleFields(
	credit: Partial<
		Pick<
			Doc<"credits">,
			| "principal"
			| "rateType"
			| "interestRate"
			| "termMonths"
			| "paymentDay"
			| "scheduleMode"
		>
	>,
): ScheduleFieldKey[] {
	const missing: ScheduleFieldKey[] = [];
	if (!credit.principal || credit.principal <= 0) missing.push("principal");
	if (!credit.rateType) missing.push("rateType");
	if (credit.interestRate === undefined || credit.interestRate < 0) {
		missing.push("interestRate");
	}
	if (!credit.termMonths || credit.termMonths < 1) missing.push("termMonths");
	if (!credit.paymentDay || credit.paymentDay < 1 || credit.paymentDay > 31) {
		missing.push("paymentDay");
	}
	if (!credit.scheduleMode) missing.push("scheduleMode");
	return missing;
}

export function inferCreditProfile(
	credit: Pick<Doc<"credits">, "disbursementAccountId" | "creditProfile">,
): CreditProfile {
	if (credit.creditProfile) {
		return credit.creditProfile;
	}
	if (credit.disbursementAccountId) {
		return "free_purpose";
	}
	return "free_purpose";
}

export function isDraftCredit(credit: Pick<Doc<"credits">, "setupStatus">): boolean {
	return credit.setupStatus === "draft";
}
