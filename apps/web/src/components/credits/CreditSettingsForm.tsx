import {
	CREDIT_SETTINGS_SUMMARY_HINT,
	DELETE_CREDIT_HINT,
	FUND_EXPENSE_CATEGORY_HINT,
	FUND_ACCOUNT_HINT,
	FUND_ACCOUNT_LABEL,
	OPERATING_ACCOUNT_HINT,
	OPERATING_ACCOUNT_LABEL,
	RATE_TYPE_OPTIONS,
	RECALC_EFFECT_OPTIONS,
	RECALC_EFFECT_LABELS,
	SCHEDULE_MODE_LABELS,
	TARGET_PAYOFF_HINT,
	type AbonoRecalcEffect,
	type RateType,
} from "@app/lib/credits/types";
import {
	FundExpenseCategoryPicker,
	type FundExpenseCategorySelection,
} from "@app/components/credits/FundExpenseCategoryPicker";
import { FieldError } from "@app/components/ui/FieldError";
import { FieldHelp } from "@app/components/ui/FieldHelp";
import { FormSelect } from "@app/components/ui/FormSelect";
import { formatCOP } from "@app/lib/format/currency";
import { formatFullDate, toDateInputValue } from "@app/lib/format/date";
import type { Id } from "@convex/_generated/dataModel";
import { Button, Input } from "@jp-ds";
import { useMemo, useState } from "react";

export type CreditEditValues = {
	name: string;
	lender: string;
	notes?: string;
	targetPayoffDate?: number;
	defaultRecalcOnAbono: AbonoRecalcEffect;
	disbursementAccountId?: Id<"accounts">;
	operatingAccountId?: Id<"accounts">;
	fundExpenseCategoryIds: Id<"categories">[];
	newFundExpenseCategoryNames: string[];
};

type CreditSettingsFormProps = {
	credit: {
		name: string;
		lender: string;
		notes?: string;
		targetPayoffDate?: number;
		defaultRecalcOnAbono: AbonoRecalcEffect;
		disbursementAccountId?: Id<"accounts">;
		operatingAccountId?: Id<"accounts">;
		fundExpenseCategories: Array<{ _id: Id<"categories">; name: string }>;
		principal: number;
		outstandingBalance: number;
		rateType: RateType;
		interestRate: number;
		termMonths: number;
		scheduleMode: string;
		startDate: number;
	};
	accounts: Array<{ _id: Id<"accounts">; name: string }>;
	expenseCategories: Array<{ _id: Id<"categories">; name: string }>;
	onSave: (values: CreditEditValues) => Promise<void>;
	onDelete: () => Promise<void>;
	loading?: boolean;
	deleteLoading?: boolean;
	error?: string;
};

export function CreditSettingsForm({
	credit,
	accounts,
	expenseCategories,
	onSave,
	onDelete,
	loading,
	deleteLoading,
	error,
}: CreditSettingsFormProps) {
	const [name, setName] = useState(credit.name);
	const [lender, setLender] = useState(credit.lender);
	const [notes, setNotes] = useState(credit.notes ?? "");
	const [targetDate, setTargetDate] = useState(
		credit.targetPayoffDate
			? toDateInputValue(credit.targetPayoffDate)
			: "",
	);
	const [recalcEffect, setRecalcEffect] = useState(
		credit.defaultRecalcOnAbono,
	);
	const [fundAccountId, setFundAccountId] = useState(
		credit.disbursementAccountId ?? "",
	);
	const [operatingAccountId, setOperatingAccountId] = useState(
		credit.operatingAccountId ?? "",
	);
	const [fundCategories, setFundCategories] =
		useState<FundExpenseCategorySelection>({
			selectedIds: credit.fundExpenseCategories.map((c) => c._id),
			newNames: [],
		});
	const [confirmDelete, setConfirmDelete] = useState(false);

	const recalcHint = useMemo(() => {
		const selected = RECALC_EFFECT_OPTIONS.find(
			(option) => option.value === recalcEffect,
		);
		if (selected) {
			return `${selected.hint} Actual: ${RECALC_EFFECT_LABELS[recalcEffect]}.`;
		}
		return "Elige qué hacer con las cuotas cuando registres un abono extra.";
	}, [recalcEffect]);

	const availableFundCategories = [
		...expenseCategories,
		...credit.fundExpenseCategories.filter(
			(c) => !expenseCategories.some((item) => item._id === c._id),
		),
	];

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		await onSave({
			name: name.trim(),
			lender: lender.trim(),
			notes: notes.trim() || undefined,
			targetPayoffDate: targetDate
				? new Date(targetDate).getTime()
				: undefined,
			defaultRecalcOnAbono: recalcEffect,
			disbursementAccountId: fundAccountId
				? (fundAccountId as Id<"accounts">)
				: undefined,
			operatingAccountId: operatingAccountId
				? (operatingAccountId as Id<"accounts">)
				: undefined,
			fundExpenseCategoryIds: fundCategories.selectedIds,
			newFundExpenseCategoryNames: fundCategories.newNames,
		});
	};

	return (
		<div className="credit-tab-panel">
			<section className="credit-panel-form glass">
				<div className="field-label-row credit-form-grid__full">
					<h3 className="section-title">Datos del crédito</h3>
					<FieldHelp text={CREDIT_SETTINGS_SUMMARY_HINT} />
				</div>

				<dl className="credit-readonly-grid">
					<div>
						<dt>Desembolso</dt>
						<dd>{formatCOP(credit.principal)}</dd>
					</div>
					<div>
						<dt>Saldo actual</dt>
						<dd>{formatCOP(credit.outstandingBalance)}</dd>
					</div>
					<div>
						<dt>Tasa</dt>
						<dd>
							{credit.interestRate}%{" "}
							{RATE_TYPE_OPTIONS.find((o) => o.value === credit.rateType)
								?.label ?? credit.rateType}
						</dd>
					</div>
					<div>
						<dt>Plazo</dt>
						<dd>{credit.termMonths} meses</dd>
					</div>
					<div>
						<dt>Forma de cuotas</dt>
						<dd>
							{SCHEDULE_MODE_LABELS[
								credit.scheduleMode as keyof typeof SCHEDULE_MODE_LABELS
							] ?? credit.scheduleMode}
						</dd>
					</div>
					<div>
						<dt>Inicio</dt>
						<dd>{formatFullDate(credit.startDate)}</dd>
					</div>
				</dl>
			</section>

			<form
				className="credit-panel-form glass"
				onSubmit={handleSubmit}
				noValidate
			>
				<h3 className="section-title">Editar configuración</h3>
				<div className="credit-form-grid credit-form-grid--single">
					<Input
						label="Nombre del crédito"
						value={name}
						onChange={(e) => setName(e.target.value)}
						required
					/>
					<Input
						label="Prestamista"
						value={lender}
						onChange={(e) => setLender(e.target.value)}
						required
					/>
					<div>
						<div className="field-label-row">
							<label className="jp-input-label" htmlFor="edit-target-payoff">
								Meta de pago (opcional)
							</label>
							<FieldHelp text={TARGET_PAYOFF_HINT} />
						</div>
						<Input
							id="edit-target-payoff"
							type="date"
							value={targetDate}
							onChange={(e) => setTargetDate(e.target.value)}
						/>
					</div>
					<FormSelect
						id="edit-recalc-effect"
						label="Preferencia en abonos extra"
						value={recalcEffect}
						hint={recalcHint}
						placeholder={false}
						onChange={(v) => setRecalcEffect(v as AbonoRecalcEffect)}
					>
						{RECALC_EFFECT_OPTIONS.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</FormSelect>

					<FormSelect
						id="edit-fund-account"
						label={FUND_ACCOUNT_LABEL}
						value={fundAccountId}
						hint={FUND_ACCOUNT_HINT}
						placeholder="Sin cuenta vinculada"
						onChange={setFundAccountId}
					>
						{accounts.map((a) => (
							<option key={a._id} value={a._id}>
								{a.name}
							</option>
						))}
					</FormSelect>

					<FormSelect
						id="edit-operating-account"
						label={OPERATING_ACCOUNT_LABEL}
						value={operatingAccountId}
						hint={OPERATING_ACCOUNT_HINT}
						placeholder="Sin cuenta vinculada"
						onChange={setOperatingAccountId}
					>
						{accounts.map((a) => (
							<option key={a._id} value={a._id}>
								{a.name}
							</option>
						))}
					</FormSelect>

					<FundExpenseCategoryPicker
						hint={FUND_EXPENSE_CATEGORY_HINT}
						availableCategories={availableFundCategories}
						value={fundCategories}
						onChange={setFundCategories}
					/>

					<Input
						label="Notas"
						value={notes}
						onChange={(e) => setNotes(e.target.value)}
					/>

					<FieldError message={error} />

					<div className="credit-panel-form__actions">
						<Button type="submit" disabled={loading}>
							{loading ? "Guardando…" : "Guardar cambios"}
						</Button>
					</div>
				</div>
			</form>

			<section className="credit-panel-form glass credit-danger-zone">
				<div className="field-label-row">
					<h3 className="section-title">Eliminar crédito</h3>
					<FieldHelp text={DELETE_CREDIT_HINT} />
				</div>
				{!confirmDelete ? (
					<Button
						type="button"
						variant="danger"
						onClick={() => setConfirmDelete(true)}
					>
						Eliminar crédito
					</Button>
				) : (
					<div className="credit-danger-zone__confirm">
						<p>¿Seguro? Esta acción no se puede deshacer.</p>
						<div className="credit-danger-zone__actions">
							<Button
								type="button"
								variant="secondary"
								onClick={() => setConfirmDelete(false)}
							>
								Cancelar
							</Button>
							<Button
								type="button"
								variant="danger"
								disabled={deleteLoading}
								onClick={() => void onDelete()}
							>
								{deleteLoading ? "Eliminando…" : "Sí, eliminar"}
							</Button>
						</div>
					</div>
				)}
			</section>
		</div>
	);
}
