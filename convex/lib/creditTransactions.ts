import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { requireAccountOwnership } from "./auth";
import { getBalanceDeltas, invertDeltas } from "./balance";
import { validatePositiveCopAmount } from "./validators";

async function applyBalanceDeltas(
	ctx: MutationCtx,
	userId: Id<"users">,
	deltas: Array<{ accountId: Id<"accounts">; delta: number }>,
) {
	for (const { accountId, delta } of deltas) {
		const account = await requireAccountOwnership(ctx, userId, accountId);
		await ctx.db.patch(accountId, {
			balance: account.balance + delta,
			updatedAt: Date.now(),
		});
	}
}

export async function insertCreditLinkedTransaction(
	ctx: MutationCtx,
	userId: Id<"users">,
	params: {
		type: "income" | "expense";
		amount: number;
		date: number;
		accountId: Id<"accounts">;
		categoryId: Id<"categories">;
		creditId: Id<"credits">;
		notes?: string;
		isCreditFundMovement?: boolean;
	},
): Promise<Id<"transactions">> {
	const amount = validatePositiveCopAmount(params.amount);
	await requireAccountOwnership(ctx, userId, params.accountId);

	const deltas = getBalanceDeltas({
		type: params.type,
		amount,
		accountId: params.accountId,
	});
	await applyBalanceDeltas(ctx, userId, deltas);

	const now = Date.now();
	const transactionId = await ctx.db.insert("transactions", {
		userId,
		type: params.type,
		amount,
		date: params.date,
		accountId: params.accountId,
		categoryId: params.categoryId,
		notes: params.notes,
		creditId: params.creditId,
		isCreditFundMovement: params.isCreditFundMovement,
		sortOrder: now,
		createdAt: now,
		updatedAt: now,
	});

	if (params.type === "expense") {
		await ctx.scheduler.runAfter(
			0,
			internal.budgets.checkThresholdAfterTransaction,
			{
				userId,
				categoryId: params.categoryId,
				date: params.date,
			},
		);
	}

	return transactionId;
}

export async function removeCreditLinkedTransaction(
	ctx: MutationCtx,
	userId: Id<"users">,
	transactionId: Id<"transactions">,
) {
	const transaction = await ctx.db.get(transactionId);
	if (!transaction || transaction.userId !== userId) {
		return;
	}

	const deltas = getBalanceDeltas({
		type: transaction.type,
		amount: transaction.amount,
		accountId: transaction.accountId,
		toAccountId: transaction.toAccountId,
	});
	await applyBalanceDeltas(ctx, userId, invertDeltas(deltas));
	await ctx.db.delete(transactionId);
}
