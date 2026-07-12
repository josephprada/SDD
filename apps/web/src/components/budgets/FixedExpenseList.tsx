import { CategoryIcon } from "@app/lib/core/categoryIcon";
import { CoreIcon } from "@app/lib/core/icons";
import type { FixedExpenseItem } from "@app/lib/budgets/types";
import { periodLabelFromKey } from "@app/lib/budgets/periodLabel";
import { formatCOP } from "@app/lib/format/currency";
import { formatShortDate } from "@app/lib/format/date";
import { Button, IconButton } from "@jp-ds";

type FixedExpenseListProps = {
	items: FixedExpenseItem[];
	isViewingCurrentMonth?: boolean;
	onEdit: (item: FixedExpenseItem) => void;
	onDelete: (id: string) => void;
	onMarkPaid: (item: FixedExpenseItem) => void;
};

export function FixedExpenseList({
	items,
	isViewingCurrentMonth = true,
	onEdit,
	onDelete,
	onMarkPaid,
}: FixedExpenseListProps) {
	if (items.length === 0) {
		return <p className="budget-empty">No tienes gastos fijos registrados.</p>;
	}

	return (
		<ul className="fixed-expense-list">
			{items.map((item) => {
				const isPaid = item.isPaidCurrentPeriod;

				return (
					<li
						key={item._id}
						className={`fixed-expense-card glass fixed-expense-card--selectable${isPaid ? " fixed-expense-card--paid" : " interactive-lift"}`}
						onClick={() => onEdit(item)}
						onKeyDown={(event) => {
							if (event.key === "Enter" || event.key === " ") {
								event.preventDefault();
								onEdit(item);
							}
						}}
						role="button"
						tabIndex={0}
						aria-label={
							isPaid
								? `${item.name}, pagado${isViewingCurrentMonth ? " este mes" : ""}`
								: item.name
						}
					>
						<div className="fixed-expense-card__header">
							<div>
								<div className="fixed-expense-card__title-row">
									<strong>{item.name}</strong>
									{isPaid ? (
										<span className="fixed-expense-card__paid-badge">
											{isViewingCurrentMonth ? "Pagado este mes" : "Pagado"}
										</span>
									) : null}
								</div>
								{item.onlyPeriodKey ? (
									<span className="fixed-expense-card__badge">
										Solo {periodLabelFromKey(item.onlyPeriodKey)}
									</span>
								) : null}
								<div className="fixed-expense-card__cat">
									<CategoryIcon
										icon={item.categoryIcon}
										size={14}
										color={item.categoryColor}
									/>
									<span>{item.categoryName}</span>
								</div>
							</div>
							<strong className="fixed-expense-card__amount">
								{formatCOP(item.amount)}
							</strong>
						</div>
						<div className="fixed-expense-card__footer">
							<div className="fixed-expense-card__meta">
								<p className="fixed-expense-card__due">
									Día {item.dayOfMonth} · Vence:{" "}
									{formatShortDate(item.nextDueDate)}
								</p>
								{!isPaid ? (
									<p className="fixed-expense-card__reminders">
										Avisos:{" "}
										{item.reminderOffsets
											.map((o) => (o === 0 ? "mismo día" : `${o}d antes`))
											.join(", ")}
									</p>
								) : null}
							</div>
							<div
								className="fixed-expense-card__actions"
								onMouseDown={(event) => event.stopPropagation()}
								onClick={(event) => event.stopPropagation()}
							>
								{!isPaid ? (
									<Button
										type="button"
										variant="secondary"
										onClick={() => onMarkPaid(item)}
									>
										Marcar pagado
									</Button>
								) : null}
								<IconButton
									aria-label={`Eliminar ${item.name}`}
									onClick={() => onDelete(item._id)}
								>
									<CoreIcon name="trash" size={16} />
								</IconButton>
							</div>
						</div>
					</li>
				);
			})}
		</ul>
	);
}
