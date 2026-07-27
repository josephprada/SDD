import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
	type MutationCtx,
	type QueryCtx,
	mutation,
	query,
} from "./_generated/server";
import {
	assertTaxDocumentEditable,
	requireTaxDocumentOwnership,
	requireUserId,
} from "./lib/auth";
import {
	TAX_CATEGORY_LABELS,
	TAX_SECTIONS,
	TAX_SECTION_LABELS,
} from "./lib/taxCategories";
import { computeSectionTotals } from "./lib/taxTotals";
import {
	taxStatusValidator,
	validateOptionalEstimatedAmount,
	validateTaxDocumentNotes,
	validateTaxYear,
} from "./lib/validators";

type Ctx = QueryCtx | MutationCtx;

async function loadTotals(ctx: Ctx, documentId: Id<"taxDocuments">) {
	const items = await ctx.db
		.query("taxItems")
		.withIndex("by_document", (q) => q.eq("documentId", documentId))
		.collect();
	return {
		totals: computeSectionTotals(items),
		itemCount: items.length,
	};
}

export const list = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);
		const documents = await ctx.db
			.query("taxDocuments")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();

		const enriched = await Promise.all(
			documents.map(async (doc) => {
				const { totals, itemCount } = await loadTotals(ctx, doc._id);
				return {
					_id: doc._id,
					taxYear: doc.taxYear,
					status: doc.status,
					filedAt: doc.filedAt,
					updatedAt: doc.updatedAt,
					totals,
					itemCount,
				};
			}),
		);

		return enriched.sort((a, b) => b.taxYear - a.taxYear);
	},
});

export const get = query({
	args: { documentId: v.id("taxDocuments") },
	handler: async (ctx, { documentId }) => {
		const userId = await requireUserId(ctx);
		const document = await ctx.db.get(documentId);
		if (!document || document.userId !== userId) {
			return null;
		}
		const { totals, itemCount } = await loadTotals(ctx, documentId);
		return {
			...document,
			totals,
			itemCount,
			statusLabel:
				document.status === "draft"
					? "Borrador"
					: document.status === "review"
						? "En revisión"
						: "Presentada",
		};
	},
});

export const create = mutation({
	args: {
		taxYear: v.number(),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, { taxYear, notes }) => {
		const userId = await requireUserId(ctx);
		const year = validateTaxYear(taxYear);
		const existing = await ctx.db
			.query("taxDocuments")
			.withIndex("by_user_year", (q) =>
				q.eq("userId", userId).eq("taxYear", year),
			)
			.first();
		if (existing) {
			throw new Error("TAX_YEAR_EXISTS");
		}
		const now = Date.now();
		return await ctx.db.insert("taxDocuments", {
			userId,
			taxYear: year,
			status: "draft",
			notes: validateTaxDocumentNotes(notes),
			createdAt: now,
			updatedAt: now,
		});
	},
});

export const updateMeta = mutation({
	args: {
		documentId: v.id("taxDocuments"),
		notes: v.optional(v.string()),
		estimatedTaxableIncome: v.optional(v.union(v.number(), v.null())),
		estimatedTaxDue: v.optional(v.union(v.number(), v.null())),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await assertTaxDocumentEditable(ctx, userId, args.documentId);

		const patch: Record<string, unknown> = { updatedAt: Date.now() };
		if (args.notes !== undefined) {
			patch.notes = validateTaxDocumentNotes(args.notes);
		}
		if (args.estimatedTaxableIncome !== undefined) {
			patch.estimatedTaxableIncome = validateOptionalEstimatedAmount(
				args.estimatedTaxableIncome,
				"estimatedTaxableIncome",
			);
		}
		if (args.estimatedTaxDue !== undefined) {
			patch.estimatedTaxDue = validateOptionalEstimatedAmount(
				args.estimatedTaxDue,
				"estimatedTaxDue",
			);
		}
		await ctx.db.patch(args.documentId, patch);
		return null;
	},
});

export const setStatus = mutation({
	args: {
		documentId: v.id("taxDocuments"),
		status: taxStatusValidator,
	},
	handler: async (ctx, { documentId, status }) => {
		const userId = await requireUserId(ctx);
		const document = await requireTaxDocumentOwnership(ctx, userId, documentId);

		if (document.status === "filed" && status !== "filed") {
			throw new Error("TAX_INVALID_TRANSITION");
		}
		if (status === "filed") {
			await ctx.db.patch(documentId, {
				status: "filed",
				filedAt: Date.now(),
				updatedAt: Date.now(),
			});
			return null;
		}
		if (document.status === "filed") {
			throw new Error("TAX_FILED_READONLY");
		}
		await ctx.db.patch(documentId, {
			status,
			updatedAt: Date.now(),
		});
		return null;
	},
});

export const reopen = mutation({
	args: { documentId: v.id("taxDocuments") },
	handler: async (ctx, { documentId }) => {
		const userId = await requireUserId(ctx);
		const document = await requireTaxDocumentOwnership(ctx, userId, documentId);
		if (document.status !== "filed") {
			throw new Error("TAX_NOT_FILED");
		}
		await ctx.db.patch(documentId, {
			status: "review",
			filedAt: undefined,
			updatedAt: Date.now(),
		});
		return null;
	},
});

export const remove = mutation({
	args: { documentId: v.id("taxDocuments") },
	handler: async (ctx, { documentId }) => {
		const userId = await requireUserId(ctx);
		await requireTaxDocumentOwnership(ctx, userId, documentId);

		const items = await ctx.db
			.query("taxItems")
			.withIndex("by_document", (q) => q.eq("documentId", documentId))
			.collect();

		for (const item of items) {
			const attachments = await ctx.db
				.query("attachments")
				.withIndex("by_entity", (q) =>
					q.eq("entityType", "taxItem").eq("entityId", item._id),
				)
				.collect();
			for (const attachment of attachments) {
				await ctx.storage.delete(attachment.storageId);
				await ctx.db.delete(attachment._id);
			}
			await ctx.db.delete(item._id);
		}

		await ctx.db.delete(documentId);
		return null;
	},
});

export const getExportPayload = query({
	args: { documentId: v.id("taxDocuments") },
	handler: async (ctx, { documentId }) => {
		const userId = await requireUserId(ctx);
		const document = await ctx.db.get(documentId);
		if (!document || document.userId !== userId) {
			return null;
		}

		const items = await ctx.db
			.query("taxItems")
			.withIndex("by_document", (q) => q.eq("documentId", documentId))
			.collect();

		const totals = computeSectionTotals(items);
		const sections = [];

		for (const section of TAX_SECTIONS) {
			const sectionItems = items.filter((i) => i.section === section);
			const withCounts = await Promise.all(
				sectionItems.map(async (item) => {
					const attachments = await ctx.db
						.query("attachments")
						.withIndex("by_entity", (q) =>
							q.eq("entityType", "taxItem").eq("entityId", item._id),
						)
						.collect();
					return {
						category: item.category,
						categoryLabel: TAX_CATEGORY_LABELS[item.category] ?? item.category,
						description: item.description,
						amount: item.amount,
						notes: item.notes,
						attachmentCount: attachments.length,
					};
				}),
			);
			sections.push({
				section,
				sectionLabel: TAX_SECTION_LABELS[section],
				items: withCounts,
				total: totals[section],
			});
		}

		return {
			taxYear: document.taxYear,
			status: document.status,
			filedAt: document.filedAt,
			estimatedTaxableIncome: document.estimatedTaxableIncome,
			estimatedTaxDue: document.estimatedTaxDue,
			notes: document.notes,
			totals,
			sections,
			exportedAt: Date.now(),
			disclaimer: "Documento de apoyo; no constituye liquidación oficial DIAN.",
		};
	},
});
