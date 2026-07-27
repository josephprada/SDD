import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
	assertTaxDocumentEditable,
	requireTaxItemOwnership,
	requireUserId,
} from "./lib/auth";
import { assertTaxCategory } from "./lib/taxCategories";
import {
	taxSectionValidator,
	taxSourceTypeValidator,
	validatePositiveCopAmount,
	validateTaxItemDescription,
	validateTaxItemNotes,
} from "./lib/validators";

export const listByDocument = query({
	args: {
		documentId: v.id("taxDocuments"),
		section: v.optional(taxSectionValidator),
	},
	handler: async (ctx, { documentId, section }) => {
		const userId = await requireUserId(ctx);
		const document = await ctx.db.get(documentId);
		if (!document || document.userId !== userId) {
			return [];
		}

		const items = section
			? await ctx.db
					.query("taxItems")
					.withIndex("by_document_section", (q) =>
						q.eq("documentId", documentId).eq("section", section),
					)
					.collect()
			: await ctx.db
					.query("taxItems")
					.withIndex("by_document", (q) => q.eq("documentId", documentId))
					.collect();

		return items.sort((a, b) => a.createdAt - b.createdAt);
	},
});

export const create = mutation({
	args: {
		documentId: v.id("taxDocuments"),
		section: taxSectionValidator,
		category: v.string(),
		description: v.string(),
		amount: v.number(),
		notes: v.optional(v.string()),
		sourceType: v.optional(taxSourceTypeValidator),
		sourceId: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await assertTaxDocumentEditable(ctx, userId, args.documentId);
		assertTaxCategory(args.section, args.category);
		const amount = validatePositiveCopAmount(args.amount);
		const description = validateTaxItemDescription(args.description);
		const notes = validateTaxItemNotes(args.notes);

		if (args.sourceType && args.sourceId) {
			const existing = await ctx.db
				.query("taxItems")
				.withIndex("by_document", (q) => q.eq("documentId", args.documentId))
				.collect();
			const dup = existing.find(
				(i) => i.sourceType === args.sourceType && i.sourceId === args.sourceId,
			);
			if (dup) {
				throw new Error("TAX_SOURCE_DUPLICATE");
			}
		}

		const now = Date.now();
		return await ctx.db.insert("taxItems", {
			userId,
			documentId: args.documentId,
			section: args.section,
			category: args.category,
			description,
			amount,
			notes,
			sourceType: args.sourceType,
			sourceId: args.sourceId,
			createdAt: now,
			updatedAt: now,
		});
	},
});

export const update = mutation({
	args: {
		itemId: v.id("taxItems"),
		section: v.optional(taxSectionValidator),
		category: v.optional(v.string()),
		description: v.optional(v.string()),
		amount: v.optional(v.number()),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const item = await requireTaxItemOwnership(ctx, userId, args.itemId);
		await assertTaxDocumentEditable(ctx, userId, item.documentId);

		const section = args.section ?? item.section;
		const category = args.category ?? item.category;
		assertTaxCategory(section, category);

		const patch: Record<string, unknown> = {
			section,
			category,
			updatedAt: Date.now(),
		};
		if (args.description !== undefined) {
			patch.description = validateTaxItemDescription(args.description);
		}
		if (args.amount !== undefined) {
			patch.amount = validatePositiveCopAmount(args.amount);
		}
		if (args.notes !== undefined) {
			patch.notes = validateTaxItemNotes(args.notes);
		}

		await ctx.db.patch(args.itemId, patch);
		return null;
	},
});

export const remove = mutation({
	args: { itemId: v.id("taxItems") },
	handler: async (ctx, { itemId }) => {
		const userId = await requireUserId(ctx);
		const item = await requireTaxItemOwnership(ctx, userId, itemId);
		await assertTaxDocumentEditable(ctx, userId, item.documentId);

		const attachments = await ctx.db
			.query("attachments")
			.withIndex("by_entity", (q) =>
				q.eq("entityType", "taxItem").eq("entityId", itemId),
			)
			.collect();
		for (const attachment of attachments) {
			await ctx.storage.delete(attachment.storageId);
			await ctx.db.delete(attachment._id);
		}

		await ctx.db.delete(itemId);
		return null;
	},
});
