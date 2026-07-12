import { EmptyState } from "@app/components/ui/EmptyState";
import { CategoryIcon } from "@app/lib/core/categoryIcon";
import { CoreIcon } from "@app/lib/core/icons";
import type { CategoryType } from "@app/lib/core/types";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { IconButton } from "@jp-ds";

export type CategoryUsage = {
	transactions: number;
	fixedExpenses: number;
	budgets: number;
	credits: number;
	savingsGoals: number;
};

const EMPTY_USAGE: CategoryUsage = {
	transactions: 0,
	fixedExpenses: 0,
	budgets: 0,
	credits: 0,
	savingsGoals: 0,
};

type CategoryListProps = {
	categories: Doc<"categories">[];
	type: CategoryType;
	usageCounts: Record<string, CategoryUsage>;
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

function creditLinkedLabel(category: Doc<"categories">): string | null {
	if (!category.linkedCreditId) return null;
	switch (category.linkedCreditPurpose) {
		case "payment":
			return "Cuota de crédito";
		case "disbursement_income":
			return "Desembolso de crédito";
		case "fund_expense":
			return "Gasto del fondo de crédito";
		default:
			return "Vinculada a crédito";
	}
}

function pluralize(count: number, singular: string, plural: string): string {
	return `${count} ${count === 1 ? singular : plural}`;
}

function formatUsageParts(
	usage: CategoryUsage,
	category: Doc<"categories">,
): string[] {
	const parts: string[] = [];

	if (usage.transactions > 0) {
		parts.push(pluralize(usage.transactions, "movimiento", "movimientos"));
	}
	if (usage.fixedExpenses > 0) {
		parts.push(pluralize(usage.fixedExpenses, "gasto fijo", "gastos fijos"));
	}
	if (usage.budgets > 0) {
		parts.push(pluralize(usage.budgets, "presupuesto", "presupuestos"));
	}
	if (usage.credits > 0 && !category.linkedCreditId) {
		parts.push(pluralize(usage.credits, "crédito", "créditos"));
	}
	if (usage.savingsGoals > 0) {
		parts.push(
			pluralize(usage.savingsGoals, "meta de ahorro", "metas de ahorro"),
		);
	}

	return parts;
}

function categorySubtitle(category: Doc<"categories">, usage: CategoryUsage): string {
	if (category.isSystem) return "Categoría del sistema";

	const linked = creditLinkedLabel(category);
	const usageParts = formatUsageParts(usage, category);

	if (linked && usageParts.length === 0) return linked;
	if (linked && usageParts.length > 0) {
		return `${linked} · ${usageParts.join(" · ")}`;
	}
	if (usageParts.length > 0) return usageParts.join(" · ");

	return pluralize(0, "movimiento", "movimientos");
}

export function CategoryList({
	categories,
	type,
	usageCounts,
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
						const usage = usageCounts[cat._id] ?? EMPTY_USAGE;
						const isSelected = selectedId === cat._id;
						const canEdit = !cat.isSystem && onEdit;
						const canArchive =
							!cat.isSystem && !cat.linkedCreditId && onArchive;

						return (
							<li
								key={cat._id}
								className={`category-list__item glass interactive-lift${isSelected ? " category-list__item--active" : ""}`}
							>
								<button
									type="button"
									className="category-list__main"
									onClick={() => canEdit && onEdit(cat)}
									disabled={!canEdit}
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
											{categorySubtitle(cat, usage)}
										</span>
									</span>
								</button>
								{cat.isSystem ? (
									<span className="category-list__lock" aria-label="Bloqueada">
										🔒
									</span>
								) : canArchive ? (
									<div className="category-list__actions">
										<IconButton
											aria-label={`Archivar ${cat.name}`}
											onClick={() => onArchive(cat)}
										>
											<CoreIcon name="trash" size={16} />
										</IconButton>
									</div>
								) : null}
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
