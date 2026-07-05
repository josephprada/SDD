import type { ThresholdStatus } from "@app/lib/budgets/types";

type BudgetProgressBarProps = {
	percent: number;
	status: ThresholdStatus;
	label?: string;
};

export function BudgetProgressBar({
	percent,
	status,
	label,
}: BudgetProgressBarProps) {
	const clamped = Math.min(Math.max(percent, 0), 1.5);
	const width = `${Math.min(clamped * 100, 100)}%`;

	return (
		<div className="budget-progress" aria-label={label}>
			<div className="budget-progress__track">
				<div
					className={`budget-progress__fill budget-progress__fill--${status}`}
					style={{ width }}
				/>
			</div>
		</div>
	);
}
