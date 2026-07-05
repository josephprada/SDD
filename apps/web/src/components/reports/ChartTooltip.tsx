import { formatCOP } from "@app/lib/format/currency";

type ChartTooltipPayloadItem = {
	name?: string | number;
	value?: number | string;
	color?: string;
	fill?: string;
};

type ChartTooltipProps = {
	active?: boolean;
	label?: string | number;
	payload?: ChartTooltipPayloadItem[];
};

export function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
	if (!active || !payload?.length) return null;

	return (
		<div className="chart-tooltip">
			{label ? <p className="chart-tooltip__label">{label}</p> : null}
			<ul className="chart-tooltip__items">
				{payload.map((entry) => (
					<li key={String(entry.name)} className="chart-tooltip__item">
						<span
							className="chart-tooltip__dot"
							style={{ background: entry.color ?? entry.fill }}
						/>
						<span className="chart-tooltip__name">{entry.name}</span>
						<span className="chart-tooltip__value amount">
							{formatCOP(Number(entry.value ?? 0))}
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}
