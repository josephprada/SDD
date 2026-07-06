import type { Doc } from "../_generated/dataModel";
import { periodKeyToMonthRange } from "./period";

const PERIOD_KEY_RE = /^\d{4}-\d{2}$/;

export function validateOnlyPeriodKey(onlyPeriodKey: string): string {
	if (!PERIOD_KEY_RE.test(onlyPeriodKey)) {
		throw new Error("Invalid period key");
	}
	return onlyPeriodKey;
}

export function appliesToPeriodKey(
	item: Pick<Doc<"fixedExpenses">, "onlyPeriodKey" | "createdAt">,
	periodKey: string,
): boolean {
	if (item.onlyPeriodKey) {
		return item.onlyPeriodKey === periodKey;
	}
	const { end } = periodKeyToMonthRange(periodKey);
	return item.createdAt <= end;
}

export function assertAppliesToPeriodKey(
	item: Pick<Doc<"fixedExpenses">, "onlyPeriodKey" | "createdAt">,
	periodKey: string,
): void {
	if (!appliesToPeriodKey(item, periodKey)) {
		throw new Error("Este gasto fijo no aplica a este mes");
	}
}
