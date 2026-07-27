import { formatCOP } from "@app/lib/format/currency";
import {
	TAX_CATEGORY_LABELS,
	TAX_SECTION_LABELS,
} from "@app/lib/tax/categories";
import type { TaxSection } from "@app/lib/tax/types";
import { Button } from "@jp-ds";
import { useMemo, useState } from "react";

export type SuggestionRow = {
	key: string;
	section: TaxSection;
	category: string;
	description: string;
	amount: number;
	sourceType: string;
	sourceId: string;
	rationale: string;
};

type TaxSuggestionsSheetProps = {
	suggestions: SuggestionRow[];
	busy?: boolean;
	onCancel: () => void;
	onAccept: (selected: SuggestionRow[]) => Promise<void>;
};

export function TaxSuggestionsSheet({
	suggestions,
	busy,
	onCancel,
	onAccept,
}: TaxSuggestionsSheetProps) {
	const [selected, setSelected] = useState<Set<string>>(
		() => new Set(suggestions.map((s) => s.key)),
	);

	const selectedRows = useMemo(
		() => suggestions.filter((s) => selected.has(s.key)),
		[suggestions, selected],
	);

	if (suggestions.length === 0) {
		return (
			<div className="modal-form">
				<p className="tax-item__meta">
					No hay sugerencias nuevas. Puedes añadir rubros manualmente.
				</p>
				<div className="form-panel__actions modal__footer">
					<Button type="button" onClick={onCancel}>
						Cerrar
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="modal-form">
			<p className="tax-item__meta">
				Selecciona las sugerencias a incorporar. Son copias editables; no se
				actualizan solas.
			</p>
			<ul className="tax-suggestions__list">
				{suggestions.map((s) => (
					<li key={s.key} className="tax-suggestions__item">
						<input
							type="checkbox"
							id={`sug-${s.key}`}
							checked={selected.has(s.key)}
							onChange={(e) => {
								setSelected((prev) => {
									const next = new Set(prev);
									if (e.target.checked) next.add(s.key);
									else next.delete(s.key);
									return next;
								});
							}}
						/>
						<label htmlFor={`sug-${s.key}`}>
							<strong>
								{TAX_SECTION_LABELS[s.section]} ·{" "}
								{TAX_CATEGORY_LABELS[s.category] ?? s.category}
							</strong>
							<span>
								{s.description} — {formatCOP(s.amount)}
							</span>
							<span className="tax-item__meta">{s.rationale}</span>
						</label>
					</li>
				))}
			</ul>
			<div className="form-panel__actions modal__footer">
				<Button type="button" variant="secondary" onClick={onCancel}>
					Descartar
				</Button>
				<Button
					type="button"
					disabled={busy || selectedRows.length === 0}
					onClick={() => onAccept(selectedRows)}
				>
					{busy ? "Aceptando…" : `Aceptar (${selectedRows.length})`}
				</Button>
			</div>
		</div>
	);
}
