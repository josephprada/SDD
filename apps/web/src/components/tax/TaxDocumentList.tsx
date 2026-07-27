import { EmptyState } from "@app/components/ui/EmptyState";
import { CoreIcon } from "@app/lib/core/icons";
import { formatCOP } from "@app/lib/format/currency";
import { TAX_STATUS_LABELS, type TaxStatus } from "@app/lib/tax/types";
import type { api } from "@convex/_generated/api";
import type { FunctionReturnType } from "convex/server";
import { Link } from "react-router";

type TaxDocItem = FunctionReturnType<typeof api.taxDocuments.list>[number];

type TaxDocumentListProps = {
	items: TaxDocItem[];
};

export function TaxDocumentList({ items }: TaxDocumentListProps) {
	if (items.length === 0) {
		return (
			<EmptyState
				title="Sin declaraciones todavía"
				description="Crea tu primera declaración de renta por año gravable."
				icon={<CoreIcon name="file-text" size={32} />}
			/>
		);
	}

	return (
		<ul className="tax-list card-stagger">
			{items.map((doc) => (
				<li key={doc._id}>
					<Link
						to={`/tax/${doc._id}`}
						className="tax-card glass interactive-lift"
					>
						<div className="tax-card__row">
							<strong>Año {doc.taxYear}</strong>
							<span>{formatCOP(doc.totals.grandTotal)}</span>
						</div>
						<span className="tax-card__badge">
							{TAX_STATUS_LABELS[doc.status as TaxStatus]}
						</span>
						<span className="tax-item__meta">
							{doc.itemCount} rubro{doc.itemCount === 1 ? "" : "s"}
						</span>
					</Link>
				</li>
			))}
		</ul>
	);
}
