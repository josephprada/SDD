import { formatCOP } from "@app/lib/format/currency";

type MetricCardProps = {
	label: string;
	value: number;
	tone?: "default" | "income" | "expense";
	signed?: boolean;
	projectedValue?: number;
	projectedLabel?: string;
};

export function MetricCard({
	label,
	value,
	tone = "default",
	signed = false,
	projectedValue,
	projectedLabel = "Si pagas fijos pendientes",
}: MetricCardProps) {
	const sign = signed ? (value < 0 ? "−" : "+") : "";
	const display = signed
		? `${sign}${formatCOP(Math.abs(value))}`
		: formatCOP(value);

	const projectedSign =
		projectedValue !== undefined
			? projectedValue < 0
				? "−"
				: "+"
			: "";

	return (
		<div className="metric-card glass">
			<span className="metric-card__label">{label}</span>
			<span className={`metric-card__value metric-card__value--${tone}`}>
				{display}
			</span>
			{projectedValue !== undefined ? (
				<span className="metric-card__projected">
					{projectedLabel}:{" "}
					<span className="metric-card__projected-value">
						{projectedSign}
						{formatCOP(Math.abs(projectedValue))}
					</span>
				</span>
			) : null}
		</div>
	);
}
