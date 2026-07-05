export function periodKeyFromTimestamp(ts: number): string {
	const d = new Date(ts);
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	return `${y}-${m}`;
}

export function periodKeyToMonthRange(periodKey: string): {
	start: number;
	end: number;
} {
	const [yearStr, monthStr] = periodKey.split("-");
	const year = Number.parseInt(yearStr, 10);
	const month = Number.parseInt(monthStr, 10) - 1;
	const start = new Date(year, month, 1, 0, 0, 0, 0).getTime();
	const end = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();
	return { start, end };
}

function startOfWeek(date: Date): Date {
	const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const day = d.getDay();
	const diff = day === 0 ? -6 : 1 - day;
	d.setDate(d.getDate() + diff);
	d.setHours(0, 0, 0, 0);
	return d;
}

function endOfWeek(date: Date): Date {
	const start = startOfWeek(date);
	const end = new Date(start);
	end.setDate(end.getDate() + 6);
	end.setHours(23, 59, 59, 999);
	return end;
}

function startOfQuarter(date: Date): Date {
	const q = Math.floor(date.getMonth() / 3) * 3;
	return new Date(date.getFullYear(), q, 1, 0, 0, 0, 0);
}

function endOfQuarter(date: Date): Date {
	const start = startOfQuarter(date);
	return new Date(start.getFullYear(), start.getMonth() + 3, 0, 23, 59, 59, 999);
}

function startOfSemester(date: Date): Date {
	const m = date.getMonth() < 6 ? 0 : 6;
	return new Date(date.getFullYear(), m, 1, 0, 0, 0, 0);
}

function endOfSemester(date: Date): Date {
	const start = startOfSemester(date);
	return new Date(start.getFullYear(), start.getMonth() + 6, 0, 23, 59, 59, 999);
}

export type GroupingId = "week" | "month" | "quarter" | "semester";

export function periodRangeForGrouping(
	grouping: GroupingId,
	anchor: Date,
): { start: number; end: number } {
	switch (grouping) {
		case "week":
			return {
				start: startOfWeek(anchor).getTime(),
				end: endOfWeek(anchor).getTime(),
			};
		case "month": {
			const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
			const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 23, 59, 59, 999);
			return { start: start.getTime(), end: end.getTime() };
		}
		case "quarter":
			return {
				start: startOfQuarter(anchor).getTime(),
				end: endOfQuarter(anchor).getTime(),
			};
		case "semester":
			return {
				start: startOfSemester(anchor).getTime(),
				end: endOfSemester(anchor).getTime(),
			};
	}
}

export function previousPeriodAnchor(
	grouping: GroupingId,
	anchor: Date,
): Date {
	switch (grouping) {
		case "week": {
			const d = new Date(anchor);
			d.setDate(d.getDate() - 7);
			return d;
		}
		case "month":
			return new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1);
		case "quarter":
			return new Date(anchor.getFullYear(), anchor.getMonth() - 3, 1);
		case "semester":
			return new Date(anchor.getFullYear(), anchor.getMonth() - 6, 1);
	}
}

export function periodKeyForClosedPeriod(
	grouping: GroupingId,
	now: Date = new Date(),
): string | null {
	const yesterday = new Date(now);
	yesterday.setDate(yesterday.getDate() - 1);
	yesterday.setHours(12, 0, 0, 0);

	const current = periodRangeForGrouping(grouping, now);
	if (yesterday.getTime() >= current.start) {
		return null;
	}

	const prevAnchor = previousPeriodAnchor(grouping, now);
	const prev = periodRangeForGrouping(grouping, prevAnchor);

	if (yesterday.getTime() < prev.start || yesterday.getTime() > prev.end) {
		return null;
	}

	if (grouping === "month") {
		return periodKeyFromTimestamp(prev.start);
	}

	return `${grouping}:${prev.start}:${prev.end}`;
}
