export function startOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

export function endOfMonth(date: Date): Date {
	return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function monthRange(date: Date): { start: number; end: number } {
	return {
		start: startOfMonth(date).getTime(),
		end: endOfMonth(date).getTime(),
	};
}

export function formatMonthYear(date: Date): string {
	const month = date.toLocaleDateString("es-CO", { month: "long" });
	const year = date.getFullYear();
	return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${year}`;
}

export function formatShortDate(timestamp: number): string {
	return new Date(timestamp).toLocaleDateString("es-CO", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

export function formatFullDate(timestamp: number): string {
	return new Date(timestamp).toLocaleDateString("es-CO", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

export function toDateInputValue(timestamp: number): string {
	const d = new Date(timestamp);
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

export function fromDateInputValue(value: string): number {
	const [y, m, d] = value.split("-").map(Number);
	return new Date(y, m - 1, d, 12, 0, 0, 0).getTime();
}

export function addMonths(date: Date, delta: number): Date {
	return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}
