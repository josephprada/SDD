import { TaxExportMenu } from "@app/components/tax/TaxExportMenu";
import { TaxItemAttachments } from "@app/components/tax/TaxItemAttachments";
import { TaxItemForm } from "@app/components/tax/TaxItemForm";
import { TaxSectionPanel } from "@app/components/tax/TaxSectionPanel";
import { TaxStatusActions } from "@app/components/tax/TaxStatusActions";
import { TaxSuggestionsSheet } from "@app/components/tax/TaxSuggestionsSheet";
import { TaxSummaryPanel } from "@app/components/tax/TaxSummaryPanel";
import { ConfirmDialog } from "@app/components/ui/ConfirmDialog";
import { Modal } from "@app/components/ui/Modal";
import { formatConvexError } from "@app/lib/convex/formatError";
import { CoreIcon } from "@app/lib/core/icons";
import { TAX_SECTIONS } from "@app/lib/tax/categories";
import {
	TAX_STATUS_LABELS,
	type TaxSection,
	type TaxStatus,
} from "@app/lib/tax/types";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@jp-ds";
import { useConvex, useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

export function TaxDetailRoute() {
	const { documentId } = useParams<{ documentId: string }>();
	const id = documentId as Id<"taxDocuments"> | undefined;
	const navigate = useNavigate();
	const convex = useConvex();

	const document = useQuery(
		api.taxDocuments.get,
		id ? { documentId: id } : "skip",
	);
	const items = useQuery(
		api.taxItems.listByDocument,
		id ? { documentId: id } : "skip",
	);

	const createItem = useMutation(api.taxItems.create);
	const updateItem = useMutation(api.taxItems.update);
	const removeItem = useMutation(api.taxItems.remove);
	const setStatus = useMutation(api.taxDocuments.setStatus);
	const reopen = useMutation(api.taxDocuments.reopen);
	const updateMeta = useMutation(api.taxDocuments.updateMeta);
	const removeDocument = useMutation(api.taxDocuments.remove);

	const [sectionForCreate, setSectionForCreate] = useState<TaxSection | null>(
		null,
	);
	const [editingItemId, setEditingItemId] = useState<Id<"taxItems"> | null>(
		null,
	);
	const [suggestionsOpen, setSuggestionsOpen] = useState(false);
	const [formError, setFormError] = useState("");
	const [busy, setBusy] = useState(false);
	const [confirmDeleteDoc, setConfirmDeleteDoc] = useState(false);

	const suggestions = useQuery(
		api.taxSuggestions.generate,
		suggestionsOpen && id ? { documentId: id } : "skip",
	);

	const editingItem = useMemo(
		() => items?.find((i) => i._id === editingItemId) ?? null,
		[items, editingItemId],
	);

	const closeItemModal = () => {
		setSectionForCreate(null);
		setEditingItemId(null);
		setFormError("");
	};

	const itemModalOpen = sectionForCreate !== null || editingItemId !== null;

	if (!id) {
		return <p>Declaración no encontrada</p>;
	}

	if (document === undefined || items === undefined) {
		return null;
	}

	if (document === null) {
		return (
			<div className="tax-page">
				<p>Declaración no encontrada.</p>
				<Link to="/tax">Volver</Link>
			</div>
		);
	}

	const readOnly = document.status === "filed";

	return (
		<div className="tax-page animate-stagger">
			<header className="tax-detail-header animate-stagger-item">
				<div className="tax-detail-header__row">
					<div>
						<h1 className="page-title">
							Declaración de renta {document.taxYear}
						</h1>
						<p className="page-subtitle">
							{TAX_STATUS_LABELS[document.status as TaxStatus]}
						</p>
					</div>
					<Link to="/tax" className="tax-detail-back">
						<CoreIcon name="chevron-left" size={16} /> Declaraciones
					</Link>
				</div>
			</header>

			<div className="tax-detail__actions animate-stagger-item">
				<TaxStatusActions
					status={document.status as TaxStatus}
					busy={busy}
					onSetStatus={async (status) => {
						setBusy(true);
						try {
							await setStatus({ documentId: id, status });
						} finally {
							setBusy(false);
						}
					}}
					onReopen={async () => {
						setBusy(true);
						try {
							await reopen({ documentId: id });
						} finally {
							setBusy(false);
						}
					}}
				/>
				{!readOnly ? (
					<Button
						type="button"
						variant="secondary"
						onClick={() => setSuggestionsOpen(true)}
					>
						<CoreIcon name="file-text" size={16} />
						Sugerir desde mis datos
					</Button>
				) : null}
				<TaxExportMenu
					loadPayload={async () =>
						convex.query(api.taxDocuments.getExportPayload, {
							documentId: id,
						})
					}
				/>
			</div>

			<TaxSummaryPanel
				totals={document.totals}
				estimatedTaxableIncome={document.estimatedTaxableIncome}
				estimatedTaxDue={document.estimatedTaxDue}
				readOnly={readOnly}
				onSaveEstimates={async (values) => {
					await updateMeta({
						documentId: id,
						estimatedTaxableIncome: values.estimatedTaxableIncome,
						estimatedTaxDue: values.estimatedTaxDue,
					});
				}}
			/>

			<div className="tax-sections">
				{TAX_SECTIONS.map((section) => (
					<TaxSectionPanel
						key={section}
						section={section}
						items={items.filter((i) => i.section === section)}
						total={document.totals[section]}
						readOnly={readOnly}
						onAdd={() => {
							setFormError("");
							setSectionForCreate(section);
						}}
						onEdit={(itemId) => {
							setFormError("");
							setEditingItemId(itemId);
						}}
					/>
				))}
			</div>

			<div className="tax-detail__danger-zone">
				<Button
					type="button"
					variant="danger"
					onClick={() => setConfirmDeleteDoc(true)}
				>
					Eliminar declaración
				</Button>
			</div>

			<Modal
				open={itemModalOpen}
				onClose={closeItemModal}
				title={editingItemId ? "Rubro" : "Nuevo rubro"}
			>
				{editingItemId && !editingItem ? (
					<div className="modal-form">
						<p className="tax-item__meta">Cargando rubro…</p>
					</div>
				) : null}

				{editingItem ? (
					<TaxItemForm
						key={editingItem._id}
						initial={editingItem}
						fixedSection={editingItem.section}
						readOnly={readOnly}
						error={formError}
						submitLabel="Guardar cambios"
						extra={
							<div>
								<p className="tax-item__meta">Adjuntos</p>
								<TaxItemAttachments
									taxItemId={editingItem._id}
									readOnly={readOnly}
								/>
							</div>
						}
						onCancel={closeItemModal}
						onSubmit={async (values) => {
							setFormError("");
							try {
								await updateItem({
									itemId: editingItem._id,
									category: values.category,
									description: values.description,
									amount: values.amount,
									notes: values.notes,
								});
								closeItemModal();
							} catch (e) {
								setFormError(
									formatConvexError(e, "No se pudo actualizar el rubro"),
								);
							}
						}}
						onDelete={
							readOnly
								? undefined
								: async () => {
										await removeItem({ itemId: editingItem._id });
										closeItemModal();
									}
						}
					/>
				) : null}

				{!editingItemId && sectionForCreate ? (
					<TaxItemForm
						key={`create-${sectionForCreate}`}
						fixedSection={sectionForCreate}
						error={formError}
						submitLabel="Guardar y adjuntar"
						extra={
							<p className="tax-item__meta">
								Al guardar se habilitará la zona para adjuntar PDF o imágenes.
							</p>
						}
						onCancel={closeItemModal}
						onSubmit={async (values) => {
							setFormError("");
							try {
								const itemId = await createItem({
									documentId: id,
									...values,
								});
								setSectionForCreate(null);
								setEditingItemId(itemId);
							} catch (e) {
								setFormError(formatConvexError(e, "No se pudo crear el rubro"));
							}
						}}
					/>
				) : null}
			</Modal>

			<Modal
				open={suggestionsOpen}
				onClose={() => setSuggestionsOpen(false)}
				title="Sugerencias desde tus datos"
			>
				{suggestions === undefined ? (
					<div className="modal-form">
						<p className="tax-item__meta">Generando sugerencias…</p>
					</div>
				) : (
					<TaxSuggestionsSheet
						suggestions={suggestions.suggestions}
						busy={busy}
						onCancel={() => setSuggestionsOpen(false)}
						onAccept={async (selected) => {
							setBusy(true);
							try {
								for (const s of selected) {
									await createItem({
										documentId: id,
										section: s.section,
										category: s.category,
										description: s.description,
										amount: s.amount,
										sourceType: s.sourceType as
											| "account"
											| "credit"
											| "income_category"
											| "expense_category"
											| "credit_interest",
										sourceId: s.sourceId,
									});
								}
								setSuggestionsOpen(false);
							} catch (e) {
								setFormError(
									formatConvexError(e, "No se pudieron aceptar sugerencias"),
								);
							} finally {
								setBusy(false);
							}
						}}
					/>
				)}
			</Modal>

			<ConfirmDialog
				open={confirmDeleteDoc}
				title="Eliminar declaración"
				description="Se eliminarán todos los rubros y adjuntos de este año. ¿Continuar?"
				confirmLabel="Eliminar"
				variant="danger"
				onConfirm={async () => {
					setConfirmDeleteDoc(false);
					await removeDocument({ documentId: id });
					navigate("/tax", { replace: true });
				}}
				onCancel={() => setConfirmDeleteDoc(false)}
			/>
		</div>
	);
}
