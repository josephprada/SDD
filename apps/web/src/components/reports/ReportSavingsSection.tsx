import { formatCOP } from "@app/lib/format/currency";
import { formatShortDate } from "@app/lib/format/date";
import type { FunctionReturnType } from "convex/server";
import { api } from "@convex/_generated/api";
import { Link } from "react-router";

type SavingsItem = FunctionReturnType<typeof api.savingsGoals.list>[number];

type ReportSavingsSectionProps = {
	items: SavingsItem[];
};

export function ReportSavingsSection({ items }: ReportSavingsSectionProps) {
	const activeGoals = items.filter((goal) => goal.status === "active");
	const totalSaved = activeGoals.reduce(
		(sum, goal) => sum + goal.currentAmount,
		0);
	const totalTarget = activeGoals.reduce(
		(sum, goal) => sum + goal.targetAmount,
		0);
	const completedCount = items.filter(
		(goal) => goal.status === "completed",
	).length;

	return (
		<section className="report-savings glass" aria-label="Metas de ahorro">
			<div className="section-header">
				<div>
					<h2 className="section-title">Ahorros</h2>
					<p className="report-section__period">Estado actual</p>
				</div>
				<Link to="/savings" className="link-accent show-desktop">
					Gestionar
				</Link>
			</div>

			{items.length === 0 ? (
				<p className="budget-empty">No tienes metas de ahorro.</p>
			) : (
				<>
					<div className="report-savings__summary">
						<div>
							<span className="report-savings__summary-label">Ahorrado</span>
							<strong className="amount">{formatCOP(totalSaved)}</strong>
						</div>
						<div>
							<span className="report-savings__summary-label">
								Meta activa
							</span>
							<strong className="amount">{formatCOP(totalTarget)}</strong>
						</div>
						<div>
							<span className="report-savings__summary-label">Completadas</span>
							<strong>{completedCount}</strong>
						</div>
					</div>

					<ul className="report-savings__list card-stagger">
						{items.map((goal) => {
							const pct = Math.min(100, Math.round(goal.percent * 100));

							return (
								<li key={goal._id} className="report-savings-item">
									<div className="report-savings-item__head">
										<strong className="report-savings-item__name">
											{goal.name}
										</strong>
										<span className="report-savings-item__pct">{pct}%</span>
									</div>
									<div
										className="savings-progress"
										role="progressbar"
										aria-valuenow={pct}
										aria-valuemin={0}
										aria-valuemax={100}
										aria-label={`${goal.name} ${pct}%`}
									>
										<div
											className="savings-progress__fill"
											style={{ width: `${pct}%` }}
										/>
									</div>
									<p className="report-savings-item__meta">
										{formatCOP(goal.currentAmount)} /{" "}
										{formatCOP(goal.targetAmount)}
										{goal.deadline
											? ` · Meta ${formatShortDate(goal.deadline)}`
											: ""}
										{goal.status === "completed" ? " · Completada" : ""}
										{goal.status === "paused" ? " · Pausada" : ""}
									</p>
								</li>
							);
						})}
					</ul>
				</>
			)}

			<Link to="/savings" className="report-section__mobile-link show-mobile">
				Gestionar ahorros
			</Link>
		</section>
	);
}
