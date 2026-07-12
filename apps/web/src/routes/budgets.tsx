import { BudgetForm } from "@app/components/budgets/BudgetForm";
import { BudgetList } from "@app/components/budgets/BudgetList";
import { FixedExpenseForm } from "@app/components/budgets/FixedExpenseForm";
import { FixedExpenseList } from "@app/components/budgets/FixedExpenseList";
import { MarkFixedExpensePaidModal } from "@app/components/budgets/MarkFixedExpensePaidModal";
import { BrandLogoMark } from "@app/components/brand/BrandLogoMark";
import { MonthSwitcher } from "@app/components/dashboard/MonthSwitcher";
import { ConfirmDialog } from "@app/components/ui/ConfirmDialog";
import { Modal } from "@app/components/ui/Modal";
import type { BudgetItem, FixedExpenseItem } from "@app/lib/budgets/types";
import { useFixedExpensePayment } from "@app/lib/budgets/useFixedExpensePayment";
import { useReconcileFixedExpensePayments } from "@app/lib/budgets/useReconcileFixedExpensePayments";
import { addMonths, formatMonthYear } from "@app/lib/format/date";
import { formatConvexError } from "@app/lib/convex/formatError";
import { periodKeyFromDate } from "@app/lib/period";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { CoreIcon } from "@app/lib/core/icons";
import { Button, IconButton } from "@jp-ds";
import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";

type Tab = "budgets" | "fixed";

export function BudgetsRoute() {
	const [searchParams] = useSearchParams();
	const initialTab: Tab = searchParams.get("tab") === "fixed" ? "fixed" : "budgets";
	const [tab, setTab] = useState<Tab>(initialTab);
	useReconcileFixedExpensePayments();
	const [periodMonth, setPeriodMonth] = useState(() => new Date());
	const periodKey = periodKeyFromDate(periodMonth);

	const budgets = useQuery(api.budgets.list, { periodKey });
	const fixedExpenses = useQuery(api.fixedExpenses.list, { periodKey });
	const categories = useQuery(api.categories.list, {
		type: "expense",
		includeArchived: false,
	});

	const createBudget = useMutation(api.budgets.create);
	const updateBudget = useMutation(api.budgets.update);
	const removeBudget = useMutation(api.budgets.remove);
	const createFixed = useMutation(api.fixedExpenses.create);
	const updateFixed = useMutation(api.fixedExpenses.update);
	const removeFixed = useMutation(api.fixedExpenses.remove);
	const acknowledgePaid = useMutation(api.fixedExpenses.acknowledgePaidForPeriod);
	const unmarkPaid = useMutation(api.fixedExpenses.unmarkPaid);
	const payment = useFixedExpensePayment();

	const [budgetModal, setBudgetModal] = useState(false);
	const [editBudget, setEditBudget] = useState<BudgetItem | null>(null);
	const [fixedModal, setFixedModal] = useState(false);
	const [editFixed, setEditFixed] = useState<FixedExpenseItem | null>(null);
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [confirmDeleteBudget, setConfirmDeleteBudget] = useState(false);
	const [budgetToDelete, setBudgetToDelete] = useState<BudgetItem | null>(null);
	const [confirmDeleteFixed, setConfirmDeleteFixed] = useState(false);
	const [fixedToDelete, setFixedToDelete] = useState<FixedExpenseItem | null>(
		null,
	);

	const expenseCategories = useMemo(() => categories ?? [], [categories]);
	const fixedExpenseCategories = useMemo(() => {
		const base = categories ?? [];
		if (!editFixed) return base;
		if (base.some((category) => category._id === editFixed.categoryId)) {
			return base;
		}
		return [
			...base,
			{
				_id: editFixed.categoryId as Id<"categories">,
				name: editFixed.categoryName,
				icon: editFixed.categoryIcon,
				color: editFixed.categoryColor,
			},
		];
	}, [categories, editFixed]);
	const isViewingCurrentMonth =
		periodKey === periodKeyFromDate(new Date());

	const openFixedExpensePayment = (item: FixedExpenseItem) => {
		if (item.isPaidCurrentPeriod) return;
		payment.openPayment({
			id: item._id,
			name: item.name,
			amount: item.amount,
			categoryName: item.categoryName,
			dueDate: item.nextDueDate,
			periodKey,
		});
	};

	if (budgets === undefined || fixedExpenses === undefined) return null;

	const handleBudgetSubmit = async (values: {
		categoryIds: Id<"categories">[];
		amount: number;
		notes?: string;
	}) => {
		setLoading(true);
		setError("");
		try {
			if (editBudget) {
				await updateBudget({
					id: editBudget._id as Id<"budgets">,
					categoryIds: values.categoryIds,
					amount: values.amount,
					notes: values.notes,
				});
			} else {
				await createBudget({ ...values, periodKey });
			}
			setBudgetModal(false);
			setEditBudget(null);
		} catch (e) {
			setError(formatConvexError(e, "Error al guardar el presupuesto"));
		} finally {
			setLoading(false);
		}
	};

	const handleFixedSubmit = async (values: {
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
	}) => {
		setLoading(true);
		setError("");
		const wasPaid = editFixed?.isPaidCurrentPeriod ?? false;
		const { markAsPaid, singleMonthOnly, ...payload } = values;
		try {
			let fixedId: Id<"fixedExpenses">;
			if (editFixed) {
				await updateFixed({
					id: editFixed._id as Id<"fixedExpenses">,
					...payload,
					...(singleMonthOnly && periodKey
						? { onlyPeriodKey: periodKey }
						: {}),
					...(!singleMonthOnly && editFixed.onlyPeriodKey
						? { clearOnlyPeriodKey: true }
						: {}),
				});
				fixedId = editFixed._id as Id<"fixedExpenses">;
			} else {
				fixedId = await createFixed({
					...payload,
					onlyPeriodKey:
						singleMonthOnly && periodKey ? periodKey : undefined,
				});
			}

			if (markAsPaid && !wasPaid) {
				await acknowledgePaid({
					id: fixedId,
					periodKey,
					dueDate: editFixed?.nextDueDate,
				});
			} else if (!markAsPaid && wasPaid) {
				await unmarkPaid({ id: fixedId });
			}

			setFixedModal(false);
			setEditFixed(null);
		} catch (e) {
			setError(formatConvexError(e, "Error al guardar el gasto fijo"));
		} finally {
			setLoading(false);
		}
	};

	const createLabel = tab === "budgets" ? "Nuevo presupuesto" : "Nuevo gasto fijo";

	const handleCreate = () => {
		if (tab === "budgets") {
			setEditBudget(null);
			setBudgetModal(true);
		} else {
			setEditFixed(null);
			setFixedModal(true);
		}
	};

	const handleDeleteBudget = async () => {
		const target = budgetToDelete ?? editBudget;
		if (!target) return;
		setLoading(true);
		try {
			await removeBudget({ id: target._id as Id<"budgets"> });
			setConfirmDeleteBudget(false);
			setBudgetToDelete(null);
			setBudgetModal(false);
			setEditBudget(null);
		} finally {
			setLoading(false);
		}
	};

	const requestDeleteBudget = (item: BudgetItem) => {
		setBudgetToDelete(item);
		setConfirmDeleteBudget(true);
		setBudgetModal(false);
		setEditBudget(null);
	};

	const handleDeleteFixed = async () => {
		const target = fixedToDelete ?? editFixed;
		if (!target) return;
		setLoading(true);
		try {
			await removeFixed({ id: target._id as Id<"fixedExpenses"> });
			setConfirmDeleteFixed(false);
			setFixedToDelete(null);
			setFixedModal(false);
			setEditFixed(null);
		} finally {
			setLoading(false);
		}
	};

	const requestDeleteFixed = (item: FixedExpenseItem) => {
		setFixedToDelete(item);
		setConfirmDeleteFixed(true);
	};

	return (
		<div className="animate-stagger">
			<div className="page-header animate-stagger-item">
				<div className="dash-header__brand show-desktop">
					<BrandLogoMark size={42} />
					<div>
						<h1 className="page-title">Presupuestos</h1>
						<p className="page-subtitle">
							{tab === "budgets"
								? `Límites del mes · ${formatMonthYear(periodMonth)}`
								: `Pagos del mes · ${formatMonthYear(periodMonth)}`}
						</p>
					</div>
				</div>
				<div className="page-header__mobile show-mobile">
					<BrandLogoMark size={28} />
					<h1 className="page-title">Presupuestos</h1>
				</div>
				<div className="page-header__controls">
					<div className="show-mobile">
						<MonthSwitcher
							month={periodMonth}
							onPrev={() => setPeriodMonth((m) => addMonths(m, -1))}
							onNext={() => setPeriodMonth((m) => addMonths(m, 1))}
							compact
						/>
					</div>
					<div className="show-desktop">
						<MonthSwitcher
							month={periodMonth}
							onPrev={() => setPeriodMonth((m) => addMonths(m, -1))}
							onNext={() => setPeriodMonth((m) => addMonths(m, 1))}
						/>
					</div>
					<div className="page-header__actions show-desktop">
						<Button type="button" onClick={handleCreate}>
							<CoreIcon name="plus" size={16} /> {createLabel}
						</Button>
					</div>
					<div className="page-header__actions show-mobile">
						<IconButton aria-label={createLabel} onClick={handleCreate}>
							<CoreIcon name="plus" size={20} />
						</IconButton>
					</div>
				</div>
			</div>

			<div className="budget-tabs animate-stagger-item">
				<button
					type="button"
					className={`budget-tabs__btn${tab === "budgets" ? " budget-tabs__btn--active" : ""}`}
					onClick={() => setTab("budgets")}
				>
					Presupuestos
				</button>
				<button
					type="button"
					className={`budget-tabs__btn${tab === "fixed" ? " budget-tabs__btn--active" : ""}`}
					onClick={() => setTab("fixed")}
				>
					Gastos fijos
				</button>
			</div>

			{tab === "budgets" ? (
				<>
					<BudgetList
						items={budgets as BudgetItem[]}
						onEdit={(item) => {
							setEditBudget(item);
							setBudgetModal(true);
						}}
						onDelete={(id) => {
							const item = (budgets as BudgetItem[]).find(
								(entry) => entry._id === id,
							);
							if (item) requestDeleteBudget(item);
						}}
					/>
				</>
			) : (
				<>
					<FixedExpenseList
						items={fixedExpenses as FixedExpenseItem[]}
						isViewingCurrentMonth={isViewingCurrentMonth}
						onEdit={(item) => {
							setEditFixed(item);
							setFixedModal(true);
						}}
						onDelete={(id) => {
							const item = (fixedExpenses as FixedExpenseItem[]).find(
								(entry) => entry._id === id,
							);
							if (item) requestDeleteFixed(item);
						}}
						onMarkPaid={openFixedExpensePayment}
					/>
				</>
			)}

			<Modal
				open={budgetModal}
				onClose={() => {
					setBudgetModal(false);
					setEditBudget(null);
				}}
				title={editBudget ? "Editar presupuesto" : "Nuevo presupuesto"}
			>
				<BudgetForm
					categories={expenseCategories}
					initial={
						editBudget
							? {
									categoryIds: editBudget.categoryIds as Id<"categories">[],
									amount: editBudget.amount,
									notes: editBudget.notes,
								}
							: undefined
					}
					loading={loading}
					serverError={error}
					onSubmit={handleBudgetSubmit}
					onCancel={() => {
						setBudgetModal(false);
						setEditBudget(null);
					}}
					onDelete={
						editBudget
							? () => {
									setBudgetToDelete(editBudget);
									setConfirmDeleteBudget(true);
									setBudgetModal(false);
								}
							: undefined
					}
				/>
			</Modal>

			<Modal
				open={fixedModal}
				onClose={() => {
					setFixedModal(false);
					setEditFixed(null);
				}}
				title={editFixed ? "Editar gasto fijo" : "Nuevo gasto fijo"}
			>
				<FixedExpenseForm
					categories={fixedExpenseCategories}
					periodKey={periodKey}
					initial={
						editFixed
							? {
									name: editFixed.name,
									amount: editFixed.amount,
									categoryId: editFixed.categoryId as Id<"categories">,
									dayOfMonth: editFixed.dayOfMonth,
									reminderOffsets: editFixed.reminderOffsets,
									emailReminders: editFixed.emailReminders,
									pushReminders: editFixed.pushReminders,
									notes: editFixed.notes,
									isPaidCurrentPeriod: editFixed.isPaidCurrentPeriod,
									onlyPeriodKey: editFixed.onlyPeriodKey,
								}
							: undefined
					}
					loading={loading}
					serverError={error}
					onSubmit={handleFixedSubmit}
					onCancel={() => {
						setFixedModal(false);
						setEditFixed(null);
					}}
					onDelete={
						editFixed
							? () => {
									setFixedToDelete(editFixed);
									setConfirmDeleteFixed(true);
								}
							: undefined
					}
				/>
			</Modal>

			<ConfirmDialog
				open={confirmDeleteBudget}
				title="Eliminar presupuesto"
				description="Esta acción no se puede deshacer."
				confirmLabel="Eliminar"
				variant="danger"
				onConfirm={handleDeleteBudget}
				onCancel={() => {
					setConfirmDeleteBudget(false);
					setBudgetToDelete(null);
				}}
			/>
			<ConfirmDialog
				open={confirmDeleteFixed}
				title="Eliminar gasto fijo"
				description="Esta acción no se puede deshacer."
				confirmLabel="Eliminar"
				variant="danger"
				onConfirm={handleDeleteFixed}
				onCancel={() => {
					setConfirmDeleteFixed(false);
					setFixedToDelete(null);
				}}
			/>

			<MarkFixedExpensePaidModal
				open={payment.paymentOpen}
				target={payment.target}
				accounts={payment.accounts}
				loading={payment.loading}
				error={payment.error}
				onClose={payment.closePayment}
				onConfirm={payment.confirmPayment}
			/>
		</div>
	);
}
