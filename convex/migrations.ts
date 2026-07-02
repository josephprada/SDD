import type { Doc } from "./_generated/dataModel";
import { internalMutation, mutation } from "./_generated/server";
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
