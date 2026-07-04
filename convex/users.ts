import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { buildDefaultPreferencesInsert } from "./lib/preferences";
import {
	validateAvatarMimeType,
	validateAvatarSize,
	validateDisplayName,
} from "./lib/validators";
import { DEFAULT_CATEGORIES, categorySeedFields } from "./seed";

export const getOrCreateProfile = internalMutation({
	args: {
		userId: v.id("users"),
		googleSub: v.string(),
	},
	handler: async (ctx, { userId, googleSub }) => {
		const existing = await ctx.db
			.query("userProfiles")
			.withIndex("by_googleSub", (q) => q.eq("googleSub", googleSub))
			.unique();

		if (existing) {
			return { isNew: false, userId: existing.userId };
		}

		const byUser = await ctx.db
			.query("userProfiles")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.unique();

		if (byUser) {
			return { isNew: false, userId };
		}

		await ctx.db.insert("userProfiles", {
			userId,
			googleSub,
			createdAt: Date.now(),
		});

		await ctx.db.insert("userPreferences", buildDefaultPreferencesInsert(userId));

		const now = Date.now();
		for (const category of DEFAULT_CATEGORIES) {
			await ctx.db.insert("categories", {
				userId,
				...categorySeedFields(category, now),
			});
		}

		return { isNew: true, userId };
	},
});

export const ensureProvisioned = mutation({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		const existing = await ctx.db
			.query("userProfiles")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.unique();

		if (existing) {
			return { isNew: false };
		}

		const identity = await ctx.auth.getUserIdentity();
		const googleSub = identity?.subject ?? `user:${userId}`;

		await ctx.db.insert("userProfiles", {
			userId,
			googleSub,
			createdAt: Date.now(),
		});

		await ctx.db.insert("userPreferences", buildDefaultPreferencesInsert(userId));

		const now = Date.now();
		for (const category of DEFAULT_CATEGORIES) {
			await ctx.db.insert("categories", {
				userId,
				...categorySeedFields(category, now),
			});
		}

		return { isNew: true };
	},
});

export const currentUser = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}

		const user = await ctx.db.get(userId);
		if (!user) {
			return null;
		}

		const identity = await ctx.auth.getUserIdentity();
		const profile = await ctx.db
			.query("userProfiles")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.unique();

		const preferences = await ctx.db
			.query("userPreferences")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.unique();

		const oauthName = user.name ?? identity?.name ?? "Usuario";
		const displayName = profile?.displayName?.trim() || oauthName;
		const googlePicture = user.image ?? identity?.pictureUrl ?? undefined;
		const customAvatarUrl = profile?.avatarStorageId
			? await ctx.storage.getUrl(profile.avatarStorageId)
			: null;

		return {
			userId,
			email: user.email ?? identity?.email ?? "",
			name: displayName,
			picture: customAvatarUrl ?? googlePicture,
			hasCustomAvatar: Boolean(profile?.avatarStorageId),
			theme: preferences?.theme ?? "dark",
		};
	},
});

export const updateDisplayName = mutation({
	args: { displayName: v.string() },
	handler: async (ctx, { displayName }) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		const trimmedName = validateDisplayName(displayName);
		const profile = await ctx.db
			.query("userProfiles")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.unique();

		if (!profile) {
			throw new Error("Profile not found");
		}

		await ctx.db.patch(profile._id, {
			displayName: trimmedName,
			profileUpdatedAt: Date.now(),
		});
	},
});

export const generateAvatarUploadUrl = mutation({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}
		return await ctx.storage.generateUploadUrl();
	},
});

export const setAvatar = mutation({
	args: { storageId: v.id("_storage") },
	handler: async (ctx, { storageId }) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		const metadata = await ctx.storage.getMetadata(storageId);
		if (!metadata?.contentType) {
			throw new Error("Invalid storage file");
		}

		validateAvatarMimeType(metadata.contentType);
		validateAvatarSize(metadata.size);

		const profile = await ctx.db
			.query("userProfiles")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.unique();

		if (!profile) {
			throw new Error("Profile not found");
		}

		if (profile.avatarStorageId) {
			await ctx.storage.delete(profile.avatarStorageId);
		}

		await ctx.db.patch(profile._id, {
			avatarStorageId: storageId,
			profileUpdatedAt: Date.now(),
		});
	},
});

export const removeAvatar = mutation({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error("Not authenticated");
		}

		const profile = await ctx.db
			.query("userProfiles")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.unique();

		if (!profile?.avatarStorageId) {
			return;
		}

		await ctx.storage.delete(profile.avatarStorageId);
		await ctx.db.patch(profile._id, {
			avatarStorageId: undefined,
			profileUpdatedAt: Date.now(),
		});
	},
});
