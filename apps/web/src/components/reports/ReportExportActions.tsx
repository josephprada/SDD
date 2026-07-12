import { exportReportCsv, exportReportCsvFilename } from "@app/lib/export/csvExport";
import type { ReportExportPayload } from "@app/lib/export/reportExportTypes";
import { exportReportPdf } from "@app/lib/export/pdfExport";
import { reportPdfFilename } from "@app/lib/export/reportExportUtils";
import { formatPeriodLabel } from "@app/lib/period";
import { CoreIcon } from "@app/lib/core/icons";
import { useToastStore } from "@app/stores/toast";
import type { GroupingId } from "@jp-ds/index";
import { Button } from "@jp-ds";
import { useState } from "react";

type ReportExportActionsProps = {
	payload: ReportExportPayload;
	grouping: GroupingId;
	anchor: Date;
};

export function ReportExportActions({
	payload,
	grouping,
	anchor,
}: ReportExportActionsProps) {
	const [busy, setBusy] = useState(false);
	const showToast = useToastStore((state) => state.show);
	const label = formatPeriodLabel(grouping, anchor);

	const onCsv = () => {
		try {
			exportReportCsv(payload, exportReportCsvFilename(label));
			showToast({
				title: "CSV exportado",
				body: "El reporte detallado se descargó correctamente.",
			});
		} catch (error) {
			showToast({
				title: "Error al exportar CSV",
				body:
					error instanceof Error
						? error.message
						: "No se pudo generar el archivo.",
			});
		}
	};

	const onPdf = async () => {
		setBusy(true);
		try {
			await exportReportPdf(payload, reportPdfFilename(label));
			showToast({
				title: "PDF exportado",
				body: "El reporte detallado se descargó correctamente.",
			});
		} catch (error) {
			showToast({
				title: "Error al exportar PDF",
				body:
					error instanceof Error
						? error.message
						: "No se pudo generar el PDF.",
			});
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="report-export-actions">
			<Button type="button" variant="secondary" onClick={onCsv}>
				<CoreIcon name="file-spreadsheet" size={16} aria-hidden />
				Exportar CSV
			</Button>
			<Button type="button" variant="secondary" disabled={busy} onClick={onPdf}>
				<CoreIcon name="file-text" size={16} aria-hidden />
				{busy ? "Generando…" : "Exportar PDF"}
			</Button>
		</div>
	);
}
