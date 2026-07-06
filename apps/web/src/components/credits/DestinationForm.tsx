import { CurrencyInput } from "@app/components/ui/CurrencyInput";
import { FieldError } from "@app/components/ui/FieldError";
import { FormModalFooter } from "@app/components/ui/FormModalFooter";
import { parseCOPInput } from "@app/lib/format/currency";
import { Input } from "@jp-ds";
import { useState } from "react";

type DestinationFormProps = {
	initial?: { name: string; amount: number; notes?: string };
	onSubmit: (values: {
		name: string;
		amount: number;
		notes?: string;
	}) => Promise<void>;
	onCancel: () => void;
	loading?: boolean;
	error?: string;
};

export function DestinationForm({
	initial,
	onSubmit,
	onCancel,
	loading,
	error,
}: DestinationFormProps) {
	const [name, setName] = useState(initial?.name ?? "");
	const [amountRaw, setAmountRaw] = useState(
		initial?.amount ? String(initial.amount) : "",
	);
	const [notes, setNotes] = useState(initial?.notes ?? "");

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		const amount = parseCOPInput(amountRaw);
		if (amount === null || amount <= 0) return;
		await onSubmit({
			name: name.trim(),
			amount,
			notes: notes.trim() || undefined,
		});
	};

	return (
		<form className="modal-form" onSubmit={handleSubmit} noValidate>
			<Input
				label="Nombre rubro"
				value={name}
				onChange={(e) => setName(e.target.value)}
				required
			/>
			<CurrencyInput
				label="Monto (COP)"
				value={amountRaw}
				onChange={setAmountRaw}
				required
			/>
			<Input
				label="Notas"
				value={notes}
				onChange={(e) => setNotes(e.target.value)}
			/>
			<FieldError message={error} />
			<FormModalFooter onCancel={onCancel} loading={loading} submitLabel="Guardar" />
		</form>
	);
}
