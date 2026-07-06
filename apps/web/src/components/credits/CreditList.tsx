import { EmptyState } from "@app/components/ui/EmptyState";
import { CoreIcon } from "@app/lib/core/icons";
import { formatCOP } from "@app/lib/format/currency";
import { formatShortDate } from "@app/lib/format/date";
import { Link } from "react-router";
import type { FunctionReturnType } from "convex/server";
import { api } from "@convex/_generated/api";

type CreditItem = FunctionReturnType<typeof api.credits.list>[number];

type CreditListProps = {
	items: CreditItem[];
};

export function CreditList({ items }: CreditListProps) {
	if (items.length === 0) {
		return (
			<EmptyState
				title="Sin créditos todavía"
				description="Usa el botón «Nuevo crédito» arriba para registrar tu primer préstamo."
				icon={<CoreIcon name="landmark" size={32} />}
			/>
		);
	}

	return (
		<ul className="credit-list">
			{items.map((credit) => (
				<li key={credit._id}>
					<Link
						to={`/credits/${credit._id}`}
						className="credit-card glass interactive-lift"
					>
						<div className="credit-card__row">
							<strong>{credit.name}</strong>
							<span className="credit-card__balance">
								{formatCOP(credit.outstandingBalance)}
							</span>
						</div>
						<span className="credit-card__lender">{credit.lender}</span>
						{credit.nextPayment ? (
							<span className="credit-card__lender">
								Próxima cuota #{credit.nextPayment.installmentNumber} —{" "}
								{formatShortDate(credit.nextPayment.dueDate)} —{" "}
								{formatCOP(credit.nextPayment.totalDue)}
							</span>
						) : null}
					</Link>
				</li>
			))}
		</ul>
	);
}
