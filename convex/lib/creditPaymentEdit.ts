import type { Doc } from "../_generated/dataModel";
import type { ScheduleMode } from "./creditAmortization";

export function canEditPendingPaymentAmount(scheduleMode: ScheduleMode): boolean {
	return (
		scheduleMode === "manual" ||
		scheduleMode === "cuota_fija" ||
		scheduleMode === "capital_constant"
	);
}

export function applyPaymentTotalOverride(
	payment: Pick<
		Doc<"creditPayments">,
		"principal" | "interest" | "insuranceAmount" | "otherFees"
	>,
	totalAmount: number,
	scheduleMode: ScheduleMode,
): Pick<
	Doc<"creditPayments">,
	"principal" | "interest" | "insuranceAmount" | "otherFees" | "totalDue"
> {
	const insurance = payment.insuranceAmount ?? 0;
	const fees = payment.otherFees ?? 0;
	const total = Math.max(0, Math.round(totalAmount));

	if (scheduleMode === "manual") {
		return {
			principal: total,
			interest: 0,
			insuranceAmount: 0,
			otherFees: 0,
			totalDue: total,
		};
	}

	const baseTotal = total - insurance - fees;
	const currentBase = payment.principal + payment.interest;

	if (currentBase <= 0 || baseTotal <= 0) {
		const principal = Math.max(0, baseTotal);
		return {
			principal,
			interest: 0,
			insuranceAmount: insurance,
			otherFees: fees,
			totalDue: principal + insurance + fees,
		};
	}

	const principal = Math.round((payment.principal / currentBase) * baseTotal);
	const interest = baseTotal - principal;

	return {
		principal,
		interest,
		insuranceAmount: insurance,
		otherFees: fees,
		totalDue: principal + interest + insurance + fees,
	};
}
