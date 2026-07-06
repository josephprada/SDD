import { monthRange } from "@app/lib/format/date";

type PayableInstallment = {
	_id: string;
	installmentNumber: number;
	dueDate: number;
	totalDue: number;
	status: "pending" | "paid" | "overdue" | "cancelled";
};

export function listPayableInstallments<T extends PayableInstallment>(
	payments: T[],
): T[] {
	return payments.filter(
		(p) => p.status === "pending" || p.status === "overdue",
	);
}

/** Pending installment due in the current calendar month, else first pending. */
export function pickDefaultPayableInstallment<T extends PayableInstallment>(
	payments: T[],
	now: Date = new Date(),
): T | undefined {
	const payable = listPayableInstallments(payments);
	if (payable.length === 0) return undefined;

	const { start, end } = monthRange(now);
	const inCurrentMonth = payable.find(
		(p) => p.dueDate >= start && p.dueDate <= end,
	);
	return inCurrentMonth ?? payable[0];
}
