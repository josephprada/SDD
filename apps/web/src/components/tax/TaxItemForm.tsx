import { CurrencyInput } from "@app/components/ui/CurrencyInput";
import { FieldError } from "@app/components/ui/FieldError";
import { FormModalFooter } from "@app/components/ui/FormModalFooter";
import { FormSelect } from "@app/components/ui/FormSelect";
import { parseCOPInput } from "@app/lib/format/currency";
import {
	TAX_CATEGORIES,
	TAX_CATEGORY_LABELS,
	TAX_SECTION_LABELS,
} from "@app/lib/tax/categories";
import type { TaxSection } from "@app/lib/tax/types";
import { Button, Input } from "@jp-ds";
import { type ReactNode, useState } from "react";

export type TaxItemFormValues = {
	section: TaxSection;
	category: string;
	description: string;
	amount: number;
	notes?: string;
};

type TaxItemFormProps = {
	initial?: Partial<TaxItemFormValues> & { section?: TaxSection };
	fixedSection?: TaxSection;
	error?: string;
	readOnly?: boolean;
	submitLabel?: string;
	/** Contenido extra antes del footer (p. ej. adjuntos). */
	extra?: ReactNode;
	onCancel: () => void;
	onSubmit: (values: TaxItemFormValues) => Promise<void>;
	onDelete?: () => Promise<void>;
};

export function TaxItemForm({
	initial,
	fixedSection,
	error,
	readOnly,
	submitLabel = "Guardar",
	extra,
	onCancel,
	onSubmit,
	onDelete,
}: TaxItemFormProps) {
	const section = fixedSection ?? initial?.section ?? "income";
	const [category, setCategory] = useState(
		initial?.category ?? TAX_CATEGORIES[section][0],
	);
	const [description, setDescription] = useState(initial?.description ?? "");
	const [amountRaw, setAmountRaw] = useState(
		initial?.amount != null ? String(initial.amount) : "",
	);
	const [notes, setNotes] = useState(initial?.notes ?? "");
	const [localError, setLocalError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const categories = TAX_CATEGORIES[section];

	return (
		<form
			className="modal-form"
			onSubmit={async (e) => {
				e.preventDefault();
				if (readOnly) return;
				const amount = parseCOPInput(amountRaw);
				if (amount == null || amount <= 0) {
					setLocalError("El monto debe ser mayor que cero");
					return;
				}
				setLocalError("");
				setSubmitting(true);
				try {
					await onSubmit({
						section,
						category,
						description,
						amount,
						notes: notes.trim() || undefined,
					});
				} finally {
					setSubmitting(false);
				}
			}}
		>
			<p className="tax-item__meta">Sección: {TAX_SECTION_LABELS[section]}</p>
			<FormSelect
				label="Categoría"
				id="tax-item-category"
				value={category}
				onChange={setCategory}
				placeholder={false}
				disabled={readOnly}
			>
				{categories.map((key) => (
					<option key={key} value={key}>
						{TAX_CATEGORY_LABELS[key] ?? key}
					</option>
				))}
			</FormSelect>
			<Input
				label="Descripción"
				value={description}
				onChange={(e) => setDescription(e.target.value)}
				required
				disabled={readOnly}
				maxLength={200}
			/>
			<CurrencyInput
				label="Monto (COP)"
				value={amountRaw}
				onChange={setAmountRaw}
				required
				disabled={readOnly}
			/>
			<Input
				label="Notas (opcional)"
				value={notes}
				onChange={(e) => setNotes(e.target.value)}
				disabled={readOnly}
				maxLength={500}
			/>
			{extra}
			<FieldError message={localError || error} />
			{readOnly ? (
				<div className="form-panel__actions modal__footer">
					<Button type="button" variant="secondary" onClick={onCancel}>
						Cerrar
					</Button>
				</div>
			) : (
				<FormModalFooter
					onCancel={onCancel}
					onDelete={
						onDelete
							? () => {
									void (async () => {
										setSubmitting(true);
										try {
											await onDelete();
										} finally {
											setSubmitting(false);
										}
									})();
								}
							: undefined
					}
					loading={submitting}
					submitLabel={submitLabel}
				/>
			)}
		</form>
	);
}
