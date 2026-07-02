import { FieldError } from "@app/components/ui/FieldError";
import { ACCOUNT_TYPE_LABELS } from "@app/lib/core/icons";
import type { AccountFormValues, AccountType } from "@app/lib/core/types";
import { parseCOPInput } from "@app/lib/format/currency";
import { Button, Input } from "@jp-ds";
import { useId, useState } from "react";

type AccountFormProps = {
	initial?: Partial<AccountFormValues>;
	isEdit?: boolean;
	loading?: boolean;
	onSubmit: (values: {
		name: string;
		type: AccountType;
		initialBalance?: number;
	}) => void;
	onCancel: () => void;
};

const defaultValues: AccountFormValues = {
	name: "",
	type: "cash",
	initialBalance: "0",
};

export function AccountForm({
	initial,
	isEdit = false,
	loading = false,
	onSubmit,
	onCancel,
}: AccountFormProps) {
	const [values, setValues] = useState<AccountFormValues>({
		...defaultValues,
		...initial,
	});
	const [errors, setErrors] = useState<Record<string, string>>({});
	const nameErrorId = useId();

	const validate = () => {
		const next: Record<string, string> = {};
		if (!values.name.trim()) next.name = "El nombre es obligatorio";
		if (!isEdit) {
			const balance = parseCOPInput(values.initialBalance);
			if (balance === null || balance < 0) {
				next.initialBalance = "Ingresa un saldo inicial válido";
			}
		}
		setErrors(next);
		return Object.keys(next).length === 0;
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!validate()) return;

		if (isEdit) {
			onSubmit({ name: values.name.trim(), type: values.type });
			return;
		}

		const balance = parseCOPInput(values.initialBalance) ?? 0;
		onSubmit({
			name: values.name.trim(),
			type: values.type,
			initialBalance: balance,
		});
	};

	return (
		<form className="modal-form" onSubmit={handleSubmit} noValidate>
			<Input
				label="Nombre"
				value={values.name}
				onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
				aria-describedby={errors.name ? nameErrorId : undefined}
				aria-invalid={Boolean(errors.name)}
				required
			/>
			<FieldError id={nameErrorId} message={errors.name} />

			<label className="jp-input-label" htmlFor="account-type">
				Tipo
			</label>
			<select
				id="account-type"
				className="jp-input"
				value={values.type}
				onChange={(e) =>
					setValues((v) => ({ ...v, type: e.target.value as AccountType }))
				}
			>
				{(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map((t) => (
					<option key={t} value={t}>
						{ACCOUNT_TYPE_LABELS[t]}
					</option>
				))}
			</select>

			{!isEdit ? (
				<>
					<Input
						label="Saldo inicial"
						inputMode="numeric"
						value={values.initialBalance}
						onChange={(e) =>
							setValues((v) => ({ ...v, initialBalance: e.target.value }))
						}
						aria-invalid={Boolean(errors.initialBalance)}
					/>
					<FieldError message={errors.initialBalance} />
				</>
			) : null}

			<div className="form-panel__actions">
				<Button type="button" variant="secondary" onClick={onCancel}>
					Cancelar
				</Button>
				<Button type="submit" disabled={loading}>
					{loading ? "Guardando…" : isEdit ? "Guardar" : "Crear cuenta"}
				</Button>
			</div>
		</form>
	);
}
