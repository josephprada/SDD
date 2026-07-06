import { formatCOP } from "@app/lib/format/currency";
import { formatShortDate } from "@app/lib/format/date";
import type { ScheduleMode } from "@app/lib/credits/types";
import { SCHEDULE_MODE_LABELS } from "@app/lib/credits/types";
import { Button } from "@jp-ds";
import type { FunctionReturnType } from "convex/server";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

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
	onEditManual?: (payment: Payment) => void;
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

export function CreditPaymentTable({
	payments,
	summary,
	scheduleMode,
	onRegisterPayment,
	onMarkUnpaid,
	onGenerateSchedule,
	onEditManual,
	loadingId,
	generatingSchedule,
}: CreditPaymentTableProps) {
	const nextPending = payments.find(
		(p) =>
			(p.status === "pending" || p.status === "overdue") &&
			(scheduleMode !== "manual" || !isManualAmountMissing(p)),
	);

	if (payments.length === 0) {
		return (
			<div className="credit-payments-empty glass">
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
		<div className="credit-payments-panel">
			<div className="credit-payments-summary glass">
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

			<div className="payment-table-wrap">
				<table className="payment-table">
					<thead>
						<tr>
							<th>#</th>
							<th>Vencimiento</th>
							<th>Total</th>
							<th>Estado</th>
							<th />
						</tr>
					</thead>
					<tbody>
						{payments.map((p) => {
							const missingAmount =
								scheduleMode === "manual" && isManualAmountMissing(p);
							return (
								<tr key={p._id}>
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
									<td>
										{missingAmount && onEditManual ? (
											<Button
												variant="secondary"
												disabled={loadingId === p._id}
												onClick={() => onEditManual(p)}
											>
												Ingresar valor
											</Button>
										) : p.status === "paid" && onMarkUnpaid ? (
											<Button
												variant="secondary"
												disabled={loadingId === p._id}
												onClick={() => onMarkUnpaid(p._id)}
											>
												{loadingId === p._id
													? "…"
													: "Volver a pendiente"}
											</Button>
										) : onRegisterPayment &&
										  (p.status === "pending" || p.status === "overdue") &&
										  !missingAmount ? (
											<Button
												variant="secondary"
												disabled={loadingId === p._id}
												onClick={() => onRegisterPayment(p)}
											>
												Registrar pago
											</Button>
										) : scheduleMode === "manual" &&
										  onEditManual &&
										  p.status !== "paid" &&
										  p.status !== "cancelled" ? (
											<Button
												variant="secondary"
												disabled={loadingId === p._id}
												onClick={() => onEditManual(p)}
											>
												Editar
											</Button>
										) : null}
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
