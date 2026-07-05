import type { Id } from "@convex/_generated/dataModel";
import { CategoryIcon } from "@app/lib/core/categoryIcon";

type CategoryItem = {
	_id: Id<"categories">;
	name: string;
	icon: string;
	color: string;
};

type CategoryChoiceBaseProps = {
	categories: CategoryItem[];
	error?: string;
};

type CategoryChoiceSingleProps = CategoryChoiceBaseProps & {
	multiple?: false;
	value: Id<"categories"> | "";
	onChange: (id: Id<"categories">) => void;
};

type CategoryChoiceMultiProps = CategoryChoiceBaseProps & {
	multiple: true;
	value: Id<"categories">[];
	onChange: (ids: Id<"categories">[]) => void;
};

export type CategoryChoiceProps =
	| CategoryChoiceSingleProps
	| CategoryChoiceMultiProps;

export function CategoryChoice(props: CategoryChoiceProps) {
	const { categories, error } = props;
	const items = [...categories].sort((a, b) =>
		a.name.localeCompare(b.name, "es"),
	);

	const isSelected = (id: Id<"categories">) => {
		if (props.multiple) {
			return props.value.includes(id);
		}
		return props.value === id;
	};

	const handleToggle = (id: Id<"categories">) => {
		if (props.multiple) {
			const next = props.value.includes(id)
				? props.value.filter((value) => value !== id)
				: [...props.value, id];
			props.onChange(next);
			return;
		}
		props.onChange(id);
	};

	const ariaLabel = props.multiple ? "Categorías" : "Categoría";

	return (
		<div>
			<div className="category-choice" aria-label={ariaLabel}>
				{items.map((cat) => {
					const active = isSelected(cat._id);
					return (
						<button
							key={cat._id}
							type="button"
							aria-pressed={active}
							className={`category-choice__item${active ? " category-choice__item--active" : ""}`}
							onClick={() => handleToggle(cat._id)}
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
