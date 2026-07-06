import { ArchiveCategoryDialog } from "@app/components/categories/ArchiveCategoryDialog";
import { CategoryForm } from "@app/components/categories/CategoryForm";
import { CategoryList } from "@app/components/categories/CategoryList";
import { BrandLogoMark } from "@app/components/brand/BrandLogoMark";
import { Modal } from "@app/components/ui/Modal";
import { CoreIcon } from "@app/lib/core/icons";
import type { CategoryFormValues, CategoryType } from "@app/lib/core/types";
import { MEDIA_DESKTOP } from "@app/lib/core/breakpoints";
import { useMediaQuery } from "@app/lib/core/useMediaQuery";
import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { Button, IconButton } from "@jp-ds";
import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";

export function CategoriesRoute() {
	const isDesktop = useMediaQuery(MEDIA_DESKTOP);
	const categories =
		useQuery(api.categories.list, {
			includeArchived: false,
			includeCreditLinked: true,
		}) ?? [];
	const transactions = useQuery(api.transactions.list, {}) ?? [];
	const createCategory = useMutation(api.categories.create);
	const updateCategory = useMutation(api.categories.update);
	const archiveCategory = useMutation(api.categories.archive);

	const [type, setType] = useState<CategoryType>("expense");
	const [mode, setMode] = useState<"closed" | "create" | "edit">("closed");
	const [editing, setEditing] = useState<Doc<"categories"> | null>(null);
	const [archiving, setArchiving] = useState<Doc<"categories"> | null>(null);
	const [loading, setLoading] = useState(false);
	const [serverError, setServerError] = useState("");

	const counts = useMemo(() => {
		const map: Record<string, number> = {};
		for (const tx of transactions) {
			map[tx.categoryId] = (map[tx.categoryId] ?? 0) + 1;
		}
		return map;
	}, [transactions]);

	const openCreate = () => {
		setEditing(null);
		setServerError("");
		setMode("create");
	};

	const openEdit = (cat: Doc<"categories">) => {
		if (cat.isSystem) return;
		setEditing(cat);
		setType(cat.type);
		setServerError("");
		setMode("edit");
	};

	const closePanel = () => {
		setMode("closed");
		setEditing(null);
		setServerError("");
	};

	const handleCreate = async (values: CategoryFormValues) => {
		setLoading(true);
		setServerError("");
		try {
			await createCategory(values);
			closePanel();
		} catch (e) {
			setServerError(e instanceof Error ? e.message : "Error al crear");
		} finally {
			setLoading(false);
		}
	};

	const handleUpdate = async (values: CategoryFormValues) => {
		if (!editing) return;
		setLoading(true);
		setServerError("");
		try {
			await updateCategory({
				categoryId: editing._id,
				name: values.name,
				icon: values.icon,
				color: values.color,
			});
			closePanel();
		} catch (e) {
			setServerError(e instanceof Error ? e.message : "Error al guardar");
		} finally {
			setLoading(false);
		}
	};

	const handleArchive = async () => {
		if (!archiving) return;
		await archiveCategory({ categoryId: archiving._id });
		setArchiving(null);
		if (editing?._id === archiving._id) closePanel();
	};

	const formNode = (
		<CategoryForm
			key={editing?._id ?? `new-${type}`}
			type={editing?.type ?? type}
			isEdit={mode === "edit"}
			initial={
				editing
					? { name: editing.name, icon: editing.icon, color: editing.color }
					: undefined
			}
			loading={loading}
			serverError={serverError}
			onSubmit={mode === "edit" ? handleUpdate : handleCreate}
			onCancel={closePanel}
			onArchive={editing && !editing.linkedCreditId ? () => setArchiving(editing) : undefined}
		/>
	);

	const panelOpen = mode !== "closed";

	return (
		<div className="animate-stagger">
			<div className="page-header animate-stagger-item">
				<div className="dash-header__brand show-desktop">
					<BrandLogoMark size={42} />
					<div>
						<h1 className="page-title">Categorías</h1>
						<p className="page-subtitle">
							Organiza cómo clasificas tus movimientos
						</p>
					</div>
				</div>
				<div className="page-header__mobile show-mobile">
					<BrandLogoMark size={28} />
					<h1 className="page-title">Categorías</h1>
				</div>
				<div className="page-header__controls">
					<div className="page-header__actions show-desktop">
						<Button onClick={openCreate}>
							<CoreIcon name="plus" size={16} /> Nueva categoría
						</Button>
					</div>
					<div className="page-header__actions show-mobile">
						<IconButton aria-label="Nueva categoría" onClick={openCreate}>
							<CoreIcon name="plus" size={20} />
						</IconButton>
					</div>
				</div>
			</div>

			<div className="category-layout animate-stagger-item">
				<CategoryList
					categories={categories}
					type={type}
					counts={counts}
					selectedId={editing?._id ?? null}
					onTypeChange={setType}
					onCreate={openCreate}
					onEdit={openEdit}
					onArchive={setArchiving}
				/>

				{isDesktop ? (
					<aside className="category-panel glass">
						{panelOpen ? (
							<>
								<h2 className="section-title">
									{mode === "edit" ? "Editar categoría" : "Nueva categoría"}
								</h2>
								{formNode}
							</>
						) : (
							<p className="category-panel__hint">
								Selecciona una categoría para editarla o crea una nueva.
							</p>
						)}
					</aside>
				) : null}
			</div>

			{!isDesktop ? (
				<Modal
					open={panelOpen}
					title={mode === "edit" ? "Editar categoría" : "Nueva categoría"}
					onClose={closePanel}
				>
					{formNode}
				</Modal>
			) : null}

			<ArchiveCategoryDialog
				open={archiving !== null}
				categoryName={archiving?.name ?? ""}
				onConfirm={handleArchive}
				onCancel={() => setArchiving(null)}
			/>
		</div>
	);
}
