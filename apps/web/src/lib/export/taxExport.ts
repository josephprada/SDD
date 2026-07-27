import { formatCOP } from "@app/lib/format/currency";
import type { api } from "@convex/_generated/api";
import type { FunctionReturnType } from "convex/server";

export type TaxExportPayload = NonNullable<
	FunctionReturnType<typeof api.taxDocuments.getExportPayload>
>;

function csvCell(value: string | number | boolean | null | undefined): string {
	if (value === null || value === undefined) return "";
	const text = String(value);
	if (/[",\n\r]/.test(text)) {
		return `"${text.replace(/"/g, '""')}"`;
	}
	return text;
}

function csvRow(
	values: Array<string | number | boolean | null | undefined>,
): string {
	return values.map(csvCell).join(",");
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

function stamp(): string {
	const d = new Date();
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}${m}${day}`;
}

export function taxExportFilename(taxYear: number, ext: string): string {
	return `renta-${taxYear}-${stamp()}.${ext}`;
}

export function downloadTaxJson(payload: TaxExportPayload): void {
	const content = JSON.stringify(payload, null, 2);
	downloadBlob(
		content,
		taxExportFilename(payload.taxYear, "json"),
		"application/json;charset=utf-8",
	);
}

export function downloadTaxCsv(payload: TaxExportPayload): void {
	const lines: string[] = [
		csvRow(["Declaracion de renta", payload.taxYear]),
		csvRow(["Estado", payload.status]),
		csvRow(["Disclaimer", payload.disclaimer]),
		"",
		csvRow([
			"Seccion",
			"Categoria",
			"Descripcion",
			"Monto",
			"Notas",
			"Adjuntos",
		]),
	];

	for (const section of payload.sections) {
		for (const item of section.items) {
			lines.push(
				csvRow([
					section.sectionLabel,
					item.categoryLabel,
					item.description,
					item.amount,
					item.notes ?? "",
					item.attachmentCount,
				]),
			);
		}
		lines.push(
			csvRow([section.sectionLabel, "TOTAL", "", section.total, "", ""]),
		);
	}

	lines.push("");
	lines.push(csvRow(["Total general", "", "", payload.totals.grandTotal]));
	if (payload.estimatedTaxableIncome != null) {
		lines.push(
			csvRow([
				"Renta gravable estimada",
				"",
				"",
				payload.estimatedTaxableIncome,
			]),
		);
	}
	if (payload.estimatedTaxDue != null) {
		lines.push(csvRow(["Impuesto estimado", "", "", payload.estimatedTaxDue]));
	}

	downloadBlob(
		lines.join("\n"),
		taxExportFilename(payload.taxYear, "csv"),
		"text/csv;charset=utf-8",
	);
}

export async function downloadTaxPdf(payload: TaxExportPayload): Promise<void> {
	const { jsPDF } = await import("jspdf");
	const pdf = new jsPDF({ unit: "pt", format: "a4" });
	const margin = 40;
	let y = margin;
	const pageHeight = pdf.internal.pageSize.getHeight();

	const ensure = (h: number) => {
		if (y + h > pageHeight - margin) {
			pdf.addPage();
			y = margin;
		}
	};

	const line = (text: string, size = 10, bold = false) => {
		ensure(16);
		pdf.setFont("helvetica", bold ? "bold" : "normal");
		pdf.setFontSize(size);
		pdf.text(text, margin, y);
		y += 16;
	};

	line(`Declaración de renta ${payload.taxYear}`, 16, true);
	line(`Estado: ${payload.status}`);
	line(payload.disclaimer, 9);
	y += 8;

	for (const section of payload.sections) {
		line(section.sectionLabel, 12, true);
		if (section.items.length === 0) {
			line("  (sin rubros)");
		} else {
			for (const item of section.items) {
				line(
					`  ${item.categoryLabel}: ${item.description} — ${formatCOP(item.amount)}`,
				);
			}
		}
		line(`  Total sección: ${formatCOP(section.total)}`, 10, true);
		y += 6;
	}

	line(`Total general: ${formatCOP(payload.totals.grandTotal)}`, 12, true);
	if (payload.estimatedTaxableIncome != null) {
		line(
			`Renta gravable estimada: ${formatCOP(payload.estimatedTaxableIncome)}`,
		);
	}
	if (payload.estimatedTaxDue != null) {
		line(`Impuesto estimado: ${formatCOP(payload.estimatedTaxDue)}`);
	}

	pdf.save(taxExportFilename(payload.taxYear, "pdf"));
}
