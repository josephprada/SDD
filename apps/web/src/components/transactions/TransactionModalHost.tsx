import { TransactionForm } from "@app/components/transactions/TransactionForm";
import { ConfirmDialog } from "@app/components/ui/ConfirmDialog";
import { Modal } from "@app/components/ui/Modal";
import { toDateInputValue } from "@app/lib/format/date";
import { useTransactionModalStore } from "@app/stores/transactionModal";
import { api } from "@convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";

export function TransactionModalHost() {
	const [searchParams, setSearchParams] = useSearchParams();
	const { mode, createType, editingId, openCreate, openTransfer, close } =
		useTransactionModalStore();
	const handledParamsRef = useRef<string | null>(null);

	const accounts =
		useQuery(api.accounts.list, { includeArchived: false }) ?? [];
	const categories =
		useQuery(api.categories.list, { includeArchived: false }) ?? [];
	const editingTx = useQuery(
		api.transactions.get,
		editingId ? { transactionId: editingId } : "skip",
	);

	const createTx = useMutation(api.transactions.create);
	const updateTx = useMutation(api.transactions.update);
	const removeTx = useMutation(api.transactions.remove);
	const [loading, setLoading] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);

	const paramMode = searchParams.get("mode");
	const paramType = searchParams.get("type");

	useEffect(() => {
		const paramKey = `${paramMode ?? ""}:${paramType ?? ""}`;
		if (!paramMode) {
			handledParamsRef.current = null;
			return;
		}
		if (handledParamsRef.current === paramKey) return;

		handledParamsRef.current = paramKey;

		if (paramMode === "transfer") {
			openTransfer();
			return;
		}
		if (paramMode === "create") {
			openCreate(paramType === "income" ? "income" : "expense");
		}
	}, [paramMode, paramType, openCreate, openTransfer]);

	const handleClose = () => {
		close();
		setConfirmDelete(false);
		handledParamsRef.current = null;
		if (paramMode || searchParams.has("id")) {
			setSearchParams({}, { replace: true });
		}
	};

	const handleDelete = async () => {
		if (!editingTx) return;
		setLoading(true);
		try {
			await removeTx({ transactionId: editingTx._id });
			setConfirmDelete(false);
			handleClose();
		} finally {
			setLoading(false);
		}
	};

	const isOpen = mode !== "closed";
	const modalTitle =
		mode === "transfer"
			? "Transferir"
			: mode === "edit"
				? "Editar movimiento"
				: "Nuevo movimiento";

	return (
		<>
			<Modal open={isOpen} title={modalTitle} onClose={handleClose}>
				{mode === "transfer" ? (
				<TransactionForm
					accounts={accounts}
					categories={categories}
					initial={{ type: "transfer" }}
					loading={loading}
					onSubmit={async (values) => {
						setLoading(true);
						try {
							await createTx(values);
							handleClose();
						} finally {
							setLoading(false);
						}
					}}
					onCancel={handleClose}
				/>
			) : mode === "edit" ? (
				editingTx === undefined ? (
					<p className="modal-loading">Cargando movimiento…</p>
				) : editingTx ? (
				<TransactionForm
					accounts={accounts}
					categories={categories}
					transactionId={editingTx._id}
					initial={{
						type: editingTx.type,
						amount: String(editingTx.amount),
						date: toDateInputValue(editingTx.date),
						accountId: editingTx.accountId,
						toAccountId: editingTx.toAccountId,
						categoryId: editingTx.categoryId,
						notes: editingTx.notes ?? "",
					}}
					loading={loading}
					onSubmit={async (values) => {
						setLoading(true);
						try {
							await updateTx({ transactionId: editingTx._id, ...values });
							handleClose();
						} finally {
							setLoading(false);
						}
					}}
					onCancel={handleClose}
					onDelete={() => setConfirmDelete(true)}
				/>
				) : null
			) : mode === "create" ? (
				<TransactionForm
					accounts={accounts}
					categories={categories}
					initial={{ type: createType }}
					loading={loading}
					onSubmit={async (values) => {
						setLoading(true);
						try {
							await createTx(values);
							handleClose();
						} finally {
							setLoading(false);
						}
					}}
					onCancel={handleClose}
				/>
				) : null}
			</Modal>
			<ConfirmDialog
				open={confirmDelete}
				title="Eliminar movimiento"
				description="Esta acción no se puede deshacer. Si el movimiento proviene de un gasto fijo, volverá a quedar pendiente de pago."
				confirmLabel="Eliminar"
				variant="danger"
				onConfirm={handleDelete}
				onCancel={() => setConfirmDelete(false)}
			/>
		</>
	);
}
