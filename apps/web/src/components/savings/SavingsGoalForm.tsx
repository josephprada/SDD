import { CategoryChoice } from "@app/components/ui/CategoryChoice";
import { CurrencyInput } from "@app/components/ui/CurrencyInput";
import { DigitsInput } from "@app/components/ui/DigitsInput";
import { FieldError } from "@app/components/ui/FieldError";
import { FieldHelp } from "@app/components/ui/FieldHelp";
import { FormModalFooter } from "@app/components/ui/FormModalFooter";
import { FormSelect } from "@app/components/ui/FormSelect";
import { formatCOPInput, parseCOPInput } from "@app/lib/format/currency";
import { toDateInputValue } from "@app/lib/format/date";
import {
	computeMonthlySavingsAmount,
	countMonthsUntilDeadline,
} from "@app/lib/savings/computeMonthlySavings";
import type { Id } from "@convex/_generated/dataModel";
import { Checkbox, Input } from "@jp-ds";
import { useEffect, useMemo, useState } from "react";

export type SavingsGoalFormValues = {
	name: string;
	targetAmount: number;
	accountId?: Id<"accounts">;
	deadline?: number;
	linkedCreditId?: Id<"credits">;
	notes?: string;
	createFixedExpense?: {
		categoryId: Id<"categories">;
		dayOfMonth: number;
		monthlyAmount: number;
	};
};

type CategoryOption = {
	_id: Id<"categories">;
	name: string;
	icon: string;
	color: string;
};

type AccountOption = {
	_id: Id<"accounts">;
	name: string;
};

type SavingsGoalFormProps = {
	accounts: AccountOption[];
	credits: Array<{ _id: Id<"credits">; name: string }>;
	categories: CategoryOption[];
	initial?: Partial<SavingsGoalFormValues>;
	onSubmit: (values: SavingsGoalFormValues) => Promise<void>;
	onCancel: () => void;
	onDelete?: () => void;
	loading?: boolean;
	error?: string;
};

const LINK_CREDIT_HINT =
	"Acumula ahorro en esta meta para destinarlo a abonos extra a capital del crédito elegido (desde tu nómina, no del fondo del crédito).";

const FIXED_EXPENSE_HINT =
	"Crea un recordatorio mensual en Gastos fijos. Si indicas fecha límite, calculamos el monto mensual para alcanzar la meta a tiempo.";

const DESTINATION_ACCOUNT_HINT =
	"Opcional. Si la eliges, cada aporte moverá dinero desde otra cuenta hacia esta (transferencia).";

export function SavingsGoalForm({
	accounts,
	credits,
	categories,
	initial,
	onSubmit,
	onCancel,
	onDelete,
	loading,
	error,
}: SavingsGoalFormProps) {
	const isCreate = !initial;
	const [name, setName] = useState(initial?.name ?? "");
	const [targetRaw, setTargetRaw] = useState(
		initial?.targetAmount ? String(initial.targetAmount) : "",
	);
	const [deadline, setDeadline] = useState(
		initial?.deadline ? toDateInputValue(initial.deadline) : "",
	);
	const [accountId, setAccountId] = useState<Id<"accounts"> | "">(
		initial?.accountId ?? "",
	);
	const [linkCredit, setLinkCredit] = useState(Boolean(initial?.linkedCreditId));
	const [linkedCreditId, setLinkedCreditId] = useState(
		initial?.linkedCreditId ?? "",
	);
	const [createFixedExpense, setCreateFixedExpense] = useState(false);
	const [fixedCategoryId, setFixedCategoryId] = useState<Id<"categories"> | "">(
		"",
	);
	const [fixedDayOfMonth, setFixedDayOfMonth] = useState("1");
	const [fixedMonthlyRaw, setFixedMonthlyRaw] = useState("");
	const [fixedMonthlyManuallyEdited, setFixedMonthlyManuallyEdited] =
		useState(false);
	const [notes, setNotes] = useState(initial?.notes ?? "");
	const [fieldError, setFieldError] = useState("");

	const deadlineMs = deadline ? new Date(deadline).getTime() : undefined;
	const targetAmountParsed = parseCOPInput(targetRaw);

	const suggestedMonthly = useMemo(() => {
		if (
			!createFixedExpense ||
			!deadlineMs ||
			targetAmountParsed === null ||
			targetAmountParsed <= 0
		) {
			return null;
		}
		return computeMonthlySavingsAmount(targetAmountParsed, deadlineMs);
	}, [createFixedExpense, deadlineMs, targetAmountParsed]);

	const monthsUntilDeadline = useMemo(() => {
		if (!deadlineMs) return null;
		return countMonthsUntilDeadline(deadlineMs);
	}, [deadlineMs]);

	useEffect(() => {
		if (!createFixedExpense || !deadlineMs || fixedMonthlyManuallyEdited) {
			return;
		}
		if (targetAmountParsed === null || targetAmountParsed <= 0) {
			return;
		}
		setFixedMonthlyRaw(
			formatCOPInput(computeMonthlySavingsAmount(targetAmountParsed, deadlineMs)),
		);
	}, [
		createFixedExpense,
		deadlineMs,
		targetAmountParsed,
		fixedMonthlyManuallyEdited,
	]);

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setFieldError("");
		const targetAmount = parseCOPInput(targetRaw);
		if (targetAmount === null || targetAmount <= 0) return;

		if (linkCredit && !linkedCreditId) {
			setFieldError("Selecciona el crédito a vincular");
			return;
		}

		let fixedExpensePayload: SavingsGoalFormValues["createFixedExpense"];
		if (isCreate && createFixedExpense) {
			const monthlyAmount = parseCOPInput(fixedMonthlyRaw);
			const dayOfMonth = Number.parseInt(fixedDayOfMonth, 10);
			if (!fixedCategoryId) {
				setFieldError("Selecciona la categoría del gasto fijo");
				return;
			}
			if (monthlyAmount === null || monthlyAmount <= 0) {
				setFieldError("Ingresa el monto mensual del gasto fijo");
				return;
			}
			if (!Number.isFinite(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
				setFieldError("El día del mes debe estar entre 1 y 31");
				return;
			}
			fixedExpensePayload = {
				categoryId: fixedCategoryId,
				dayOfMonth,
				monthlyAmount,
			};
		}

		await onSubmit({
			name: name.trim(),
			targetAmount,
			accountId: accountId ? (accountId as Id<"accounts">) : undefined,
			deadline: deadline ? new Date(deadline).getTime() : undefined,
			linkedCreditId:
				linkCredit && linkedCreditId
					? (linkedCreditId as Id<"credits">)
					: undefined,
			notes: notes.trim() || undefined,
			createFixedExpense: fixedExpensePayload,
		});
	};

	return (
		<form className="tx-form tx-form--modal" onSubmit={handleSubmit} noValidate>
			<div className="tx-form__scroll brand-scroll">
				<Input
					label="Nombre meta"
					value={name}
					onChange={(e) => setName(e.target.value)}
					required
				/>
				<CurrencyInput
					label="Monto objetivo (COP)"
					value={targetRaw}
					onChange={(value) => {
						setTargetRaw(value);
						setFixedMonthlyManuallyEdited(false);
					}}
					required
				/>
				<Input
					label="Fecha límite (opcional)"
					type="date"
					value={deadline}
					onChange={(e) => {
						setDeadline(e.target.value);
						setFixedMonthlyManuallyEdited(false);
					}}
				/>
				<FormSelect
					id="savings-destination-account"
					label="Cuenta destino (opcional)"
					value={accountId}
					hint={DESTINATION_ACCOUNT_HINT}
					placeholder="Sin cuenta destino"
					onChange={(value) => setAccountId(value as Id<"accounts"> | "")}
				>
					{accounts.map((account) => (
						<option key={account._id} value={account._id}>
							{account.name}
						</option>
					))}
				</FormSelect>

				<div className="credit-form-check">
					<Checkbox
						label="Vincular a abono a capital de un crédito"
						checked={linkCredit}
						onChange={setLinkCredit}
					/>
				</div>
				{linkCredit ? (
					<FormSelect
						id="savings-linked-credit"
						label="Crédito"
						value={linkedCreditId}
						hint={LINK_CREDIT_HINT}
						placeholder="Seleccionar crédito"
						onChange={setLinkedCreditId}
					>
						{credits.map((c) => (
							<option key={c._id} value={c._id}>
								{c.name}
							</option>
						))}
					</FormSelect>
				) : null}

				{isCreate ? (
					<>
						<div className="field-label-row credit-form-check">
							<Checkbox
								label="Crear gasto fijo mensual relacionado"
								checked={createFixedExpense}
								onChange={(checked) => {
									setCreateFixedExpense(checked);
									if (checked) {
										setFixedMonthlyManuallyEdited(false);
									}
								}}
							/>
							<FieldHelp text={FIXED_EXPENSE_HINT} />
						</div>
						{createFixedExpense ? (
							<div className="savings-goal-fixed-fields">
								<CategoryChoice
									categories={categories}
									value={fixedCategoryId}
									onChange={setFixedCategoryId}
								/>
								<DigitsInput
									label="Día de pago (1–31)"
									value={fixedDayOfMonth}
									onChange={setFixedDayOfMonth}
									maxLength={2}
								/>
								<CurrencyInput
									label="Monto mensual a apartar (COP)"
									value={fixedMonthlyRaw}
									onChange={(value) => {
										setFixedMonthlyManuallyEdited(true);
										setFixedMonthlyRaw(value);
									}}
									required
								/>
								{suggestedMonthly !== null && monthsUntilDeadline !== null ? (
									<p className="credit-form-field-hint">
										{fixedMonthlyManuallyEdited
											? `Sugerido para ${monthsUntilDeadline} mes${monthsUntilDeadline === 1 ? "" : "es"}: ${formatCOPInput(suggestedMonthly)}`
											: `Calculado para alcanzar la meta en ${monthsUntilDeadline} mes${monthsUntilDeadline === 1 ? "" : "es"}. Puedes ajustarlo si lo necesitas.`}
									</p>
								) : (
									<p className="credit-form-field-hint">
										Agrega una fecha límite para calcular el monto mensual
										automáticamente, o ingrésalo manualmente.
									</p>
								)}
							</div>
						) : null}
					</>
				) : null}

				<Input
					label="Notas"
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
				/>
				<FieldError message={fieldError || error} />
			</div>
			<FormModalFooter
				onCancel={onCancel}
				onDelete={onDelete}
				loading={loading}
				submitLabel="Guardar meta"
			/>
		</form>
	);
}
