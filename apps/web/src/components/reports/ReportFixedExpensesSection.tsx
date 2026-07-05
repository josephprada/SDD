import { CategoryIcon } from "@app/lib/core/categoryIcon";
import type { FixedExpenseItem } from "@app/lib/budgets/types";
import { formatCOP } from "@app/lib/format/currency";
import { formatShortDate } from "@app/lib/format/date";
import { Link } from "react-router";

type ReportFixedExpensesSectionProps = {
	items: FixedExpenseItem[];
	periodLabel: string;
};

export function ReportFixedExpensesSection({
	items,
	periodLabel,
}: ReportFixedExpensesSectionProps) {
	const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
	const paidCount = items.filter((item) => item.isPaidCurrentPeriod).length;
	const pendingAmount = items
		.filter((item) => !item.isPaidCurrentPeriod)
		.reduce((sum, item) => sum + item.amount, 0);

	return (
		<section
			className="report-fixed-expenses glass"
			aria-label="Gastos fijos del período"
		>
			<div className="section-header">
				<div>
					<h2 className="section-title">Gastos fijos</h2>
					<p className="report-section__period">{periodLabel}</p>
				</div>
				<Link to="/budgets?tab=fixed" className="link-accent show-desktop">
					Gestionar
				</Link>
			</div>

			{items.length === 0 ? (
				<p className="budget-empty">No tienes gastos fijos registrados.</p>
			) : (
				<>
					<div className="report-fixed-expenses__summary">
						<div>
							<span className="report-fixed-expenses__summary-label">Comprometido</span>
							<strong className="amount">{formatCOP(totalAmount)}</strong>
						</div>
						<div>
							<span className="report-fixed-expenses__summary-label">Pendiente</span>
							<strong className="amount text-danger">{formatCOP(pendingAmount)}</strong>
						</div>
						<div>
							<span className="report-fixed-expenses__summary-label">Pagados</span>
							<strong>
								{paidCount}/{items.length}
							</strong>
						</div>
					</div>

					<ul className="report-fixed-expenses__list">
						{items.map((item) => (
							<li key={item._id} className="report-fixed-expense-item">
								<div className="report-fixed-expense-item__head">
									<strong className="report-fixed-expense-item__name">
										{item.name}
									</strong>
									<strong className="amount">{formatCOP(item.amount)}</strong>
								</div>
								<div className="report-fixed-expense-item__meta">
									<span className="report-fixed-expense-item__cat">
										<CategoryIcon
											icon={item.categoryIcon}
											size={14}
											color={item.categoryColor}
										/>
										<span>{item.categoryName}</span>
									</span>
									<span
										className={
											item.isPaidCurrentPeriod
												? "report-fixed-expense-item__status report-fixed-expense-item__status--paid"
												: "report-fixed-expense-item__status"
										}
									>
										{item.isPaidCurrentPeriod
											? "Pagado"
											: `Vence ${formatShortDate(item.nextDueDate)}`}
									</span>
								</div>
							</li>
						))}
					</ul>
				</>
			)}

			<Link
				to="/budgets?tab=fixed"
				className="report-section__mobile-link show-mobile"
			>
				Gestionar gastos fijos
			</Link>
		</section>
	);
}
