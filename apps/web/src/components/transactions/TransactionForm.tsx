import {
	AttachmentList,
	useAttachmentCount,
} from "@app/components/attachments/AttachmentList";
import { AttachmentUploader } from "@app/components/attachments/AttachmentUploader";
import { BudgetThresholdAlert } from "@app/components/budgets/BudgetThresholdAlert";
import { CategoryChoice } from "@app/components/ui/CategoryChoice";
import { FieldError } from "@app/components/ui/FieldError";
import { FormModalFooter } from "@app/components/ui/FormModalFooter";
import type { TransactionType } from "@app/lib/core/types";
import { formatCOPInput, formatCOPInputFromRaw, formatCOP, parseCOPInput } from "@app/lib/format/currency";
import { fromDateInputValue, formatShortDate, toDateInputValue } from "@app/lib/format/date";
import { periodKeyFromDate } from "@app/lib/period";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { api } from "@convex/_generated/api";
import { Input, Checkbox } from "@jp-ds";
import { useQuery } from "convex/react";
import { useEffect, useMemo, useRef, useState } from "react";

type TransactionFormProps = {
	accounts: Doc<"accounts">[];
	categories: Doc<"categories">[];
	initial?: Partial<{
		type: TransactionType;
		amount: string;
		date: string;
		accountId: Id<"accounts">;
		toAccountId: Id<"accounts">;
		categoryId: Id<"categories">;
		notes: string;
		destinationName?: string;
	}>;
	transactionId?: Id<"transactions">;
	loading?: boolean;
	serverError?: string;
	onSubmit: (values: {
		type: TransactionType;
		amount: number;
		date: number;
		accountId: Id<"accounts">;
		toAccountId?: Id<"accounts">;
		categoryId: Id<"categories">;
		notes?: string;
		creditPaymentId?: Id<"creditPayments">;
		creditFundSpend?: {
			creditId: Id<"credits">;
			destinationId: Id<"creditDestinations">;
		};
		fixedExpenseId?: Id<"fixedExpenses">;
	}) => void;
	onCancel: () => void;
	onDelete?: () => void;
};

const typeOptions: { value: TransactionType; label: string }[] = [
	{ value: "expense", label: "Gasto" },
	{ value: "income", label: "Ingreso" },
	{ value: "transfer", label: "Transferencia" },
];

const amountLabels: Record<TransactionType, string> = {
	expense: "Monto del gasto",
	income: "Monto del ingreso",
	transfer: "Monto a transferir",
};

export function TransactionForm({
	accounts,
	categories,
	initial,
	transactionId,
	loading = false,
	serverError,
	onSubmit,
	onCancel,
	onDelete,
}: TransactionFormProps) {
	const activeAccounts = accounts.filter((a) => !a.archived);
	const [type, setType] = useState<TransactionType>(initial?.type ?? "expense");
	const [amount, setAmount] = useState(() => {
		const n = initial?.amount ? parseCOPInput(initial.amount) : null;
		return n !== null ? formatCOPInput(n) : "";
	});
	const [date, setDate] = useState(
		initial?.date ?? toDateInputValue(Date.now()),
	);
	const [accountId, setAccountId] = useState<Id<"accounts"> | "">(
		initial?.accountId ?? activeAccounts[0]?._id ?? "",
	);
	const [toAccountId, setToAccountId] = useState<Id<"accounts"> | "">(
		initial?.toAccountId ?? "",
	);
	const [categoryId, setCategoryId] = useState<Id<"categories"> | "">(
		initial?.categoryId ?? "",
	);
	const [notes, setNotes] = useState(initial?.notes ?? "");
	const [creditPaymentOverride, setCreditPaymentOverride] = useState<
		Id<"creditPayments"> | ""
	>("");
	const [fundDestinationOverride, setFundDestinationOverride] = useState<
		Id<"creditDestinations"> | ""
	>("");
	const [markFixedExpensePaid, setMarkFixedExpensePaid] = useState(false);
	const [fixedExpenseOverride, setFixedExpenseOverride] = useState<
		Id<"fixedExpenses"> | ""
	>("");
	const [error, setError] = useState("");
	const amountInputRef = useRef<HTMLInputElement>(null);
	const attachmentCount = useAttachmentCount(transactionId);

	const filteredCategories = categories.filter(
		(c) => !c.archived && c.type === type,
	);

	const selectedCategory = filteredCategories.find((c) => c._id === categoryId);
	const isFundExpenseFlow =
		!transactionId &&
		type === "expense" &&
		selectedCategory?.linkedCreditPurpose === "fund_expense";
	const isCreditPaymentCandidate =
		!transactionId &&
		type === "expense" &&
		!!selectedCategory?.linkedCreditId &&
		selectedCategory?.linkedCreditPurpose !== "fund_expense" &&
		selectedCategory?.linkedCreditPurpose !== "disbursement_income";

	const isFixedExpenseCandidate =
		!transactionId && type === "expense" && Boolean(categoryId);

	const draftAmount = parseCOPInput(amount) ?? 0;
	const periodKey = useMemo(
		() => periodKeyFromDate(new Date(fromDateInputValue(date))),
		[date],
	);

	const fixedExpenseContext = useQuery(
		api.fixedExpenseContext.getContextForCategory,
		isFixedExpenseCandidate && categoryId
			? { categoryId, periodKey }
			: "skip",
	);

	const hasUnpaidFixedExpenses =
		!!fixedExpenseContext &&
		fixedExpenseContext.unpaidItems.length > 0 &&
		!isCreditPaymentCandidate &&
		!isFundExpenseFlow;
	const fixedExpenseLoading =
		isFixedExpenseCandidate && fixedExpenseContext === undefined;
	const isFixedExpenseFlow = hasUnpaidFixedExpenses && markFixedExpensePaid;

	const resolvedFixedExpenseId = useMemo(() => {
		if (!fixedExpenseContext) return "";
		if (
			fixedExpenseOverride &&
			fixedExpenseContext.unpaidItems.some(
				(item) => item._id === fixedExpenseOverride,
			)
		) {
			return fixedExpenseOverride;
		}
		return fixedExpenseContext.defaultFixedExpenseId ?? "";
	}, [fixedExpenseContext, fixedExpenseOverride]);

	const selectedFixedExpense = fixedExpenseContext?.unpaidItems.find(
		(item) => item._id === resolvedFixedExpenseId,
	);
	const isFixedAmountLocked =
		isFixedExpenseFlow && !!selectedFixedExpense && selectedFixedExpense.amount > 0;

	const creditContext = useQuery(
		api.creditPaymentContext.getContextForCategory,
		isCreditPaymentCandidate && categoryId ? { categoryId } : "skip",
	);
	const isCreditPaymentFlow = isCreditPaymentCandidate && !!creditContext;

	const fundContext = useQuery(
		api.creditFundContext.getContextForCategory,
		isFundExpenseFlow && categoryId ? { categoryId } : "skip",
	);

	const creditPaymentLoading =
		isCreditPaymentCandidate && creditContext === undefined;
	const creditPaymentUnavailable =
		isCreditPaymentCandidate && creditContext === null;

	const fundExpenseLoading = isFundExpenseFlow && fundContext === undefined;
	const fundExpenseUnavailable = isFundExpenseFlow && fundContext === null;

	const resolvedFundDestinationId = useMemo(() => {
		if (!fundContext) return "";
		if (
			fundDestinationOverride &&
			fundContext.destinations.some((d) => d._id === fundDestinationOverride)
		) {
			return fundDestinationOverride;
		}
		return (
			fundContext.defaultDestinationId ?? fundContext.destinations[0]?._id ?? ""
		);
	}, [fundContext, fundDestinationOverride]);

	const resolvedCreditPaymentId = useMemo(() => {
		if (!creditContext) return "";
		if (
			creditPaymentOverride &&
			creditContext.payableInstallments.some(
				(p) => p._id === creditPaymentOverride,
			)
		) {
			return creditPaymentOverride;
		}
		return (
			creditContext.defaultPaymentId ??
			creditContext.payableInstallments[0]?._id ??
			""
		);
	}, [creditContext, creditPaymentOverride]);

	const selectedInstallment = creditContext?.payableInstallments.find(
		(p) => p._id === resolvedCreditPaymentId,
	);
	const isCreditAmountLocked =
		isCreditPaymentFlow && !!selectedInstallment && selectedInstallment.totalDue > 0;

	const creditDisplayAmount =
		isCreditAmountLocked && selectedInstallment
			? formatCOPInput(selectedInstallment.totalDue)
			: isFixedAmountLocked && selectedFixedExpense
				? formatCOPInput(selectedFixedExpense.amount)
				: amount;

	const budgetPreview = useQuery(
		api.budgets.previewForTransaction,
		type === "expense" && categoryId
			? {
					categoryId,
					periodKey,
					draftAmount: draftAmount > 0 ? draftAmount : undefined,
					excludeTransactionId: transactionId,
				}
			: "skip",
	);

	useEffect(() => {
		const valid = filteredCategories.some((c) => c._id === categoryId);
		if (!valid) {
			setCategoryId(filteredCategories[0]?._id ?? "");
		}
	}, [type, filteredCategories, categoryId]);

	useEffect(() => {
		setCreditPaymentOverride("");
		setFundDestinationOverride("");
		setFixedExpenseOverride("");
	}, [categoryId]);

	useEffect(() => {
		if (hasUnpaidFixedExpenses) {
			setMarkFixedExpensePaid(true);
		} else {
			setMarkFixedExpensePaid(false);
		}
	}, [hasUnpaidFixedExpenses, categoryId, periodKey]);

	useEffect(() => {
		if (isFixedAmountLocked && selectedFixedExpense) {
			setAmount(formatCOPInput(selectedFixedExpense.amount));
		}
	}, [isFixedAmountLocked, selectedFixedExpense]);

	useEffect(() => {
		if (creditContext?.paymentAccountId) {
			setAccountId(creditContext.paymentAccountId);
		} else if (fundContext?.disbursementAccountId) {
			setAccountId(fundContext.disbursementAccountId);
		}
	}, [
		creditContext?.paymentAccountId,
		fundContext?.disbursementAccountId,
		categoryId,
	]);

	useEffect(() => {
		const input = amountInputRef.current;
		if (!input) return;

		const frame = requestAnimationFrame(() => {
			input.focus({ preventScroll: true });
			if (input.value) {
				input.select();
			}
		});

		return () => cancelAnimationFrame(frame);
	}, []);

	const handleAmountChange = (raw: string) => {
		setAmount(formatCOPInputFromRaw(raw));
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (fundExpenseLoading) {
			setError("Cargando datos del fondo…");
			return;
		}
		if (fundExpenseUnavailable) {
			setError("Este crédito no tiene fondo configurado para gastos");
			return;
		}
		if (creditPaymentLoading) {
			setError("Cargando datos de la cuota…");
			return;
		}
		if (creditPaymentUnavailable) {
			setError("Este crédito no tiene cuenta de pago configurada");
			return;
		}

		const parsed = isCreditAmountLocked && selectedInstallment
			? selectedInstallment.totalDue
			: isFixedAmountLocked && selectedFixedExpense
				? selectedFixedExpense.amount
				: parseCOPInput(amount);
		if (!parsed || parsed <= 0) {
			setError("Ingresa un monto válido");
			return;
		}
		if (!isFundExpenseFlow && !accountId) {
			setError(
				type === "transfer"
					? "Selecciona la cuenta origen"
					: "Selecciona una cuenta",
			);
			return;
		}
		if (type === "transfer") {
			if (!toAccountId) {
				setError("Selecciona la cuenta destino");
				return;
			}
			if (toAccountId === accountId) {
				setError("Origen y destino deben ser diferentes");
				return;
			}
		}
		if (!categoryId) {
			setError("Selecciona una categoría");
			return;
		}
		if (isFundExpenseFlow) {
			if (!resolvedFundDestinationId) {
				setError("Selecciona el rubro del crédito");
				return;
			}
			if (!accountId) {
				setError("Selecciona la cuenta");
				return;
			}
			if (
				accountId === fundContext?.disbursementAccountId &&
				parsed > (fundContext?.escrowBalance ?? 0)
			) {
				setError("El monto supera el saldo disponible del fondo");
				return;
			}
		}
		if (isCreditPaymentFlow) {
			if (!resolvedCreditPaymentId) {
				setError("Selecciona la cuota a pagar");
				return;
			}
			if (!selectedInstallment || selectedInstallment.totalDue <= 0) {
				setError("La cuota seleccionada no tiene un valor definido");
				return;
			}
		}
		if (isFixedExpenseFlow) {
			if (!resolvedFixedExpenseId) {
				setError("Selecciona el gasto fijo a registrar");
				return;
			}
			if (!selectedFixedExpense) {
				setError("Gasto fijo no válido para este período");
				return;
			}
		}
		setError("");
		onSubmit({
			type,
			amount: parsed,
			date: fromDateInputValue(date),
			accountId: accountId as Id<"accounts">,
			toAccountId:
				type === "transfer" ? (toAccountId as Id<"accounts">) : undefined,
			categoryId,
			notes: notes.trim() || undefined,
			creditPaymentId: resolvedCreditPaymentId || undefined,
			creditFundSpend: isFundExpenseFlow
				? {
						creditId: fundContext!.creditId,
						destinationId: resolvedFundDestinationId as Id<"creditDestinations">,
					}
				: undefined,
			fixedExpenseId:
				isFixedExpenseFlow && !isCreditPaymentFlow && !isFundExpenseFlow
					? (resolvedFixedExpenseId as Id<"fixedExpenses">)
					: undefined,
		});
	};

	const creditSubmitBlocked =
		isCreditPaymentFlow &&
		(creditPaymentLoading ||
			creditPaymentUnavailable ||
			!resolvedCreditPaymentId ||
			!selectedInstallment ||
			selectedInstallment.totalDue <= 0);

	const fundParsedAmount = parseCOPInput(amount) ?? 0;
	const fundEscrowExceeded =
		isFundExpenseFlow &&
		accountId === fundContext?.disbursementAccountId &&
		fundParsedAmount > (fundContext?.escrowBalance ?? 0);

	const fundSubmitBlocked =
		isFundExpenseFlow &&
		(fundExpenseLoading ||
			fundExpenseUnavailable ||
			!resolvedFundDestinationId ||
			!accountId ||
			fundParsedAmount <= 0 ||
			fundEscrowExceeded);

	const fixedSubmitBlocked =
		isFixedExpenseFlow &&
		(fixedExpenseLoading ||
			!resolvedFixedExpenseId ||
			!selectedFixedExpense ||
			selectedFixedExpense.amount <= 0);

	return (
		<form className="tx-form tx-form--modal" onSubmit={handleSubmit} noValidate>
			<div className="tx-form__scroll brand-scroll">
				<div className="tx-form__amount">
				<span className="tx-form__amount-label">{amountLabels[type]}</span>
				<div className={`tx-form__amount-input tx-form__amount-input--${type}`}>
					<span className="tx-form__currency">$</span>
					<input
						ref={amountInputRef}
						type="text"
						inputMode="numeric"
						autoComplete="off"
						placeholder="0"
						value={creditDisplayAmount}
						readOnly={isCreditAmountLocked || isFixedAmountLocked}
						onChange={(e) => handleAmountChange(e.target.value)}
						onPaste={(e) => {
							e.preventDefault();
							handleAmountChange(e.clipboardData.getData("text"));
						}}
						aria-label={amountLabels[type]}
					/>
				</div>
			</div>

			<div className="segmented" role="tablist" aria-label="Tipo de movimiento">
				{typeOptions.map((opt) => (
					<button
						key={opt.value}
						type="button"
						role="tab"
						aria-selected={type === opt.value}
						className={`segmented__item${type === opt.value ? " segmented__item--active" : ""}`}
						onClick={() => setType(opt.value)}
					>
						{opt.label}
					</button>
				))}
			</div>

			<fieldset className="category-fieldset">
				<legend className="jp-input-label">Categoría</legend>
				<CategoryChoice
					categories={filteredCategories}
					value={categoryId}
					onChange={setCategoryId}
				/>
			</fieldset>

			{isCreditPaymentFlow && creditPaymentLoading ? (
				<p className="tx-form__hint">Cargando cuotas del crédito…</p>
			) : null}

			{isCreditPaymentFlow && creditPaymentUnavailable ? (
				<p className="tx-form__hint" role="alert">
					Este crédito no tiene cuenta de pago configurada. Configúrala en los
					ajustes del crédito.
				</p>
			) : null}

			{isCreditPaymentFlow && creditContext ? (
				<>
					<p className="tx-form__hint">
						Cuota de <strong>{creditContext.creditName}</strong>. Al guardar se
						marcará la cuota como pagada.
					</p>
					<label className="jp-input-label" htmlFor="tx-credit-installment">
						Cuota a pagar
					</label>
					<select
						id="tx-credit-installment"
						className="jp-input"
						value={resolvedCreditPaymentId}
						onChange={(e) =>
							setCreditPaymentOverride(
								e.target.value as Id<"creditPayments">,
							)
						}
					>
						{creditContext.payableInstallments.length === 0 ? (
							<option value="">No hay cuotas pendientes</option>
						) : (
							creditContext.payableInstallments.map((payment) => (
								<option key={payment._id} value={payment._id}>
									#{payment.installmentNumber} — vence{" "}
									{formatShortDate(payment.dueDate)} —{" "}
									{payment.totalDue > 0
										? formatCOP(payment.totalDue)
										: "Sin valor definido"}
								</option>
							))
						)}
					</select>
				</>
			) : null}

			{isFixedExpenseCandidate && fixedExpenseLoading ? (
				<p className="tx-form__hint">Buscando gastos fijos pendientes…</p>
			) : null}

			{hasUnpaidFixedExpenses && fixedExpenseContext ? (
				<div className="credit-form-check">
					<Checkbox
						label="Registrar pago de gasto fijo"
						checked={markFixedExpensePaid}
						onChange={setMarkFixedExpensePaid}
					/>
					{markFixedExpensePaid ? (
						<>
							<p className="tx-form__hint">
								Al guardar se marcará como pagado en Presupuestos → Gastos
								fijos
								{selectedFixedExpense?.linkedSavingsGoalName
									? ` y se registrará el aporte en la meta «${selectedFixedExpense.linkedSavingsGoalName}»`
									: ""}
								.
							</p>
							{fixedExpenseContext.unpaidItems.length > 1 ? (
								<>
									<label
										className="jp-input-label"
										htmlFor="tx-fixed-expense"
									>
										Gasto fijo
									</label>
									<select
										id="tx-fixed-expense"
										className="jp-input"
										value={resolvedFixedExpenseId}
										onChange={(e) =>
											setFixedExpenseOverride(
												e.target.value as Id<"fixedExpenses">,
											)
										}
									>
										{fixedExpenseContext.unpaidItems.map((item) => (
											<option key={item._id} value={item._id}>
												{item.name} — día {item.dayOfMonth} —{" "}
												{formatCOP(item.amount)}
											</option>
										))}
									</select>
								</>
							) : (
								<p className="tx-form__hint">
									Gasto fijo: <strong>{selectedFixedExpense?.name}</strong> (
									{formatCOP(selectedFixedExpense?.amount ?? 0)})
								</p>
							)}
						</>
					) : null}
				</div>
			) : null}

			{isFundExpenseFlow && fundExpenseLoading ? (
				<p className="tx-form__hint">Cargando fondo del crédito…</p>
			) : null}

			{isFundExpenseFlow && fundExpenseUnavailable ? (
				<p className="tx-form__hint" role="alert">
					Configura las cuentas del crédito y al menos una categoría de fondo en
					los ajustes.
				</p>
			) : null}

			{isFundExpenseFlow && fundContext ? (
				<>
					<p className="tx-form__hint">
						Gasto del fondo de <strong>{fundContext.creditName}</strong>.
						Disponible en desembolso:{" "}
						<strong>{formatCOP(fundContext.escrowBalance)}</strong>. Quedará
						registrado en Movimientos y en la pestaña Fondo.
					</p>
					<label className="jp-input-label" htmlFor="tx-fund-destination">
						Rubro del crédito
					</label>
					<select
						id="tx-fund-destination"
						className="jp-input"
						value={resolvedFundDestinationId}
						onChange={(e) =>
							setFundDestinationOverride(
								e.target.value as Id<"creditDestinations">,
							)
						}
					>
						{fundContext.destinations.length === 0 ? (
							<option value="">Crea un rubro en el crédito primero</option>
						) : (
							fundContext.destinations.map((destination) => (
								<option key={destination._id} value={destination._id}>
									{destination.name} ({formatCOP(destination.amount)})
								</option>
							))
						)}
					</select>
				</>
			) : null}

			{transactionId && initial?.destinationName ? (
				<p className="tx-form__hint">
					Rubro del crédito: <strong>{initial.destinationName}</strong>
				</p>
			) : null}

			{budgetPreview &&
			!isCreditPaymentFlow &&
			!isFundExpenseFlow &&
			!isFixedExpenseFlow ? (
				<BudgetThresholdAlert preview={budgetPreview} draftAmount={draftAmount} />
			) : null}

			<label className="jp-input-label" htmlFor="tx-account">
				{type === "transfer" ? "Cuenta origen" : "Cuenta"}
			</label>
			{isFundExpenseFlow ? (
				<p className="tx-form__hint">
					Por defecto la cuenta de desembolso (
					{fundContext?.disbursementAccountName ?? "fondo"}). Puedes cambiarla.
				</p>
			) : null}
			<select
				id="tx-account"
				className="jp-input"
				value={accountId}
				onChange={(e) => setAccountId(e.target.value as Id<"accounts">)}
			>
				{activeAccounts.map((a) => (
					<option key={a._id} value={a._id}>
						{a.name}
						{isFundExpenseFlow && a._id === fundContext?.disbursementAccountId
							? " (desembolso)"
							: ""}
					</option>
				))}
			</select>
			{fundEscrowExceeded ? (
				<p className="tx-form__hint" role="alert">
					El monto supera el saldo del fondo ({formatCOP(fundContext?.escrowBalance ?? 0)}).
				</p>
			) : null}

			{!isFundExpenseFlow && type === "transfer" ? (
				<>
					<label className="jp-input-label" htmlFor="tx-to-account">
						Cuenta destino
					</label>
					<select
						id="tx-to-account"
						className="jp-input"
						value={toAccountId}
						onChange={(e) => setToAccountId(e.target.value as Id<"accounts">)}
					>
						<option value="">Selecciona…</option>
						{activeAccounts
							.filter((a) => a._id !== accountId)
							.map((a) => (
								<option key={a._id} value={a._id}>
									{a.name}
								</option>
							))}
					</select>
				</>
			) : null}

			<Input
				label="Fecha"
				type="date"
				value={date}
				onChange={(e) => setDate(e.target.value)}
				required
			/>

			<Input
				label="Nota (opcional)"
				value={notes}
				onChange={(e) => setNotes(e.target.value)}
			/>

			{transactionId ? (
				<div className="attachments-section">
					<span className="jp-input-label">Adjuntos</span>
					<AttachmentList transactionId={transactionId} />
					<AttachmentUploader
						transactionId={transactionId}
						currentCount={attachmentCount}
					/>
				</div>
			) : null}

				<FieldError message={error || serverError} />
			</div>

			<FormModalFooter
				onCancel={onCancel}
				onDelete={onDelete}
				loading={loading}
				submitDisabled={
					creditSubmitBlocked || fundSubmitBlocked || fixedSubmitBlocked
				}
				submitLabel="Guardar movimiento"
			/>
		</form>
	);
}
