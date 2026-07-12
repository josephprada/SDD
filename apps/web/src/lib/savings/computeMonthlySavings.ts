/** Calendar months from `from` until `deadline` (minimum 1). */
export function countMonthsUntilDeadline(
	deadlineMs: number,
	fromMs = Date.now(),
): number {
	const end = new Date(deadlineMs);
	const start = new Date(fromMs);
	end.setHours(0, 0, 0, 0);
	start.setHours(0, 0, 0, 0);

	if (end.getTime() <= start.getTime()) {
		return 1;
	}

	let months =
		(end.getFullYear() - start.getFullYear()) * 12 +
		(end.getMonth() - start.getMonth());

	if (end.getDate() < start.getDate()) {
		months -= 1;
	}

	return Math.max(1, months);
}

/** Suggested monthly contribution to reach `targetAmount` by `deadlineMs`. */
export function computeMonthlySavingsAmount(
	targetAmount: number,
	deadlineMs: number,
	fromMs = Date.now(),
): number {
	if (targetAmount <= 0) return 0;
	const months = countMonthsUntilDeadline(deadlineMs, fromMs);
	return Math.ceil(targetAmount / months);
}
