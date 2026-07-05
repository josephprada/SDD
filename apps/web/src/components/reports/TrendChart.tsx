import { ChartTooltip } from "@app/components/reports/ChartTooltip";
import { chartTooltipWrapperStyle, getChartColors } from "@app/lib/charts/chartTheme";
import type { ReportSummary } from "@app/lib/reports/types";
import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

type TrendChartProps = {
	summary: ReportSummary;
};

export function TrendChart({ summary }: TrendChartProps) {
	const colors = getChartColors();
	let cumulativeIncome = 0;
	let cumulativeExpense = 0;
	const data = summary.timeSeries.map((p) => {
		cumulativeIncome += p.income;
		cumulativeExpense += p.expense;

		return {
			label: p.bucketLabel,
			Ingresos: cumulativeIncome,
			Gastos: cumulativeExpense,
			Neto: cumulativeIncome - cumulativeExpense,
		};
	});

	if (summary.totalIncome === 0 && summary.totalExpense === 0) {
		return (
			<div className="chart-panel glass">
				<h3 className="chart-panel__title">Evolución acumulada</h3>
				<p className="budget-empty">
					Sin movimientos en este período para calcular la evolución.
				</p>
			</div>
		);
	}

	return (
		<div className="chart-panel glass" aria-label="Evolución acumulada">
			<h3 className="chart-panel__title">Evolución acumulada</h3>
			<ResponsiveContainer width="100%" height={260}>
				<LineChart data={data}>
					<CartesianGrid strokeDasharray="3 3" stroke={colors.muted} opacity={0.3} />
					<XAxis dataKey="label" stroke={colors.muted} fontSize={12} />
					<YAxis stroke={colors.muted} fontSize={12} />
					<Tooltip
						content={<ChartTooltip />}
						wrapperStyle={chartTooltipWrapperStyle}
					/>
					<Legend />
					<Line
						type="monotone"
						dataKey="Ingresos"
						stroke={colors.accent}
						strokeWidth={2}
						dot={false}
					/>
					<Line
						type="monotone"
						dataKey="Gastos"
						stroke={colors.danger}
						strokeWidth={2}
						dot={false}
					/>
					<Line
						type="monotone"
						dataKey="Neto"
						stroke={colors.text}
						strokeWidth={2}
						dot={false}
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}
