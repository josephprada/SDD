import type { ThresholdStatus } from "@app/lib/budgets/types";
import { formatCOP } from "@app/lib/format/currency";
import { formatMonthYear } from "@app/lib/format/date";

export type BudgetTransactionPreview = {
	budgetLabel: string;
	periodKey: string;
	limit: number;
	spent: number;
	projectedSpent: number;
	remaining: number;
	projectedRemaining: number;
	percent: number;
	projectedPercent: number;
	thresholdStatus: ThresholdStatus;
	projectedThresholdStatus: ThresholdStatus;
};

type BudgetThresholdAlertProps = {
	preview: BudgetTransactionPreview;
	draftAmount: number;
};

function periodLabelFromKey(periodKey: string): string {
	const [year, month] = periodKey.split("-").map(Number);
	return formatMonthYear(new Date(year, month - 1, 1));
}

function shouldShowAlert(
	preview: BudgetTransactionPreview,
	draftAmount: number,
): boolean {
	const currentAlert =
		preview.thresholdStatus === "warning" ||
		preview.thresholdStatus === "danger";
	const projectedAlert =
		draftAmount > 0 &&
		(preview.projectedThresholdStatus === "warning" ||
			preview.projectedThresholdStatus === "danger");
	return currentAlert || projectedAlert;
}

function buildMessage(
	preview: BudgetTransactionPreview,
	draftAmount: number,
): { tone: "warning" | "danger"; text: string } {
	const period = periodLabelFromKey(preview.periodKey);
	const label = preview.budgetLabel;
	const currentPct = Math.round(preview.percent * 100);
	const projectedPct = Math.round(preview.projectedPercent * 100);

	if (draftAmount > 0 && preview.projectedThresholdStatus === "danger") {
		const over = Math.abs(preview.projectedRemaining);
		return {
			tone: "danger",
			text: `Con este gasto superarías el presupuesto de ${label} (${period}) por ${formatCOP(over)} (${projectedPct}%).`,
		};
	}

	if (draftAmount > 0 && preview.projectedThresholdStatus === "warning") {
		return {
			tone: "warning",
			text: `Con este gasto el presupuesto de ${label} (${period}) llegaría al ${projectedPct}% (${formatCOP(preview.projectedRemaining)} restantes).`,
		};
	}

	if (preview.thresholdStatus === "danger") {
		return {
			tone: "danger",
			text: `Presupuesto de ${label} (${period}) superado: ${formatCOP(preview.spent)} de ${formatCOP(preview.limit)} (${currentPct}%).`,
		};
	}

	return {
		tone: "warning",
		text: `Presupuesto de ${label} (${period}) al ${currentPct}%: quedan ${formatCOP(preview.remaining)} de ${formatCOP(preview.limit)}.`,
	};
}

export function BudgetThresholdAlert({
	preview,
	draftAmount,
}: BudgetThresholdAlertProps) {
	if (!shouldShowAlert(preview, draftAmount)) return null;

	const { tone, text } = buildMessage(preview, draftAmount);

	return (
		<div
			className={`budget-alert budget-alert--${tone}`}
			role="status"
			aria-live="polite"
		>
			{text}
		</div>
	);
}
