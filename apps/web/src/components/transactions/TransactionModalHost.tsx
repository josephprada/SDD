import { TransactionForm } from "@app/components/transactions/TransactionForm";
import { ConfirmDialog } from "@app/components/ui/ConfirmDialog";
import { Modal } from "@app/components/ui/Modal";
import {
	uploadAttachmentFile,
} from "@app/components/attachments/AttachmentUploader";
import { toDateInputValue } from "@app/lib/format/date";
import { useTransactionModalStore } from "@app/stores/transactionModal";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
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
		useQuery(api.categories.list, {
			includeArchived: false,
			includeCreditLinked: true,
		}) ?? [];
	const editingTx = useQuery(
		api.transactions.get,
		editingId ? { transactionId: editingId } : "skip",
	);

	const createTx = useMutation(api.transactions.create);
	const updateTx = useMutation(api.transactions.update);
	const removeTx = useMutation(api.transactions.remove);
	const generateUploadUrl = useMutation(api.attachments.generateUploadUrl);
	const createAttachment = useMutation(api.attachments.create);
	const [loading, setLoading] = useState(false);
	const [confirmDelete, setConfirmDelete] = useState(false);
	const [submitError, setSubmitError] = useState("");

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
		setSubmitError("");
		handledParamsRef.current = null;
		if (paramMode || searchParams.has("id")) {
			setSearchParams({}, { replace: true });
		}
	};

	const uploadPendingFiles = async (
		transactionId: Id<"transactions">,
		files: File[],
	) => {
		const errors: string[] = [];
		for (const file of files) {
			try {
				await uploadAttachmentFile(
					file,
					transactionId,
					() => generateUploadUrl({}),
					(args) => createAttachment(args),
				);
			} catch (e) {
				errors.push(
					e instanceof Error ? e.message : `Error al subir ${file.name}`,
				);
			}
		}
		return errors;
	};

	const handleDelete = async () => {
		if (!editingTx) return;
		const transactionId = editingTx._id;
		setLoading(true);
		try {
			// Cerrar confirm primero (unlock nested), luego modal, luego borrar.
			setConfirmDelete(false);
			handleClose();
			await removeTx({ transactionId });
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (mode !== "edit" || !editingId || editingTx !== null) return;
		close();
		setConfirmDelete(false);
		setSubmitError("");
		handledParamsRef.current = null;
		if (paramMode || searchParams.has("id")) {
			setSearchParams({}, { replace: true });
		}
	}, [
		mode,
		editingId,
		editingTx,
		close,
		paramMode,
		searchParams,
		setSearchParams,
	]);

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
						serverError={submitError}
						onSubmit={async (values) => {
							setLoading(true);
							setSubmitError("");
							try {
								const { pendingFiles: _pf, ...payload } = values;
								await createTx(payload);
								handleClose();
							} catch (e) {
								setSubmitError(
									e instanceof Error
										? e.message
										: "Error al guardar movimiento",
								);
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
								destinationName: editingTx.destinationName,
							}}
							loading={loading}
							serverError={submitError}
							onSubmit={async (values) => {
								setLoading(true);
								setSubmitError("");
								try {
									const { pendingFiles: _pf, ...payload } = values;
									await updateTx({ transactionId: editingTx._id, ...payload });
									handleClose();
								} catch (e) {
									setSubmitError(
										e instanceof Error
											? e.message
											: "Error al guardar movimiento",
									);
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
						serverError={submitError}
						onSubmit={async (values) => {
							setLoading(true);
							setSubmitError("");
							try {
								const { pendingFiles = [], ...payload } = values;
								const transactionId = await createTx(payload);
								if (pendingFiles.length > 0 && transactionId) {
									const uploadErrors = await uploadPendingFiles(
										transactionId as Id<"transactions">,
										pendingFiles,
									);
									if (uploadErrors.length > 0) {
										setSubmitError(
											`Movimiento guardado, pero falló un adjunto: ${uploadErrors[0]}`,
										);
										setLoading(false);
										return;
									}
								}
								handleClose();
							} catch (e) {
								setSubmitError(
									e instanceof Error
										? e.message
										: "Error al guardar movimiento",
								);
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
