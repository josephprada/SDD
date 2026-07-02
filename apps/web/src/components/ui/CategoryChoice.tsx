import type { Id } from "@convex/_generated/dataModel";
import { CategoryIcon } from "@app/lib/core/categoryIcon";

type CategoryItem = {
	_id: Id<"categories">;
	name: string;
	icon: string;
	color: string;
};

type CategoryChoiceProps = {
	categories: CategoryItem[];
	value: Id<"categories"> | "";
	onChange: (id: Id<"categories">) => void;
	error?: string;
};

export function CategoryChoice({
	categories,
	value,
	onChange,
	error,
}: CategoryChoiceProps) {
	const items = [...categories].sort((a, b) =>
		a.name.localeCompare(b.name, "es"),
	);

	return (
		<div>
			<div className="category-choice" aria-label="Categoría">
				{items.map((cat) => {
					const isActive = value === cat._id;
					return (
						<button
							key={cat._id}
							type="button"
							aria-pressed={isActive}
							className={`category-choice__item${isActive ? " category-choice__item--active" : ""}`}
							onClick={() => onChange(cat._id)}
						>
							<span
								className="category-choice__icon"
								style={{ backgroundColor: `${cat.color}22` }}
							>
								<CategoryIcon icon={cat.icon} size={16} color={cat.color} />
							</span>
							<span className="category-choice__name">{cat.name}</span>
						</button>
					);
				})}
			</div>
			{error ? (
				<span className="field-error" role="alert">
					{error}
				</span>
			) : null}
		</div>
	);
}
