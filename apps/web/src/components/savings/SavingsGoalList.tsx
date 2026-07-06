import { formatCOP } from "@app/lib/format/currency";
import { formatShortDate } from "@app/lib/format/date";
import { CoreIcon } from "@app/lib/core/icons";
import { IconButton } from "@jp-ds";
import type { FunctionReturnType } from "convex/server";
import { api } from "@convex/_generated/api";

type GoalItem = FunctionReturnType<typeof api.savingsGoals.list>[number];

type SavingsGoalListProps = {
	items: GoalItem[];
	onEdit: (id: string) => void;
	onContribute: (id: string) => void;
};

export function SavingsGoalList({
	items,
	onEdit,
	onContribute,
}: SavingsGoalListProps) {
	if (items.length === 0) {
		return <p className="budget-empty">No tienes metas de ahorro.</p>;
	}

	return (
		<ul className="savings-goal-list">
			{items.map((goal) => {
				const pct = Math.min(100, Math.round(goal.percent * 100));
				return (
					<li key={goal._id} className="savings-goal-card glass">
						<div className="credit-card__row">
							<strong>{goal.name}</strong>
							<span>{pct}%</span>
						</div>
						<div className="savings-progress" aria-hidden>
							<div
								className="savings-progress__fill"
								style={{ width: `${pct}%` }}
							/>
						</div>
						<p className="credit-card__lender">
							{formatCOP(goal.currentAmount)} / {formatCOP(goal.targetAmount)}
							{goal.deadline
								? ` — meta ${formatShortDate(goal.deadline)}`
								: ""}
						</p>
						<div className="budget-card__actions">
							<IconButton
								aria-label="Aportar a meta"
								onClick={() => onContribute(goal._id)}
							>
								<CoreIcon name="plus" size={16} />
							</IconButton>
							<IconButton
								aria-label="Editar meta"
								onClick={() => onEdit(goal._id)}
							>
								<CoreIcon name="edit" size={16} />
							</IconButton>
						</div>
					</li>
				);
			})}
		</ul>
	);
}
