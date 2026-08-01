import { formatCOP } from "@app/lib/format/currency";

type MetricCardProps = {
	label: string;
	value: number;
	tone?: "default" | "income" | "expense";
	signed?: boolean;
	/** When set with highlightValue, this row is primary and value/label become secondary. */
	highlightLabel?: string;
	highlightValue?: number;
};

function formatSigned(value: number, signed: boolean): string {
	if (!signed) return formatCOP(value);
	const sign = value < 0 ? "−" : "+";
	return `${sign}${formatCOP(Math.abs(value))}`;
}

export function MetricCard({
	label,
	value,
	tone = "default",
	signed = false,
	highlightLabel,
	highlightValue,
}: MetricCardProps) {
	const hasHighlight = highlightValue !== undefined && Boolean(highlightLabel);

	if (hasHighlight) {
		return (
			<div
				className="metric-card glass metric-card--with-highlight"
				data-testid="metric-card-projected"
			>
				<span className="metric-card__label metric-card__label--primary">
					{highlightLabel}
				</span>
				<span
					className={`metric-card__value metric-card__value--${tone}`}
					data-testid="metric-projected-value"
				>
					{formatSigned(highlightValue, signed)}
				</span>
				<span className="metric-card__secondary">
					{label}:{" "}
					<span
						className="metric-card__secondary-value"
						data-testid="metric-net-value"
					>
						{formatSigned(value, signed)}
					</span>
				</span>
			</div>
		);
	}

	return (
		<div className="metric-card glass">
			<span className="metric-card__label">{label}</span>
			<span className={`metric-card__value metric-card__value--${tone}`}>
				{formatSigned(value, signed)}
			</span>
		</div>
	);
}
