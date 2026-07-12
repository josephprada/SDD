import { CategoryChoice } from "@app/components/ui/CategoryChoice";
import { CurrencyInput } from "@app/components/ui/CurrencyInput";
import { DigitsInput } from "@app/components/ui/DigitsInput";
import { FieldError } from "@app/components/ui/FieldError";
import { FormModalFooter } from "@app/components/ui/FormModalFooter";
import { ReminderOffsetsEditor } from "@app/components/budgets/ReminderOffsetsEditor";
import { periodLabelFromKey } from "@app/lib/budgets/periodLabel";
import type { Id } from "@convex/_generated/dataModel";
import { formatCOPInput, parseCOPInput } from "@app/lib/format/currency";
import { Checkbox, Input } from "@jp-ds";
import { useState } from "react";

type CategoryOption = {
	_id: Id<"categories">;
	name: string;
	icon: string;
	color: string;
};

type FixedExpenseFormProps = {
	categories: CategoryOption[];
	periodKey?: string;
	initial?: {
		name?: string;
		amount?: number;
		categoryId?: Id<"categories">;
		dayOfMonth?: number;
		reminderOffsets?: number[];
		emailReminders?: boolean;
		pushReminders?: boolean;
		notes?: string;
		isPaidCurrentPeriod?: boolean;
		onlyPeriodKey?: string;
	};
	loading?: boolean;
	serverError?: string;
	onSubmit: (values: {
		name: string;
		amount: number;
		categoryId: Id<"categories">;
		dayOfMonth: number;
		reminderOffsets: number[];
		emailReminders: boolean;
		pushReminders: boolean;
		notes?: string;
		markAsPaid: boolean;
		singleMonthOnly: boolean;
	}) => void;
	onCancel: () => void;
	onDelete?: () => void;
};

export function FixedExpenseForm({
	categories,
	periodKey,
	initial,
	loading,
	serverError,
	onSubmit,
	onCancel,
	onDelete,
}: FixedExpenseFormProps) {
	const isCreate = !initial;
	const canEditSingleMonth =
		Boolean(periodKey) &&
		(isCreate || !initial?.onlyPeriodKey || initial.onlyPeriodKey === periodKey);
	const [name, setName] = useState(initial?.name ?? "");
	const [amountStr, setAmountStr] = useState(
		initial?.amount ? formatCOPInput(initial.amount) : "",
	);
	const [categoryId, setCategoryId] = useState<Id<"categories"> | "">(
		initial?.categoryId ?? "",
	);
	const [dayOfMonth, setDayOfMonth] = useState(
		String(initial?.dayOfMonth ?? 1),
	);
	const [reminderOffsets, setReminderOffsets] = useState<number[]>(
		initial?.reminderOffsets ?? [2, 0],
	);
	const [pushReminders, setPushReminders] = useState(
		initial?.pushReminders ?? true,
	);
	const [notes, setNotes] = useState(initial?.notes ?? "");
	const [markAsPaid, setMarkAsPaid] = useState(
		initial?.isPaidCurrentPeriod ?? false,
	);
	const [singleMonthOnly, setSingleMonthOnly] = useState(
		Boolean(initial?.onlyPeriodKey && initial.onlyPeriodKey === periodKey),
	);
	const [error, setError] = useState("");
	const periodLabel = periodKey ? periodLabelFromKey(periodKey) : "";

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const amount = parseCOPInput(amountStr);
		const day = Number.parseInt(dayOfMonth, 10);
		if (!name.trim()) {
			setError("El nombre es obligatorio");
			return;
		}
		if (!categoryId) {
			setError("Selecciona una categoría");
			return;
		}
		if (!amount || amount <= 0) {
			setError("Monto inválido");
			return;
		}
		if (day < 1 || day > 31) {
			setError("Día del mes entre 1 y 31");
			return;
		}
		if (reminderOffsets.length === 0) {
			setError("Añade al menos un recordatorio");
			return;
		}
		setError("");
		onSubmit({
			name: name.trim(),
			amount,
			categoryId,
			dayOfMonth: day,
			reminderOffsets,
			emailReminders: false,
			pushReminders,
			notes: notes.trim() || undefined,
			markAsPaid,
			singleMonthOnly: canEditSingleMonth ? singleMonthOnly : false,
		});
	};

	return (
		<form className="tx-form tx-form--modal fixed-expense-form" onSubmit={handleSubmit} noValidate>
			<div className="tx-form__scroll brand-scroll">
				<Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
				<CurrencyInput
					label="Monto (COP)"
					value={amountStr}
					onChange={setAmountStr}
				/>
				<span className="jp-input-label">Categoría</span>
				<CategoryChoice
					categories={categories}
					value={categoryId}
					onChange={setCategoryId}
				/>
				<DigitsInput
					label="Día del mes (1–31)"
					value={dayOfMonth}
					onChange={setDayOfMonth}
					maxLength={2}
				/>
				{canEditSingleMonth ? (
					<div className="fixed-expense-form__checks">
						<Checkbox
							label={`Solo para ${periodLabel}`}
							checked={singleMonthOnly}
							onChange={setSingleMonthOnly}
						/>
						{singleMonthOnly ? (
							<p className="tx-form__hint fixed-expense-form__single-month-hint">
								No se repetirá en los meses siguientes. Solo aparece en{" "}
								{periodLabel}.
							</p>
						) : null}
					</div>
				) : null}
				{initial?.onlyPeriodKey && initial.onlyPeriodKey !== periodKey ? (
					<p className="tx-form__hint">
						Este gasto aplica solo a{" "}
						<strong>{periodLabelFromKey(initial.onlyPeriodKey)}</strong>.
					</p>
				) : null}
				<ReminderOffsetsEditor
					value={reminderOffsets}
					onChange={setReminderOffsets}
				/>
				<div className="fixed-expense-form__checks">
					<Checkbox
						label="Recordatorio push"
						checked={pushReminders}
						onChange={setPushReminders}
					/>
				</div>
				<div className="fixed-expense-form__paid-row">
					<div>
						<div className="settings-row__title">Pagado este mes</div>
						<div className="settings-row__sub">
							Marca el período como pagado. Si ya existe un movimiento
							compatible, se vinculará sin crear otro.
						</div>
					</div>
					<button
						type="button"
						role="switch"
						aria-checked={markAsPaid}
						aria-label={
							markAsPaid
								? "Desmarcar como pagado este mes"
								: "Marcar como pagado este mes"
						}
						className={`toggle-switch${markAsPaid ? " toggle-switch--on" : ""}`}
						onClick={() => setMarkAsPaid((paid) => !paid)}
					>
						<span className="toggle-switch__thumb" />
					</button>
				</div>
				<Input
					label="Notas (opcional)"
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
				/>
				<FieldError message={error || serverError} />
			</div>
			<FormModalFooter
				onCancel={onCancel}
				onDelete={onDelete}
				loading={loading}
			/>
		</form>
	);
}
