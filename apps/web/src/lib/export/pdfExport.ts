import type { BudgetItem, FixedExpenseItem } from "@app/lib/budgets/types";
import { TRANSACTION_TYPE_LABELS } from "@app/lib/core/icons";
import { formatCOP } from "@app/lib/format/currency";
import { formatFullDate } from "@app/lib/format/date";
import type { ReportExportPayload } from "@app/lib/export/reportExportTypes";
import {
	budgetCategoriesLabel,
	formatReminderOffsets,
	groupingLabel,
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
	writer.addTable(
		["Categorias", "Presup.", "Gastado", "Restante", "%", "Estado", "Notas"],
		buildBudgetRows(payload.budgets),
		[84, 54, 54, 54, 26, 46, writer.contentWidth - 318],
	);

	writer.addSection("Gastos fijos");
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

	writer.save(filename);
}
