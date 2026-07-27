import { TaxItemRow } from "@app/components/tax/TaxItemRow";
import { CoreIcon } from "@app/lib/core/icons";
import { formatCOP } from "@app/lib/format/currency";
import { TAX_SECTION_LABELS } from "@app/lib/tax/categories";
import type { TaxSection } from "@app/lib/tax/types";
import type { Id } from "@convex/_generated/dataModel";
import { Button, IconButton } from "@jp-ds";

type Item = {
	_id: Id<"taxItems">;
	category: string;
	description: string;
	amount: number;
	notes?: string;
};

type TaxSectionPanelProps = {
	section: TaxSection;
	items: Item[];
	total: number;
	readOnly?: boolean;
	onAdd: () => void;
	onEdit: (itemId: Id<"taxItems">) => void;
};

export function TaxSectionPanel({
	section,
	items,
	total,
	readOnly,
	onAdd,
	onEdit,
}: TaxSectionPanelProps) {
	return (
		<section className="tax-section glass">
			<div className="tax-section__header">
				<div>
					<h2>{TAX_SECTION_LABELS[section]}</h2>
					<span className="tax-item__meta">Total {formatCOP(total)}</span>
				</div>
				{!readOnly ? (
					<>
						<div className="show-desktop">
							<Button type="button" variant="secondary" onClick={onAdd}>
								<CoreIcon name="plus" size={16} />
								Añadir
							</Button>
						</div>
						<div className="show-mobile">
							<IconButton aria-label="Añadir rubro" onClick={onAdd}>
								<CoreIcon name="plus" size={18} />
							</IconButton>
						</div>
					</>
				) : null}
			</div>
			{items.length === 0 ? (
				<p className="tax-item__meta">Sin rubros en esta sección.</p>
			) : (
				<ul className="tax-item-list">
					{items.map((item) => (
						<li key={item._id}>
							<TaxItemRow
								item={item}
								disabled={false}
								onClick={() => onEdit(item._id)}
							/>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
