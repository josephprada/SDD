import { EmptyState } from "@app/components/ui/EmptyState";
import { CategoryIcon } from "@app/lib/core/categoryIcon";
import { CoreIcon } from "@app/lib/core/icons";
import type { CategoryType } from "@app/lib/core/types";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { IconButton } from "@jp-ds";

type CategoryListProps = {
	categories: Doc<"categories">[];
	type: CategoryType;
	counts: Record<string, number>;
	selectedId?: Id<"categories"> | null;
	onTypeChange: (type: CategoryType) => void;
	onCreate?: () => void;
	onEdit?: (category: Doc<"categories">) => void;
	onArchive?: (category: Doc<"categories">) => void;
};

const typeOptions = [
	{ value: "expense" as const, label: "Gastos" },
	{ value: "income" as const, label: "Ingresos" },
	{ value: "transfer" as const, label: "Transferencias" },
];

export function CategoryList({
	categories,
	type,
	counts,
	selectedId,
	onTypeChange,
	onCreate,
	onEdit,
	onArchive,
}: CategoryListProps) {
	const filtered = categories.filter((c) => c.type === type && !c.archived);

	return (
		<div className="category-page">
			<div className="chips-row" role="tablist" aria-label="Tipo de categoría">
				{typeOptions.map((opt) => (
					<button
						key={opt.value}
						type="button"
						role="tab"
						aria-selected={type === opt.value}
						className={`chip${type === opt.value ? " chip--active" : ""}`}
						onClick={() => onTypeChange(opt.value)}
					>
						{opt.label}
					</button>
				))}
			</div>

			{filtered.length === 0 ? (
				<EmptyState
					title="Sin categorías"
					description="Crea una categoría para organizar tus movimientos."
					actionLabel={onCreate ? "Crear categoría" : undefined}
					onAction={onCreate}
					icon={<CoreIcon name="tags" size={32} />}
				/>
			) : (
				<ul className="category-list">
					{filtered.map((cat) => {
						const count = counts[cat._id] ?? 0;
						const isSelected = selectedId === cat._id;
						return (
							<li
								key={cat._id}
								className={`category-list__item glass${isSelected ? " category-list__item--active" : ""}`}
							>
								<button
									type="button"
									className="category-list__main"
									onClick={() => onEdit?.(cat)}
									disabled={cat.isSystem}
								>
									<span
										className="category-list__icon"
										style={{
											backgroundColor: `${cat.color}22`,
											color: cat.color,
										}}
									>
										<CategoryIcon icon={cat.icon} size={18} color={cat.color} />
									</span>
									<span className="category-list__body">
										<span className="category-list__name">{cat.name}</span>
										<span className="category-list__count">
											{cat.isSystem
												? "Categoría del sistema"
												: `${count} ${count === 1 ? "movimiento" : "movimientos"}`}
										</span>
									</span>
								</button>
								<div className="category-list__actions">
									{cat.isSystem ? (
										<span
											className="category-list__lock"
											aria-label="Bloqueada"
										>
											🔒
										</span>
									) : (
										<>
											{onEdit ? (
												<IconButton
													aria-label={`Editar ${cat.name}`}
													onClick={() => onEdit(cat)}
												>
													<CoreIcon name="edit" size={16} />
												</IconButton>
											) : null}
											{onArchive ? (
												<IconButton
													aria-label={`Archivar ${cat.name}`}
													onClick={() => onArchive(cat)}
												>
													<CoreIcon name="trash" size={16} />
												</IconButton>
											) : null}
										</>
									)}
								</div>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
