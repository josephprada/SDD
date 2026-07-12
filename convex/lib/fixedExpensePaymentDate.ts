import { periodKeyFromTimestamp } from "./period";

/**
 * Uses the moment the user marks the expense as paid (never the due date).
 */
export function resolveFixedExpensePaymentDate(params: {
	now?: number;
}): number {
	return params.now ?? Date.now();
}

export function resolveFixedExpensePaymentPeriodKey(params: {
	periodKey?: string;
	dueDate?: number;
	now?: number;
}): string {
	if (params.periodKey) return params.periodKey;
	const now = params.now ?? Date.now();
	if (params.dueDate !== undefined && params.dueDate <= now) {
		return periodKeyFromTimestamp(params.dueDate);
	}
	return periodKeyFromTimestamp(now);
}
