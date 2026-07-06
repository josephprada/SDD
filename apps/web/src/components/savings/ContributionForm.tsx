import { CurrencyInput } from "@app/components/ui/CurrencyInput";
import { FieldError } from "@app/components/ui/FieldError";
import { FormModalFooter } from "@app/components/ui/FormModalFooter";
import { FormSelect } from "@app/components/ui/FormSelect";
import { parseCOPInput } from "@app/lib/format/currency";
import { toDateInputValue } from "@app/lib/format/date";
import type { Id } from "@convex/_generated/dataModel";
import { Input } from "@jp-ds";
import { useState } from "react";

type AccountOption = {
	_id: Id<"accounts">;
	name: string;
};

type ContributionFormProps = {
	accounts: AccountOption[];
	destinationAccountId?: Id<"accounts">;
	destinationAccountName?: string;
	onSubmit: (values: {
		amount: number;
		contributedAt: number;
		fromAccountId?: Id<"accounts">;
		notes?: string;
	}) => Promise<void>;
	onCancel: () => void;
	loading?: boolean;
	error?: string;
	suggestAbono?: boolean;
};

const SOURCE_ACCOUNT_HINT =
	"El aporte se registrará como transferencia desde esta cuenta hacia la cuenta destino de la meta.";

export function ContributionForm({
	accounts,
	destinationAccountId,
	destinationAccountName,
	onSubmit,
	onCancel,
	loading,
	error,
	suggestAbono,
}: ContributionFormProps) {
	const sourceAccounts = destinationAccountId
		? accounts.filter((account) => account._id !== destinationAccountId)
		: accounts;
	const [amountRaw, setAmountRaw] = useState("");
	const [contributedAt, setContributedAt] = useState(
		toDateInputValue(Date.now()),
	);
	const [fromAccountId, setFromAccountId] = useState<Id<"accounts"> | "">(
		sourceAccounts[0]?._id ?? "",
	);
	const [notes, setNotes] = useState("");
	const [fieldError, setFieldError] = useState("");

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setFieldError("");
		const amount = parseCOPInput(amountRaw);
		if (amount === null || amount <= 0) return;

		if (destinationAccountId && !fromAccountId) {
			setFieldError("Selecciona la cuenta origen del aporte");
			return;
		}

		await onSubmit({
			amount,
			contributedAt: new Date(contributedAt).getTime(),
			fromAccountId: destinationAccountId
				? (fromAccountId as Id<"accounts">)
				: undefined,
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
			{destinationAccountId ? (
				<p className="tx-form__hint">
					Destino: <strong>{destinationAccountName ?? "Cuenta destino"}</strong>.
					Se creará una transferencia entre cuentas.
				</p>
			) : (
				<p className="tx-form__hint">
					Esta meta no tiene cuenta destino. El aporte solo actualizará el
					progreso de la meta.
				</p>
			)}
			{destinationAccountId ? (
				<FormSelect
					id="contribution-source-account"
					label="Cuenta origen"
					value={fromAccountId}
					hint={SOURCE_ACCOUNT_HINT}
					onChange={(value) => setFromAccountId(value as Id<"accounts"> | "")}
					required
				>
					<option value="">— Seleccionar cuenta —</option>
					{sourceAccounts.map((account) => (
						<option key={account._id} value={account._id}>
							{account.name}
						</option>
					))}
				</FormSelect>
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
			<FieldError message={fieldError || error} />
			<FormModalFooter
				onCancel={onCancel}
				loading={loading}
				submitLabel="Registrar aporte"
			/>
		</form>
	);
}
