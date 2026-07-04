import type { Doc } from "./_generated/dataModel";
import { internalMutation, mutation } from "./_generated/server";
import {
	DEFAULT_USER_PREFERENCES,
	resolveUserPreferences,
} from "./lib/preferences";
import { requireUserId } from "./lib/auth";

type LegacyCategory = Doc<"categories"> & {
  archived?: boolean;
  isSystem?: boolean;
  updatedAt?: number;
};

function buildBackfillPatch(category: LegacyCategory) {
  const patch: { archived?: boolean; isSystem?: boolean; updatedAt?: number } =
    {};

  if (category.archived === undefined) patch.archived = false;
  if (category.isSystem === undefined) {
    patch.isSystem =
      category.name === "Transferencia" && category.type === "transfer";
  }
  if (category.updatedAt === undefined) {
    patch.updatedAt = category.createdAt;
  }

  return patch;
}

/** Dev-only backfill for the authenticated user's legacy categories. */
export const backfillCategories = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    let updated = 0;
    for (const category of categories) {
      const patch = buildBackfillPatch(category);
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(category._id, patch);
        updated += 1;
      }
    }

    return { updated };
  },
});

/**
 * Dev-only backfill for ALL legacy categories, runnable from the CLI
 * without auth context: `bunx convex run migrations:backfillAllCategories`.
 */
export const backfillAllCategories = internalMutation({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db.query("categories").collect();

    let updated = 0;
    for (const category of categories) {
      const patch = buildBackfillPatch(category);
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(category._id, patch);
        updated += 1;
      }
    }

    return { updated };
  },
});

/** Backfill preference fields for legacy rows (theme-only). */
export const backfillUserPreferences = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const doc = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!doc) {
      return { updated: false };
    }

    const resolved = resolveUserPreferences(doc);
    const patch: Record<string, unknown> = {};

    if (doc.accentPreset === undefined) patch.accentPreset = resolved.accentPreset;
    if (doc.dangerPreset === undefined) patch.dangerPreset = resolved.dangerPreset;
    if (doc.typographyPreset === undefined) {
      patch.typographyPreset = resolved.typographyPreset;
    } else if (doc.typographyPreset !== resolved.typographyPreset) {
      patch.typographyPreset = resolved.typographyPreset;
    }
    if (doc.defaultGrouping === undefined) {
      patch.defaultGrouping = resolved.defaultGrouping;
    }
    if (doc.language === undefined) patch.language = resolved.language;
    if (doc.notificationsEnabled === undefined) {
      patch.notificationsEnabled = resolved.notificationsEnabled;
    }

    if (Object.keys(patch).length === 0) {
      return { updated: false };
    }

    patch.updatedAt = Date.now();
    await ctx.db.patch(doc._id, patch);
    return { updated: true };
  },
});

export const backfillAllUserPreferences = internalMutation({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("userPreferences").collect();
    let updated = 0;

    for (const doc of docs) {
      const patch: Record<string, unknown> = {};
      if (doc.accentPreset === undefined) {
        patch.accentPreset = DEFAULT_USER_PREFERENCES.accentPreset;
      }
      if (doc.dangerPreset === undefined) {
        patch.dangerPreset = DEFAULT_USER_PREFERENCES.dangerPreset;
      }
      const resolved = resolveUserPreferences(doc);
      if (doc.typographyPreset === undefined) {
        patch.typographyPreset = resolved.typographyPreset;
      } else if (doc.typographyPreset !== resolved.typographyPreset) {
        patch.typographyPreset = resolved.typographyPreset;
      }
      if (doc.defaultGrouping === undefined) {
        patch.defaultGrouping = DEFAULT_USER_PREFERENCES.defaultGrouping;
      }
      if (doc.language === undefined) patch.language = DEFAULT_USER_PREFERENCES.language;
      if (doc.notificationsEnabled === undefined) {
        patch.notificationsEnabled = DEFAULT_USER_PREFERENCES.notificationsEnabled;
      }

      if (Object.keys(patch).length > 0) {
        patch.updatedAt = Date.now();
        await ctx.db.patch(doc._id, patch);
        updated += 1;
      }
    }

    return { updated };
  },
});
