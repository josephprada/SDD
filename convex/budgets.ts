import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { internalMutation, mutation, query } from "./_generated/server";
import { requireCategoryOwnership, requireUserId } from "./lib/auth";
import {
	thresholdStatus,
	type ThresholdStatus,
} from "./lib/notifications";
import { periodKeyToMonthRange, periodKeyFromTimestamp } from "./lib/period";
import { resolveUserPreferences } from "./lib/preferences";
import {
	validatePeriodKey,
	validatePositiveCopAmount,
	MAX_BUDGET_NOTES_LENGTH,
} from "./lib/validators";
import { internal } from "./_generated/api";

export type BudgetCategoryInfo = {
	id: Id<"categories">;
	name: string;
	color: string;
	icon: string;
};

export type BudgetListItem = {
	_id: Id<"budgets">;
	categoryIds: Id<"categories">[];
	categories: BudgetCategoryInfo[];
	amount: number;
	spent: number;
	remaining: number;
	percent: number;
	thresholdStatus: ThresholdStatus;
	notes?: string;
};

async function spentForCategoriesInPeriod(
	ctx: { db: QueryCtx["db"] },
	userId: Id<"users">,
	categoryIds: Id<"categories">[],
	periodStart: number,
	periodEnd: number,
	excludeTransactionId?: Id<"transactions">,
): Promise<number> {
	let spent = 0;
	for (const categoryId of categoryIds) {
		const transactions = await ctx.db
			.query("transactions")
			.withIndex("by_user_category", (q) =>
				q.eq("userId", userId).eq("categoryId", categoryId),
			)
			.collect();

		for (const t of transactions) {
			if (excludeTransactionId && t._id === excludeTransactionId) continue;
			if (t.type === "expense" && t.date >= periodStart && t.date <= periodEnd) {
				spent += t.amount;
			}
		}
	}
	return spent;
}

async function resolveBudgetCategories(
	ctx: QueryCtx,
	categoryIds: Id<"categories">[],
): Promise<BudgetCategoryInfo[]> {
	const categories: BudgetCategoryInfo[] = [];
	for (const id of categoryIds) {
		const category = await ctx.db.get(id);
		categories.push({
			id,
			name: category?.name ?? "Categoría",
			color: category?.color ?? "#7F8C8D",
			icon: category?.icon ?? "package",
		});
	}
	return categories;
}

async function enrichBudget(
	ctx: QueryCtx,
	budget: Doc<"budgets">,
): Promise<BudgetListItem> {
	const categoryIds = budget.categoryIds;
	const { start, end } = periodKeyToMonthRange(budget.periodKey);
	const spent = await spentForCategoriesInPeriod(
		ctx,
		budget.userId,
		categoryIds,
		start,
		end,
	);
	const percent = budget.amount > 0 ? spent / budget.amount : 0;

	return {
		_id: budget._id,
		categoryIds,
		categories: await resolveBudgetCategories(ctx, categoryIds),
		amount: budget.amount,
		spent,
		remaining: budget.amount - spent,
		percent,
		thresholdStatus: thresholdStatus(percent),
		notes: budget.notes,
	};
}

async function validateExpenseCategories(
	ctx: QueryCtx,
	userId: Id<"users">,
	categoryIds: Id<"categories">[],
) {
	if (categoryIds.length === 0) {
		throw new Error("Select at least one category");
	}

	const unique = new Set(categoryIds);
	if (unique.size !== categoryIds.length) {
		throw new Error("Duplicate categories in budget");
	}

	for (const categoryId of categoryIds) {
		const category = await requireCategoryOwnership(ctx, userId, categoryId);
		if (category.type !== "expense") {
			throw new Error("Only expense categories can have budgets");
		}
		if (category.archived) {
			throw new Error("Category is archived");
		}
	}
}

async function assertCategoriesAvailableForPeriod(
	ctx: QueryCtx,
	userId: Id<"users">,
	periodKey: string,
	categoryIds: Id<"categories">[],
	excludeBudgetId?: Id<"budgets">,
) {
	const budgets = await ctx.db
		.query("budgets")
		.withIndex("by_user_period", (q) =>
			q.eq("userId", userId).eq("periodKey", periodKey),
		)
		.collect();

	const selected = new Set(categoryIds);
	const conflicts = new Set<Id<"categories">>();

	for (const budget of budgets) {
		if (excludeBudgetId && budget._id === excludeBudgetId) continue;
		for (const categoryId of budget.categoryIds) {
			if (selected.has(categoryId)) {
				conflicts.add(categoryId);
			}
		}
	}

	if (conflicts.size === 0) return;

	const names: string[] = [];
	for (const categoryId of conflicts) {
		const category = await ctx.db.get(categoryId);
		names.push(category?.name ?? "Categoría");
	}

	const label =
		names.length === 1
			? `La categoría «${names[0]}»`
			: `Las categorías ${names.map((name) => `«${name}»`).join(", ")}`;

	throw new ConvexError(
		`${label} ya está en otro presupuesto de este mes. Cada categoría solo puede pertenecer a un presupuesto a la vez.`,
	);
}

export const list = query({
	args: { periodKey: v.string() },
	handler: async (ctx, { periodKey }) => {
		const userId = await requireUserId(ctx);
		validatePeriodKey(periodKey);

		const budgets = await ctx.db
			.query("budgets")
			.withIndex("by_user_period", (q) =>
				q.eq("userId", userId).eq("periodKey", periodKey),
			)
			.collect();

		return Promise.all(budgets.map((b) => enrichBudget(ctx, b)));
	},
});

export const listAtRisk = query({
	args: {
		periodKey: v.string(),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, { periodKey, limit = 5 }) => {
		const userId = await requireUserId(ctx);
		validatePeriodKey(periodKey);

		const budgets = await ctx.db
			.query("budgets")
			.withIndex("by_user_period", (q) =>
				q.eq("userId", userId).eq("periodKey", periodKey),
			)
			.collect();

		const enriched = await Promise.all(budgets.map((b) => enrichBudget(ctx, b)));

		return enriched
			.filter(
				(b) =>
					b.thresholdStatus === "warning" || b.thresholdStatus === "danger",
			)
			.sort((a, b) => b.percent - a.percent)
			.slice(0, Math.max(1, Math.min(limit, 10)));
	},
});

export type BudgetTransactionPreview = {
	budgetId: Id<"budgets">;
	budgetLabel: string;
	periodKey: string;
	limit: number;
	spent: number;
	projectedSpent: number;
	remaining: number;
	projectedRemaining: number;
	percent: number;
	projectedPercent: number;
	thresholdStatus: ThresholdStatus;
	projectedThresholdStatus: ThresholdStatus;
};

export const previewForTransaction = query({
	args: {
		categoryId: v.id("categories"),
		periodKey: v.string(),
		draftAmount: v.optional(v.number()),
		excludeTransactionId: v.optional(v.id("transactions")),
	},
	handler: async (ctx, args): Promise<BudgetTransactionPreview | null> => {
		const userId = await requireUserId(ctx);
		const periodKey = validatePeriodKey(args.periodKey);

		const budgets = await ctx.db
			.query("budgets")
			.withIndex("by_user_period", (q) =>
				q.eq("userId", userId).eq("periodKey", periodKey),
			)
			.collect();

		const budget = budgets.find((b) => b.categoryIds.includes(args.categoryId));
		if (!budget) return null;

		const categories = await resolveBudgetCategories(ctx, budget.categoryIds);
		const { start, end } = periodKeyToMonthRange(periodKey);
		const spent = await spentForCategoriesInPeriod(
			ctx,
			userId,
			budget.categoryIds,
			start,
			end,
			args.excludeTransactionId,
		);
		const draftAmount = args.draftAmount ?? 0;
		const projectedSpent = spent + draftAmount;
		const limit = budget.amount;
		const percent = limit > 0 ? spent / limit : 0;
		const projectedPercent = limit > 0 ? projectedSpent / limit : 0;

		return {
			budgetId: budget._id,
			budgetLabel: categories.map((c) => c.name).join(", "),
			periodKey,
			limit,
			spent,
			projectedSpent,
			remaining: limit - spent,
			projectedRemaining: limit - projectedSpent,
			percent,
			projectedPercent,
			thresholdStatus: thresholdStatus(percent),
			projectedThresholdStatus: thresholdStatus(projectedPercent),
		};
	},
});

export const create = mutation({
	args: {
		categoryIds: v.array(v.id("categories")),
		amount: v.number(),
		periodKey: v.string(),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const periodKey = validatePeriodKey(args.periodKey);
		const amount = validatePositiveCopAmount(args.amount);
		const notes = args.notes?.trim().slice(0, MAX_BUDGET_NOTES_LENGTH);

		await validateExpenseCategories(ctx, userId, args.categoryIds);
		await assertCategoriesAvailableForPeriod(
			ctx,
			userId,
			periodKey,
			args.categoryIds,
		);

		const now = Date.now();
		return await ctx.db.insert("budgets", {
			userId,
			categoryIds: args.categoryIds,
			amount,
			periodKey,
			notes: notes || undefined,
			createdAt: now,
			updatedAt: now,
		});
	},
});

export const update = mutation({
	args: {
		id: v.id("budgets"),
		categoryIds: v.optional(v.array(v.id("categories"))),
		amount: v.optional(v.number()),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const budget = await ctx.db.get(args.id);
		if (!budget || budget.userId !== userId) {
			throw new Error("Budget not found");
		}

		const patch: Partial<Doc<"budgets">> = { updatedAt: Date.now() };

		if (args.categoryIds !== undefined) {
			await validateExpenseCategories(ctx, userId, args.categoryIds);
			await assertCategoriesAvailableForPeriod(
				ctx,
				userId,
				budget.periodKey,
				args.categoryIds,
				args.id,
			);
			patch.categoryIds = args.categoryIds;
		}
		if (args.amount !== undefined) {
			patch.amount = validatePositiveCopAmount(args.amount);
		}
		if (args.notes !== undefined) {
			patch.notes = args.notes.trim().slice(0, MAX_BUDGET_NOTES_LENGTH) || undefined;
		}

		await ctx.db.patch(args.id, patch);
		return null;
	},
});

export const remove = mutation({
	args: { id: v.id("budgets") },
	handler: async (ctx, { id }) => {
		const userId = await requireUserId(ctx);
		const budget = await ctx.db.get(id);
		if (!budget || budget.userId !== userId) {
			throw new Error("Budget not found");
		}
		await ctx.db.delete(id);
		return null;
	},
});

export const checkThresholdAfterTransaction = internalMutation({
	args: {
		userId: v.id("users"),
		categoryId: v.id("categories"),
		date: v.number(),
	},
	handler: async (ctx, { userId, categoryId, date }) => {
		const prefsDoc = await ctx.db
			.query("userPreferences")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.unique();
		const prefs = resolveUserPreferences(prefsDoc);
		if (!prefs.notificationsEnabled) return null;

		const periodKey = periodKeyFromTimestamp(date);
		const budgets = await ctx.db
			.query("budgets")
			.withIndex("by_user_period", (q) =>
				q.eq("userId", userId).eq("periodKey", periodKey),
			)
			.collect();

		const matching = budgets.filter((b) =>
			b.categoryIds.includes(categoryId),
		);

		for (const budget of matching) {
			const enriched = await enrichBudget(ctx, budget);
			const status = enriched.thresholdStatus;
			if (status !== "warning" && status !== "danger") continue;

			const pct = Math.round(enriched.percent * 100);
			const dateKey = new Date().toISOString().slice(0, 10);
			const label = enriched.categories.map((c) => c.name).join(", ");

			await ctx.scheduler.runAfter(0, internal.notifications.dispatch, {
				userId,
				type: "budget_threshold",
				referenceId: budget._id as string,
				channels: ["in_app", "push"],
				payload: {
					title: `Presupuesto ${label}`,
					body: `Has alcanzado el ${pct}% del límite (${status === "danger" ? "superado" : "alerta"})`,
					url: "/budgets",
					emailSubject: `Alerta de presupuesto — ${label}`,
					emailHtml: `<p>Tu presupuesto <strong>${label}</strong> está al <strong>${pct}%</strong>.</p>`,
				},
				dateKey,
				dedupeSuffix: status,
			});
		}

		return null;
	},
});
