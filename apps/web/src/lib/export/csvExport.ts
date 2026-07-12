import type { BudgetItem, FixedExpenseItem } from "@app/lib/budgets/types";
import { CREDIT_STATUS_LABELS } from "@app/lib/credits/types";
import { TRANSACTION_TYPE_LABELS } from "@app/lib/core/icons";
import { formatFullDate } from "@app/lib/format/date";
import type { ReportExportPayload } from "@app/lib/export/reportExportTypes";
import {
	budgetCategoriesLabel,
	computeCreditsExportSummary,
	computeSavingsExportSummary,
	formatReminderOffsets,
	groupingLabel,
	SAVINGS_STATUS_LABELS,
	thresholdLabel,
} from "@app/lib/export/reportExportUtils";

function csvCell(value: string | number | boolean | null | undefined): string {
	if (value === null || value === undefined) return "";
	const text = String(value);
	if (/[",\n\r]/.test(text)) {
		return `"${text.replace(/"/g, '""')}"`;
	}
	return text;
}

function csvRow(values: Array<string | number | boolean | null | undefined>): string {
	return values.map(csvCell).join(",");
}

function sectionTitle(title: string): string {
	return csvRow([title]);
}

function blankLine(): string {
	return "";
}

function downloadBlob(content: string, filename: string, type: string) {
	const blob = new Blob([`\uFEFF${content}`], { type });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

function buildTimeSeriesRows(payload: ReportExportPayload): string[] {
	const rows: string[] = [
		sectionTitle("EVOLUCIÓN TEMPORAL"),
		csvRow([
			"Bucket",
			"Ingresos del bucket",
			"Gastos del bucket",
			"Neto del bucket",
			"Ingresos acumulados",
			"Gastos acumulados",
			"Neto acumulado",
		]),
	];

	let cumulativeIncome = 0;
	let cumulativeExpense = 0;

	for (const point of payload.summary.timeSeries) {
		cumulativeIncome += point.income;
		cumulativeExpense += point.expense;

		rows.push(
			csvRow([
				point.bucketLabel,
				point.income,
				point.expense,
				point.income - point.expense,
				cumulativeIncome,
				cumulativeExpense,
				cumulativeIncome - cumulativeExpense,
			]),
		);
	}

	return rows;
}

function buildBudgetRows(budgets: BudgetItem[]): string[] {
	const totalBudget = budgets.reduce((sum, item) => sum + item.amount, 0);
	const totalSpent = budgets.reduce((sum, item) => sum + item.spent, 0);
	const rows: string[] = [
		sectionTitle("PRESUPUESTOS"),
		csvRow(["Alcance", "Mes seleccionado"]),
		blankLine(),
		sectionTitle("PRESUPUESTOS — RESUMEN"),
		csvRow(["Concepto", "Valor"]),
		csvRow(["Presupuestado", totalBudget]),
		csvRow(["Gastado", totalSpent]),
		csvRow(["Restante", totalBudget - totalSpent]),
		blankLine(),
		sectionTitle("PRESUPUESTOS — DETALLE"),
		csvRow([
			"Categorías",
			"Monto presupuestado",
			"Gastado",
			"Restante",
			"Porcentaje usado",
			"Estado",
			"Notas",
		]),
	];

	if (budgets.length === 0) {
		rows.push(csvRow(["Sin presupuestos para el mes seleccionado"]));
		return rows;
	}

	for (const budget of budgets) {
		rows.push(
			csvRow([
				budgetCategoriesLabel(budget),
				budget.amount,
				budget.spent,
				budget.remaining,
				`${Math.round(budget.percent * 100)}%`,
				thresholdLabel(budget.thresholdStatus),
				budget.notes ?? "",
			]),
		);
	}

	rows.push(
		csvRow([
			"TOTAL",
			totalBudget,
			totalSpent,
			totalBudget - totalSpent,
			totalBudget > 0 ? `${Math.round((totalSpent / totalBudget) * 100)}%` : "0%",
			"",
			"",
		]),
	);

	return rows;
}

function buildFixedExpenseRows(fixedExpenses: FixedExpenseItem[]): string[] {
	const totalAmount = fixedExpenses.reduce((sum, item) => sum + item.amount, 0);
	const pendingAmount = fixedExpenses
		.filter((item) => !item.isPaidCurrentPeriod)
		.reduce((sum, item) => sum + item.amount, 0);
	const paidCount = fixedExpenses.filter((item) => item.isPaidCurrentPeriod).length;
	const rows: string[] = [
		sectionTitle("GASTOS FIJOS"),
		csvRow(["Alcance", "Mes seleccionado"]),
		blankLine(),
		sectionTitle("GASTOS FIJOS — RESUMEN"),
		csvRow(["Concepto", "Valor"]),
		csvRow(["Comprometido", totalAmount]),
		csvRow(["Pendiente", pendingAmount]),
		csvRow(["Pagados", `${paidCount}/${fixedExpenses.length}`]),
		blankLine(),
		sectionTitle("GASTOS FIJOS — DETALLE"),
		csvRow([
			"Nombre",
			"Monto",
			"Categoría",
			"Día del mes",
			"Próximo vencimiento",
			"Estado del mes",
			"Recordatorios email",
			"Recordatorios push",
			"Offsets de aviso",
			"Notas",
		]),
	];

	if (fixedExpenses.length === 0) {
		rows.push(csvRow(["Sin gastos fijos registrados"]));
		return rows;
	}

	for (const item of fixedExpenses) {
		rows.push(
			csvRow([
				item.name,
				item.amount,
				item.categoryName,
				item.dayOfMonth,
				formatFullDate(item.nextDueDate),
				item.isPaidCurrentPeriod ? "Pagado" : "Pendiente",
				item.emailReminders ? "Sí" : "No",
				item.pushReminders ? "Sí" : "No",
				formatReminderOffsets(item.reminderOffsets),
				item.notes ?? "",
			]),
		);
	}

	rows.push(
		csvRow([
			"TOTAL",
			totalAmount,
			"",
			"",
			"",
			`${paidCount}/${fixedExpenses.length} pagados · Pendiente ${pendingAmount}`,
			"",
			"",
			"",
			"",
		]),
	);

	return rows;
}

function buildCreditRows(payload: ReportExportPayload): string[] {
	const summary = computeCreditsExportSummary(payload.credits);
	const rows: string[] = [
		sectionTitle("CRÉDITOS"),
		csvRow(["Alcance", "Estado actual (no filtrado por período)"]),
		blankLine(),
		sectionTitle("CRÉDITOS — RESUMEN"),
		csvRow(["Concepto", "Valor"]),
		csvRow(["Deuda total", summary.totalOutstanding]),
		csvRow(["Créditos activos", summary.activeCount]),
		csvRow(["Con cuota pendiente", summary.withNextPayment]),
		blankLine(),
		sectionTitle("CRÉDITOS — DETALLE"),
		csvRow([
			"Nombre",
			"Acreedor",
			"Desembolso",
			"Saldo pendiente",
			"Estado",
			"Próxima cuota",
			"Vencimiento",
			"Monto cuota",
		]),
	];

	if (summary.activeCredits.length === 0) {
		rows.push(csvRow(["Sin créditos activos"]));
		return rows;
	}

	for (const credit of summary.activeCredits) {
		rows.push(
			csvRow([
				credit.name,
				credit.lender ?? "",
				credit.principal,
				credit.outstandingBalance,
				CREDIT_STATUS_LABELS[credit.status],
				credit.nextPayment?.installmentNumber ?? "",
				credit.nextPayment ? formatFullDate(credit.nextPayment.dueDate) : "",
				credit.nextPayment?.totalDue ?? "",
			]),
		);
	}

	rows.push(
		csvRow([
			"TOTAL DEUDA",
			"",
			"",
			summary.totalOutstanding,
			"",
			"",
			"",
			"",
		]),
	);

	return rows;
}

function buildSavingsRows(payload: ReportExportPayload): string[] {
	const summary = computeSavingsExportSummary(payload.savingsGoals);
	const rows: string[] = [
		sectionTitle("AHORROS"),
		csvRow(["Alcance", "Estado actual (no filtrado por período)"]),
		blankLine(),
		sectionTitle("AHORROS — RESUMEN"),
		csvRow(["Concepto", "Valor"]),
		csvRow(["Ahorrado (metas activas)", summary.totalSaved]),
		csvRow(["Meta activa", summary.totalTarget]),
		csvRow(["Metas completadas", summary.completedCount]),
		blankLine(),
		sectionTitle("AHORROS — DETALLE"),
		csvRow([
			"Meta",
			"Ahorrado",
			"Objetivo",
			"Progreso %",
			"Restante",
			"Estado",
			"Cuenta",
			"Vinculada a crédito",
			"Fecha meta",
		]),
	];

	if (payload.savingsGoals.length === 0) {
		rows.push(csvRow(["Sin metas de ahorro"]));
		return rows;
	}

	for (const goal of payload.savingsGoals) {
		rows.push(
			csvRow([
				goal.name,
				goal.currentAmount,
				goal.targetAmount,
				Math.round(goal.percent * 100),
				goal.remaining,
				SAVINGS_STATUS_LABELS[goal.status],
				goal.accountName ?? "",
				goal.linkedCreditId ? "Sí" : "No",
				goal.deadline ? formatFullDate(goal.deadline) : "",
			]),
		);
	}

	rows.push(
		csvRow([
			"TOTAL ACTIVO",
			summary.totalSaved,
			summary.totalTarget,
			"",
			"",
			"",
			"",
			"",
			"",
		]),
	);

	return rows;
}

function buildTransactionRows(
	payload: ReportExportPayload,
): string[] {
	const rows: string[] = [
		sectionTitle("MOVIMIENTOS DETALLADOS"),
		csvRow([
			"Fecha",
			"Tipo",
			"Cuenta origen",
			"Cuenta destino",
			"Categoría",
			"Monto",
			"Notas",
		]),
	];

	if (payload.transactions.length === 0) {
		rows.push(csvRow(["Sin movimientos en el período y filtros seleccionados"]));
		return rows;
	}

	let incomeTotal = 0;
	let expenseTotal = 0;

	for (const transaction of payload.transactions) {
		if (transaction.type === "income") incomeTotal += transaction.amount;
		if (transaction.type === "expense") expenseTotal += transaction.amount;

		rows.push(
			csvRow([
				formatFullDate(transaction.date),
				TRANSACTION_TYPE_LABELS[transaction.type],
				transaction.accountName,
				transaction.toAccountName ?? "",
				transaction.categoryName,
				transaction.amount,
				transaction.notes ?? "",
			]),
		);
	}

	rows.push(
		csvRow([
			"TOTAL INGRESOS",
			"",
			"",
			"",
			"",
			incomeTotal,
			"",
		]),
		csvRow([
			"TOTAL GASTOS",
			"",
			"",
			"",
			"",
			expenseTotal,
			"",
		]),
		csvRow([
			"NETO MOVIMIENTOS",
			"",
			"",
			"",
			"",
			incomeTotal - expenseTotal,
			"",
		]),
	);

	return rows;
}

export function exportReportCsv(payload: ReportExportPayload, filename: string): void {
	const generatedAt = new Date().toLocaleString("es-CO", {
		dateStyle: "long",
		timeStyle: "short",
	});

	const lines = [
		sectionTitle("REPORTE FINANCIERO — JP Wallet"),
		csvRow(["Generado", generatedAt]),
		csvRow(["Período", payload.periodLabel]),
		csvRow(["Clave de mes (presupuestos/gastos fijos)", payload.periodKey]),
		csvRow([
			"Módulos incluidos",
			"Resumen financiero, presupuestos, gastos fijos, créditos y ahorros",
		]),
		csvRow(["Desde", formatFullDate(payload.dateFrom)]),
		csvRow(["Hasta", formatFullDate(payload.dateTo)]),
		csvRow(["Agrupación", groupingLabel(payload.grouping)]),
		csvRow(["Filtro categoría", payload.filters.categoryLabel]),
		csvRow(["Filtro cuenta", payload.filters.accountLabel]),
		blankLine(),
		sectionTitle("RESUMEN FINANCIERO"),
		csvRow(["Concepto", "Monto"]),
		csvRow(["Ingresos", payload.summary.totalIncome]),
		csvRow(["Gastos", payload.summary.totalExpense]),
		csvRow(["Neto", payload.summary.net]),
		csvRow(["Cantidad de movimientos", payload.transactions.length]),
		blankLine(),
		...buildTimeSeriesRows(payload),
		blankLine(),
		sectionTitle("GASTOS POR CATEGORÍA"),
		csvRow(["Categoría", "Monto", "Porcentaje del gasto total"]),
		...(payload.summary.byCategory.length > 0
			? payload.summary.byCategory.map((category) =>
					csvRow([
						category.name,
						category.amount,
						`${(category.percent * 100).toFixed(1)}%`,
					]),
				)
			: [csvRow(["Sin gastos por categoría en el período"])]),
		blankLine(),
		...buildTransactionRows(payload),
		blankLine(),
		...buildBudgetRows(payload.budgets),
		blankLine(),
		...buildFixedExpenseRows(payload.fixedExpenses),
		blankLine(),
		...buildCreditRows(payload),
		blankLine(),
		...buildSavingsRows(payload),
	];

	downloadBlob(lines.join("\n"), filename, "text/csv;charset=utf-8");
}

export function exportReportCsvFilename(label: string): string {
	return `reporte-${label.replace(/\s+/g, "-").toLowerCase()}.csv`;
}
