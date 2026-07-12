import type { BudgetItem } from "@app/lib/budgets/types";
import type { ThresholdStatus } from "@app/lib/budgets/types";
import type {
	ReportCreditItem,
	ReportSavingsItem,
} from "@app/lib/export/reportExportTypes";
import { GROUPING_LABELS, type GroupingId } from "@jp-ds/index";

const THRESHOLD_LABELS: Record<ThresholdStatus, string> = {
	ok: "Normal",
	info: "Atención",
	warning: "Alerta",
	danger: "Excedido",
};

export const SAVINGS_STATUS_LABELS: Record<
	ReportSavingsItem["status"],
	string
> = {
	active: "Activa",
	completed: "Completada",
	paused: "Pausada",
};

export function filterActiveCredits(credits: ReportCreditItem[]): ReportCreditItem[] {
	return credits.filter(
		(credit) =>
			credit.setupStatus !== "draft" && credit.status !== "paid_off",
	);
}

export function computeCreditsExportSummary(credits: ReportCreditItem[]) {
	const activeCredits = filterActiveCredits(credits);
	const totalOutstanding = activeCredits.reduce(
		(sum, credit) => sum + credit.outstandingBalance,
		0,
	);
	const withNextPayment = activeCredits.filter(
		(credit) => credit.nextPayment !== undefined,
	).length;

	return {
		activeCredits,
		totalOutstanding,
		activeCount: activeCredits.length,
		withNextPayment,
	};
}

export function computeSavingsExportSummary(goals: ReportSavingsItem[]) {
	const activeGoals = goals.filter((goal) => goal.status === "active");
	const totalSaved = activeGoals.reduce(
		(sum, goal) => sum + goal.currentAmount,
		0,
	);
	const totalTarget = activeGoals.reduce(
		(sum, goal) => sum + goal.targetAmount,
		0,
	);
	const completedCount = goals.filter(
		(goal) => goal.status === "completed",
	).length;

	return {
		activeGoals,
		totalSaved,
		totalTarget,
		completedCount,
	};
}

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
