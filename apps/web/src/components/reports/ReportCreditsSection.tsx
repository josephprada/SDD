import { CREDIT_STATUS_LABELS } from "@app/lib/credits/types";
import { formatCOP } from "@app/lib/format/currency";
import { formatShortDate } from "@app/lib/format/date";
import type { FunctionReturnType } from "convex/server";
import { api } from "@convex/_generated/api";
import { Link } from "react-router";

type CreditItem = FunctionReturnType<typeof api.credits.list>[number];

type ReportCreditsSectionProps = {
	items: CreditItem[];
};

export function ReportCreditsSection({ items }: ReportCreditsSectionProps) {
	const activeCredits = items.filter(
		(credit) =>
			credit.setupStatus !== "draft" && credit.status !== "paid_off",
	);
	const totalOutstanding = activeCredits.reduce(
		(sum, credit) => sum + credit.outstandingBalance,
		0);
	const withNextPayment = activeCredits.filter(
		(credit) => credit.nextPayment !== undefined,
	).length;

	return (
		<section className="report-credits glass" aria-label="Créditos activos">
			<div className="section-header">
				<div>
					<h2 className="section-title">Créditos</h2>
					<p className="report-section__period">Estado actual</p>
				</div>
				<Link to="/credits" className="link-accent show-desktop">
					Gestionar
				</Link>
			</div>

			{activeCredits.length === 0 ? (
				<p className="budget-empty">No tienes créditos activos.</p>
			) : (
				<>
					<div className="report-credits__summary">
						<div>
							<span className="report-credits__summary-label">
								Deuda total
							</span>
							<strong className="amount">{formatCOP(totalOutstanding)}</strong>
						</div>
						<div>
							<span className="report-credits__summary-label">
								Créditos activos
							</span>
							<strong>{activeCredits.length}</strong>
						</div>
						<div>
							<span className="report-credits__summary-label">
								Con cuota pendiente
							</span>
							<strong>{withNextPayment}</strong>
						</div>
					</div>

					<ul className="report-credits__list">
						{activeCredits.map((credit) => (
							<li key={credit._id} className="report-credit-item">
								<div className="report-credit-item__head">
									<div className="report-credit-item__title">
										<Link
											to={`/credits/${credit._id}`}
											className="report-credit-item__name"
										>
											{credit.name}
										</Link>
										{credit.lender ? (
											<span className="report-credit-item__lender">
												{credit.lender}
											</span>
										) : null}
									</div>
									<strong className="amount">
										{formatCOP(credit.outstandingBalance)}
									</strong>
								</div>
								<div className="report-credit-item__meta">
									<span>{CREDIT_STATUS_LABELS[credit.status]}</span>
									{credit.nextPayment ? (
										<span>
											Cuota #{credit.nextPayment.installmentNumber} —{" "}
											{formatShortDate(credit.nextPayment.dueDate)} —{" "}
											{formatCOP(credit.nextPayment.totalDue)}
										</span>
									) : (
										<span>Sin cuotas pendientes</span>
									)}
								</div>
							</li>
						))}
					</ul>
				</>
			)}

			<Link to="/credits" className="report-section__mobile-link show-mobile">
				Gestionar créditos
			</Link>
		</section>
	);
}
