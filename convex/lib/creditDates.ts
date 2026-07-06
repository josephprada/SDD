export function daysInMonth(year: number, monthIndex: number): number {
	return new Date(year, monthIndex + 1, 0).getDate();
}

export function resolvePaymentDate(
	year: number,
	monthIndex: number,
	paymentDay: number,
): Date {
	const day = Math.min(paymentDay, daysInMonth(year, monthIndex));
	return new Date(year, monthIndex, day, 12, 0, 0, 0);
}

/** First installment due one month after startDate on paymentDay. */
export function generateDueDates(
	startDate: number,
	paymentDay: number,
	count: number,
): number[] {
	if (count <= 0) return [];
	const start = new Date(startDate);
	let year = start.getFullYear();
	let month = start.getMonth() + 1;
	if (month > 11) {
		month = 0;
		year += 1;
	}

	const dates: number[] = [];
	for (let i = 0; i < count; i++) {
		dates.push(resolvePaymentDate(year, month, paymentDay).getTime());
		month += 1;
		if (month > 11) {
			month = 0;
			year += 1;
		}
	}
	return dates;
}

export function startOfDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export type PaymentStatus = "pending" | "paid" | "overdue" | "cancelled";

export function markOverdueStatus(
	status: PaymentStatus,
	dueDate: number,
	now: number = Date.now(),
): PaymentStatus {
	if (status !== "pending") return status;
	if (startOfDay(new Date(dueDate)).getTime() < startOfDay(new Date(now)).getTime()) {
		return "overdue";
	}
	return status;
}

export function dateKeyFromTimestamp(ts: number): string {
	const d = new Date(ts);
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}
