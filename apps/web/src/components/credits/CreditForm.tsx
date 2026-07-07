import {
	ALREADY_IN_PROGRESS_HINT,
	ALREADY_IN_PROGRESS_LABEL,
	CREDIT_PRINCIPAL_LABEL,
	CREDIT_START_DATE_HINT,
	CREDIT_START_DATE_LABEL,
	DISBURSED_PRINCIPAL_LABEL,
	DISBURSEMENT_ACCOUNT_HINT,
	DISBURSEMENT_ACCOUNT_LABEL,
	DISBURSEMENT_START_DATE_LABEL,
	FUND_EXPENSE_CATEGORY_HINT,
	HAS_DISBURSEMENT_HINT,
	HAS_DISBURSEMENT_LABEL,
	OUTSTANDING_BALANCE_HINT,
	OUTSTANDING_BALANCE_LABEL,
	PAID_INSTALLMENTS_HINT,
	PAID_INSTALLMENTS_LABEL,
	PAYMENT_ACCOUNT_HINT,
	PAYMENT_ACCOUNT_LABEL,
	RATE_TYPE_OPTIONS,
	SCHEDULE_MODE_OPTIONS,
	TRACK_REMAINING_ONLY_HINT,
	TRACK_REMAINING_ONLY_LABEL,
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
	startDate?: number;
	paymentDay: number;
	scheduleMode: ScheduleMode;
	fixedInstallment?: number;
	disbursementAccountId?: Id<"accounts">;
	paymentAccountId?: Id<"accounts">;
	registerDisbursementIncome?: boolean;
	alreadyInProgress?: boolean;
	paidInstallmentsCount?: number;
	trackRemainingOnly?: boolean;
	outstandingBalance?: number;
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
	const [alreadyInProgress, setAlreadyInProgress] = useState(false);
	const [paidInstallmentsRaw, setPaidInstallmentsRaw] = useState("");
	const [trackRemainingOnly, setTrackRemainingOnly] = useState(true);
	const [outstandingBalanceRaw, setOutstandingBalanceRaw] = useState("");
	const [hasDisbursement, setHasDisbursement] = useState(false);
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
	const [clientError, setClientError] = useState("");
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

	const handleHasDisbursementChange = (checked: boolean) => {
		setHasDisbursement(checked);
		if (!checked) {
			setDisbursementAccountId("");
			setRegisterDisbursementIncome(false);
			setFundCategories({ selectedIds: [], newNames: [] });
			setFundCategoryError("");
		}
	};

	const handleAlreadyInProgressChange = (checked: boolean) => {
		setAlreadyInProgress(checked);
		if (checked) {
			setRegisterDisbursementIncome(false);
		}
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setClientError("");
		const principal = parseCOPInput(principalRaw);
		if (principal === null || principal <= 0) return;
		if (!rateType || !scheduleMode) {
			return;
		}
		if (hasDisbursement && !disbursementAccountId) {
			setClientError("Selecciona la cuenta de desembolso");
			return;
		}
		if (
			hasDisbursement &&
			fundCategories.selectedIds.length === 0 &&
			fundCategories.newNames.length === 0
		) {
			setFundCategoryError("Agrega al menos una categoría para gastos del fondo");
			return;
		}
		if (!hasDisbursement) {
			setFundCategoryError("");
		}
		const term = Number.parseInt(termMonths, 10);
		const rate = Number.parseFloat(interestRate);
		const day = Number.parseInt(paymentDay, 10);
		if (!Number.isFinite(term) || term <= 0) return;
		if (!Number.isFinite(rate) || rate < 0) return;
		if (!Number.isFinite(day) || day < 1 || day > 31) return;

		let paidInstallmentsCount: number | undefined;
		let outstandingBalance: number | undefined;

		if (alreadyInProgress && paidInstallmentsRaw.trim()) {
			const paid = Number.parseInt(paidInstallmentsRaw, 10);
			if (!Number.isFinite(paid) || paid < 0) {
				setClientError("Las cuotas pagadas deben ser un número válido");
				return;
			}
			if (paid >= term) {
				setClientError("Las cuotas pagadas deben ser menores que el plazo total");
				return;
			}
			paidInstallmentsCount = paid;
		}

		if (alreadyInProgress) {
			const parsedBalance = outstandingBalanceRaw
				? parseCOPInput(outstandingBalanceRaw)
				: null;
			if (scheduleMode === "manual") {
				if (parsedBalance === null || parsedBalance <= 0) {
					setClientError(
						"Indica el saldo capital pendiente para créditos manuales en marcha",
					);
					return;
				}
				outstandingBalance = parsedBalance;
			} else if (parsedBalance !== null && parsedBalance > 0) {
				outstandingBalance = parsedBalance;
			}
		}

		const fixedInstallment = fixedInstallmentRaw
			? parseCOPInput(fixedInstallmentRaw) ?? undefined
			: undefined;

		await onSubmit({
			name: name.trim(),
			lender: lender.trim(),
			principal,
			rateType,
			interestRate: rate,
			termMonths: term,
			startDate: startDate ? new Date(startDate).getTime() : undefined,
			paymentDay: day,
			scheduleMode,
			fixedInstallment,
			disbursementAccountId: hasDisbursement
				? (disbursementAccountId as Id<"accounts">)
				: undefined,
			paymentAccountId: paymentAccountId
				? (paymentAccountId as Id<"accounts">)
				: undefined,
			registerDisbursementIncome:
				hasDisbursement && !alreadyInProgress
					? registerDisbursementIncome
					: false,
			alreadyInProgress,
			paidInstallmentsCount,
			trackRemainingOnly: alreadyInProgress ? trackRemainingOnly : undefined,
			outstandingBalance,
			fundExpenseCategoryIds: hasDisbursement
				? fundCategories.selectedIds
				: [],
			newFundExpenseCategoryNames: hasDisbursement
				? fundCategories.newNames
				: [],
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
					label={hasDisbursement ? DISBURSED_PRINCIPAL_LABEL : CREDIT_PRINCIPAL_LABEL}
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
				<div className="credit-form-grid__full">
					<Input
						label={
							hasDisbursement
								? DISBURSEMENT_START_DATE_LABEL
								: CREDIT_START_DATE_LABEL
						}
						type="date"
						value={startDate}
						onChange={(e) => setStartDate(e.target.value)}
					/>
					<p className="credit-form-field-hint">{CREDIT_START_DATE_HINT}</p>
				</div>
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

				<div className="credit-form-grid__full credit-form-toggle-row">
					<div className="credit-form-toggle-row__text">
						<span className="credit-form-toggle-row__label">
							{ALREADY_IN_PROGRESS_LABEL}
						</span>
						<p className="credit-form-field-hint">{ALREADY_IN_PROGRESS_HINT}</p>
					</div>
					<button
						type="button"
						role="switch"
						aria-checked={alreadyInProgress}
						aria-label={
							alreadyInProgress
								? "Desactivar crédito en marcha"
								: "Activar crédito en marcha"
						}
						className={`toggle-switch${alreadyInProgress ? " toggle-switch--on" : ""}`}
						onClick={() => handleAlreadyInProgressChange(!alreadyInProgress)}
					>
						<span className="toggle-switch__thumb" />
					</button>
				</div>

				{alreadyInProgress ? (
					<>
						<div className="credit-form-grid__full">
							<Input
								label={PAID_INSTALLMENTS_LABEL}
								value={paidInstallmentsRaw}
								onChange={(e) => setPaidInstallmentsRaw(e.target.value)}
							/>
							<p className="credit-form-field-hint">{PAID_INSTALLMENTS_HINT}</p>
						</div>
						<CurrencyInput
							label={OUTSTANDING_BALANCE_LABEL}
							value={outstandingBalanceRaw}
							onChange={setOutstandingBalanceRaw}
							required={scheduleMode === "manual"}
						/>
						<p className="credit-form-field-hint">{OUTSTANDING_BALANCE_HINT}</p>
						<div className="credit-form-grid__full credit-form-toggle-row">
							<div className="credit-form-toggle-row__text">
								<span className="credit-form-toggle-row__label">
									{TRACK_REMAINING_ONLY_LABEL}
								</span>
								<p className="credit-form-field-hint">
									{TRACK_REMAINING_ONLY_HINT}
								</p>
							</div>
							<button
								type="button"
								role="switch"
								aria-checked={trackRemainingOnly}
								aria-label={
									trackRemainingOnly
										? "Desactivar solo cuotas restantes"
										: "Activar solo cuotas restantes"
								}
								className={`toggle-switch${trackRemainingOnly ? " toggle-switch--on" : ""}`}
								onClick={() => setTrackRemainingOnly(!trackRemainingOnly)}
							>
								<span className="toggle-switch__thumb" />
							</button>
						</div>
					</>
				) : null}

				<div className="credit-form-grid__full credit-form-toggle-row">
					<div className="credit-form-toggle-row__text">
						<span className="credit-form-toggle-row__label">
							{HAS_DISBURSEMENT_LABEL}
						</span>
						<p className="credit-form-field-hint">{HAS_DISBURSEMENT_HINT}</p>
					</div>
					<button
						type="button"
						role="switch"
						aria-checked={hasDisbursement}
						aria-label={
							hasDisbursement
								? "Desactivar desembolso en cuenta"
								: "Activar desembolso en cuenta"
						}
						className={`toggle-switch${hasDisbursement ? " toggle-switch--on" : ""}`}
						onClick={() => handleHasDisbursementChange(!hasDisbursement)}
					>
						<span className="toggle-switch__thumb" />
					</button>
				</div>

				{hasDisbursement ? (
					<>
						<div className="credit-form-grid__full">
							<FormSelect
								id="credit-disbursement-account"
								label={DISBURSEMENT_ACCOUNT_LABEL}
								value={disbursementAccountId}
								hint={DISBURSEMENT_ACCOUNT_HINT}
								placeholder="Seleccionar cuenta"
								onChange={setDisbursementAccountId}
							>
								{accounts.map((a) => (
									<option key={a._id} value={a._id}>
										{a.name}
									</option>
								))}
							</FormSelect>
						</div>

						{disbursementAccountId && !alreadyInProgress ? (
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
					</>
				) : null}

				<div className="credit-form-grid__full">
					<FormSelect
						id="credit-payment-account"
						label={PAYMENT_ACCOUNT_LABEL}
						value={paymentAccountId}
						hint={PAYMENT_ACCOUNT_HINT}
						placeholder="Seleccionar cuenta"
						onChange={setPaymentAccountId}
					>
						{accounts.map((a) => (
							<option key={a._id} value={a._id}>
								{a.name}
							</option>
						))}
					</FormSelect>
				</div>

				<Input
					label="Notas"
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					className="credit-form-grid__full"
				/>

				<div className="credit-form-grid__full">
					<FieldError message={clientError || error} />
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
