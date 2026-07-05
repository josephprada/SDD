export function daysInMonth(year: number, monthIndex: number): number {
	return new Date(year, monthIndex + 1, 0).getDate();
}

export function resolveDueDate(
	year: number,
	monthIndex: number,
	dayOfMonth: number,
): Date {
	const day = Math.min(dayOfMonth, daysInMonth(year, monthIndex));
	return new Date(year, monthIndex, day, 12, 0, 0, 0);
}

export function nextDueTimestamp(
	dayOfMonth: number,
	from: Date = new Date(),
): number {
	const now = new Date(from);
	let year = now.getFullYear();
	let month = now.getMonth();
	let due = resolveDueDate(year, month, dayOfMonth);
	if (due.getTime() < startOfDay(now).getTime()) {
		month += 1;
		if (month > 11) {
			month = 0;
			year += 1;
		}
		due = resolveDueDate(year, month, dayOfMonth);
	}
	return due.getTime();
}

function startOfDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function dateKeyFromTimestamp(ts: number): string {
	const d = new Date(ts);
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

export function dueTimestampsInRange(
	dayOfMonth: number,
	periodStart: number,
	periodEnd: number,
): number[] {
	const results: number[] = [];
	const cursor = new Date(periodStart);
	cursor.setDate(1);
	cursor.setHours(12, 0, 0, 0);

	while (cursor.getTime() <= periodEnd) {
		const due = resolveDueDate(
			cursor.getFullYear(),
			cursor.getMonth(),
			dayOfMonth,
		);
		const ts = due.getTime();
		if (ts >= periodStart && ts <= periodEnd) {
			results.push(ts);
		}
		cursor.setMonth(cursor.getMonth() + 1);
	}

	return results;
}

export function dueTimestampForPeriodKey(
	dayOfMonth: number,
	periodKey: string,
): number {
	const [yearStr, monthStr] = periodKey.split("-");
	const year = Number.parseInt(yearStr, 10);
	const monthIndex = Number.parseInt(monthStr, 10) - 1;
	return resolveDueDate(year, monthIndex, dayOfMonth).getTime();
}

export function reminderDatesForMonth(
	year: number,
	monthIndex: number,
	dayOfMonth: number,
	offsets: number[],
): number[] {
	const due = resolveDueDate(year, monthIndex, dayOfMonth);
	return offsets.map((offset) => {
		const d = new Date(due);
		d.setDate(d.getDate() - offset);
		d.setHours(12, 0, 0, 0);
		return d.getTime();
	});
}
