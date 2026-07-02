import { formatCOP } from "@app/lib/format/currency";
import type { TransactionItem } from "./TransactionList";

type TransactionAmountProps = {
	type: TransactionItem["type"];
	amount: number;
};

export function TransactionAmount({ type, amount }: TransactionAmountProps) {
	const sign = type === "expense" ? "−" : type === "income" ? "+" : "";

	return (
		<span className={`tx-amount tx-amount--${type}`}>
			{sign ? (
				<span className="tx-amount__sign" aria-hidden>
					{sign}
				</span>
			) : null}
			<span className="tx-amount__value">{formatCOP(amount)}</span>
		</span>
	);
}
