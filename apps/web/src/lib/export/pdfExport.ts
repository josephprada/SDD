import type { BudgetItem, FixedExpenseItem } from "@app/lib/budgets/types";
import { CREDIT_STATUS_LABELS } from "@app/lib/credits/types";
import { TRANSACTION_TYPE_LABELS } from "@app/lib/core/icons";
import { formatCOP } from "@app/lib/format/currency";
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
import type { jsPDF } from "jspdf";

const MARGIN = 40;
const LINE = 14;
const HEADER_ROW = 18;
const BODY_ROW = 15;

class PdfWriter {
	private y = MARGIN;
	private readonly pageWidth: number;
	private readonly pageHeight: number;
	readonly contentWidth: number;

	constructor(private readonly pdf: jsPDF) {
		this.pageWidth = pdf.internal.pageSize.getWidth();
		this.pageHeight = pdf.internal.pageSize.getHeight();
		this.contentWidth = this.pageWidth - MARGIN * 2;
	}

	ensureSpace(height: number): void {
		if (this.y + height > this.pageHeight - MARGIN) {
			this.pdf.addPage();
			this.y = MARGIN;
		}
	}

	addTitle(text: string): void {
		this.ensureSpace(28);
		this.pdf.setFont("helvetica", "bold");
		this.pdf.setFontSize(16);
		this.pdf.setTextColor(20, 20, 20);
		this.pdf.text(text, MARGIN, this.y);
		this.y += 24;
	}

	addMeta(label: string, value: string): void {
		this.ensureSpace(LINE);
		this.pdf.setFont("helvetica", "bold");
		this.pdf.setFontSize(9);
		this.pdf.setTextColor(90, 90, 90);
		this.pdf.text(`${label}:`, MARGIN, this.y);
		this.pdf.setFont("helvetica", "normal");
		this.pdf.setTextColor(30, 30, 30);
		this.pdf.text(value, MARGIN + 110, this.y);
		this.y += LINE;
	}

	addSection(title: string): void {
		this.ensureSpace(24);
		this.y += 8;
		this.pdf.setFont("helvetica", "bold");
		this.pdf.setFontSize(12);
		this.pdf.setTextColor(20, 20, 20);
		this.pdf.text(title, MARGIN, this.y);
		this.y += 18;
	}

	addParagraph(text: string): void {
		this.ensureSpace(LINE);
		this.pdf.setFont("helvetica", "normal");
		this.pdf.setFontSize(10);
		this.pdf.setTextColor(80, 80, 80);
		this.pdf.text(text, MARGIN, this.y);
		this.y += LINE;
	}

	addTable(headers: string[], rows: string[][], colWidths: number[]): void {
		this.ensureSpace(HEADER_ROW);
		let x = MARGIN;
		this.pdf.setFillColor(236, 240, 244);
		this.pdf.rect(MARGIN, this.y - 11, this.contentWidth, HEADER_ROW, "F");
		this.pdf.setFont("helvetica", "bold");
		this.pdf.setFontSize(8);
		this.pdf.setTextColor(30, 30, 30);

		for (let index = 0; index < headers.length; index += 1) {
			this.pdf.text(
				truncate(this.pdf, headers[index], colWidths[index] - 6),
				x + 3,
				this.y,
			);
			x += colWidths[index];
		}
		this.y += HEADER_ROW;

		this.pdf.setFont("helvetica", "normal");
		for (const row of rows) {
			this.ensureSpace(BODY_ROW);
			x = MARGIN;
			for (let index = 0; index < row.length; index += 1) {
				this.pdf.text(
					truncate(this.pdf, row[index] ?? "", colWidths[index] - 6),
					x + 3,
					this.y,
				);
				x += colWidths[index];
			}
			this.y += BODY_ROW;
		}

		this.y += 6;
	}

	save(filename: string): void {
		this.pdf.save(filename);
	}
}

function truncate(pdf: jsPDF, text: string, maxWidth: number): string {
	if (pdf.getTextWidth(text) <= maxWidth) return text;

	let trimmed = text;
	while (trimmed.length > 0 && pdf.getTextWidth(`${trimmed}…`) > maxWidth) {
		trimmed = trimmed.slice(0, -1);
	}

	return trimmed.length > 0 ? `${trimmed}…` : text.slice(0, 1);
}

function buildTimeSeriesRows(payload: ReportExportPayload): string[][] {
	const rows: string[][] = [];
	let cumulativeIncome = 0;
	let cumulativeExpense = 0;

	for (const point of payload.summary.timeSeries) {
		cumulativeIncome += point.income;
		cumulativeExpense += point.expense;

		rows.push([
			point.bucketLabel,
			formatCOP(point.income),
			formatCOP(point.expense),
			formatCOP(point.income - point.expense),
			formatCOP(cumulativeIncome),
			formatCOP(cumulativeExpense),
			formatCOP(cumulativeIncome - cumulativeExpense),
		]);
	}

	return rows;
}

function buildBudgetRows(budgets: BudgetItem[]): string[][] {
	if (budgets.length === 0) {
		return [["Sin presupuestos para el mes seleccionado"]];
	}

	const rows = budgets.map((budget) => [
		budgetCategoriesLabel(budget),
		formatCOP(budget.amount),
		formatCOP(budget.spent),
		formatCOP(budget.remaining),
		`${Math.round(budget.percent * 100)}%`,
		thresholdLabel(budget.thresholdStatus),
		budget.notes ?? "",
	]);

	const totalBudget = budgets.reduce((sum, item) => sum + item.amount, 0);
	const totalSpent = budgets.reduce((sum, item) => sum + item.spent, 0);

	rows.push([
		"TOTAL",
		formatCOP(totalBudget),
		formatCOP(totalSpent),
		formatCOP(totalBudget - totalSpent),
		totalBudget > 0 ? `${Math.round((totalSpent / totalBudget) * 100)}%` : "0%",
		"",
		"",
	]);

	return rows;
}

function buildFixedExpenseRows(fixedExpenses: FixedExpenseItem[]): string[][] {
	if (fixedExpenses.length === 0) {
		return [["Sin gastos fijos registrados"]];
	}

	const rows = fixedExpenses.map((item) => [
		item.name,
		formatCOP(item.amount),
		item.categoryName,
		String(item.dayOfMonth),
		formatFullDate(item.nextDueDate),
		item.isPaidCurrentPeriod ? "Pagado" : "Pendiente",
		item.emailReminders ? "Si" : "No",
		item.pushReminders ? "Si" : "No",
		formatReminderOffsets(item.reminderOffsets),
		item.notes ?? "",
	]);

	const totalAmount = fixedExpenses.reduce((sum, item) => sum + item.amount, 0);
	const pendingAmount = fixedExpenses
		.filter((item) => !item.isPaidCurrentPeriod)
		.reduce((sum, item) => sum + item.amount, 0);
	const paidCount = fixedExpenses.filter((item) => item.isPaidCurrentPeriod).length;

	rows.push([
		"TOTAL",
		formatCOP(totalAmount),
		"",
		"",
		"",
		`${paidCount}/${fixedExpenses.length} pagados`,
		"",
		"",
		`Pendiente ${formatCOP(pendingAmount)}`,
		"",
	]);

	return rows;
}

function buildCreditRows(payload: ReportExportPayload): string[][] {
	const summary = computeCreditsExportSummary(payload.credits);

	if (summary.activeCredits.length === 0) {
		return [["Sin creditos activos"]];
	}

	const rows = summary.activeCredits.map((credit) => [
		credit.name,
		credit.lender ?? "",
		formatCOP(credit.principal),
		formatCOP(credit.outstandingBalance),
		CREDIT_STATUS_LABELS[credit.status],
		credit.nextPayment ? `#${credit.nextPayment.installmentNumber}` : "",
		credit.nextPayment ? formatFullDate(credit.nextPayment.dueDate) : "",
		credit.nextPayment ? formatCOP(credit.nextPayment.totalDue) : "",
	]);

	rows.push([
		"TOTAL DEUDA",
		"",
		"",
		formatCOP(summary.totalOutstanding),
		"",
		"",
		"",
		"",
	]);

	return rows;
}

function buildSavingsRows(payload: ReportExportPayload): string[][] {
	if (payload.savingsGoals.length === 0) {
		return [["Sin metas de ahorro"]];
	}

	const summary = computeSavingsExportSummary(payload.savingsGoals);
	const rows = payload.savingsGoals.map((goal) => [
		goal.name,
		formatCOP(goal.currentAmount),
		formatCOP(goal.targetAmount),
		`${Math.round(goal.percent * 100)}%`,
		formatCOP(goal.remaining),
		SAVINGS_STATUS_LABELS[goal.status],
		goal.accountName ?? "",
		goal.linkedCreditId ? "Si" : "No",
		goal.deadline ? formatFullDate(goal.deadline) : "",
	]);

	rows.push([
		"TOTAL ACTIVO",
		formatCOP(summary.totalSaved),
		formatCOP(summary.totalTarget),
		"",
		"",
		"",
		"",
		"",
		"",
	]);

	return rows;
}

function buildTransactionRows(payload: ReportExportPayload): string[][] {
	if (payload.transactions.length === 0) {
		return [["Sin movimientos en el periodo y filtros seleccionados"]];
	}

	const rows = payload.transactions.map((transaction) => [
		formatFullDate(transaction.date),
		TRANSACTION_TYPE_LABELS[transaction.type],
		transaction.accountName,
		transaction.toAccountName ?? "",
		transaction.categoryName,
		formatCOP(transaction.amount),
		transaction.notes ?? "",
	]);

	let incomeTotal = 0;
	let expenseTotal = 0;
	for (const transaction of payload.transactions) {
		if (transaction.type === "income") incomeTotal += transaction.amount;
		if (transaction.type === "expense") expenseTotal += transaction.amount;
	}

	rows.push(["", "", "", "", "TOTAL INGRESOS", formatCOP(incomeTotal), ""]);
	rows.push(["", "", "", "", "TOTAL GASTOS", formatCOP(expenseTotal), ""]);
	rows.push([
		"",
		"",
		"",
		"",
		"NETO MOVIMIENTOS",
		formatCOP(incomeTotal - expenseTotal),
		"",
	]);

	return rows;
}

export async function exportReportPdf(
	payload: ReportExportPayload,
	filename: string,
): Promise<void> {
	const { jsPDF } = await import("jspdf");
	const writer = new PdfWriter(
		new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" }),
	);

	const generatedAt = new Date().toLocaleString("es-CO", {
		dateStyle: "long",
		timeStyle: "short",
	});

	writer.addTitle("Reporte financiero — JP Wallet");
	writer.addMeta("Generado", generatedAt);
	writer.addMeta("Periodo", payload.periodLabel);
	writer.addMeta("Desde", formatFullDate(payload.dateFrom));
	writer.addMeta("Hasta", formatFullDate(payload.dateTo));
	writer.addMeta("Agrupacion", groupingLabel(payload.grouping));
	writer.addMeta("Filtro categoria", payload.filters.categoryLabel);
	writer.addMeta("Filtro cuenta", payload.filters.accountLabel);
	writer.addMeta("Mes presupuestos", payload.periodKey);
	writer.addMeta(
		"Modulos incluidos",
		"Resumen, presupuestos, gastos fijos, creditos y ahorros",
	);

	writer.addSection("Resumen financiero");
	writer.addTable(
		["Concepto", "Monto"],
		[
			["Ingresos", formatCOP(payload.summary.totalIncome)],
			["Gastos", formatCOP(payload.summary.totalExpense)],
			["Neto", formatCOP(payload.summary.net)],
			["Movimientos", String(payload.transactions.length)],
		],
		[220, writer.contentWidth - 220],
	);

	writer.addSection("Evolucion temporal");
	const timeSeriesRows = buildTimeSeriesRows(payload);
	if (timeSeriesRows.length === 0) {
		writer.addParagraph("Sin datos de evolucion temporal.");
	} else {
		const bucketWidth = 70;
		const valueWidth = Math.floor((writer.contentWidth - bucketWidth) / 6);
		writer.addTable(
			[
				"Bucket",
				"Ingresos",
				"Gastos",
				"Neto",
				"Ing. acum.",
				"Gasto acum.",
				"Neto acum.",
			],
			timeSeriesRows,
			[
				bucketWidth,
				valueWidth,
				valueWidth,
				valueWidth,
				valueWidth,
				valueWidth,
				valueWidth,
			],
		);
	}

	writer.addSection("Gastos por categoria");
	if (payload.summary.byCategory.length === 0) {
		writer.addParagraph("Sin gastos por categoria en el periodo.");
	} else {
		writer.addTable(
			["Categoria", "Monto", "% del gasto"],
			payload.summary.byCategory.map((category) => [
				category.name,
				formatCOP(category.amount),
				`${(category.percent * 100).toFixed(1)}%`,
			]),
			[200, writer.contentWidth - 280, 80],
		);
	}

	writer.addSection("Movimientos detallados");
	writer.addTable(
		["Fecha", "Tipo", "Cuenta", "Destino", "Categoria", "Monto", "Notas"],
		buildTransactionRows(payload),
		[56, 44, 64, 56, 64, 56, writer.contentWidth - 340],
	);

	writer.addSection("Presupuestos");
	const totalBudget = payload.budgets.reduce((sum, item) => sum + item.amount, 0);
	const totalSpent = payload.budgets.reduce((sum, item) => sum + item.spent, 0);
	writer.addTable(
		["Concepto", "Monto"],
		[
			["Presupuestado", formatCOP(totalBudget)],
			["Gastado", formatCOP(totalSpent)],
			["Restante", formatCOP(totalBudget - totalSpent)],
		],
		[220, writer.contentWidth - 220],
	);
	writer.addTable(
		["Categorias", "Presup.", "Gastado", "Restante", "%", "Estado", "Notas"],
		buildBudgetRows(payload.budgets),
		[84, 54, 54, 54, 26, 46, writer.contentWidth - 318],
	);

	writer.addSection("Gastos fijos");
	const fixedTotal = payload.fixedExpenses.reduce(
		(sum, item) => sum + item.amount,
		0,
	);
	const fixedPending = payload.fixedExpenses
		.filter((item) => !item.isPaidCurrentPeriod)
		.reduce((sum, item) => sum + item.amount, 0);
	const fixedPaidCount = payload.fixedExpenses.filter(
		(item) => item.isPaidCurrentPeriod,
	).length;
	writer.addTable(
		["Concepto", "Monto"],
		[
			["Comprometido", formatCOP(fixedTotal)],
			["Pendiente", formatCOP(fixedPending)],
			[
				"Pagados",
				`${fixedPaidCount}/${payload.fixedExpenses.length}`,
			],
		],
		[220, writer.contentWidth - 220],
	);
	writer.addTable(
		[
			"Nombre",
			"Monto",
			"Categoria",
			"Dia",
			"Vence",
			"Estado",
			"Email",
			"Push",
			"Avisos",
			"Notas",
		],
		buildFixedExpenseRows(payload.fixedExpenses),
		[54, 48, 48, 22, 54, 40, 24, 24, 48, writer.contentWidth - 362],
	);

	const creditsSummary = computeCreditsExportSummary(payload.credits);
	writer.addSection("Creditos");
	writer.addMeta("Alcance", "Estado actual");
	writer.addTable(
		["Concepto", "Valor"],
		[
			["Deuda total", formatCOP(creditsSummary.totalOutstanding)],
			["Creditos activos", String(creditsSummary.activeCount)],
			["Con cuota pendiente", String(creditsSummary.withNextPayment)],
		],
		[220, writer.contentWidth - 220],
	);
	writer.addTable(
		[
			"Nombre",
			"Acreedor",
			"Desembolso",
			"Saldo",
			"Estado",
			"Cuota",
			"Vence",
			"Monto",
		],
		buildCreditRows(payload),
		[56, 48, 48, 48, 36, 24, 48, writer.contentWidth - 308],
	);

	const savingsSummary = computeSavingsExportSummary(payload.savingsGoals);
	writer.addSection("Ahorros");
	writer.addMeta("Alcance", "Estado actual");
	writer.addTable(
		["Concepto", "Valor"],
		[
			["Ahorrado (metas activas)", formatCOP(savingsSummary.totalSaved)],
			["Meta activa", formatCOP(savingsSummary.totalTarget)],
			["Metas completadas", String(savingsSummary.completedCount)],
		],
		[220, writer.contentWidth - 220],
	);
	writer.addTable(
		[
			"Meta",
			"Ahorrado",
			"Objetivo",
			"Progreso",
			"Restante",
			"Estado",
			"Cuenta",
			"Vinculo credito",
			"Fecha meta",
		],
		buildSavingsRows(payload),
		[56, 48, 48, 36, 48, 40, 48, 36, writer.contentWidth - 360],
	);

	writer.save(filename);
}
