import type { Doc } from "../_generated/dataModel";

type SortableTransaction = Pick<
	Doc<"transactions">,
	"date" | "sortOrder" | "createdAt"
>;

export function transactionSortKey(tx: SortableTransaction): number {
	return tx.sortOrder ?? tx.createdAt;
}

export function compareTransactions(
	a: SortableTransaction,
	b: SortableTransaction,
): number {
	if (b.date !== a.date) return b.date - a.date;
	return transactionSortKey(b) - transactionSortKey(a);
}
