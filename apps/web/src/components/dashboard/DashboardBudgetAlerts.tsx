import { BudgetProgressBar } from "@app/components/budgets/BudgetProgressBar";
import { CategoryIcon } from "@app/lib/core/categoryIcon";
import type { BudgetItem } from "@app/lib/budgets/types";
import { formatCOP } from "@app/lib/format/currency";
import { Link } from "react-router";

type DashboardBudgetAlertsProps = {
	items: BudgetItem[];
	periodLabel: string;
};

function budgetLabel(item: BudgetItem): string {
	return item.categories.map((c) => c.name).join(", ");
}

export function DashboardBudgetAlerts({
	items,
	periodLabel,
}: DashboardBudgetAlertsProps) {
	if (items.length === 0) return null;

	return (
		<section className="dash-budget-alerts glass" aria-label="Presupuestos en alerta">
			<div className="section-header">
				<div>
					<h2 className="section-title">Presupuestos en alerta</h2>
					<p className="dash-budget-alerts__period">{periodLabel}</p>
				</div>
				<Link to="/budgets" className="link-accent show-desktop">
					Ver todos
				</Link>
			</div>

			<ul className="dash-budget-alerts__list">
				{items.map((item) => {
					const label = budgetLabel(item);
					const pct = Math.round(item.percent * 100);

					return (
						<li key={item._id} className="dash-budget-alert">
							<div className="dash-budget-alert__head">
								<div className="dash-budget-alert__cats">
									{item.categories.map((cat) => (
										<span key={cat.id} className="dash-budget-alert__cat">
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
									className={`dash-budget-alert__pct dash-budget-alert__pct--${item.thresholdStatus}`}
								>
									{pct}%
								</span>
							</div>
							<BudgetProgressBar
								percent={item.percent}
								status={item.thresholdStatus}
								label={`${label} ${pct}%`}
							/>
							<p className="dash-budget-alert__meta">
								{formatCOP(item.spent)} / {formatCOP(item.amount)}
								{item.remaining < 0
									? ` · Sobregiro ${formatCOP(Math.abs(item.remaining))}`
									: ` · Restante ${formatCOP(item.remaining)}`}
							</p>
						</li>
					);
				})}
			</ul>

			<Link to="/budgets" className="dash-budget-alerts__mobile-link show-mobile">
				Ver presupuestos
			</Link>
		</section>
	);
}
