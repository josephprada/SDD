import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = QueryCtx | MutationCtx;

export async function requireUserId(ctx: Ctx): Promise<Id<"users">> {
	const userId = await getAuthUserId(ctx);
	if (!userId) {
		throw new Error("Not authenticated");
	}
	return userId;
}

export async function requireAccountOwnership(
	ctx: Ctx,
	userId: Id<"users">,
	accountId: Id<"accounts">,
) {
	const account = await ctx.db.get(accountId);
	if (!account || account.userId !== userId) {
		throw new Error("Account not found");
	}
	return account;
}

export async function requireCategoryOwnership(
	ctx: Ctx,
	userId: Id<"users">,
	categoryId: Id<"categories">,
) {
	const category = await ctx.db.get(categoryId);
	if (!category || category.userId !== userId) {
		throw new Error("Category not found");
	}
	return category;
}

export async function requireTransactionOwnership(
	ctx: Ctx,
	userId: Id<"users">,
	transactionId: Id<"transactions">,
) {
	const transaction = await ctx.db.get(transactionId);
	if (!transaction || transaction.userId !== userId) {
		throw new Error("Transaction not found");
	}
	return transaction;
}

export async function requireAttachmentOwnership(
	ctx: Ctx,
	userId: Id<"users">,
	attachmentId: Id<"attachments">,
) {
	const attachment = await ctx.db.get(attachmentId);
	if (!attachment || attachment.userId !== userId) {
		throw new Error("Attachment not found");
	}
	return attachment;
}

export async function requireCreditOwnership(
	ctx: Ctx,
	userId: Id<"users">,
	creditId: Id<"credits">,
) {
	const credit = await ctx.db.get(creditId);
	if (!credit || credit.userId !== userId) {
		throw new Error("Credit not found");
	}
	return credit;
}

export async function requireSavingsGoalOwnership(
	ctx: Ctx,
	userId: Id<"users">,
	goalId: Id<"savingsGoals">,
) {
	const goal = await ctx.db.get(goalId);
	if (!goal || goal.userId !== userId) {
		throw new Error("Savings goal not found");
	}
	return goal;
}
