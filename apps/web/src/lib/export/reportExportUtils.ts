import type { BudgetItem } from "@app/lib/budgets/types";
import type { ThresholdStatus } from "@app/lib/budgets/types";
import { GROUPING_LABELS, type GroupingId } from "@jp-ds/index";

const THRESHOLD_LABELS: Record<ThresholdStatus, string> = {
	ok: "Normal",
	info: "Atención",
	warning: "Alerta",
	danger: "Excedido",
};

export function thresholdLabel(status: ThresholdStatus): string {
	return THRESHOLD_LABELS[status];
}

export function groupingLabel(grouping: GroupingId): string {
	return GROUPING_LABELS[grouping];
}

export function reportPdfFilename(label: string): string {
	return `reporte-${label.replace(/\s+/g, "-").toLowerCase()}.pdf`;
}

export function budgetCategoriesLabel(item: BudgetItem): string {
	return item.categories.map((category) => category.name).join(" | ");
}

export function formatReminderOffsets(offsets: number[]): string {
	return offsets
		.map((offset) => (offset === 0 ? "mismo día" : `${offset}d antes`))
		.join("; ");
}
