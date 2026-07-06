import { CurrencyInput } from "@app/components/ui/CurrencyInput";
import { FieldError } from "@app/components/ui/FieldError";
import { FormModalFooter } from "@app/components/ui/FormModalFooter";
import { parseCOPInput } from "@app/lib/format/currency";
import { toDateInputValue } from "@app/lib/format/date";
import { Input } from "@jp-ds";
import { useState } from "react";

type ContributionFormProps = {
	onSubmit: (values: {
		amount: number;
		contributedAt: number;
		notes?: string;
	}) => Promise<void>;
	onCancel: () => void;
	loading?: boolean;
	error?: string;
	suggestAbono?: boolean;
	linkedCreditId?: string;
};

export function ContributionForm({
	onSubmit,
	onCancel,
	loading,
	error,
	suggestAbono,
}: ContributionFormProps) {
	const [amountRaw, setAmountRaw] = useState("");
	const [contributedAt, setContributedAt] = useState(
		toDateInputValue(Date.now()),
	);
	const [notes, setNotes] = useState("");

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		const amount = parseCOPInput(amountRaw);
		if (amount === null || amount <= 0) return;
		await onSubmit({
			amount,
			contributedAt: new Date(contributedAt).getTime(),
			notes: notes.trim() || undefined,
		});
	};

	return (
		<form className="modal-form" onSubmit={handleSubmit} noValidate>
			{suggestAbono ? (
				<p className="credit-warn" role="status">
					¡Meta alcanzada o umbral anual! Considera registrar un abono a capital
					en el crédito vinculado.
				</p>
			) : null}
			<CurrencyInput
				label="Monto aporte (COP)"
				value={amountRaw}
				onChange={setAmountRaw}
				required
			/>
			<Input
				label="Fecha"
				type="date"
				value={contributedAt}
				onChange={(e) => setContributedAt(e.target.value)}
				required
			/>
			<Input
				label="Notas"
				value={notes}
				onChange={(e) => setNotes(e.target.value)}
			/>
			<FieldError message={error} />
			<FormModalFooter
				onCancel={onCancel}
				loading={loading}
				submitLabel="Registrar aporte"
			/>
		</form>
	);
}
