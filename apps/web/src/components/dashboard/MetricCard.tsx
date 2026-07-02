import { formatCOP } from "@app/lib/format/currency";

type MetricCardProps = {
	label: string;
	value: number;
	tone?: "default" | "income" | "expense";
	signed?: boolean;
};

export function MetricCard({
	label,
	value,
	tone = "default",
	signed = false,
}: MetricCardProps) {
	const sign = signed ? (value < 0 ? "−" : "+") : "";
	const display = signed
		? `${sign}${formatCOP(Math.abs(value))}`
		: formatCOP(value);

	return (
		<div className="metric-card glass">
			<span className="metric-card__label">{label}</span>
			<span className={`metric-card__value metric-card__value--${tone}`}>
				{display}
			</span>
		</div>
	);
}
