import { formatCOP } from "@app/lib/format/currency";
import { formatShortDate } from "@app/lib/format/date";
import { CoreIcon } from "@app/lib/core/icons";
import type { FunctionReturnType } from "convex/server";
import { api } from "@convex/_generated/api";
import { Button, IconButton } from "@jp-ds";

type GoalItem = FunctionReturnType<typeof api.savingsGoals.list>[number];

type SavingsGoalListProps = {
	items: GoalItem[];
	onEdit: (goal: GoalItem) => void;
	onAddContribution: (goal: GoalItem) => void;
	onApplyAbono?: (goal: GoalItem) => void;
	onMovementClick?: (transactionId: string) => void;
};

function isGoalReadyForAbono(goal: GoalItem): boolean {
	return goal.status === "completed" || goal.currentAmount >= goal.targetAmount;
}

export function SavingsGoalList({
	items,
	onEdit,
	onAddContribution,
	onApplyAbono,
	onMovementClick,
}: SavingsGoalListProps) {
	if (items.length === 0) {
		return <p className="budget-empty">No tienes metas de ahorro.</p>;
	}

	return (
		<ul className="savings-goal-list card-stagger">
			{items.map((goal) => {
				const pct = Math.min(100, Math.round(goal.percent * 100));
				const movements = goal.movements ?? [];
				const readyForAbono =
					Boolean(goal.linkedCreditId) && isGoalReadyForAbono(goal);

				return (
					<li
						key={goal._id}
						id={`savings-goal-${goal._id}`}
						className="savings-goal-card destination-card glass interactive-lift"
					>
						<div className="destination-card__header">
							<button
								type="button"
								className="credit-card__main"
								onClick={() => onEdit(goal)}
							>
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
								{formatCOP(goal.currentAmount)} /{" "}
								{formatCOP(goal.targetAmount)}
								{goal.deadline
									? ` — meta ${formatShortDate(goal.deadline)}`
									: ""}
							</p>
							{goal.accountName ? (
								<p className="credit-card__lender">
									Cuenta: {goal.accountName}
								</p>
							) : null}
							</button>
							<div className="credit-card__actions">
								{readyForAbono ? (
									<Button
										onClick={() => onApplyAbono?.(goal)}
									>
										Abonar a capital
									</Button>
								) : null}
								<IconButton
									aria-label={`Registrar aporte en ${goal.name}`}
									onClick={() => onAddContribution(goal)}
								>
									<CoreIcon name="plus" size={18} />
								</IconButton>
							</div>
						</div>
						{movements.length > 0 ? (
							<ul
								className="destination-movements"
								onClick={(event) => event.stopPropagation()}
								onKeyDown={(event) => event.stopPropagation()}
							>
								{movements.map((movement) => {
									const clickable = Boolean(
										movement.transactionId && onMovementClick,
									);
									return (
										<li key={movement._id}>
											<button
												type="button"
												className="destination-movement"
												disabled={!clickable}
												onClick={() => {
													if (movement.transactionId) {
														onMovementClick?.(
															movement.transactionId,
														);
													}
												}}
											>
												<div className="destination-movement__row">
													<span className="destination-movement__desc">
														Aporte
													</span>
													<strong className="destination-movement__amount">
														{formatCOP(movement.amount)}
													</strong>
												</div>
												<span className="destination-movement__meta">
													{formatShortDate(movement.contributedAt)}
												</span>
												{movement.notes ? (
													<span className="destination-movement__notes">
														{movement.notes}
													</span>
												) : null}
											</button>
										</li>
									);
								})}
							</ul>
						) : null}
					</li>
				);
			})}
		</ul>
	);
}
