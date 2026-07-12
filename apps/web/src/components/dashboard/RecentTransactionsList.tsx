import type { TransactionItem } from "@app/components/transactions/TransactionList";
import { TransactionRow } from "@app/components/transactions/TransactionRow";
import { EmptyState } from "@app/components/ui/EmptyState";
import { CoreIcon } from "@app/lib/core/icons";
import type { Id } from "@convex/_generated/dataModel";
import { Link } from "react-router";

type RecentTransactionsListProps = {
	transactions: TransactionItem[];
	onEdit: (id: Id<"transactions">) => void;
};

export function RecentTransactionsList({
	transactions,
	onEdit,
}: RecentTransactionsListProps) {
	return (
		<section className="recent-tx glass" aria-label="Movimientos recientes">
			<div className="section-header">
				<h2 className="section-title">Últimos movimientos</h2>
				<Link to="/transactions" className="link-accent show-desktop">
					Ver todas
				</Link>
			</div>

			{transactions.length === 0 ? (
				<EmptyState
					title="Sin movimientos"
					description="Aún no hay movimientos registrados."
					icon={<CoreIcon name="arrow-down-up" size={28} />}
				/>
			) : (
				<ul className="tx-rows card-stagger">
					{transactions.map((tx) => (
						<TransactionRow
							key={tx._id}
							tx={tx}
							variant="dashboard"
							onSelect={(id) => onEdit(id as Id<"transactions">)}
						/>
					))}
				</ul>
			)}
		</section>
	);
}
