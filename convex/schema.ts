import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import {
	accentPresetValidator,
	dangerPresetValidator,
	groupingValidator,
	languageValidator,
	themeValidator,
	typographyPresetValidator,
} from "./lib/preferences";

const accountTypeValidator = v.union(
	v.literal("cash"),
	v.literal("bank"),
	v.literal("credit"),
);

const categoryTypeValidator = v.union(
	v.literal("expense"),
	v.literal("income"),
	v.literal("transfer"),
);

const transactionTypeValidator = v.union(
	v.literal("income"),
	v.literal("expense"),
	v.literal("transfer"),
);

const mimeTypeValidator = v.union(
	v.literal("image/jpeg"),
	v.literal("image/png"),
	v.literal("application/pdf"),
);

export default defineSchema({
	...authTables,

	userProfiles: defineTable({
		userId: v.id("users"),
		googleSub: v.string(),
		displayName: v.optional(v.string()),
		avatarStorageId: v.optional(v.id("_storage")),
		profileUpdatedAt: v.optional(v.number()),
		createdAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_googleSub", ["googleSub"]),

	userPreferences: defineTable({
		userId: v.id("users"),
		theme: themeValidator,
		accentPreset: v.optional(accentPresetValidator),
		dangerPreset: v.optional(dangerPresetValidator),
		typographyPreset: v.optional(typographyPresetValidator),
		defaultGrouping: v.optional(groupingValidator),
		language: v.optional(languageValidator),
		notificationsEnabled: v.optional(v.boolean()),
		updatedAt: v.number(),
	}).index("by_user", ["userId"]),

	categories: defineTable({
		userId: v.id("users"),
		name: v.string(),
		icon: v.string(),
		color: v.string(),
		type: categoryTypeValidator,
		archived: v.optional(v.boolean()),
		isSystem: v.optional(v.boolean()),
		createdAt: v.number(),
		updatedAt: v.optional(v.number()),
		archivedAt: v.optional(v.number()),
	})
		.index("by_user", ["userId"])
		.index("by_user_type", ["userId", "type"])
		.index("by_user_type_archived", ["userId", "type", "archived"]),

	accounts: defineTable({
		userId: v.id("users"),
		name: v.string(),
		type: accountTypeValidator,
		initialBalance: v.number(),
		balance: v.number(),
		archived: v.boolean(),
		sortOrder: v.optional(v.number()),
		createdAt: v.number(),
		updatedAt: v.number(),
		archivedAt: v.optional(v.number()),
	})
		.index("by_user", ["userId"])
		.index("by_user_archived", ["userId", "archived"]),

	transactions: defineTable({
		userId: v.id("users"),
		type: transactionTypeValidator,
		amount: v.number(),
		date: v.number(),
		accountId: v.id("accounts"),
		toAccountId: v.optional(v.id("accounts")),
		categoryId: v.id("categories"),
		notes: v.optional(v.string()),
		sortOrder: v.optional(v.number()),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_user_date", ["userId", "date"])
		.index("by_user_account", ["userId", "accountId"])
		.index("by_user_category", ["userId", "categoryId"]),

	attachments: defineTable({
		userId: v.id("users"),
		entityType: v.literal("transaction"),
		entityId: v.id("transactions"),
		storageId: v.id("_storage"),
		filename: v.string(),
		mimeType: mimeTypeValidator,
		size: v.number(),
		uploadedAt: v.number(),
	})
		.index("by_user", ["userId"])
		.index("by_entity", ["entityType", "entityId"]),
});
