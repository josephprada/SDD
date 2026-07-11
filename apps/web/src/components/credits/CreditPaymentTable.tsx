import { formatCOP } from "@app/lib/format/currency";
import { formatShortDate } from "@app/lib/format/date";
import type { ScheduleMode } from "@app/lib/credits/types";
import { SCHEDULE_MODE_LABELS } from "@app/lib/credits/types";
import { Button, Checkbox } from "@jp-ds";
import type { FunctionReturnType } from "convex/server";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMemo, useState } from "react";

type Payment = FunctionReturnType<typeof api.creditPayments.listByCredit>[number];

type PaymentSummary = {
	total: number;
	paid: number;
	pending: number;
};

type CreditPaymentTableProps = {
	payments: Payment[];
	summary: PaymentSummary;
	scheduleMode: ScheduleMode;
	onRegisterPayment?: (payment: Payment) => void;
	onMarkUnpaid?: (paymentId: Id<"creditPayments">) => void;
	onGenerateSchedule?: () => void;
	onEditManual?: (
		payments: Payment[],
		initialSelectedIds: Id<"creditPayments">[],
	) => void;
	onViewTransaction?: (transactionId: Id<"transactions">) => void;
	loadingId?: string | null;
	generatingSchedule?: boolean;
};

const STATUS_LABELS: Record<Payment["status"], string> = {
	pending: "Pendiente",
	paid: "Pagada",
	overdue: "Vencida",
	cancelled: "Cancelada",
};

function isManualAmountMissing(payment: Payment): boolean {
	return payment.principal === 0 && payment.interest === 0;
}

function formatPaymentTotal(payment: Payment, scheduleMode: ScheduleMode): string {
	if (scheduleMode === "manual" && isManualAmountMissing(payment)) {
		return "Sin definir";
	}
	return formatCOP(payment.totalDue);
}

function isSelectable(payment: Payment): boolean {
	return payment.status !== "cancelled";
}

function isPendingLike(payment: Payment): boolean {
	return payment.status === "pending" || payment.status === "overdue";
}

function isPayable(payment: Payment, scheduleMode: ScheduleMode): boolean {
	return (
		isPendingLike(payment) &&
		(scheduleMode !== "manual" || !isManualAmountMissing(payment))
	);
}

export function CreditPaymentTable({
	payments,
	summary,
	scheduleMode,
	onRegisterPayment,
	onMarkUnpaid,
	onGenerateSchedule,
	onEditManual,
	onViewTransaction,
	loadingId,
	generatingSchedule,
}: CreditPaymentTableProps) {
	const [selectedIds, setSelectedIds] = useState<Set<Id<"creditPayments">>>(
		new Set(),
	);

	const selectablePayments = useMemo(
		() => payments.filter(isSelectable),
		[payments],
	);

	const editableManualPayments = useMemo(
		() =>
			scheduleMode === "manual"
				? payments.filter((p) => isPendingLike(p))
				: [],
		[payments, scheduleMode],
	);

	const selectedPayments = useMemo(
		() => payments.filter((p) => selectedIds.has(p._id)),
		[payments, selectedIds],
	);

	const singleSelected =
		selectedPayments.length === 1 ? selectedPayments[0] : null;

	const canEditManual =
		scheduleMode === "manual" &&
		selectedPayments.length > 0 &&
		selectedPayments.every(isPendingLike);

	const canRegister =
		singleSelected !== null &&
		isPayable(singleSelected, scheduleMode) &&
		Boolean(onRegisterPayment);

	const canMarkUnpaid =
		singleSelected !== null &&
		singleSelected.status === "paid" &&
		Boolean(onMarkUnpaid);

	const manualEditLabel =
		selectedPayments.some((p) => isManualAmountMissing(p)) ||
		selectedPayments.every((p) => isManualAmountMissing(p))
			? "Ingresar valor"
			: "Editar valor";

	const allSelectableSelected =
		selectablePayments.length > 0 &&
		selectedIds.size === selectablePayments.length;

	const toggleRow = (paymentId: Id<"creditPayments">, checked: boolean) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (checked) next.add(paymentId);
			else next.delete(paymentId);
			return next;
		});
	};

	const toggleAll = (checked: boolean) => {
		if (checked) {
			setSelectedIds(new Set(selectablePayments.map((p) => p._id)));
		} else {
			setSelectedIds(new Set());
		}
	};

	const clearSelection = () => setSelectedIds(new Set());

	const handleRegisterPayment = () => {
		if (!canRegister || !singleSelected || !onRegisterPayment) return;
		onRegisterPayment(singleSelected);
		clearSelection();
	};

	const handleEditManual = () => {
		if (!canEditManual || !onEditManual) return;
		onEditManual(editableManualPayments, [...selectedIds]);
	};

	const handleRowClick = (payment: Payment) => {
		if (
			payment.status !== "paid" ||
			!payment.transactionId ||
			!onViewTransaction
		) {
			return;
		}
		onViewTransaction(payment.transactionId);
	};

	const handleMarkUnpaid = async () => {
		if (!canMarkUnpaid || !singleSelected || !onMarkUnpaid) return;
		await onMarkUnpaid(singleSelected._id);
		clearSelection();
	};

	const nextPending = payments.find(
		(p) =>
			isPendingLike(p) &&
			(scheduleMode !== "manual" || !isManualAmountMissing(p)),
	);

	if (payments.length === 0) {
		return (
			<div className="credit-payments-empty glass animate-stagger-item">
				<p className="credit-payments-empty__title">
					Aún no hay cuotas en la tabla
				</p>
				<p className="tx-form__hint">
					{scheduleMode === "manual"
						? `Modo manual — genera las ${summary.total} cuotas con fechas de vencimiento. Luego ingresa el valor de cada una según tu extracto.`
						: `Modo ${SCHEDULE_MODE_LABELS[scheduleMode]} — puedes generar la tabla completa de ${summary.total} cuotas mensuales con fechas y montos.`}
				</p>
				<div className="credit-payments-empty__actions">
					{onGenerateSchedule ? (
						<Button
							onClick={onGenerateSchedule}
							disabled={generatingSchedule}
						>
							{generatingSchedule
								? "Generando…"
								: `Generar ${summary.total} cuotas`}
						</Button>
					) : null}
				</div>
			</div>
		);
	}

	return (
		<div className="credit-payments-panel animate-stagger">
			<div className="credit-payments-summary glass animate-stagger-item">
				<div className="credit-payments-summary__stat">
					<span className="credit-summary__label">Total cuotas</span>
					<strong>{summary.total}</strong>
				</div>
				<div className="credit-payments-summary__stat">
					<span className="credit-summary__label">Pagadas</span>
					<strong>{summary.paid}</strong>
				</div>
				<div className="credit-payments-summary__stat">
					<span className="credit-summary__label">Pendientes</span>
					<strong>{summary.pending}</strong>
				</div>
				{nextPending ? (
					<div className="credit-payments-summary__stat credit-payments-summary__stat--highlight">
						<span className="credit-summary__label">Próxima cuota</span>
						<strong>
							#{nextPending.installmentNumber} —{" "}
							{formatShortDate(nextPending.dueDate)} —{" "}
							{formatCOP(nextPending.totalDue)}
						</strong>
					</div>
				) : null}
			</div>

			<div className="payment-table-toolbar glass animate-stagger-item">
				<span className="payment-table-toolbar__count">
					{selectedIds.size > 0
						? `${selectedIds.size} seleccionada(s)`
						: onViewTransaction
							? "Marca cuotas para actuar · clic en pagada = ver movimiento"
							: "Selecciona cuotas para actuar"}
				</span>
				<div className="payment-table-toolbar__actions">
					{onEditManual && scheduleMode === "manual" ? (
						<Button
							variant="secondary"
							disabled={!canEditManual}
							onClick={handleEditManual}
						>
							{manualEditLabel}
						</Button>
					) : null}
					{onRegisterPayment ? (
						<Button disabled={!canRegister} onClick={handleRegisterPayment}>
							Registrar pago
						</Button>
					) : null}
					{onMarkUnpaid ? (
						<Button
							variant="secondary"
							disabled={
								!canMarkUnpaid || loadingId === singleSelected?._id
							}
							onClick={() => void handleMarkUnpaid()}
						>
							{loadingId === singleSelected?._id
								? "…"
								: "Volver a pendiente"}
						</Button>
					) : null}
				</div>
			</div>

			<div className="payment-table-wrap animate-stagger-item">
				<table className="payment-table">
					<thead>
						<tr>
							<th className="payment-table__check-col">
								<Checkbox
									checked={allSelectableSelected}
									onChange={toggleAll}
									label=""
									aria-label="Seleccionar todas las cuotas"
								/>
							</th>
							<th>#</th>
							<th>Vencimiento</th>
							<th>Total</th>
							<th>Estado</th>
						</tr>
					</thead>
					<tbody>
						{payments.map((p) => {
							const missingAmount =
								scheduleMode === "manual" && isManualAmountMissing(p);
							const selectable = isSelectable(p);
							const opensMovement =
								p.status === "paid" &&
								Boolean(p.transactionId) &&
								Boolean(onViewTransaction);
							const rowClassName = [
								selectedIds.has(p._id)
									? "payment-table__row--selected"
									: "",
								opensMovement ? "payment-table__row--clickable" : "",
							]
								.filter(Boolean)
								.join(" ");
							return (
								<tr
									key={p._id}
									className={rowClassName || undefined}
									onClick={() => handleRowClick(p)}
									title={
										opensMovement
											? "Ver movimiento del pago"
											: undefined
									}
								>
									<td
										className="payment-table__check-col"
										onClick={(event) => event.stopPropagation()}
									>
										{selectable ? (
											<Checkbox
												checked={selectedIds.has(p._id)}
												onChange={(checked) => toggleRow(p._id, checked)}
												label=""
												aria-label={`Seleccionar cuota ${p.installmentNumber}`}
											/>
										) : null}
									</td>
									<td>{p.installmentNumber}</td>
									<td>{formatShortDate(p.dueDate)}</td>
									<td
										className={
											missingAmount ? "payment-table__cell--muted" : undefined
										}
									>
										{formatPaymentTotal(p, scheduleMode)}
									</td>
									<td>
										<span
											className={`payment-status payment-status--${p.status}`}
										>
											{STATUS_LABELS[p.status]}
										</span>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}
