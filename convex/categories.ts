import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { requireCategoryOwnership, requireUserId } from "./lib/auth";
import { categoryTypeValidator, validateNonEmptyName } from "./lib/validators";

export type CategoryUsageCounts = {
	transactions: number;
	fixedExpenses: number;
	budgets: number;
	credits: number;
	savingsGoals: number;
};

const emptyUsage = (): CategoryUsageCounts => ({
	transactions: 0,
	fixedExpenses: 0,
	budgets: 0,
	credits: 0,
	savingsGoals: 0,
});

export const usageCounts = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);
		const counts: Record<string, CategoryUsageCounts> = {};

		const bump = (categoryId: Id<"categories">, field: keyof CategoryUsageCounts) => {
			const key = categoryId as string;
			if (!counts[key]) counts[key] = emptyUsage();
			counts[key][field]++;
		};

		const transactions = await ctx.db
			.query("transactions")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();
		for (const tx of transactions) {
			bump(tx.categoryId, "transactions");
		}

		const fixedExpenses = await ctx.db
			.query("fixedExpenses")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();
		const fixedExpenseCategoryById = new Map(
			fixedExpenses.map((fe) => [fe._id, fe.categoryId]),
		);
		for (const fe of fixedExpenses) {
			bump(fe.categoryId, "fixedExpenses");
		}

		const budgets = await ctx.db
			.query("budgets")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();
		for (const budget of budgets) {
			for (const categoryId of budget.categoryIds) {
				bump(categoryId, "budgets");
			}
		}

		const credits = await ctx.db
			.query("credits")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();
		for (const credit of credits) {
			const linkedCategories = new Set<Id<"categories">>();
			if (credit.paymentCategoryId) {
				linkedCategories.add(credit.paymentCategoryId);
			}
			if (credit.disbursementIncomeCategoryId) {
				linkedCategories.add(credit.disbursementIncomeCategoryId);
			}
			for (const categoryId of credit.fundExpenseCategoryIds ?? []) {
				linkedCategories.add(categoryId);
			}
			for (const categoryId of linkedCategories) {
				bump(categoryId, "credits");
			}
		}

		const goals = await ctx.db
			.query("savingsGoals")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();
		for (const goal of goals) {
			if (!goal.linkedFixedExpenseId) continue;
			const categoryId = fixedExpenseCategoryById.get(goal.linkedFixedExpenseId);
			if (categoryId) bump(categoryId, "savingsGoals");
		}

		return counts;
	},
});

export const list = query({
	args: {
		type: v.optional(categoryTypeValidator),
		includeArchived: v.optional(v.boolean()),
		includeCreditLinked: v.optional(v.boolean()),
	},
	handler: async (ctx, { type, includeArchived, includeCreditLinked }) => {
		const userId = await requireUserId(ctx);

		let categories = type
			? await ctx.db
					.query("categories")
					.withIndex("by_user_type", (q) =>
						q.eq("userId", userId).eq("type", type),
					)
					.collect()
			: await ctx.db
					.query("categories")
					.withIndex("by_user", (q) => q.eq("userId", userId))
					.collect();

		if (!includeArchived) {
			categories = categories.filter((c) => !c.archived);
		}

		if (!includeCreditLinked) {
			categories = categories.filter((c) => !c.linkedCreditId);
		}

		return categories.sort((a, b) => a.name.localeCompare(b.name, "es"));
	},
});

export const create = mutation({
	args: {
		name: v.string(),
		icon: v.string(),
		color: v.string(),
		type: categoryTypeValidator,
	},
	handler: async (ctx, { name, icon, color, type }) => {
		const userId = await requireUserId(ctx);
		const trimmedName = validateNonEmptyName(name);

		const existing = await ctx.db
			.query("categories")
			.withIndex("by_user_type_archived", (q) =>
				q.eq("userId", userId).eq("type", type).eq("archived", false),
			)
			.collect();

		const duplicate = existing.find(
			(c) => c.name.toLowerCase() === trimmedName.toLowerCase(),
		);
		if (duplicate) {
			throw new Error("A category with this name already exists");
		}

		const now = Date.now();
		return await ctx.db.insert("categories", {
			userId,
			name: trimmedName,
			icon: icon.trim() || "📦",
			color: color.trim() || "#7F8C8D",
			type,
			archived: false,
			isSystem: false,
			createdAt: now,
			updatedAt: now,
		});
	},
});

export const update = mutation({
	args: {
		categoryId: v.id("categories"),
		name: v.string(),
		icon: v.string(),
		color: v.string(),
	},
	handler: async (ctx, { categoryId, name, icon, color }) => {
		const userId = await requireUserId(ctx);
		const category = await requireCategoryOwnership(ctx, userId, categoryId);

		if (category.isSystem) {
			throw new Error("System categories cannot be edited");
		}

		const trimmedName = validateNonEmptyName(name);

		const siblings = await ctx.db
			.query("categories")
			.withIndex("by_user_type_archived", (q) =>
				q.eq("userId", userId).eq("type", category.type).eq("archived", false),
			)
			.collect();

		const duplicate = siblings.find(
			(c) =>
				c._id !== categoryId &&
				c.name.toLowerCase() === trimmedName.toLowerCase(),
		);
		if (duplicate) {
			throw new Error("A category with this name already exists");
		}

		await ctx.db.patch(categoryId, {
			name: trimmedName,
			icon: icon.trim() || category.icon,
			color: color.trim() || category.color,
			updatedAt: Date.now(),
		});

		return null;
	},
});

export const archive = mutation({
	args: {
		categoryId: v.id("categories"),
	},
	handler: async (ctx, { categoryId }) => {
		const userId = await requireUserId(ctx);
		const category = await requireCategoryOwnership(ctx, userId, categoryId);

		if (category.isSystem) {
			throw new Error("System categories cannot be archived");
		}

		const now = Date.now();
		await ctx.db.patch(categoryId, {
			archived: true,
			archivedAt: now,
			updatedAt: now,
		});

		return null;
	},
});
