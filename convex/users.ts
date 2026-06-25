import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { DEFAULT_CATEGORIES } from "./seed";

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

    await ctx.db.insert("userPreferences", {
      userId,
      theme: "dark",
      updatedAt: Date.now(),
    });

    for (const category of DEFAULT_CATEGORIES) {
      await ctx.db.insert("categories", {
        userId,
        ...category,
        createdAt: Date.now(),
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

    await ctx.db.insert("userPreferences", {
      userId,
      theme: "dark",
      updatedAt: Date.now(),
    });

    for (const category of DEFAULT_CATEGORIES) {
      await ctx.db.insert("categories", {
        userId,
        ...category,
        createdAt: Date.now(),
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

    const preferences = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return {
      userId,
      email: user.email ?? "",
      name: user.name ?? "Usuario",
      picture: user.image ?? undefined,
      theme: preferences?.theme ?? "dark",
    };
  },
});
