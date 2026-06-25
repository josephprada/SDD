import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const themeValidator = v.union(
  v.literal("light"),
  v.literal("dark"),
  v.literal("system"),
);

export default defineSchema({
  ...authTables,

  userProfiles: defineTable({
    userId: v.id("users"),
    googleSub: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_googleSub", ["googleSub"]),

  userPreferences: defineTable({
    userId: v.id("users"),
    theme: themeValidator,
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),

  categories: defineTable({
    userId: v.id("users"),
    name: v.string(),
    icon: v.string(),
    color: v.string(),
    type: v.union(v.literal("expense"), v.literal("income"), v.literal("transfer")),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});
