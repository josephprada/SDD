import { ContributionForm } from "@app/components/savings/ContributionForm";
import { CapitalAbonoForm } from "@app/components/credits/CapitalAbonoForm";
import type { CapitalAbonoFormValues } from "@app/components/credits/CapitalAbonoForm";
import { SavingsGoalForm } from "@app/components/savings/SavingsGoalForm";
import { SavingsGoalList } from "@app/components/savings/SavingsGoalList";
import { BrandLogoMark } from "@app/components/brand/BrandLogoMark";
import { ConfirmDialog } from "@app/components/ui/ConfirmDialog";
import { Modal } from "@app/components/ui/Modal";
import { CoreIcon } from "@app/lib/core/icons";
import { useTransactionModalStore } from "@app/stores/transactionModal";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Button, IconButton } from "@jp-ds";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";

export function SavingsRoute() {
	const openEditTransaction = useTransactionModalStore((s) => s.openEdit);
	const goals = useQuery(api.savingsGoals.list, {});
	const accounts = useQuery(api.accounts.list, {});
	const credits = useQuery(api.credits.list, {});
	const categories = useQuery(api.categories.list, {
		type: "expense",
		includeArchived: false,
	});
	const createGoal = useMutation(api.savingsGoals.create);
	const updateGoal = useMutation(api.savingsGoals.update);
	const removeGoal = useMutation(api.savingsGoals.remove);
	const createContribution = useMutation(api.savingsContributions.create);
	const createAbono = useMutation(api.creditCapitalAbonos.create);

	const [goalModal, setGoalModal] = useState(false);
	const [contributionModal, setContributionModal] = useState(false);
	const [abonoModal, setAbonoModal] = useState(false);
	const [abonoGoalId, setAbonoGoalId] =
		useState<Id<"savingsGoals"> | null>(null);
	const [abonoInitial, setAbonoInitial] =
		useState<Partial<CapitalAbonoFormValues>>();
	const [contributingGoalId, setContributingGoalId] =
		useState<Id<"savingsGoals"> | null>(null);
	const [editingGoalId, setEditingGoalId] =
		useState<Id<"savingsGoals"> | null>(null);
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	if (
		goals === undefined ||
		accounts === undefined ||
		credits === undefined ||
		categories === undefined
	) {
		return null;
	}

	const destinationAccounts = accounts.filter((account) => !account.isCreditEscrow);

	const editingGoal = editingGoalId
		? goals.find((goal) => goal._id === editingGoalId)
		: null;

	const contributingGoal = contributingGoalId
		? goals.find((goal) => goal._id === contributingGoalId)
		: null;

	const abonoGoal = abonoGoalId
		? goals.find((goal) => goal._id === abonoGoalId)
		: null;

	const creditById = new Map(credits.map((credit) => [credit._id, credit]));

	const formAccounts =
		editingGoal?.accountId &&
		!destinationAccounts.some((account) => account._id === editingGoal.accountId)
			? [
					...destinationAccounts,
					...accounts.filter((account) => account._id === editingGoal.accountId),
				]
			: destinationAccounts;

	const closeGoalModal = () => {
		setGoalModal(false);
		setEditingGoalId(null);
		setError("");
	};

	const closeContributionModal = () => {
		setContributionModal(false);
		setContributingGoalId(null);
		setError("");
	};

	const closeAbonoModal = () => {
		setAbonoModal(false);
		setAbonoGoalId(null);
		setAbonoInitial(undefined);
		setError("");
	};

	const openAbonoFromGoal = (goal: (typeof goals)[number]) => {
		if (!goal.linkedCreditId) return;
		const linkedCredit = creditById.get(goal.linkedCreditId);
		if (!linkedCredit) return;
		setAbonoGoalId(goal._id);
		setAbonoInitial({
			amount: goal.currentAmount,
			paidAt: Date.now(),
			recalcEffect: linkedCredit.defaultRecalcOnAbono,
			notes: `Abono desde meta «${goal.name}»`,
		});
		setError("");
		setAbonoModal(true);
	};

	const handleDelete = async () => {
		if (!editingGoalId) return;
		setLoading(true);
		try {
			await removeGoal({ goalId: editingGoalId });
			setConfirmDelete(false);
			closeGoalModal();
		} catch (e) {
			setError(e instanceof Error ? e.message : "Error al eliminar meta");
			setConfirmDelete(false);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="savings-page animate-stagger">
			<div className="page-header animate-stagger-item">
				<div className="dash-header__brand show-desktop">
					<BrandLogoMark size={42} />
					<div>
						<h1 className="page-title">Metas de ahorro</h1>
						<p className="page-subtitle">
							Ahorro separado del fondo de crédito
						</p>
					</div>
				</div>
				<div className="page-header__mobile show-mobile">
					<BrandLogoMark size={28} />
					<h1 className="page-title">Metas de ahorro</h1>
				</div>
				<div className="page-header__controls">
					<div className="page-header__actions show-desktop">
						<Button
							onClick={() => {
								setEditingGoalId(null);
								setGoalModal(true);
							}}
						>
							<CoreIcon name="plus" size={16} />
							Nueva meta
						</Button>
					</div>
					<div className="page-header__actions show-mobile">
						<IconButton
							aria-label="Nueva meta de ahorro"
							onClick={() => {
								setEditingGoalId(null);
								setGoalModal(true);
							}}
						>
							<CoreIcon name="plus" size={20} />
						</IconButton>
					</div>
				</div>
			</div>

			<SavingsGoalList
				items={goals}
				onEdit={(goal) => {
					setEditingGoalId(goal._id);
					setGoalModal(true);
				}}
				onAddContribution={(goal) => {
					setContributingGoalId(goal._id);
					setContributionModal(true);
				}}
				onApplyAbono={openAbonoFromGoal}
				onMovementClick={(transactionId) =>
					openEditTransaction(transactionId as Id<"transactions">)
				}
			/>

			<Modal
				open={goalModal}
				onClose={closeGoalModal}
				title={editingGoalId ? "Editar meta de ahorro" : "Nueva meta de ahorro"}
			>
				<SavingsGoalForm
					key={editingGoalId ?? "new"}
					accounts={formAccounts.map((account) => ({
						_id: account._id,
						name: account.name,
					}))}
					credits={credits.map((c) => ({ _id: c._id, name: c.name }))}
					categories={categories.map((c) => ({
						_id: c._id,
						name: c.name,
						icon: c.icon,
						color: c.color,
					}))}
					initial={
						editingGoal
							? {
									name: editingGoal.name,
									targetAmount: editingGoal.targetAmount,
									accountId: editingGoal.accountId,
									deadline: editingGoal.deadline,
									linkedCreditId: editingGoal.linkedCreditId,
									notes: editingGoal.notes,
								}
							: undefined
					}
					error={error}
					loading={loading}
					onCancel={closeGoalModal}
					onDelete={
						editingGoalId ? () => setConfirmDelete(true) : undefined
					}
					onSubmit={async (values) => {
						setLoading(true);
						setError("");
						try {
							if (editingGoalId) {
								const hadLinkedCredit = Boolean(
									editingGoal?.linkedCreditId,
								);
								const hadAccountId = Boolean(editingGoal?.accountId);
								await updateGoal({
									goalId: editingGoalId,
									name: values.name,
									targetAmount: values.targetAmount,
									accountId: values.accountId,
									clearAccountId: hadAccountId && !values.accountId,
									deadline: values.deadline,
									notes: values.notes,
									linkedCreditId: values.linkedCreditId,
									clearLinkedCreditId:
										hadLinkedCredit && !values.linkedCreditId,
								});
							} else {
								await createGoal(values);
							}
							closeGoalModal();
						} catch (e) {
							setError(
								e instanceof Error ? e.message : "Error al guardar meta",
							);
						} finally {
							setLoading(false);
						}
					}}
				/>
			</Modal>

			<Modal
				open={contributionModal}
				onClose={closeContributionModal}
				title={
					contributingGoal
						? `Aporte — ${contributingGoal.name}`
						: "Registrar aporte"
				}
			>
				{contributingGoal ? (
					<ContributionForm
						key={contributingGoal._id}
						accounts={destinationAccounts.map((account) => ({
							_id: account._id,
							name: account.name,
						}))}
						destinationAccountId={contributingGoal.accountId}
						destinationAccountName={contributingGoal.accountName}
						error={error}
						loading={loading}
						onCancel={closeContributionModal}
						onSubmit={async (values) => {
							setLoading(true);
							setError("");
							try {
								await createContribution({
									goalId: contributingGoal._id,
									...values,
								});
								closeContributionModal();
							} catch (e) {
								setError(
									e instanceof Error
										? e.message
										: "Error al registrar aporte",
								);
							} finally {
								setLoading(false);
							}
						}}
					/>
				) : null}
			</Modal>

			<Modal
				open={abonoModal}
				onClose={closeAbonoModal}
				title={
					abonoGoal
						? `Abonar a capital — ${abonoGoal.name}`
						: "Abonar a capital"
				}
			>
				{abonoGoal?.linkedCreditId ? (
					<CapitalAbonoForm
						key={abonoGoal._id}
						initial={abonoInitial}
						error={error}
						loading={loading}
						onCancel={closeAbonoModal}
						submitLabel="Registrar abono"
						onSubmit={async (values) => {
							setLoading(true);
							setError("");
							try {
								await createAbono({
									creditId: abonoGoal.linkedCreditId!,
									...values,
									savingsGoalId: abonoGoal._id,
								});
								closeAbonoModal();
							} catch (e) {
								setError(
									e instanceof Error
										? e.message
										: "Error al registrar abono",
								);
							} finally {
								setLoading(false);
							}
						}}
					/>
				) : null}
			</Modal>

			<ConfirmDialog
				open={confirmDelete}
				title="Eliminar meta de ahorro"
				description="Se eliminarán los aportes registrados en esta meta. Si tiene un gasto fijo vinculado, también se eliminará. Los movimientos en tus cuentas no se borran."
				confirmLabel="Eliminar"
				variant="danger"
				onConfirm={handleDelete}
				onCancel={() => setConfirmDelete(false)}
			/>
		</div>
	);
}
