import { CategoryIcon } from "@app/lib/core/categoryIcon";
import { CoreIcon } from "@app/lib/core/icons";
import type { FixedExpenseItem } from "@app/lib/budgets/types";
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
			{items.map((item) => (
				<li
					key={item._id}
					className="fixed-expense-card glass interactive-lift fixed-expense-card--selectable"
					onClick={() => onEdit(item)}
					onKeyDown={(event) => {
						if (event.key === "Enter" || event.key === " ") {
							event.preventDefault();
							onEdit(item);
						}
					}}
					role="button"
					tabIndex={0}
				>
					<div className="fixed-expense-card__header">
						<div>
							<strong>{item.name}</strong>
							<div className="fixed-expense-card__cat">
								<CategoryIcon
									icon={item.categoryIcon}
									size={14}
									color={item.categoryColor}
								/>
								<span>{item.categoryName}</span>
							</div>
						</div>
						<strong>{formatCOP(item.amount)}</strong>
					</div>
					<p className="fixed-expense-card__due">
						Día {item.dayOfMonth} · Vence: {formatShortDate(item.nextDueDate)}
					</p>
					<p className="fixed-expense-card__reminders">
						Avisos:{" "}
						{item.reminderOffsets
							.map((o) => (o === 0 ? "mismo día" : `${o}d antes`))
							.join(", ")}
					</p>
					<div
						className="fixed-expense-card__actions"
						onMouseDown={(event) => event.stopPropagation()}
						onClick={(event) => event.stopPropagation()}
					>
						<Button
							type="button"
							variant="secondary"
							onClick={() => onMarkPaid(item)}
							disabled={item.isPaidCurrentPeriod}
						>
							{item.isPaidCurrentPeriod
								? isViewingCurrentMonth
									? "Pagado este mes"
									: "Pagado"
								: "Marcar pagado"}
						</Button>
						<IconButton
							aria-label={`Eliminar ${item.name}`}
							onClick={() => onDelete(item._id)}
						>
							<CoreIcon name="trash" size={16} />
						</IconButton>
					</div>
				</li>
			))}
		</ul>
	);
}
