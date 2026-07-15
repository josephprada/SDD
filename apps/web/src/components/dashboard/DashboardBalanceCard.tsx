import { formatCOP } from "@app/lib/format/currency";

type DashboardBalanceCardProps = {
	totalBalance: number;
	accountCount: number;
};

export function DashboardBalanceCard({
	totalBalance,
	accountCount,
}: DashboardBalanceCardProps) {
	const isNegative = totalBalance < 0;

	return (
		<div
			className={`balance-card glass${isNegative ? " balance-card--negative" : ""}`}
		>
			<span className="balance-card__label">Disponible</span>
			<span className="balance-card__value">{formatCOP(totalBalance)}</span>
			<span className="balance-card__meta">
				{accountCount}{" "}
				{accountCount === 1 ? "cuenta activa" : "cuentas activas"} · actualizado
				ahora
			</span>
		</div>
	);
}
