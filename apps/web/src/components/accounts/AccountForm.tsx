import { CurrencyInput } from "@app/components/ui/CurrencyInput";
import { FieldError } from "@app/components/ui/FieldError";
import { FormModalFooter } from "@app/components/ui/FormModalFooter";
import { ACCOUNT_TYPE_LABELS } from "@app/lib/core/icons";
import type { AccountFormValues, AccountType } from "@app/lib/core/types";
import {
	formatCOPInput,
	formatCOPInputFromRaw,
	parseCOPInput,
} from "@app/lib/format/currency";
import { Checkbox, Input } from "@jp-ds";
import { useId, useState } from "react";

type AccountFormProps = {
	initial?: Partial<AccountFormValues>;
	isEdit?: boolean;
	loading?: boolean;
	onSubmit: (values: {
		name: string;
		type: AccountType;
		initialBalance?: number;
		excludeFromPersonalFinance: boolean;
	}) => void;
	onCancel: () => void;
	onDelete?: () => void;
	deleteLabel?: string;
};

const defaultValues: AccountFormValues = {
	name: "",
	type: "cash",
	initialBalance: formatCOPInput(0),
	excludeFromPersonalFinance: false,
};

export function AccountForm({
	initial,
	isEdit = false,
	loading = false,
	onSubmit,
	onCancel,
	onDelete,
	deleteLabel = "Archivar",
}: AccountFormProps) {
	const [values, setValues] = useState<AccountFormValues>(() => ({
		...defaultValues,
		...initial,
		initialBalance:
			initial?.initialBalance !== undefined
				? formatCOPInputFromRaw(initial.initialBalance)
				: defaultValues.initialBalance,
		excludeFromPersonalFinance:
			initial?.excludeFromPersonalFinance ??
			defaultValues.excludeFromPersonalFinance,
	}));
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
			onSubmit({
				name: values.name.trim(),
				type: values.type,
				excludeFromPersonalFinance: values.excludeFromPersonalFinance,
			});
			return;
		}

		const balance = parseCOPInput(values.initialBalance) ?? 0;
		onSubmit({
			name: values.name.trim(),
			type: values.type,
			initialBalance: balance,
			excludeFromPersonalFinance: values.excludeFromPersonalFinance,
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
					<CurrencyInput
						label="Saldo inicial"
						value={values.initialBalance}
						onChange={(initialBalance) =>
							setValues((v) => ({ ...v, initialBalance }))
						}
						aria-invalid={Boolean(errors.initialBalance)}
					/>
					<FieldError message={errors.initialBalance} />
				</>
			) : null}

			<div className="credit-form-check">
				<Checkbox
					label="Excluir de finanzas personales"
					checked={values.excludeFromPersonalFinance}
					onChange={(excludeFromPersonalFinance) =>
						setValues((v) => ({ ...v, excludeFromPersonalFinance }))
					}
				/>
				<p className="tx-form__hint">
					Si está activo, esta cuenta no suma al balance total ni a ingresos,
					gastos o neto del mes.
				</p>
			</div>

			<FormModalFooter
				onCancel={onCancel}
				onDelete={isEdit ? onDelete : undefined}
				deleteLabel={deleteLabel}
				loading={loading}
				submitLabel={isEdit ? "Guardar" : "Crear cuenta"}
			/>
		</form>
	);
}
