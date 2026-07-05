import type { ReportSummary } from "@app/lib/reports/types";
import { formatCOP } from "@app/lib/format/currency";

type ReportSummaryCardProps = {
	summary: ReportSummary;
};

export function ReportSummaryCard({ summary }: ReportSummaryCardProps) {
	return (
		<div className="report-summary glass">
			<div>
				<span>Ingresos</span>
				<strong className="text-success">{formatCOP(summary.totalIncome)}</strong>
			</div>
			<div>
				<span>Gastos</span>
				<strong className="text-danger">{formatCOP(summary.totalExpense)}</strong>
			</div>
			<div>
				<span>Neto</span>
				<strong>{formatCOP(summary.net)}</strong>
			</div>
		</div>
	);
}
