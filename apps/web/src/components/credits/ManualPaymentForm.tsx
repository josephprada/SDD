import { CurrencyInput } from "@app/components/ui/CurrencyInput";
import { FieldError } from "@app/components/ui/FieldError";
import { FormModalFooter } from "@app/components/ui/FormModalFooter";
import { formatShortDate } from "@app/lib/format/date";
import { parseCOPInput } from "@app/lib/format/currency";
import { useState } from "react";

export type ManualPaymentValues = {
	totalAmount: number;
};

type ManualPaymentFormProps = {
	installmentNumber: number;
	dueDate: number;
	initialTotal?: number;
	onSubmit: (values: ManualPaymentValues) => Promise<void>;
	onCancel: () => void;
	loading?: boolean;
	error?: string;
};

export function ManualPaymentForm({
	installmentNumber,
	dueDate,
	initialTotal,
	onSubmit,
	onCancel,
	loading,
	error,
}: ManualPaymentFormProps) {
	const [amountRaw, setAmountRaw] = useState(
		initialTotal && initialTotal > 0 ? String(initialTotal) : "",
	);

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		const totalAmount = parseCOPInput(amountRaw);
		if (totalAmount === null || totalAmount <= 0) return;

		await onSubmit({ totalAmount });
	};

	return (
		<form className="tx-form tx-form--modal" onSubmit={handleSubmit} noValidate>
			<div className="tx-form__scroll brand-scroll credit-form-grid credit-form-grid--single">
				<p className="tx-form__hint credit-form-grid__full">
					Cuota #{installmentNumber} — vence el{" "}
					<strong>{formatShortDate(dueDate)}</strong>. Ingresa el valor de la
					cuota según tu extracto bancario.
				</p>
				<CurrencyInput
					label="Valor de la cuota (COP)"
					value={amountRaw}
					onChange={setAmountRaw}
					required
				/>
				<div className="credit-form-grid__full">
					<FieldError message={error} />
				</div>
			</div>
			<FormModalFooter
				onCancel={onCancel}
				loading={loading}
				submitLabel="Guardar valor"
			/>
		</form>
	);
}
