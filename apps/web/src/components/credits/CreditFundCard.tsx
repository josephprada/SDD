import { formatCOP } from "@app/lib/format/currency";
import { Link } from "react-router";
import type { Id } from "@convex/_generated/dataModel";

type CreditFundCardProps = {
	creditId: Id<"credits">;
	name: string;
	principal: number;
	spentFromDisbursement: number;
	availableFromDisbursement: number;
};

export function CreditFundCard({
	creditId,
	name,
	principal,
	spentFromDisbursement,
	availableFromDisbursement,
}: CreditFundCardProps) {
	return (
		<Link
			to={`/credits/${creditId}?tab=fund`}
			className="credit-fund-card interactive-lift"
		>
			<strong className="credit-fund-card__name">{name}</strong>
			<span className="credit-fund-card__total">{formatCOP(principal)}</span>
			<div className="credit-fund-card__stat">
				<span className="credit-summary__label">Gastado</span>
				<strong>{formatCOP(spentFromDisbursement)}</strong>
			</div>
			<div className="credit-fund-card__stat">
				<span className="credit-summary__label">Disponible</span>
				<strong>{formatCOP(availableFromDisbursement)}</strong>
			</div>
		</Link>
	);
}
