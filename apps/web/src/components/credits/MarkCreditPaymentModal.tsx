import { FieldError } from "@app/components/ui/FieldError";
import { Modal } from "@app/components/ui/Modal";
import {
	listPayableInstallments,
	pickDefaultPayableInstallment,
} from "@app/lib/credits/payments";
import { formatCOP } from "@app/lib/format/currency";
import { formatShortDate } from "@app/lib/format/date";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@jp-ds";
import { useEffect, useMemo, useState } from "react";

type PaymentOption = {
	_id: Id<"creditPayments">;
	installmentNumber: number;
	dueDate: number;
	totalDue: number;
	status: "pending" | "paid" | "overdue" | "cancelled";
};

type MarkCreditPaymentModalProps = {
	open: boolean;
	creditName: string;
	paymentAccountName?: string;
	payments: PaymentOption[];
	initialPaymentId?: Id<"creditPayments">;
	loading?: boolean;
	error?: string;
	onClose: () => void;
	onConfirm: (paymentId: Id<"creditPayments">) => void;
};

export function MarkCreditPaymentModal({
	open,
	creditName,
	paymentAccountName,
	payments,
	initialPaymentId,
	loading,
	error,
	onClose,
	onConfirm,
}: MarkCreditPaymentModalProps) {
	const payable = useMemo(() => listPayableInstallments(payments), [payments]);
	const defaultPayment = useMemo(
		() => pickDefaultPayableInstallment(payments),
		[payments],
	);
	const [paymentId, setPaymentId] = useState<Id<"creditPayments"> | "">("");

	useEffect(() => {
		if (!open) return;
		if (
			initialPaymentId &&
			payable.some((p) => p._id === initialPaymentId)
		) {
			setPaymentId(initialPaymentId);
			return;
		}
		setPaymentId(defaultPayment?._id ?? "");
	}, [open, initialPaymentId, defaultPayment?._id, payable]);

	const selected = payable.find((p) => p._id === paymentId);

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		if (!paymentId) return;
		onConfirm(paymentId);
	};

	return (
		<Modal open={open} onClose={onClose} title="Registrar pago de cuota">
			<form className="tx-form tx-form--modal" onSubmit={handleSubmit} noValidate>
				<div className="tx-form__scroll brand-scroll credit-form-grid credit-form-grid--single">
					<p className="tx-form__hint credit-form-grid__full">
						Se registrará un gasto en{" "}
						<strong>{paymentAccountName ?? "la cuenta de pago"}</strong>{" "}
						por la cuota del crédito <strong>{creditName}</strong>.
					</p>

					<label className="jp-input-label" htmlFor="credit-pay-installment">
						Cuota a pagar
					</label>
					<select
						id="credit-pay-installment"
						className="jp-input credit-form-grid__full"
						value={paymentId}
						onChange={(event) =>
							setPaymentId(event.target.value as Id<"creditPayments">)
						}
						required
					>
						{payable.length === 0 ? (
							<option value="">No hay cuotas pendientes</option>
						) : (
							payable.map((payment) => (
								<option key={payment._id} value={payment._id}>
									#{payment.installmentNumber} — vence{" "}
									{formatShortDate(payment.dueDate)} —{" "}
									{payment.totalDue > 0
										? formatCOP(payment.totalDue)
										: "Sin valor definido"}
								</option>
							))
						)}
					</select>

					{selected ? (
						<p className="tx-form__hint credit-form-grid__full">
							Monto a registrar:{" "}
							<strong>
								{selected.totalDue > 0
									? formatCOP(selected.totalDue)
									: "Define el valor de la cuota antes de pagar"}
							</strong>
						</p>
					) : null}

					<div className="credit-form-grid__full">
						<FieldError message={error} />
					</div>
				</div>
				<div className="form-panel__actions modal__footer">
					<Button type="button" variant="secondary" onClick={onClose}>
						Cancelar
					</Button>
					<Button
						type="submit"
						disabled={
							loading ||
							!paymentId ||
							!selected ||
							selected.totalDue <= 0
						}
					>
						{loading ? "Registrando…" : "Confirmar pago"}
					</Button>
				</div>
			</form>
		</Modal>
	);
}
