import { CategoryChoice } from "@app/components/ui/CategoryChoice";
import { CurrencyInput } from "@app/components/ui/CurrencyInput";
import { FieldError } from "@app/components/ui/FieldError";
import { FormModalFooter } from "@app/components/ui/FormModalFooter";
import type { Id } from "@convex/_generated/dataModel";
import { Input } from "@jp-ds";
import { useState } from "react";
import { formatCOPInput, parseCOPInput } from "@app/lib/format/currency";

type CategoryOption = {
	_id: Id<"categories">;
	name: string;
	icon: string;
	color: string;
};

type BudgetFormProps = {
	categories: CategoryOption[];
	initial?: {
		categoryIds?: Id<"categories">[];
		amount?: number;
		notes?: string;
	};
	loading?: boolean;
	serverError?: string;
	onSubmit: (values: {
		categoryIds: Id<"categories">[];
		amount: number;
		notes?: string;
	}) => void;
	onCancel: () => void;
	onDelete?: () => void;
};

export function BudgetForm({
	categories,
	initial,
	loading,
	serverError,
	onSubmit,
	onCancel,
	onDelete,
}: BudgetFormProps) {
	const [categoryIds, setCategoryIds] = useState<Id<"categories">[]>(
		initial?.categoryIds ?? [],
	);
	const [amountStr, setAmountStr] = useState(
		initial?.amount ? formatCOPInput(initial.amount) : "",
	);
	const [notes, setNotes] = useState(initial?.notes ?? "");
	const [error, setError] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const amount = parseCOPInput(amountStr);
		if (categoryIds.length === 0) {
			setError("Selecciona al menos una categoría");
			return;
		}
		if (!amount || amount <= 0) {
			setError("Ingresa un monto válido");
			return;
		}
		setError("");
		onSubmit({
			categoryIds,
			amount,
			notes: notes.trim() || undefined,
		});
	};

	return (
		<form className="tx-form tx-form--modal" onSubmit={handleSubmit} noValidate>
			<div className="tx-form__scroll brand-scroll">
				<span className="jp-input-label">Categorías</span>
				<p className="tx-form__hint">Puedes seleccionar varias categorías</p>
				<CategoryChoice
					multiple
					categories={categories}
					value={categoryIds}
					onChange={setCategoryIds}
				/>
				<CurrencyInput
					label="Límite mensual (COP)"
					value={amountStr}
					onChange={setAmountStr}
					required
				/>
				<Input
					label="Notas (opcional)"
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
				/>
				<FieldError message={error || serverError} />
			</div>
			<FormModalFooter
				onCancel={onCancel}
				onDelete={onDelete}
				loading={loading}
			/>
		</form>
	);
}
