import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { requireAccountOwnership } from "./auth";
import { getBalanceDeltas, invertDeltas } from "./balance";
import { validatePositiveCopAmount } from "./validators";

async function applyBalanceDeltas(
	ctx: MutationCtx,
	userId: Id<"users">,
	deltas: Array<{ accountId: Id<"accounts">; delta: number }>,
) {
	const now = Date.now();
	for (const { accountId, delta } of deltas) {
		const account = await requireAccountOwnership(ctx, userId, accountId);
		if (account.archived && delta < 0) {
			throw new Error("Cannot debit archived account");
		}
		await ctx.db.patch(accountId, {
			balance: account.balance + delta,
			updatedAt: now,
		});
	}
}

export async function resolveTransferCategory(
	ctx: MutationCtx,
	userId: Id<"users">,
): Promise<Id<"categories">> {
	const categories = await ctx.db
		.query("categories")
		.withIndex("by_user_type", (q) =>
			q.eq("userId", userId).eq("type", "transfer"),
		)
		.collect();

	const active = categories.filter((category) => !category.archived);
	const systemTransfer = active.find(
		(category) => category.name === "Transferencia",
	);
	const category = systemTransfer ?? active[0];
	if (!category) {
		throw new Error(
			"Crea la categoría de transferencia para registrar aportes entre cuentas",
		);
	}
	return category._id;
}

export async function insertSavingsGoalTransferTransaction(
	ctx: MutationCtx,
	userId: Id<"users">,
	params: {
		fromAccountId: Id<"accounts">;
		toAccountId: Id<"accounts">;
		amount: number;
		date: number;
		notes?: string;
	},
): Promise<Id<"transactions">> {
	if (params.fromAccountId === params.toAccountId) {
		throw new Error("La cuenta origen y destino deben ser distintas");
	}

	const amount = validatePositiveCopAmount(params.amount);
	await requireAccountOwnership(ctx, userId, params.fromAccountId);
	const destination = await requireAccountOwnership(
		ctx,
		userId,
		params.toAccountId,
	);
	if (destination.archived) {
		throw new Error("La cuenta destino está archivada");
	}

	const categoryId = await resolveTransferCategory(ctx, userId);
	const deltas = getBalanceDeltas({
		type: "transfer",
		amount,
		accountId: params.fromAccountId,
		toAccountId: params.toAccountId,
	});
	await applyBalanceDeltas(ctx, userId, deltas);

	const now = Date.now();
	const notes = params.notes?.trim() || "Aporte a meta de ahorro";

	return await ctx.db.insert("transactions", {
		userId,
		type: "transfer",
		amount,
		date: params.date,
		accountId: params.fromAccountId,
		toAccountId: params.toAccountId,
		categoryId,
		notes,
		sortOrder: now,
		createdAt: now,
		updatedAt: now,
	});
}

export async function removeSavingsGoalLinkedTransaction(
	ctx: MutationCtx,
	userId: Id<"users">,
	transactionId: Id<"transactions">,
): Promise<void> {
	const transaction = await ctx.db.get(transactionId);
	if (!transaction || transaction.userId !== userId) {
		return;
	}
	if (transaction.type !== "transfer" && transaction.type !== "income") {
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
