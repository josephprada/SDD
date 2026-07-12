import { CategoryIcon } from "@app/lib/core/categoryIcon";
import type { FixedExpenseItem } from "@app/lib/budgets/types";
import { formatCOP } from "@app/lib/format/currency";
import { formatShortDate } from "@app/lib/format/date";
import { Link } from "react-router";

export type UpcomingFixedExpenseItem = FixedExpenseItem & {
	dueDate: number;
	isOverdue: boolean;
};

type DashboardFixedExpensesProps = {
	items: UpcomingFixedExpenseItem[];
	onMarkPaid: (item: UpcomingFixedExpenseItem) => void;
};

export function DashboardFixedExpenses({
	items,
	onMarkPaid,
}: DashboardFixedExpensesProps) {
	if (items.length === 0) return null;

	return (
		<section
			className="dash-fixed-expenses glass"
			aria-label="Próximos gastos fijos"
		>
			<div className="section-header">
				<h2 className="section-title">Gastos fijos próximos</h2>
				<Link to="/budgets?tab=fixed" className="link-accent show-desktop">
					Ver todos
				</Link>
			</div>

			<ul className="dash-fixed-expenses__list card-stagger">
				{items.map((item) => (
					<li
						key={`${item._id}-${item.dueDate}`}
						className="dash-fixed-expense dash-fixed-expense--actionable"
						onClick={() => onMarkPaid(item)}
						onKeyDown={(event) => {
							if (event.key === "Enter" || event.key === " ") {
								event.preventDefault();
								onMarkPaid(item);
							}
						}}
						role="button"
						tabIndex={0}
					>
						<div className="dash-fixed-expense__head">
							<strong className="dash-fixed-expense__name">{item.name}</strong>
							<strong>{formatCOP(item.amount)}</strong>
						</div>
						<div className="dash-fixed-expense__meta">
							<span className="dash-fixed-expense__cat">
								<CategoryIcon
									icon={item.categoryIcon}
									size={14}
									color={item.categoryColor}
								/>
								<span>{item.categoryName}</span>
							</span>
							<span
								className={`dash-fixed-expense__due${item.isOverdue ? " dash-fixed-expense__due--overdue" : ""}`}
							>
								{item.isOverdue ? "Vencido" : "Próximo"}:{" "}
								{formatShortDate(item.dueDate)}
							</span>
						</div>
					</li>
				))}
			</ul>

			<Link to="/budgets?tab=fixed" className="dash-fixed-expenses__mobile-link show-mobile">
				Ver gastos fijos
			</Link>
		</section>
	);
}
