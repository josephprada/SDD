import { CurrencyInput } from "@app/components/ui/CurrencyInput";
import { formatCOP, parseCOPInput } from "@app/lib/format/currency";
import { TAX_SECTION_LABELS } from "@app/lib/tax/categories";
import { TAX_DISCLAIMER, type TaxSection } from "@app/lib/tax/types";
import { Button } from "@jp-ds";
import { useState } from "react";

type Totals = Record<TaxSection, number> & { grandTotal: number };

type TaxSummaryPanelProps = {
	totals: Totals;
	estimatedTaxableIncome?: number;
	estimatedTaxDue?: number;
	readOnly?: boolean;
	onSaveEstimates?: (values: {
		estimatedTaxableIncome: number | null;
		estimatedTaxDue: number | null;
	}) => Promise<void>;
};

export function TaxSummaryPanel({
	totals,
	estimatedTaxableIncome,
	estimatedTaxDue,
	readOnly,
	onSaveEstimates,
}: TaxSummaryPanelProps) {
	const [incomeRaw, setIncomeRaw] = useState(
		estimatedTaxableIncome != null ? String(estimatedTaxableIncome) : "",
	);
	const [taxRaw, setTaxRaw] = useState(
		estimatedTaxDue != null ? String(estimatedTaxDue) : "",
	);
	const [saving, setSaving] = useState(false);

	const sections: TaxSection[] = [
		"assets",
		"liabilities",
		"income",
		"deductions",
		"exempt",
	];

	return (
		<section className="tax-summary glass">
			{sections.map((section) => (
				<div key={section} className="tax-summary__row">
					<span>{TAX_SECTION_LABELS[section]}</span>
					<strong>{formatCOP(totals[section])}</strong>
				</div>
			))}
			<div className="tax-summary__row tax-summary__row--strong">
				<span>Suma de rubros</span>
				<strong>{formatCOP(totals.grandTotal)}</strong>
			</div>
			<p className="tax-disclaimer">{TAX_DISCLAIMER}</p>

			{onSaveEstimates ? (
				<div className="tax-form" style={{ gridColumn: "1 / -1" }}>
					<p className="tax-item__meta">
						Estimados manuales (opcionales; la app no calcula UVT ni tarifas
						DIAN).
					</p>
					<CurrencyInput
						label="Renta gravable estimada"
						value={incomeRaw}
						onChange={setIncomeRaw}
						disabled={readOnly}
					/>
					<CurrencyInput
						label="Impuesto estimado"
						value={taxRaw}
						onChange={setTaxRaw}
						disabled={readOnly}
					/>
					{!readOnly ? (
						<div className="tax-form__actions">
							<Button
								type="button"
								variant="secondary"
								disabled={saving}
								onClick={async () => {
									setSaving(true);
									try {
										await onSaveEstimates({
											estimatedTaxableIncome: incomeRaw
												? (parseCOPInput(incomeRaw) ?? null)
												: null,
											estimatedTaxDue: taxRaw
												? (parseCOPInput(taxRaw) ?? null)
												: null,
										});
									} finally {
										setSaving(false);
									}
								}}
							>
								{saving ? "Guardando…" : "Guardar estimados"}
							</Button>
						</div>
					) : (
						<div className="tax-summary__row">
							<span>Estimados guardados</span>
							<span>
								{estimatedTaxableIncome != null
									? formatCOP(estimatedTaxableIncome)
									: "—"}{" "}
								/ {estimatedTaxDue != null ? formatCOP(estimatedTaxDue) : "—"}
							</span>
						</div>
					)}
				</div>
			) : null}
		</section>
	);
}
