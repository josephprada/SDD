import {
	CREDIT_PRINCIPAL_LABEL,
	CREDIT_SETTINGS_SUMMARY_HINT,
	CREDIT_START_DATE_HINT,
	CREDIT_START_DATE_LABEL,
	DELETE_CREDIT_HINT,
	FUND_EXPENSE_CATEGORY_HINT,
	FUND_ACCOUNT_HINT,
	FUND_ACCOUNT_LABEL,
	OPERATING_ACCOUNT_HINT,
	OPERATING_ACCOUNT_LABEL,
	OUTSTANDING_BALANCE_HINT,
	OUTSTANDING_BALANCE_LABEL,
	RATE_TYPE_OPTIONS,
	RECALC_EFFECT_OPTIONS,
	RECALC_EFFECT_LABELS,
	SCHEDULE_MODE_OPTIONS,
	TARGET_PAYOFF_HINT,
	CREDIT_PROFILE_LABELS,
	type AbonoRecalcEffect,
	type CreditProfile,
	type RateType,
	type ScheduleMode,
} from "@app/lib/credits/types";
import { CreditProfilePicker } from "@app/components/credits/CreditProfilePicker";
import {
	getCreditProfileConfig,
	getIncompatibleProfileDataLabels,
} from "@app/lib/credits/creditProfileRegistry";
import {
	FundExpenseCategoryPicker,
	type FundExpenseCategorySelection,
} from "@app/components/credits/FundExpenseCategoryPicker";
import { CurrencyInput } from "@app/components/ui/CurrencyInput";
import { FieldError } from "@app/components/ui/FieldError";
import { FieldHelp } from "@app/components/ui/FieldHelp";
import { FormSelect } from "@app/components/ui/FormSelect";
import { Modal } from "@app/components/ui/Modal";
import { formatCOP, formatCOPInput, parseCOPInput } from "@app/lib/format/currency";
import { toDateInputValue } from "@app/lib/format/date";
import type { Id } from "@convex/_generated/dataModel";
import { Button, Input } from "@jp-ds";
import { useMemo, useState } from "react";

export type CreditEditValues = {
	name: string;
	lender: string;
	notes?: string;
	principal: number;
	outstandingBalance: number;
	rateType: RateType;
	interestRate: number;
	termMonths: number;
	paymentDay: number;
	scheduleMode: ScheduleMode;
	startDate: number;
	insuranceMonthly?: number;
	fixedInstallment?: number;
	targetPayoffDate?: number;
	defaultRecalcOnAbono: AbonoRecalcEffect;
	disbursementAccountId?: Id<"accounts">;
	operatingAccountId?: Id<"accounts">;
	fundExpenseCategoryIds: Id<"categories">[];
	newFundExpenseCategoryNames: string[];
};

type CreditSettingsFormProps = {
	credit: {
		creditProfile: CreditProfile;
		linkedAsset?: unknown;
		informalAgreement?: unknown;
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
		paymentDay: number;
		scheduleMode: ScheduleMode;
		startDate: number;
		insuranceMonthly?: number;
		fixedInstallment?: number;
		paymentsSummary?: { paid: number };
	};
	accounts: Array<{ _id: Id<"accounts">; name: string }>;
	expenseCategories: Array<{ _id: Id<"categories">; name: string }>;
	onSave: (values: CreditEditValues) => Promise<void>;
	onChangeProfile: (
		profile: CreditProfile,
		preserveIncompatibleData: boolean,
	) => Promise<void>;
	onDelete: () => Promise<void>;
	loading?: boolean;
	profileChangeLoading?: boolean;
	deleteLoading?: boolean;
	error?: string;
	profileChangeError?: string;
};

export function CreditSettingsForm({
	credit,
	accounts,
	expenseCategories,
	onSave,
	onChangeProfile,
	onDelete,
	loading,
	profileChangeLoading,
	deleteLoading,
	error,
	profileChangeError,
}: CreditSettingsFormProps) {
	const paidCount = credit.paymentsSummary?.paid ?? 0;
	const profileConfig = getCreditProfileConfig(credit.creditProfile);

	const [profilePickerOpen, setProfilePickerOpen] = useState(false);
	const [profileConfirmOpen, setProfileConfirmOpen] = useState(false);
	const [pendingProfile, setPendingProfile] = useState<CreditProfile | null>(
		null,
	);
	const [incompatibleLabels, setIncompatibleLabels] = useState<string[]>([]);

	const [name, setName] = useState(credit.name);
	const [lender, setLender] = useState(credit.lender);
	const [notes, setNotes] = useState(credit.notes ?? "");
	const [principalRaw, setPrincipalRaw] = useState(
		credit.principal > 0 ? formatCOPInput(credit.principal) : "",
	);
	const [outstandingRaw, setOutstandingRaw] = useState(
		credit.outstandingBalance > 0
			? formatCOPInput(credit.outstandingBalance)
			: "",
	);
	const [rateType, setRateType] = useState<RateType>(credit.rateType);
	const [interestRate, setInterestRate] = useState(
		credit.interestRate > 0 ? String(credit.interestRate) : "",
	);
	const [termMonths, setTermMonths] = useState(
		credit.termMonths > 0 ? String(credit.termMonths) : "",
	);
	const [paymentDay, setPaymentDay] = useState(String(credit.paymentDay || 1));
	const [scheduleMode, setScheduleMode] = useState<ScheduleMode>(
		credit.scheduleMode,
	);
	const [startDate, setStartDate] = useState(
		credit.startDate ? toDateInputValue(credit.startDate) : "",
	);
	const [insuranceRaw, setInsuranceRaw] = useState(
		credit.insuranceMonthly && credit.insuranceMonthly > 0
			? formatCOPInput(credit.insuranceMonthly)
			: "",
	);
	const [fixedInstallmentRaw, setFixedInstallmentRaw] = useState(
		credit.fixedInstallment && credit.fixedInstallment > 0
			? formatCOPInput(credit.fixedInstallment)
			: "",
	);
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
	const [clientError, setClientError] = useState("");

	const rateHint = useMemo(() => {
		return (
			RATE_TYPE_OPTIONS.find((o) => o.value === rateType)?.hint ??
			"Selecciona un tipo para ver cómo debes ingresar el valor de la tasa."
		);
	}, [rateType]);

	const scheduleHint = useMemo(() => {
		return (
			SCHEDULE_MODE_OPTIONS.find((o) => o.value === scheduleMode)?.hint ??
			"Elige cómo se calculan o registran las cuotas de este crédito."
		);
	}, [scheduleMode]);

	const rateValueLabel = useMemo(() => {
		if (rateType === "MV") return "Valor de la tasa (% mensual)";
		if (rateType === "EA" || rateType === "NAMV") {
			return "Valor de la tasa (% anual)";
		}
		return "Valor de la tasa (%)";
	}, [rateType]);

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

	const applyProfileChange = async (
		profile: CreditProfile,
		preserveIncompatibleData: boolean,
	) => {
		await onChangeProfile(profile, preserveIncompatibleData);
		setProfilePickerOpen(false);
		setProfileConfirmOpen(false);
		setPendingProfile(null);
		setIncompatibleLabels([]);
	};

	const handleProfileSelect = (nextProfile: CreditProfile) => {
		if (nextProfile === credit.creditProfile) {
			setProfilePickerOpen(false);
			return;
		}

		const incompatible = getIncompatibleProfileDataLabels(
			{
				linkedAsset: credit.linkedAsset,
				informalAgreement: credit.informalAgreement,
				fundExpenseCategoryCount: credit.fundExpenseCategories.length,
			},
			nextProfile,
		);

		if (incompatible.length === 0) {
			void applyProfileChange(nextProfile, false);
			return;
		}

		setPendingProfile(nextProfile);
		setIncompatibleLabels(incompatible);
		setProfilePickerOpen(false);
		setProfileConfirmOpen(true);
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setClientError("");

		const principal = parseCOPInput(principalRaw);
		const outstandingBalance = parseCOPInput(outstandingRaw);
		const term = Number.parseInt(termMonths, 10);
		const rate = Number.parseFloat(interestRate);
		const day = Number.parseInt(paymentDay, 10);
		const insuranceMonthly = insuranceRaw
			? parseCOPInput(insuranceRaw) ?? undefined
			: undefined;
		const fixedInstallment = fixedInstallmentRaw
			? parseCOPInput(fixedInstallmentRaw) ?? undefined
			: undefined;

		if (!name.trim()) {
			setClientError("Indica un nombre para el crédito");
			return;
		}
		if (principal === null || principal <= 0) {
			setClientError("Indica un monto de crédito válido");
			return;
		}
		if (outstandingBalance === null || outstandingBalance < 0) {
			setClientError("Indica un saldo pendiente válido");
			return;
		}
		if (!Number.isFinite(rate) || rate < 0) {
			setClientError("Indica una tasa de interés válida");
			return;
		}
		if (!Number.isFinite(term) || term <= 0) {
			setClientError("Indica un plazo en meses válido");
			return;
		}
		if (paidCount > 0 && term < paidCount) {
			setClientError(
				`El plazo no puede ser menor que las cuotas ya pagadas (${paidCount})`,
			);
			return;
		}
		if (!Number.isFinite(day) || day < 1 || day > 31) {
			setClientError("El día de pago debe estar entre 1 y 31");
			return;
		}
		if (!startDate) {
			setClientError("Indica la fecha de inicio del crédito");
			return;
		}

		await onSave({
			name: name.trim(),
			lender: lender.trim(),
			notes: notes.trim() || undefined,
			principal,
			outstandingBalance: outstandingBalance > 0 ? outstandingBalance : principal,
			rateType,
			interestRate: rate,
			termMonths: term,
			paymentDay: day,
			scheduleMode,
			startDate: new Date(startDate).getTime(),
			insuranceMonthly,
			fixedInstallment,
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
				<div className="credit-form-profile-bar">
					<div className="credit-form-profile-bar__meta">
						<span className="credit-form-profile-bar__label">
							Tipo de crédito
						</span>
						<span className="credit-form-profile-bar__value">
							{CREDIT_PROFILE_LABELS[credit.creditProfile]}
						</span>
						<p className="tx-form__hint">{profileConfig.description}</p>
					</div>
					<Button
						type="button"
						variant="secondary"
						disabled={profileChangeLoading}
						onClick={() => setProfilePickerOpen(true)}
					>
						Cambiar
					</Button>
				</div>
				<FieldError message={profileChangeError} />
			</section>

			<form
				className="credit-panel-form glass"
				onSubmit={handleSubmit}
				noValidate
			>
				<div className="field-label-row credit-form-grid__full">
					<h3 className="section-title">Datos del crédito</h3>
					<FieldHelp text={CREDIT_SETTINGS_SUMMARY_HINT} />
				</div>

				{paidCount > 0 ? (
					<p className="tx-form__hint credit-form-grid__full">
						Tienes {paidCount} cuota(s) pagada(s). Al guardar cambios
						financieros se recalculan solo las cuotas pendientes (
						{formatCOP(credit.outstandingBalance)} saldo actual).
					</p>
				) : null}

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
					/>

					<CurrencyInput
						label={CREDIT_PRINCIPAL_LABEL}
						value={principalRaw}
						onChange={setPrincipalRaw}
						required
					/>

					<CurrencyInput
						label={OUTSTANDING_BALANCE_LABEL}
						value={outstandingRaw}
						onChange={setOutstandingRaw}
						required
					/>
					<p className="tx-form__hint credit-form-grid__full">
						{OUTSTANDING_BALANCE_HINT}
					</p>

					<FormSelect
						id="edit-rate-type"
						label="Tipo de tasa de interés"
						value={rateType}
						hint={rateHint}
						placeholder={false}
						onChange={(v) => setRateType(v as RateType)}
					>
						{RATE_TYPE_OPTIONS.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</FormSelect>

					<Input
						label={rateValueLabel}
						type="number"
						min={0}
						step="any"
						value={interestRate}
						onChange={(e) => setInterestRate(e.target.value)}
						required
					/>

					<Input
						label="Plazo (meses / cuotas)"
						type="number"
						min={1}
						value={termMonths}
						onChange={(e) => setTermMonths(e.target.value)}
						required
					/>

					<Input
						label="Día de pago mensual"
						type="number"
						min={1}
						max={31}
						value={paymentDay}
						onChange={(e) => setPaymentDay(e.target.value)}
						required
					/>

					<FormSelect
						id="edit-schedule-mode"
						label="Forma de cuotas"
						value={scheduleMode}
						hint={scheduleHint}
						placeholder={false}
						onChange={(v) => setScheduleMode(v as ScheduleMode)}
					>
						{SCHEDULE_MODE_OPTIONS.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</FormSelect>

					<div>
						<div className="field-label-row">
							<label className="jp-input-label" htmlFor="edit-start-date">
								{CREDIT_START_DATE_LABEL}
							</label>
							<FieldHelp text={CREDIT_START_DATE_HINT} />
						</div>
						<Input
							id="edit-start-date"
							type="date"
							value={startDate}
							onChange={(e) => setStartDate(e.target.value)}
							required
						/>
					</div>

					<CurrencyInput
						label="Seguro mensual (opcional)"
						value={insuranceRaw}
						onChange={setInsuranceRaw}
					/>

					{scheduleMode === "cuota_fija" ? (
						<>
							<CurrencyInput
								label="Cuota fija acordada (opcional)"
								value={fixedInstallmentRaw}
								onChange={setFixedInstallmentRaw}
							/>
							<p className="tx-form__hint credit-form-grid__full">
								Si la conoces, úsala; si no, se calcula con la tasa y el plazo.
							</p>
						</>
					) : null}

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

					<FieldError message={clientError || error} />

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

			<Modal
				open={profilePickerOpen}
				title="Cambiar tipo de crédito"
				onClose={() => setProfilePickerOpen(false)}
			>
				<CreditProfilePicker onSelect={handleProfileSelect} />
			</Modal>

			<Modal
				open={profileConfirmOpen}
				title="Datos del perfil anterior"
				onClose={() => {
					setProfileConfirmOpen(false);
					setPendingProfile(null);
					setIncompatibleLabels([]);
				}}
			>
				<div className="credit-profile-confirm">
					<p className="tx-form__hint">
						El tipo{" "}
						<strong>
							{pendingProfile
								? CREDIT_PROFILE_LABELS[pendingProfile]
								: ""}
						</strong>{" "}
						no usa: {incompatibleLabels.join(", ")}. ¿Qué hacemos con esa
						información?
					</p>
					<div className="credit-profile-confirm__actions">
						<Button
							type="button"
							variant="secondary"
							disabled={profileChangeLoading}
							onClick={() => {
								setProfileConfirmOpen(false);
								setProfilePickerOpen(true);
							}}
						>
							Volver
						</Button>
						<Button
							type="button"
							variant="secondary"
							disabled={profileChangeLoading || !pendingProfile}
							onClick={() =>
								pendingProfile &&
								void applyProfileChange(pendingProfile, true)
							}
						>
							{profileChangeLoading ? "Guardando…" : "Conservar en historial"}
						</Button>
						<Button
							type="button"
							variant="danger"
							disabled={profileChangeLoading || !pendingProfile}
							onClick={() =>
								pendingProfile &&
								void applyProfileChange(pendingProfile, false)
							}
						>
							{profileChangeLoading ? "Guardando…" : "Eliminar datos"}
						</Button>
					</div>
				</div>
			</Modal>
		</div>
	);
}
