import { CoreIcon } from "@app/lib/core/icons";
import {
	type TaxExportPayload,
	downloadTaxCsv,
	downloadTaxJson,
	downloadTaxPdf,
} from "@app/lib/export/taxExport";
import { Button } from "@jp-ds";
import { useState } from "react";

type TaxExportMenuProps = {
	loadPayload: () => Promise<TaxExportPayload | null>;
};

export function TaxExportMenu({ loadPayload }: TaxExportMenuProps) {
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");

	const run = async (kind: "json" | "csv" | "pdf") => {
		setError("");
		setBusy(true);
		try {
			const payload = await loadPayload();
			if (!payload) {
				setError("No se pudo cargar la declaración");
				return;
			}
			if (kind === "json") downloadTaxJson(payload);
			else if (kind === "csv") downloadTaxCsv(payload);
			else await downloadTaxPdf(payload);
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error al exportar");
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="tax-export-actions">
			<Button
				type="button"
				variant="secondary"
				disabled={busy}
				aria-label="Descargar CSV"
				onClick={() => run("csv")}
			>
				<CoreIcon name="download" size={16} />
				CSV
			</Button>
			<Button
				type="button"
				variant="secondary"
				disabled={busy}
				aria-label="Descargar PDF"
				onClick={() => run("pdf")}
			>
				<CoreIcon name="download" size={16} />
				PDF
			</Button>
			<Button
				type="button"
				variant="secondary"
				disabled={busy}
				aria-label="Descargar JSON"
				onClick={() => run("json")}
			>
				<CoreIcon name="download" size={16} />
				JSON
			</Button>
			{error ? <span className="tax-item__meta">{error}</span> : null}
		</div>
	);
}
