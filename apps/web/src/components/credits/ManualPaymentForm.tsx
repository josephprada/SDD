import { CurrencyInput } from "@app/components/ui/CurrencyInput";
import { FieldError } from "@app/components/ui/FieldError";
import { FormModalFooter } from "@app/components/ui/FormModalFooter";
import { parseCOPInput } from "@app/lib/format/currency";
import type { Id } from "@convex/_generated/dataModel";
import { useState } from "react";

export type ManualPaymentBatchValues = {
	totalAmount: number;
	paymentIds: Id<"creditPayments">[];
};

type ManualPaymentFormProps = {
	paymentIds: Id<"creditPayments">[];
	onSubmit: (values: ManualPaymentBatchValues) => Promise<void>;
	onCancel: () => void;
	loading?: boolean;
	error?: string;
};

export function ManualPaymentForm({
	paymentIds,
	onSubmit,
	onCancel,
	loading,
	error,
}: ManualPaymentFormProps) {
	const [amountRaw, setAmountRaw] = useState("");
	const [clientError, setClientError] = useState("");

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setClientError("");
		const totalAmount = parseCOPInput(amountRaw);
		if (totalAmount === null || totalAmount <= 0) {
			setClientError("Ingresa un valor válido para la cuota");
			return;
		}
		if (paymentIds.length === 0) {
			setClientError("No hay cuotas seleccionadas");
			return;
		}

		await onSubmit({
			totalAmount,
			paymentIds,
		});
	};

	return (
		<form className="tx-form tx-form--modal" onSubmit={handleSubmit} noValidate>
			<div className="tx-form__scroll brand-scroll credit-form-grid credit-form-grid--single">
				<p className="tx-form__hint credit-form-grid__full">
					{paymentIds.length > 1
						? `Ingresa el valor según tu extracto. Se aplicará a las ${paymentIds.length} cuotas que seleccionaste en la tabla.`
						: "Ingresa el valor de la cuota según tu extracto."}
				</p>
				<CurrencyInput
					label="Valor de la cuota (COP)"
					value={amountRaw}
					onChange={setAmountRaw}
					required
				/>

				<div className="credit-form-grid__full">
					<FieldError message={clientError || error} />
				</div>
			</div>
			<FormModalFooter
				onCancel={onCancel}
				loading={loading}
				submitDisabled={paymentIds.length === 0}
				submitLabel={
					paymentIds.length > 1
						? `Guardar en ${paymentIds.length} cuotas`
						: "Guardar valor"
				}
			/>
		</form>
	);
}
