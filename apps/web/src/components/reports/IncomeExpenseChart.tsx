import { ChartTooltip } from "@app/components/reports/ChartTooltip";
import { chartTooltipWrapperStyle, getChartColors } from "@app/lib/charts/chartTheme";
import type { ReportSummary } from "@app/lib/reports/types";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

type IncomeExpenseChartProps = {
	summary: ReportSummary;
};

export function IncomeExpenseChart({ summary }: IncomeExpenseChartProps) {
	const colors = getChartColors();
	const data =
		summary.timeSeries.length > 0
			? summary.timeSeries.map((p) => ({
					label: p.bucketLabel,
					Ingresos: p.income,
					Gastos: p.expense,
				}))
			: [
					{
						label: "Total",
						Ingresos: summary.totalIncome,
						Gastos: summary.totalExpense,
					},
				];

	return (
		<div className="chart-panel glass" aria-label="Ingresos vs gastos">
			<h3 className="chart-panel__title">Ingresos vs gastos</h3>
			<ResponsiveContainer width="100%" height={260}>
				<BarChart data={data}>
					<CartesianGrid strokeDasharray="3 3" stroke={colors.muted} opacity={0.3} />
					<XAxis dataKey="label" stroke={colors.muted} fontSize={12} />
					<YAxis stroke={colors.muted} fontSize={12} />
					<Tooltip
						content={<ChartTooltip />}
						wrapperStyle={chartTooltipWrapperStyle}
					/>
					<Legend />
					<Bar dataKey="Ingresos" fill={colors.accent} radius={[4, 4, 0, 0]} />
					<Bar dataKey="Gastos" fill={colors.danger} radius={[4, 4, 0, 0]} />
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
