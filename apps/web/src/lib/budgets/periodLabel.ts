import { formatMonthYear } from "@app/lib/format/date";

export function periodLabelFromKey(periodKey: string): string {
	const [year, month] = periodKey.split("-").map(Number);
	return formatMonthYear(new Date(year, month - 1, 1));
}
