import { FieldError } from "@app/components/ui/FieldError";
import { FormModalFooter } from "@app/components/ui/FormModalFooter";
import { Input } from "@jp-ds";
import { useState } from "react";

type TaxDocumentCreateFormProps = {
	error?: string;
	onCancel: () => void;
	onSubmit: (taxYear: number) => Promise<void>;
};

export function TaxDocumentCreateForm({
	error,
	onCancel,
	onSubmit,
}: TaxDocumentCreateFormProps) {
	const defaultYear = new Date().getFullYear() - 1;
	const [year, setYear] = useState(String(defaultYear));
	const [submitting, setSubmitting] = useState(false);

	return (
		<form
			className="modal-form"
			onSubmit={async (e) => {
				e.preventDefault();
				const taxYear = Number(year);
				setSubmitting(true);
				try {
					await onSubmit(taxYear);
				} finally {
					setSubmitting(false);
				}
			}}
		>
			<Input
				label="Año gravable"
				type="number"
				inputMode="numeric"
				value={year}
				onChange={(e) => setYear(e.target.value)}
				required
				min={2000}
				max={new Date().getFullYear() + 1}
			/>
			<FieldError message={error} />
			<FormModalFooter
				onCancel={onCancel}
				loading={submitting}
				submitLabel="Crear declaración"
				savingLabel="Creando…"
			/>
		</form>
	);
}
