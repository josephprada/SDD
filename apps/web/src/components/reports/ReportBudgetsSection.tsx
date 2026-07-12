import { BudgetProgressBar } from "@app/components/budgets/BudgetProgressBar";
import { CategoryIcon } from "@app/lib/core/categoryIcon";
import type { BudgetItem } from "@app/lib/budgets/types";
import { formatCOP } from "@app/lib/format/currency";
import { Link } from "react-router";

type ReportBudgetsSectionProps = {
	items: BudgetItem[];
	periodLabel: string;
};

function budgetLabel(item: BudgetItem): string {
	return item.categories.map((c) => c.name).join(", ");
}

export function ReportBudgetsSection({
	items,
	periodLabel,
}: ReportBudgetsSectionProps) {
	const totalBudget = items.reduce((sum, item) => sum + item.amount, 0);
	const totalSpent = items.reduce((sum, item) => sum + item.spent, 0);

	return (
		<section className="report-budgets glass" aria-label="Presupuestos del período">
			<div className="section-header">
				<div>
					<h2 className="section-title">Presupuestos</h2>
					<p className="report-section__period">{periodLabel}</p>
				</div>
				<Link to="/budgets" className="link-accent show-desktop">
					Gestionar
				</Link>
			</div>

			{items.length === 0 ? (
				<p className="budget-empty">No hay presupuestos para este mes.</p>
			) : (
				<>
					<div className="report-budgets__summary">
						<div>
							<span className="report-budgets__summary-label">Presupuestado</span>
							<strong className="amount">{formatCOP(totalBudget)}</strong>
						</div>
						<div>
							<span className="report-budgets__summary-label">Gastado</span>
							<strong className="amount">{formatCOP(totalSpent)}</strong>
						</div>
					</div>

					<ul className="report-budgets__list card-stagger">
						{items.map((item) => {
							const label = budgetLabel(item);
							const pct = Math.round(item.percent * 100);

							return (
								<li key={item._id} className="report-budget-item">
									<div className="report-budget-item__head">
										<div className="report-budget-item__cats">
											{item.categories.map((cat) => (
												<span key={cat.id} className="report-budget-item__cat">
													<CategoryIcon
														icon={cat.icon}
														size={14}
														color={cat.color}
													/>
													<span>{cat.name}</span>
												</span>
											))}
										</div>
										<span
											className={`report-budget-item__pct report-budget-item__pct--${item.thresholdStatus}`}
										>
											{pct}%
										</span>
									</div>
									<BudgetProgressBar
										percent={item.percent}
										status={item.thresholdStatus}
										label={`${label} ${pct}%`}
									/>
									<p className="report-budget-item__meta">
										{formatCOP(item.spent)} / {formatCOP(item.amount)}
										{item.remaining < 0
											? ` · Sobregiro ${formatCOP(Math.abs(item.remaining))}`
											: ` · Restante ${formatCOP(item.remaining)}`}
									</p>
								</li>
							);
						})}
					</ul>
				</>
			)}

			<Link to="/budgets" className="report-section__mobile-link show-mobile">
				Gestionar presupuestos
			</Link>
		</section>
	);
}
