import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { requireUserId } from "./lib/auth";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export type ApiAuditEntry = {
	_id: Id<"apiAuditLog">;
	tokenId: Id<"apiTokens">;
	tokenPrefix?: string;
	action: string;
	success: boolean;
	errorCode?: string;
	summary?: string;
	createdAt: number;
};

export const listRecent = query({
	args: { limit: v.optional(v.number()) },
	handler: async (ctx, { limit }): Promise<ApiAuditEntry[]> => {
		const userId = await requireUserId(ctx);
		const cap = Math.min(Math.max(limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);

		const entries = await ctx.db
			.query("apiAuditLog")
			.withIndex("by_user_created", (q) => q.eq("userId", userId))
			.order("desc")
			.take(cap);

		const tokenPrefixCache = new Map<Id<"apiTokens">, string | undefined>();
		const results: ApiAuditEntry[] = [];

		for (const entry of entries) {
			if (!tokenPrefixCache.has(entry.tokenId)) {
				const token = await ctx.db.get(entry.tokenId);
				tokenPrefixCache.set(entry.tokenId, token?.tokenPrefix);
			}
			results.push({
				_id: entry._id,
				tokenId: entry.tokenId,
				tokenPrefix: tokenPrefixCache.get(entry.tokenId),
				action: entry.action,
				success: entry.success,
				errorCode: entry.errorCode,
				summary: entry.summary,
				createdAt: entry.createdAt,
			});
		}

		return results;
	},
});
