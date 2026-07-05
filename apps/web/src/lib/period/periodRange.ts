import type { GroupingId } from "@jp-ds/index";

function startOfDay(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function endOfDay(date: Date): Date {
	return new Date(
		date.getFullYear(),
		date.getMonth(),
		date.getDate(),
		23,
		59,
		59,
		999,
	);
}

function startOfWeek(date: Date): Date {
	const d = startOfDay(date);
	const day = d.getDay();
	const diff = day === 0 ? -6 : 1 - day;
	d.setDate(d.getDate() + diff);
	return d;
}

function endOfWeek(date: Date): Date {
	const start = startOfWeek(date);
	const end = new Date(start);
	end.setDate(end.getDate() + 6);
	return endOfDay(end);
}

function startOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function startOfQuarter(date: Date): Date {
	const quarterStartMonth = Math.floor(date.getMonth() / 3) * 3;
	return new Date(date.getFullYear(), quarterStartMonth, 1, 0, 0, 0, 0);
}

function endOfQuarter(date: Date): Date {
	const start = startOfQuarter(date);
	return new Date(start.getFullYear(), start.getMonth() + 3, 0, 23, 59, 59, 999);
}

function startOfSemester(date: Date): Date {
	const startMonth = date.getMonth() < 6 ? 0 : 6;
	return new Date(date.getFullYear(), startMonth, 1, 0, 0, 0, 0);
}

function endOfSemester(date: Date): Date {
	const start = startOfSemester(date);
	return new Date(start.getFullYear(), start.getMonth() + 6, 0, 23, 59, 59, 999);
}

export function periodRange(
	grouping: GroupingId,
	anchor: Date,
): { start: number; end: number } {
	switch (grouping) {
		case "week":
			return {
				start: startOfWeek(anchor).getTime(),
				end: endOfWeek(anchor).getTime(),
			};
		case "month":
			return {
				start: startOfMonth(anchor).getTime(),
				end: endOfMonth(anchor).getTime(),
			};
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

export function addPeriod(
	grouping: GroupingId,
	anchor: Date,
	delta: number,
): Date {
	switch (grouping) {
		case "week": {
			const next = new Date(anchor);
			next.setDate(next.getDate() + delta * 7);
			return next;
		}
		case "month":
			return new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1);
		case "quarter":
			return new Date(anchor.getFullYear(), anchor.getMonth() + delta * 3, 1);
		case "semester":
			return new Date(anchor.getFullYear(), anchor.getMonth() + delta * 6, 1);
	}
}

const MONTHS_SHORT = [
	"Ene",
	"Feb",
	"Mar",
	"Abr",
	"May",
	"Jun",
	"Jul",
	"Ago",
	"Sep",
	"Oct",
	"Nov",
	"Dic",
];

function formatDayMonth(date: Date): string {
	return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

export function formatPeriodLabel(grouping: GroupingId, anchor: Date): string {
	const year = anchor.getFullYear();

	switch (grouping) {
		case "week": {
			const start = startOfWeek(anchor);
			const end = endOfWeek(anchor);
			if (start.getFullYear() === end.getFullYear()) {
				return `${formatDayMonth(start)} – ${formatDayMonth(end)} ${year}`;
			}
			return `${formatDayMonth(start)} ${start.getFullYear()} – ${formatDayMonth(end)} ${end.getFullYear()}`;
		}
		case "month": {
			const month = anchor.toLocaleDateString("es-CO", { month: "long" });
			return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${year}`;
		}
		case "quarter": {
			const start = startOfQuarter(anchor);
			const end = endOfQuarter(anchor);
			return `${MONTHS_SHORT[start.getMonth()]}–${MONTHS_SHORT[end.getMonth()]} ${year}`;
		}
		case "semester": {
			const start = startOfSemester(anchor);
			const end = endOfSemester(anchor);
			return `${MONTHS_SHORT[start.getMonth()]}–${MONTHS_SHORT[end.getMonth()]} ${year}`;
		}
	}
}

export function periodSummaryTitle(grouping: GroupingId): string {
	switch (grouping) {
		case "week":
			return "Esta semana";
		case "month":
			return "Este mes";
		case "quarter":
			return "Este trimestre";
		case "semester":
			return "Este semestre";
	}
}

export function periodNetLabel(grouping: GroupingId): string {
	switch (grouping) {
		case "week":
			return "Neto de la semana";
		case "month":
			return "Neto del mes";
		case "quarter":
			return "Neto del trimestre";
		case "semester":
			return "Neto del semestre";
	}
}

export function periodKeyFromDate(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, "0");
	return `${y}-${m}`;
}

export function dashboardSubtitle(grouping: GroupingId): string {
	switch (grouping) {
		case "week":
			return "Resumen financiero de la semana";
		case "month":
			return "Resumen financiero del mes en curso";
		case "quarter":
			return "Resumen financiero del trimestre";
		case "semester":
			return "Resumen financiero del semestre";
	}
}
