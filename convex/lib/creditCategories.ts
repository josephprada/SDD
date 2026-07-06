import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { requireCategoryOwnership } from "./auth";
import { validateNonEmptyName } from "./validators";

const CREDIT_CATEGORY_COLOR = "#07FBA2";

export async function createCreditPaymentCategory(
	ctx: MutationCtx,
	userId: Id<"users">,
	creditId: Id<"credits">,
	creditName: string,
): Promise<Id<"categories">> {
	const now = Date.now();
	return await ctx.db.insert("categories", {
		userId,
		name: `Cuota · ${creditName}`,
		icon: "💳",
		color: CREDIT_CATEGORY_COLOR,
		type: "expense",
		archived: false,
		isSystem: false,
		linkedCreditId: creditId,
		linkedCreditPurpose: "payment",
		linkedCreditAutoDelete: true,
		createdAt: now,
		updatedAt: now,
	});
}

export async function createCreditDisbursementCategory(
	ctx: MutationCtx,
	userId: Id<"users">,
	creditId: Id<"credits">,
	creditName: string,
): Promise<Id<"categories">> {
	const now = Date.now();
	return await ctx.db.insert("categories", {
		userId,
		name: `Desembolso · ${creditName}`,
		icon: "🏦",
		color: CREDIT_CATEGORY_COLOR,
		type: "income",
		archived: false,
		isSystem: false,
		linkedCreditId: creditId,
		linkedCreditPurpose: "disbursement_income",
		linkedCreditAutoDelete: true,
		createdAt: now,
		updatedAt: now,
	});
}

export async function createFundExpenseCategory(
	ctx: MutationCtx,
	userId: Id<"users">,
	creditId: Id<"credits">,
	categoryName: string,
	options?: { deleteWithCredit?: boolean },
): Promise<Id<"categories">> {
	const name = validateNonEmptyName(categoryName);
	const now = Date.now();
	return await ctx.db.insert("categories", {
		userId,
		name,
		icon: "🔨",
		color: CREDIT_CATEGORY_COLOR,
		type: "expense",
		archived: false,
		isSystem: false,
		linkedCreditId: creditId,
		linkedCreditPurpose: "fund_expense",
		linkedCreditAutoDelete: options?.deleteWithCredit ?? false,
		createdAt: now,
		updatedAt: now,
	});
}

export async function linkFundExpenseCategory(
	ctx: MutationCtx,
	userId: Id<"users">,
	creditId: Id<"credits">,
	categoryId: Id<"categories">,
) {
	const category = await requireCategoryOwnership(ctx, userId, categoryId);
	if (category.type !== "expense") {
		throw new Error("Fund expense categories must be expense type");
	}
	if (category.archived) {
		throw new Error("Cannot link archived category");
	}
	if (
		category.linkedCreditId &&
		category.linkedCreditId !== creditId &&
		category.linkedCreditPurpose !== "fund_expense"
	) {
		throw new Error("Category is already linked to another credit");
	}
	const now = Date.now();
	await ctx.db.patch(categoryId, {
		linkedCreditId: creditId,
		linkedCreditPurpose: "fund_expense",
		linkedCreditAutoDelete: undefined,
		updatedAt: now,
	});
}

export async function unlinkCategoryFromCredit(
	ctx: MutationCtx,
	categoryId: Id<"categories">,
) {
	const category = await ctx.db.get(categoryId);
	if (!category?.linkedCreditId) return;
	await ctx.db.patch(categoryId, {
		linkedCreditId: undefined,
		linkedCreditPurpose: undefined,
		linkedCreditAutoDelete: undefined,
		updatedAt: Date.now(),
	});
}

/** @deprecated use unlinkCategoryFromCredit */
export async function unlinkFundExpenseCategory(
	ctx: MutationCtx,
	categoryId: Id<"categories">,
) {
	await unlinkCategoryFromCredit(ctx, categoryId);
}

export async function syncFundExpenseCategories(
	ctx: MutationCtx,
	userId: Id<"users">,
	creditId: Id<"credits">,
	categoryIds: Id<"categories">[],
	newCategoryNames: string[],
	options?: { deleteNewWithCredit?: boolean },
): Promise<Id<"categories">[]> {
	const uniqueIds = [...new Set(categoryIds)];
	for (const categoryId of uniqueIds) {
		await linkFundExpenseCategory(ctx, userId, creditId, categoryId);
	}
	const createdIds: Id<"categories">[] = [];
	for (const rawName of newCategoryNames) {
		const trimmed = rawName.trim();
		if (!trimmed) continue;
		createdIds.push(
			await createFundExpenseCategory(ctx, userId, creditId, trimmed, {
				deleteWithCredit: options?.deleteNewWithCredit ?? false,
			}),
		);
	}
	return [...uniqueIds, ...createdIds];
}

export function isFundExpenseCategory(
	category: { _id: Id<"categories">; linkedCreditPurpose?: string },
	fundExpenseCategoryIds?: Id<"categories">[],
): boolean {
	if (category.linkedCreditPurpose === "fund_expense") return true;
	return fundExpenseCategoryIds?.includes(category._id) ?? false;
}

function shouldDeleteCategoryOnCreditRemove(category: {
	linkedCreditPurpose?: string;
	linkedCreditAutoDelete?: boolean;
}): boolean {
	if (category.linkedCreditAutoDelete) return true;
	if (
		category.linkedCreditPurpose === "payment" ||
		category.linkedCreditPurpose === "disbursement_income"
	) {
		return true;
	}
	return false;
}

export async function deleteCategoriesLinkedToCredit(
	ctx: MutationCtx,
	creditId: Id<"credits">,
) {
	const categories = await ctx.db
		.query("categories")
		.withIndex("by_linked_credit", (q) => q.eq("linkedCreditId", creditId))
		.collect();
	for (const category of categories) {
		if (shouldDeleteCategoryOnCreditRemove(category)) {
			await ctx.db.delete(category._id);
			continue;
		}
		await unlinkCategoryFromCredit(ctx, category._id);
	}
}
