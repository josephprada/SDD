import type { FixedExpensePaymentTarget } from "@app/lib/budgets/fixedExpensePayment";
import { formatCOP } from "@app/lib/format/currency";
import { formatShortDate } from "@app/lib/format/date";
import { FieldError } from "@app/components/ui/FieldError";
import { Modal } from "@app/components/ui/Modal";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@jp-ds";
import { useEffect, useState } from "react";

type AccountOption = {
	_id: Id<"accounts">;
	name: string;
};

type MarkFixedExpensePaidModalProps = {
	open: boolean;
	target: FixedExpensePaymentTarget | null;
	accounts: AccountOption[];
	loading?: boolean;
	error?: string;
	onClose: () => void;
	onConfirm: (accountId: Id<"accounts">) => void;
};

export function MarkFixedExpensePaidModal({
	open,
	target,
	accounts,
	loading,
	error,
	onClose,
	onConfirm,
}: MarkFixedExpensePaidModalProps) {
	const [accountId, setAccountId] = useState<Id<"accounts"> | "">("");

	useEffect(() => {
		if (!open) return;
		setAccountId(accounts[0]?._id ?? "");
	}, [open, accounts]);

	if (!target) return null;

	const handleSubmit = (event: React.FormEvent) => {
		event.preventDefault();
		if (!accountId) return;
		onConfirm(accountId);
	};

	return (
		<Modal open={open} onClose={onClose} title="Registrar pago">
			<form className="tx-form tx-form--modal" onSubmit={handleSubmit} noValidate>
				<div className="tx-form__scroll brand-scroll">
					<p className="fixed-expense-pay__summary">
						Se creará un gasto de{" "}
						<strong>{formatCOP(target.amount)}</strong> por{" "}
						<strong>{target.name}</strong>
						{target.categoryName ? (
							<>
								{" "}
								· {target.categoryName}
							</>
						) : null}
						{target.dueDate ? (
							<>
								{" "}
								· vence {formatShortDate(target.dueDate)}
							</>
						) : null}
						.
					</p>

					<label className="jp-input-label" htmlFor="fixed-expense-pay-account">
						¿Con qué cuenta lo pagaste?
					</label>
					<select
						id="fixed-expense-pay-account"
						className="jp-input"
						value={accountId}
						onChange={(event) =>
							setAccountId(event.target.value as Id<"accounts">)
						}
						required
					>
						{accounts.length === 0 ? (
							<option value="">No hay cuentas activas</option>
						) : (
							accounts.map((account) => (
								<option key={account._id} value={account._id}>
									{account.name}
								</option>
							))
						)}
					</select>

					<FieldError message={error} />
				</div>
				<div className="form-panel__actions modal__footer">
					<Button type="button" variant="secondary" onClick={onClose}>
						Cancelar
					</Button>
					<Button type="submit" disabled={loading || !accountId}>
						{loading ? "Registrando…" : "Confirmar pago"}
					</Button>
				</div>
			</form>
		</Modal>
	);
}
