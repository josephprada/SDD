import type { Id } from "../_generated/dataModel";

export type BalanceDelta = {
	accountId: Id<"accounts">;
	delta: number;
};

export type TransactionLike = {
	type: "income" | "expense" | "transfer";
	amount: number;
	accountId: Id<"accounts">;
	toAccountId?: Id<"accounts">;
};

export function getBalanceDeltas(transaction: TransactionLike): BalanceDelta[] {
	const { type, amount, accountId, toAccountId } = transaction;

	switch (type) {
		case "income":
			return [{ accountId, delta: amount }];
		case "expense":
			return [{ accountId, delta: -amount }];
		case "transfer":
			if (!toAccountId) {
				throw new Error("Transfer requires destination account");
			}
			if (accountId === toAccountId) {
				throw new Error("Transfer origin and destination must differ");
			}
			return [
				{ accountId, delta: -amount },
				{ accountId: toAccountId, delta: amount },
			];
		default:
			throw new Error("Invalid transaction type");
	}
}

export function invertDeltas(deltas: BalanceDelta[]): BalanceDelta[] {
	return deltas.map(({ accountId, delta }) => ({ accountId, delta: -delta }));
}
