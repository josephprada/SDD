import { BudgetProgressBar } from "@app/components/budgets/BudgetProgressBar";
import { CategoryIcon } from "@app/lib/core/categoryIcon";
import type { BudgetItem } from "@app/lib/budgets/types";
import { formatCOP } from "@app/lib/format/currency";
import { CoreIcon } from "@app/lib/core/icons";
import { IconButton } from "@jp-ds";

type BudgetListProps = {
	items: BudgetItem[];
	onEdit: (item: BudgetItem) => void;
	onDelete: (id: string) => void;
};

function budgetLabel(item: BudgetItem): string {
	return item.categories.map((c) => c.name).join(", ");
}

export function BudgetList({ items, onEdit, onDelete }: BudgetListProps) {
	if (items.length === 0) {
		return (
			<p className="budget-empty">No hay presupuestos para este mes.</p>
		);
	}

	const totalBudget = items.reduce((s, i) => s + i.amount, 0);
	const totalSpent = items.reduce((s, i) => s + i.spent, 0);

	return (
		<div className="budget-list">
			<div className="budget-summary glass">
				<div>
					<span className="budget-summary__label">Presupuestado</span>
					<strong>{formatCOP(totalBudget)}</strong>
				</div>
				<div>
					<span className="budget-summary__label">Gastado</span>
					<strong>{formatCOP(totalSpent)}</strong>
				</div>
			</div>

			<ul className="budget-list__items">
				{items.map((item) => {
					const label = budgetLabel(item);
					return (
						<li
							key={item._id}
							className="budget-card glass interactive-lift budget-card--selectable"
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
							<div className="budget-card__header">
								<div className="budget-card__cat">
									{item.categories.map((cat) => (
										<span key={cat.id} className="budget-card__cat-chip">
											<span
												className="budget-card__dot"
												style={{ background: cat.color }}
											/>
											<CategoryIcon
												icon={cat.icon}
												size={16}
												color={cat.color}
											/>
											<span>{cat.name}</span>
										</span>
									))}
								</div>
								<div
									className="budget-card__actions"
									onMouseDown={(event) => event.stopPropagation()}
									onClick={(event) => event.stopPropagation()}
								>
									<IconButton
										aria-label={`Eliminar presupuesto ${label}`}
										onClick={() => onDelete(item._id)}
									>
										<CoreIcon name="trash" size={16} />
									</IconButton>
								</div>
							</div>
							<BudgetProgressBar
								percent={item.percent}
								status={item.thresholdStatus}
								label={`${label} ${Math.round(item.percent * 100)}%`}
							/>
							<div className="budget-card__meta">
								<span>
									{formatCOP(item.spent)} / {formatCOP(item.amount)}
								</span>
								<span className={item.remaining < 0 ? "text-danger" : ""}>
									{item.remaining < 0
										? `Sobregiro ${formatCOP(Math.abs(item.remaining))}`
										: `Restante ${formatCOP(item.remaining)}`}
								</span>
							</div>
						</li>
					);
				})}
			</ul>
		</div>
	);
}
