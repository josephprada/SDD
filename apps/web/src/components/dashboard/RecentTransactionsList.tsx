import type { TransactionItem } from "@app/components/transactions/TransactionList";
import { TransactionRow } from "@app/components/transactions/TransactionRow";
import { EmptyState } from "@app/components/ui/EmptyState";
import { CoreIcon } from "@app/lib/core/icons";
import { Link, useNavigate } from "react-router";

type RecentTransactionsListProps = {
	transactions: TransactionItem[];
};

export function RecentTransactionsList({
	transactions,
}: RecentTransactionsListProps) {
	const navigate = useNavigate();

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
					description="Aún no hay movimientos este mes."
					icon={<CoreIcon name="arrow-down-up" size={28} />}
				/>
			) : (
				<ul className="tx-rows">
					{transactions.map((tx) => (
						<TransactionRow
							key={tx._id}
							tx={tx}
							variant="dashboard"
							onSelect={(id) => navigate(`/transactions?id=${id}`)}
						/>
					))}
				</ul>
			)}
		</section>
	);
}
