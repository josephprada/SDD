import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { requireAccountOwnership, requireCreditOwnership } from "./auth";
import { getBalanceDeltas } from "./balance";
import { isFundExpenseCategory } from "./creditCategories";
import { validatePositiveCopAmount } from "./validators";

async function applyBalanceDelta(
	ctx: MutationCtx,
	userId: Id<"users">,
	accountId: Id<"accounts">,
	delta: number,
) {
	const account = await requireAccountOwnership(ctx, userId, accountId);
	if (account.archived && delta < 0) {
		throw new Error("Cannot debit archived account");
	}
	await ctx.db.patch(accountId, {
		balance: account.balance + delta,
		updatedAt: Date.now(),
	});
}

export async function executeSpendFromFund(
	ctx: MutationCtx,
	userId: Id<"users">,
	args: {
		creditId: Id<"credits">;
		destinationId: Id<"creditDestinations">;
		amount: number;
		categoryId: Id<"categories">;
		expenseAccountId?: Id<"accounts">;
		notes?: string;
		date?: number;
	},
) {
	const credit = await requireCreditOwnership(ctx, userId, args.creditId);
	const amount = validatePositiveCopAmount(args.amount);
	const destination = await ctx.db.get(args.destinationId);
	if (!destination || destination.creditId !== args.creditId) {
		throw new Error("Destination not found");
	}
	if (!credit.disbursementAccountId) {
		throw new Error("Credit disbursement account not configured");
	}

	const category = await ctx.db.get(args.categoryId);
	if (
		!category ||
		category.userId !== userId ||
		!isFundExpenseCategory(category, credit.fundExpenseCategoryIds)
	) {
		throw new Error("Category is not a fund expense category for this credit");
	}

	const expenseAccountId =
		args.expenseAccountId ?? credit.disbursementAccountId;
	await requireAccountOwnership(ctx, userId, expenseAccountId);

	if (expenseAccountId === credit.disbursementAccountId) {
		const escrow = await ctx.db.get(credit.disbursementAccountId);
		if ((escrow?.balance ?? 0) < amount) {
			throw new Error("Insufficient escrow balance");
		}
	}

	const now = args.date ?? Date.now();
	const deltas = getBalanceDeltas({
		type: "expense",
		amount,
		accountId: expenseAccountId,
	});
	for (const { accountId, delta } of deltas) {
		await applyBalanceDelta(ctx, userId, accountId, delta);
	}

	const expenseId = await ctx.db.insert("transactions", {
		userId,
		type: "expense",
		amount,
		date: now,
		accountId: expenseAccountId,
		categoryId: args.categoryId,
		notes: args.notes ?? destination.name,
		creditId: args.creditId,
		creditDestinationId: args.destinationId,
		sortOrder: now,
		createdAt: now,
		updatedAt: now,
	});

	await ctx.scheduler.runAfter(
		0,
		internal.budgets.checkThresholdAfterTransaction,
		{
			userId,
			categoryId: args.categoryId,
			date: now,
		},
	);

	const transactionIds = [...(destination.transactionIds ?? []), expenseId];

	await ctx.db.patch(args.destinationId, {
		status:
			destination.status === "planned" ? "in_progress" : destination.status,
		spentAt: now,
		transactionIds,
		updatedAt: now,
	});

	return { expenseId };
}
