import { formatCOP } from "@app/lib/format/currency";
import { TAX_CATEGORY_LABELS } from "@app/lib/tax/categories";
import type { Id } from "@convex/_generated/dataModel";

type TaxItemRowProps = {
	item: {
		_id: Id<"taxItems">;
		category: string;
		description: string;
		amount: number;
		notes?: string;
	};
	disabled?: boolean;
	onClick: () => void;
};

export function TaxItemRow({ item, disabled, onClick }: TaxItemRowProps) {
	return (
		<button
			type="button"
			className="tax-item"
			onClick={onClick}
			disabled={disabled}
		>
			<div className="tax-item__row">
				<strong>{item.description}</strong>
				<span>{formatCOP(item.amount)}</span>
			</div>
			<span className="tax-item__meta">
				{TAX_CATEGORY_LABELS[item.category] ?? item.category}
				{item.notes ? ` · ${item.notes}` : ""}
			</span>
		</button>
	);
}
