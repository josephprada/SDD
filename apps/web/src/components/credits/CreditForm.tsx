import {
	DISBURSEMENT_ACCOUNT_HINT,
	DISBURSEMENT_ACCOUNT_LABEL,
	FUND_EXPENSE_CATEGORY_HINT,
	PAYMENT_ACCOUNT_HINT,
	PAYMENT_ACCOUNT_LABEL,
	RATE_TYPE_OPTIONS,
	SCHEDULE_MODE_OPTIONS,
	type RateType,
	type ScheduleMode,
} from "@app/lib/credits/types";
import { CurrencyInput } from "@app/components/ui/CurrencyInput";
import { FieldError } from "@app/components/ui/FieldError";
import { FormModalFooter } from "@app/components/ui/FormModalFooter";
import { FormSelect } from "@app/components/ui/FormSelect";
import {
	FundExpenseCategoryPicker,
	type FundExpenseCategorySelection,
} from "@app/components/credits/FundExpenseCategoryPicker";
import { parseCOPInput } from "@app/lib/format/currency";
import type { Id } from "@convex/_generated/dataModel";
import { Checkbox, Input } from "@jp-ds";
import { useMemo, useState } from "react";

export type CreditFormValues = {
	name: string;
	lender: string;
	principal: number;
	rateType: RateType;
	interestRate: number;
	termMonths: number;
	startDate: number;
	paymentDay: number;
	scheduleMode: ScheduleMode;
	fixedInstallment?: number;
	insuranceMonthly?: number;
	disbursementAccountId: Id<"accounts">;
	paymentAccountId: Id<"accounts">;
	registerDisbursementIncome?: boolean;
	fundExpenseCategoryIds: Id<"categories">[];
	newFundExpenseCategoryNames: string[];
	notes?: string;
};

type CreditFormProps = {
	accounts: Array<{ _id: Id<"accounts">; name: string }>;
	expenseCategories: Array<{ _id: Id<"categories">; name: string }>;
	onSubmit: (values: CreditFormValues) => Promise<void>;
	onCancel: () => void;
	loading?: boolean;
	error?: string;
};

export function CreditForm({
	accounts,
	expenseCategories,
	onSubmit,
	onCancel,
	loading,
	error,
}: CreditFormProps) {
	const [name, setName] = useState("");
	const [lender, setLender] = useState("");
	const [principalRaw, setPrincipalRaw] = useState("");
	const [rateType, setRateType] = useState<RateType | "">("");
	const [interestRate, setInterestRate] = useState("");
	const [termMonths, setTermMonths] = useState("");
	const [startDate, setStartDate] = useState("");
	const [paymentDay, setPaymentDay] = useState("");
	const [scheduleMode, setScheduleMode] = useState<ScheduleMode | "">("");
	const [fixedInstallmentRaw, setFixedInstallmentRaw] = useState("");
	const [insuranceRaw, setInsuranceRaw] = useState("");
	const [disbursementAccountId, setDisbursementAccountId] = useState("");
	const [paymentAccountId, setPaymentAccountId] = useState("");
	const [registerDisbursementIncome, setRegisterDisbursementIncome] =
		useState(false);
	const [fundCategories, setFundCategories] =
		useState<FundExpenseCategorySelection>({
			selectedIds: [],
			newNames: [],
		});
	const [fundCategoryError, setFundCategoryError] = useState("");
	const [notes, setNotes] = useState("");

	const rateHint = useMemo(() => {
		if (rateType) {
			return (
				RATE_TYPE_OPTIONS.find((o) => o.value === rateType)?.hint ?? ""
			);
		}
		return "Selecciona un tipo para ver cómo debes ingresar el valor de la tasa.";
	}, [rateType]);
	const scheduleHint = useMemo(() => {
		if (scheduleMode) {
			return (
				SCHEDULE_MODE_OPTIONS.find((o) => o.value === scheduleMode)?.hint ??
				""
			);
		}
		return "Elige cómo se calculan o registran las cuotas de este crédito.";
	}, [scheduleMode]);
	const rateValueLabel = useMemo(() => {
		if (rateType === "MV") return "Valor de la tasa (% mensual)";
		if (rateType === "EA" || rateType === "NAMV") {
			return "Valor de la tasa (% anual)";
		}
		return "Valor de la tasa (%)";
	}, [rateType]);

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		const principal = parseCOPInput(principalRaw);
		if (principal === null || principal <= 0) return;
		if (!rateType || !scheduleMode || !startDate || !disbursementAccountId || !paymentAccountId) {
			return;
		}
		if (
			fundCategories.selectedIds.length === 0 &&
			fundCategories.newNames.length === 0
		) {
			setFundCategoryError("Agrega al menos una categoría para gastos del fondo");
			return;
		}
		setFundCategoryError("");
		const term = Number.parseInt(termMonths, 10);
		const rate = Number.parseFloat(interestRate);
		const day = Number.parseInt(paymentDay, 10);
		if (!Number.isFinite(term) || term <= 0) return;
		if (!Number.isFinite(rate) || rate < 0) return;
		if (!Number.isFinite(day) || day < 1 || day > 31) return;
		const fixedInstallment = fixedInstallmentRaw
			? parseCOPInput(fixedInstallmentRaw) ?? undefined
			: undefined;
		const insuranceMonthly = insuranceRaw
			? parseCOPInput(insuranceRaw) ?? undefined
			: undefined;

		await onSubmit({
			name: name.trim(),
			lender: lender.trim(),
			principal,
			rateType,
			interestRate: rate,
			termMonths: term,
			startDate: new Date(startDate).getTime(),
			paymentDay: day,
			scheduleMode,
			fixedInstallment,
			insuranceMonthly,
			disbursementAccountId: disbursementAccountId as Id<"accounts">,
			paymentAccountId: paymentAccountId as Id<"accounts">,
			registerDisbursementIncome,
			fundExpenseCategoryIds: fundCategories.selectedIds,
			newFundExpenseCategoryNames: fundCategories.newNames,
			notes: notes.trim() || undefined,
		});
	};

	return (
		<form className="tx-form tx-form--modal" onSubmit={handleSubmit} noValidate>
			<div className="tx-form__scroll brand-scroll credit-form-grid">
				<Input
					label="Nombre del crédito"
					value={name}
					onChange={(e) => setName(e.target.value)}
					required
				/>
				<Input
					label="Prestamista (banco o entidad)"
					value={lender}
					onChange={(e) => setLender(e.target.value)}
					required
				/>

				<CurrencyInput
					label="Monto desembolsado (COP)"
					value={principalRaw}
					onChange={setPrincipalRaw}
					required
				/>

				<div>
					<FormSelect
						id="credit-rate-type"
						label="Tipo de tasa de interés"
						value={rateType}
						hint={rateHint}
						onChange={(v) => setRateType(v as RateType | "")}
					>
						<option value="">— Seleccionar —</option>
						{RATE_TYPE_OPTIONS.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</FormSelect>
				</div>

				<Input
					label={rateValueLabel}
					value={interestRate}
					onChange={(e) => setInterestRate(e.target.value)}
					required
				/>
				<Input
					label="Plazo (meses)"
					value={termMonths}
					onChange={(e) => setTermMonths(e.target.value)}
					required
				/>
				<Input
					label="Fecha del desembolso"
					type="date"
					value={startDate}
					onChange={(e) => setStartDate(e.target.value)}
					required
				/>
				<Input
					label="Día de pago de la cuota (1–31)"
					value={paymentDay}
					onChange={(e) => setPaymentDay(e.target.value)}
					required
				/>

				<div className="credit-form-grid__full">
					<FormSelect
						id="credit-schedule-mode"
						label="Forma de pago de las cuotas"
						value={scheduleMode}
						hint={scheduleHint}
						onChange={(v) => setScheduleMode(v as ScheduleMode | "")}
					>
						<option value="">— Seleccionar —</option>
						{SCHEDULE_MODE_OPTIONS.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</FormSelect>
				</div>

				{scheduleMode === "cuota_fija" ? (
					<CurrencyInput
						label="Cuota mensual conocida (opcional)"
						value={fixedInstallmentRaw}
						onChange={setFixedInstallmentRaw}
					/>
				) : null}

				<CurrencyInput
					label="Seguro de vida / otros fijos mensuales (opcional)"
					value={insuranceRaw}
					onChange={setInsuranceRaw}
				/>

				<div className="credit-form-grid__full">
					<FormSelect
						id="credit-disbursement-account"
						label={DISBURSEMENT_ACCOUNT_LABEL}
						value={disbursementAccountId}
						hint={DISBURSEMENT_ACCOUNT_HINT}
						onChange={setDisbursementAccountId}
					>
						<option value="">— Seleccionar cuenta —</option>
						{accounts.map((a) => (
							<option key={a._id} value={a._id}>
								{a.name}
							</option>
						))}
					</FormSelect>
				</div>

				<div className="credit-form-grid__full">
					<FormSelect
						id="credit-payment-account"
						label={PAYMENT_ACCOUNT_LABEL}
						value={paymentAccountId}
						hint={PAYMENT_ACCOUNT_HINT}
						onChange={setPaymentAccountId}
					>
						<option value="">— Seleccionar cuenta —</option>
						{accounts.map((a) => (
							<option key={a._id} value={a._id}>
								{a.name}
							</option>
						))}
					</FormSelect>
				</div>

				{disbursementAccountId ? (
					<div className="credit-form-grid__full credit-form-check">
						<Checkbox
							label="Registrar el desembolso como ingreso en esta cuenta"
							checked={registerDisbursementIncome}
							onChange={setRegisterDisbursementIncome}
						/>
					</div>
				) : null}

				<FundExpenseCategoryPicker
					hint={FUND_EXPENSE_CATEGORY_HINT}
					availableCategories={expenseCategories}
					value={fundCategories}
					onChange={setFundCategories}
					error={fundCategoryError}
				/>

				<Input
					label="Notas"
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					className="credit-form-grid__full"
				/>

				<div className="credit-form-grid__full">
					<FieldError message={error} />
				</div>
			</div>

			<FormModalFooter
				onCancel={onCancel}
				loading={loading}
				submitLabel="Guardar crédito"
			/>
		</form>
	);
}
