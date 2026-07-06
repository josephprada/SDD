import { CapitalAbonoForm } from "@app/components/credits/CapitalAbonoForm";
import type { CapitalAbonoFormValues } from "@app/components/credits/CapitalAbonoForm";
import { MarkCreditPaymentModal } from "@app/components/credits/MarkCreditPaymentModal";
import { CreditPaymentTable } from "@app/components/credits/CreditPaymentTable";
import { DestinationChart } from "@app/components/credits/DestinationChart";
import { DestinationForm } from "@app/components/credits/DestinationForm";
import { DestinationList } from "@app/components/credits/DestinationList";
import { PayoffSimulator } from "@app/components/credits/PayoffSimulator";
import { Modal } from "@app/components/ui/Modal";
import { ConfirmDialog } from "@app/components/ui/ConfirmDialog";
import { ManualPaymentForm } from "@app/components/credits/ManualPaymentForm";
import { CreditSettingsForm } from "@app/components/credits/CreditSettingsForm";
import { useTransactionModalStore } from "@app/stores/transactionModal";
import {
	CREDIT_STATUS_LABELS,
	RECALC_EFFECT_LABELS,
	type CreditTab,
} from "@app/lib/credits/types";
import { formatCOP } from "@app/lib/format/currency";
import { formatFullDate } from "@app/lib/format/date";
import { CoreIcon } from "@app/lib/core/icons";
import type { FunctionReturnType } from "convex/server";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@jp-ds";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { useToastStore } from "@app/stores/toast";

type CreditPayment = FunctionReturnType<
	typeof api.creditPayments.listByCredit
>[number];

type CreditAbono = FunctionReturnType<
	typeof api.creditCapitalAbonos.list
>[number];

const TABS: Array<{ id: CreditTab; label: string }> = [
	{ id: "payments", label: "Cuotas" },
	{ id: "abonos", label: "Abonos" },
	{ id: "destinations", label: "Destinos" },
	{ id: "settings", label: "Ajustes" },
];

const VALID_TABS = new Set<CreditTab>(TABS.map((t) => t.id));

function resolveTab(raw: string | null): CreditTab {
	if (raw === "fund") return "destinations";
	if (raw && VALID_TABS.has(raw as CreditTab)) return raw as CreditTab;
	return "payments";
}

export function CreditDetailRoute() {
	const navigate = useNavigate();
	const showToast = useToastStore((s) => s.show);
	const openEditTransaction = useTransactionModalStore((s) => s.openEdit);
	const { id } = useParams<{ id: string }>();
	const creditId = id as Id<"credits">;
	const [searchParams, setSearchParams] = useSearchParams();
	const tab = resolveTab(searchParams.get("tab"));

	const credit = useQuery(api.credits.get, { creditId });
	const payments = useQuery(api.creditPayments.listByCredit, { creditId });
	const abonos = useQuery(api.creditCapitalAbonos.list, { creditId });
	const savingsGoals = useQuery(api.savingsGoals.list, {});
	const linkedGoals =
		savingsGoals?.filter((g) => g.linkedCreditId === creditId) ?? [];
	const destinations = useQuery(api.creditDestinations.list, { creditId });
	const fundSummary = useQuery(api.credits.fundSummary, { creditId });
	const categories = useQuery(api.categories.list, {
		type: "expense",
		includeArchived: false,
	});
	const linkableExpenseCategories =
		categories?.filter((c) => !c.linkedCreditId).map((c) => ({
			_id: c._id,
			name: c.name,
		})) ?? [];
	const accounts = useQuery(api.accounts.list, { includeArchived: false });

	const markPaid = useMutation(api.creditPayments.markPaid);
	const markUnpaid = useMutation(api.creditPayments.markUnpaid);
	const createAbono = useMutation(api.creditCapitalAbonos.create);
	const updateAbono = useMutation(api.creditCapitalAbonos.update);
	const removeAbono = useMutation(api.creditCapitalAbonos.remove);
	const createDestination = useMutation(api.creditDestinations.create);
	const updateDestination = useMutation(api.creditDestinations.update);
	const removeDestination = useMutation(api.creditDestinations.remove);
	const updateCredit = useMutation(api.credits.update);
	const removeCredit = useMutation(api.credits.remove);
	const ensureSchedule = useMutation(api.credits.ensurePaymentSchedule);
	const updateManualRow = useMutation(api.credits.updateManualRow);

	const [payingId, setPayingId] = useState<string | null>(null);
	const [paymentModal, setPaymentModal] = useState(false);
	const [paymentModalPaymentId, setPaymentModalPaymentId] = useState<
		Id<"creditPayments"> | null
	>(null);
	const [destModal, setDestModal] = useState(false);
	const [editingDestinationId, setEditingDestinationId] =
		useState<Id<"creditDestinations"> | null>(null);
	const [manualModal, setManualModal] = useState(false);
	const [abonoModal, setAbonoModal] = useState(false);
	const [editingAbonoId, setEditingAbonoId] =
		useState<Id<"creditCapitalAbonos"> | null>(null);
	const [abonoInitial, setAbonoInitial] =
		useState<Partial<CapitalAbonoFormValues>>();
	const [abonoSavingsGoalId, setAbonoSavingsGoalId] =
		useState<Id<"savingsGoals"> | null>(null);
	const [confirmDeleteAbono, setConfirmDeleteAbono] = useState(false);
	const [editingPayment, setEditingPayment] = useState<CreditPayment | null>(
		null,
	);
	const [loading, setLoading] = useState(false);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [generatingSchedule, setGeneratingSchedule] = useState(false);
	const [settingsError, setSettingsError] = useState("");
	const [error, setError] = useState("");
	const scheduleRequested = useRef(false);

	useEffect(() => {
		const raw = searchParams.get("tab");
		if (raw === "fund" || (raw && !VALID_TABS.has(raw as CreditTab))) {
			setSearchParams(
				{ tab: raw === "fund" ? "destinations" : "payments" },
				{ replace: true },
			);
		}
	}, [searchParams, setSearchParams]);

	useEffect(() => {
		if (
			credit === undefined ||
			payments === undefined ||
			scheduleRequested.current
		) {
			return;
		}
		if (payments.length === 0 && credit.status === "active") {
			scheduleRequested.current = true;
			setGeneratingSchedule(true);
			void ensureSchedule({ creditId })
				.catch((e) => {
					setError(
						e instanceof Error ? e.message : "No se pudo generar la tabla",
					);
				})
				.finally(() => setGeneratingSchedule(false));
		}
	}, [credit, payments, creditId, ensureSchedule]);

	if (
		credit === undefined ||
		payments === undefined ||
		abonos === undefined ||
		destinations === undefined ||
		accounts === undefined ||
		fundSummary === undefined
	) {
		return null;
	}

	const hasFund = Boolean(fundSummary.disbursementAccountId);

	const setTab = (next: CreditTab) => {
		setSearchParams({ tab: next });
	};

	const editingDestination = editingDestinationId
		? destinations?.destinations.find((d) => d._id === editingDestinationId)
		: null;

	const closeDestModal = () => {
		setDestModal(false);
		setEditingDestinationId(null);
		setError("");
	};

	const editingAbono = editingAbonoId
		? abonos.find((abono) => abono._id === editingAbonoId)
		: null;

	const closeAbonoModal = () => {
		setAbonoModal(false);
		setEditingAbonoId(null);
		setAbonoInitial(undefined);
		setAbonoSavingsGoalId(null);
		setError("");
	};

	const openAbonoModal = (
		initial?: Partial<CapitalAbonoFormValues>,
		savingsGoalId?: Id<"savingsGoals">,
	) => {
		setEditingAbonoId(null);
		setAbonoInitial(initial);
		setAbonoSavingsGoalId(savingsGoalId ?? null);
		setError("");
		setAbonoModal(true);
	};

	const openEditAbono = (abono: CreditAbono) => {
		setEditingAbonoId(abono._id);
		setAbonoInitial({
			amount: abono.amount,
			paidAt: abono.paidAt,
			recalcEffect: abono.recalcEffect,
			notes: abono.notes,
		});
		setError("");
		setAbonoModal(true);
	};

	const isGoalReadyForAbono = (goal: (typeof linkedGoals)[number]) =>
		goal.status === "completed" || goal.currentAmount >= goal.targetAmount;

	const handleDeleteAbono = async () => {
		if (!editingAbonoId) return;
		setLoading(true);
		try {
			await removeAbono({ abonoId: editingAbonoId });
			setConfirmDeleteAbono(false);
			closeAbonoModal();
			showToast({
				title: "Abono eliminado",
				body: "Las cuotas se recalcularon. Si aplicó una meta de ahorro, esta fue restaurada.",
			});
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error al eliminar abono");
			setConfirmDeleteAbono(false);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="credits-page animate-stagger">
			<header className="credits-header">
				<div>
					<Link to="/credits" className="credit-detail-back">
						<CoreIcon name="chevron-left" size={16} /> Créditos
					</Link>
					<h1 className="page-title">{credit.name}</h1>
					<p className="page-subtitle">
						{credit.lender} — {CREDIT_STATUS_LABELS[credit.status]}
					</p>
				</div>
			</header>

			<div className="credit-summary">
				<div className="credit-summary__item">
					<span className="credit-summary__label">Saldo deuda</span>
					<strong>{formatCOP(credit.outstandingBalance)}</strong>
				</div>
				{hasFund ? (
					<>
						<div className="credit-summary__item">
							<span className="credit-summary__label">
								Gastado del desembolso
							</span>
							<strong>
								{formatCOP(fundSummary.spentFromDisbursement)}
							</strong>
						</div>
						<div className="credit-summary__item">
							<span className="credit-summary__label">
								Disponible del desembolso
							</span>
							<strong>
								{formatCOP(fundSummary.availableFromDisbursement)}
							</strong>
						</div>
					</>
				) : (
					<div className="credit-summary__item">
						<span className="credit-summary__label">Desembolso</span>
						<strong>{formatCOP(credit.principal)}</strong>
					</div>
				)}
				{credit.targetPayoffDate ? (
					<div className="credit-summary__item">
						<span className="credit-summary__label">Meta pago</span>
						<strong>{formatFullDate(credit.targetPayoffDate)}</strong>
					</div>
				) : null}
				<div className="credit-summary__item">
					<span className="credit-summary__label">Cuotas</span>
					<strong>
						{credit.paymentsSummary.paid} pagadas ·{" "}
						{credit.paymentsSummary.pending} pendientes ·{" "}
						{credit.termMonths} total
					</strong>
				</div>
			</div>

			<nav className="credit-tabs" aria-label="Secciones del crédito">
				{TABS.map((t) => (
					<button
						key={t.id}
						type="button"
						className={`credit-tab${tab === t.id ? " credit-tab--active" : ""}`}
						onClick={() => setTab(t.id)}
					>
						{t.label}
					</button>
				))}
			</nav>

			{tab === "payments" ? (
				<>
					<div className="credits-header">
						<h2 className="section-title">Cuotas</h2>
						<Button
							onClick={() => {
								setPaymentModalPaymentId(null);
								setPaymentModal(true);
								setError("");
							}}
						>
							Registrar pago
						</Button>
					</div>
					<CreditPaymentTable
					payments={payments}
					summary={{
						total: credit.termMonths,
						paid: credit.paymentsSummary.paid,
						pending: credit.paymentsSummary.pending,
					}}
					scheduleMode={credit.scheduleMode}
					generatingSchedule={generatingSchedule}
					loadingId={payingId}
					onGenerateSchedule={async () => {
						setGeneratingSchedule(true);
						setError("");
						try {
							await ensureSchedule({ creditId });
						} catch (e) {
							setError(
								e instanceof Error
									? e.message
									: "No se pudo generar la tabla",
							);
						} finally {
							setGeneratingSchedule(false);
						}
					}}
					onEditManual={(payment) => {
						setEditingPayment(payment);
						setManualModal(true);
					}}
					onRegisterPayment={(payment) => {
						setPaymentModalPaymentId(payment._id);
						setPaymentModal(true);
						setError("");
					}}
					onMarkUnpaid={async (paymentId) => {
						setPayingId(paymentId);
						try {
							await markUnpaid({ paymentId });
						} catch (e) {
							setError(
								e instanceof Error
									? e.message
									: "No se pudo revertir la cuota",
							);
						} finally {
							setPayingId(null);
						}
					}}
				/>
				</>
			) : null}

			<MarkCreditPaymentModal
				open={paymentModal}
				creditName={credit.name}
				paymentAccountName={credit.paymentAccountName}
				payments={payments}
				initialPaymentId={paymentModalPaymentId ?? undefined}
				error={error}
				loading={loading}
				onClose={() => {
					setPaymentModal(false);
					setPaymentModalPaymentId(null);
					setError("");
				}}
				onConfirm={async (paymentId) => {
					setLoading(true);
					setError("");
					setPayingId(paymentId);
					try {
						await markPaid({ paymentId, paidDate: Date.now() });
						setPaymentModal(false);
						setPaymentModalPaymentId(null);
					} catch (e) {
						setError(
							e instanceof Error
								? e.message
								: "No se pudo registrar el pago",
						);
					} finally {
						setLoading(false);
						setPayingId(null);
					}
				}}
			/>

			<Modal
				open={manualModal}
				onClose={() => {
					setManualModal(false);
					setEditingPayment(null);
					setError("");
				}}
				title={
					editingPayment
						? editingPayment.totalDue > 0
							? `Editar cuota #${editingPayment.installmentNumber}`
							: `Cuota #${editingPayment.installmentNumber}`
						: "Valor de cuota"
				}
			>
				{editingPayment ? (
					<ManualPaymentForm
						key={editingPayment._id}
						installmentNumber={editingPayment.installmentNumber}
						dueDate={editingPayment.dueDate}
						initialTotal={editingPayment.totalDue}
						error={error}
						loading={loading}
						onCancel={() => {
							setManualModal(false);
							setEditingPayment(null);
						}}
						onSubmit={async (values) => {
							setLoading(true);
							setError("");
							try {
								await updateManualRow({
									paymentId: editingPayment._id,
									totalAmount: values.totalAmount,
								});
								setManualModal(false);
								setEditingPayment(null);
							} catch (e) {
								setError(
									e instanceof Error
										? e.message
										: "Error al guardar valor",
								);
							} finally {
								setLoading(false);
							}
						}}
					/>
				) : null}
			</Modal>

			{tab === "abonos" ? (
				<div className="credit-tab-panel">
					<div className="credits-header">
						<h2 className="section-title">Abonos a capital</h2>
						<Button
							onClick={() =>
								openAbonoModal({
									recalcEffect: credit.defaultRecalcOnAbono,
								})
							}
						>
							Registrar abono
						</Button>
					</div>
					<PayoffSimulator creditId={creditId} />
					{linkedGoals.length > 0 ? (
						<div>
							<h3 className="section-title">Ahorro para abonos</h3>
							<ul className="credit-list">
								{linkedGoals.map((goal) => {
									const pct = Math.min(
										100,
										Math.round(goal.percent * 100),
									);
									const ready = isGoalReadyForAbono(goal);
									return (
										<li
											key={goal._id}
											className="credit-card glass savings-goal-card destination-card"
										>
											<div className="destination-card__header">
												<div className="credit-card__main credit-card__main--static">
													<div className="credit-card__row">
														<strong>{goal.name}</strong>
														<span>{pct}%</span>
													</div>
													<div className="savings-progress" aria-hidden>
														<div
															className="savings-progress__fill"
															style={{ width: `${pct}%` }}
														/>
													</div>
													<span className="credit-card__lender">
														Ahorrado {formatCOP(goal.currentAmount)} de{" "}
														{formatCOP(goal.targetAmount)}
														{ready
															? " — meta cumplida"
															: " — sigue aportando para habilitar el abono"}
													</span>
												</div>
												{ready ? (
													<div className="credit-card__actions">
														<Button
															onClick={() =>
																openAbonoModal(
																	{
																		amount: goal.currentAmount,
																		paidAt: Date.now(),
																		recalcEffect:
																			credit.defaultRecalcOnAbono,
																		notes: `Abono desde meta «${goal.name}»`,
																	},
																	goal._id,
																)
															}
														>
															Abonar a capital
														</Button>
													</div>
												) : null}
											</div>
										</li>
									);
								})}
							</ul>
						</div>
					) : null}
					{abonos.length > 0 ? (
						<ul className="credit-list">
							{abonos.map((abono) => (
								<li key={abono._id} className="credit-card glass interactive-lift">
									<button
										type="button"
										className="credit-card__main"
										onClick={() => openEditAbono(abono)}
									>
										<div className="credit-card__row">
											<strong>{formatFullDate(abono.paidAt)}</strong>
											<span>{formatCOP(abono.amount)}</span>
										</div>
										<span className="credit-card__lender">
											{RECALC_EFFECT_LABELS[abono.recalcEffect]}
										</span>
										{abono.notes ? (
											<span className="credit-card__lender">
												{abono.notes}
											</span>
										) : null}
									</button>
								</li>
							))}
						</ul>
					) : (
						<p className="tx-form__hint">
							Aún no hay abonos registrados. Usa el botón de arriba cuando
							hagas un pago extra a capital.
						</p>
					)}
					<Modal
						open={abonoModal}
						onClose={closeAbonoModal}
						title={
							editingAbonoId
								? "Editar abono a capital"
								: "Registrar abono a capital"
						}
					>
						<CapitalAbonoForm
							key={editingAbonoId ?? abonoInitial?.amount ?? "new"}
							initial={abonoInitial ?? editingAbono ?? undefined}
							error={error}
							loading={loading}
							onCancel={closeAbonoModal}
							onDelete={
								editingAbonoId
									? () => setConfirmDeleteAbono(true)
									: undefined
							}
							submitLabel={
								editingAbonoId ? "Guardar abono" : "Registrar abono"
							}
							onSubmit={async (values) => {
								setLoading(true);
								setError("");
								try {
									if (editingAbonoId) {
										await updateAbono({
											abonoId: editingAbonoId,
											...values,
										});
										showToast({
											title: "Abono actualizado",
											body: "Las cuotas pendientes se recalcularon.",
										});
									} else {
										await createAbono({
											creditId,
											...values,
											savingsGoalId: abonoSavingsGoalId ?? undefined,
										});
										showToast({
											title: "Abono registrado",
											body: "El abono a capital quedó aplicado al crédito.",
										});
									}
									closeAbonoModal();
								} catch (e) {
									setError(
										e instanceof Error
											? e.message
											: "Error al guardar abono",
									);
								} finally {
									setLoading(false);
								}
							}}
						/>
					</Modal>
					<ConfirmDialog
						open={confirmDeleteAbono}
						title="Eliminar abono a capital"
						description="Se recalcularán las cuotas pendientes. Si este abono consumió una meta de ahorro, la meta volverá a aparecer en Ahorros."
						confirmLabel="Eliminar"
						variant="danger"
						onConfirm={handleDeleteAbono}
						onCancel={() => setConfirmDeleteAbono(false)}
					/>
				</div>
			) : null}

			{tab === "destinations" ? (
				<div>
					<div className="credits-header">
						<div>
							<h2 className="section-title">Rubros / destinos</h2>
							<p className="page-subtitle">
								Registra nuevos gastos del fondo desde el botón de movimientos,
								usando las categorías de gasto del crédito.
							</p>
						</div>
						<Button
							onClick={() => {
								setEditingDestinationId(null);
								setDestModal(true);
							}}
						>
							Nuevo rubro
						</Button>
					</div>
					<DestinationChart
						destinations={destinations.destinations}
						principal={credit.principal}
					/>
					<DestinationList
						data={destinations}
						onEdit={(destination) => {
							setEditingDestinationId(destination._id);
							setDestModal(true);
						}}
						onMovementClick={(transactionId) =>
							openEditTransaction(transactionId as Id<"transactions">)
						}
						onDelete={async (destinationId) => {
							await removeDestination({
								destinationId: destinationId as Id<"creditDestinations">,
							});
						}}
					/>
					<Modal
						open={destModal}
						onClose={closeDestModal}
						title={editingDestinationId ? "Editar rubro" : "Nuevo rubro"}
					>
						<DestinationForm
							key={editingDestinationId ?? "new"}
							initial={
								editingDestination
									? {
											name: editingDestination.name,
											amount: editingDestination.amount,
											notes: editingDestination.notes,
										}
									: undefined
							}
							error={error}
							loading={loading}
							onCancel={closeDestModal}
							onSubmit={async (values) => {
								setLoading(true);
								setError("");
								try {
									if (editingDestinationId) {
										await updateDestination({
											destinationId: editingDestinationId,
											...values,
										});
									} else {
										await createDestination({ creditId, ...values });
									}
									closeDestModal();
								} catch (e) {
									setError(
										e instanceof Error ? e.message : "Error al guardar rubro",
									);
								} finally {
									setLoading(false);
								}
							}}
						/>
					</Modal>
				</div>
			) : null}

			{tab === "settings" ? (
				<CreditSettingsForm
					credit={credit}
					accounts={accounts.map((a) => ({ _id: a._id, name: a.name }))}
					expenseCategories={linkableExpenseCategories}
					error={settingsError}
					loading={loading}
					deleteLoading={deleteLoading}
					onSave={async (values) => {
						setLoading(true);
						setSettingsError("");
						try {
							const hadFund = Boolean(credit.disbursementAccountId);
							const hadOperating = Boolean(credit.operatingAccountId);
							await updateCredit({
								creditId,
								name: values.name,
								lender: values.lender,
								notes: values.notes,
								targetPayoffDate: values.targetPayoffDate,
								clearTargetPayoffDate:
									Boolean(credit.targetPayoffDate) &&
									!values.targetPayoffDate,
								defaultRecalcOnAbono: values.defaultRecalcOnAbono,
								disbursementAccountId: values.disbursementAccountId,
								operatingAccountId: values.operatingAccountId,
								clearDisbursementAccount:
									hadFund && !values.disbursementAccountId,
								clearOperatingAccount:
									hadOperating && !values.operatingAccountId,
								fundExpenseCategoryIds: values.fundExpenseCategoryIds,
								newFundExpenseCategoryNames:
									values.newFundExpenseCategoryNames,
							});
							showToast({
								title: "Guardado exitosamente!",
								body: "Los ajustes del crédito se actualizaron.",
							});
						} catch (e) {
							setSettingsError(
								e instanceof Error ? e.message : "Error al guardar",
							);
						} finally {
							setLoading(false);
						}
					}}
					onDelete={async () => {
						setDeleteLoading(true);
						try {
							await removeCredit({ creditId });
							navigate("/credits", { replace: true });
						} catch (e) {
							setSettingsError(
								e instanceof Error ? e.message : "Error al eliminar",
							);
						} finally {
							setDeleteLoading(false);
						}
					}}
				/>
			) : null}
		</div>
	);
}
