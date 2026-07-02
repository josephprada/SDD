import type { Doc } from "../_generated/dataModel";

type SortableAccount = Pick<Doc<"accounts">, "sortOrder" | "createdAt">;

export function accountSortKey(account: SortableAccount): number {
	return account.sortOrder ?? account.createdAt;
}

export function compareAccounts(
	a: SortableAccount,
	b: SortableAccount,
): number {
	return accountSortKey(a) - accountSortKey(b);
}
