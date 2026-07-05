import { ChartTooltip } from "@app/components/reports/ChartTooltip";
import { chartTooltipWrapperStyle } from "@app/lib/charts/chartTheme";
import type { ReportSummary } from "@app/lib/reports/types";
import {
	Cell,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
} from "recharts";

type CategoryBreakdownChartProps = {
	summary: ReportSummary;
};

export function CategoryBreakdownChart({ summary }: CategoryBreakdownChartProps) {
	const data = summary.byCategory.map((c) => ({
		name: c.name,
		value: c.amount,
		color: c.color,
	}));

	if (data.length === 0) {
		return (
			<div className="chart-panel glass">
				<h3 className="chart-panel__title">Gastos por categoría</h3>
				<p className="budget-empty">Sin gastos en el período.</p>
			</div>
		);
	}

	return (
		<div className="chart-panel glass" aria-label="Gastos por categoría">
			<h3 className="chart-panel__title">Gastos por categoría</h3>
			<ResponsiveContainer width="100%" height={260}>
				<PieChart>
					<Pie
						data={data}
						dataKey="value"
						nameKey="name"
						cx="50%"
						cy="50%"
						outerRadius={90}
						label={({ name, percent }) =>
							`${name} ${((percent ?? 0) * 100).toFixed(0)}%`
						}
					>
						{data.map((entry) => (
							<Cell key={entry.name} fill={entry.color} />
						))}
					</Pie>
					<Tooltip
						content={<ChartTooltip />}
						wrapperStyle={chartTooltipWrapperStyle}
					/>
				</PieChart>
			</ResponsiveContainer>
			<table className="sr-only">
				<caption>Gastos por categoría</caption>
				<tbody>
					{data.map((row) => (
						<tr key={row.name}>
							<td>{row.name}</td>
							<td>{row.value}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
