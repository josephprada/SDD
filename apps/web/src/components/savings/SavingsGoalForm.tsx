import { CurrencyInput } from "@app/components/ui/CurrencyInput";
import { FieldError } from "@app/components/ui/FieldError";
import { FormModalFooter } from "@app/components/ui/FormModalFooter";
import { FormSelect } from "@app/components/ui/FormSelect";
import { parseCOPInput } from "@app/lib/format/currency";
import { toDateInputValue } from "@app/lib/format/date";
import type { Id } from "@convex/_generated/dataModel";
import { Input } from "@jp-ds";
import { useState } from "react";

export type SavingsGoalFormValues = {
	name: string;
	targetAmount: number;
	deadline?: number;
	linkedCreditId?: Id<"credits">;
	notes?: string;
};

type SavingsGoalFormProps = {
	credits: Array<{ _id: Id<"credits">; name: string }>;
	initial?: Partial<SavingsGoalFormValues>;
	onSubmit: (values: SavingsGoalFormValues) => Promise<void>;
	onCancel: () => void;
	loading?: boolean;
	error?: string;
};

export function SavingsGoalForm({
	credits,
	initial,
	onSubmit,
	onCancel,
	loading,
	error,
}: SavingsGoalFormProps) {
	const [name, setName] = useState(initial?.name ?? "");
	const [targetRaw, setTargetRaw] = useState(
		initial?.targetAmount ? String(initial.targetAmount) : "",
	);
	const [deadline, setDeadline] = useState(
		initial?.deadline ? toDateInputValue(initial.deadline) : "",
	);
	const [linkedCreditId, setLinkedCreditId] = useState(
		initial?.linkedCreditId ?? "",
	);
	const [notes, setNotes] = useState(initial?.notes ?? "");

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		const targetAmount = parseCOPInput(targetRaw);
		if (targetAmount === null || targetAmount <= 0) return;
		await onSubmit({
			name: name.trim(),
			targetAmount,
			deadline: deadline ? new Date(deadline).getTime() : undefined,
			linkedCreditId: linkedCreditId
				? (linkedCreditId as Id<"credits">)
				: undefined,
			notes: notes.trim() || undefined,
		});
	};

	return (
		<form className="modal-form" onSubmit={handleSubmit} noValidate>
			<Input
				label="Nombre meta"
				value={name}
				onChange={(e) => setName(e.target.value)}
				required
			/>
			<CurrencyInput
				label="Monto objetivo (COP)"
				value={targetRaw}
				onChange={setTargetRaw}
				required
			/>
			<Input
				label="Fecha límite (opcional)"
				type="date"
				value={deadline}
				onChange={(e) => setDeadline(e.target.value)}
			/>
			<FormSelect
				id="savings-linked-credit"
				label="Crédito vinculado (abono anual)"
				value={linkedCreditId}
				onChange={setLinkedCreditId}
			>
				<option value="">— Ninguno —</option>
				{credits.map((c) => (
					<option key={c._id} value={c._id}>
						{c.name}
					</option>
				))}
			</FormSelect>
			<Input
				label="Notas"
				value={notes}
				onChange={(e) => setNotes(e.target.value)}
			/>
			<FieldError message={error} />
			<FormModalFooter
				onCancel={onCancel}
				loading={loading}
				submitLabel="Guardar meta"
			/>
		</form>
	);
}
