import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const themeValidator = v.union(
  v.literal("light"),
  v.literal("dark"),
  v.literal("system"),
);

export const getTheme = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    return prefs?.theme ?? "dark";
  },
});

export const updateTheme = mutation({
  args: { theme: themeValidator },
  handler: async (ctx, { theme }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return;
    }

    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { theme, updatedAt: Date.now() });
      return;
    }

    await ctx.db.insert("userPreferences", {
      userId,
      theme,
      updatedAt: Date.now(),
    });
  },
});
