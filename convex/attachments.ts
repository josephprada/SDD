import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
	requireAttachmentOwnership,
	requireTransactionOwnership,
	requireUserId,
} from "./lib/auth";
import {
	MAX_ATTACHMENTS_PER_TRANSACTION,
	MAX_ATTACHMENT_SIZE,
	mimeTypeValidator,
	validateMimeType,
} from "./lib/validators";

export const generateUploadUrl = mutation({
	args: {},
	handler: async (ctx) => {
		await requireUserId(ctx);
		return await ctx.storage.generateUploadUrl();
	},
});

export const listByTransaction = query({
	args: {
		transactionId: v.id("transactions"),
	},
	handler: async (ctx, { transactionId }) => {
		const userId = await requireUserId(ctx);
		const transaction = await ctx.db.get(transactionId);
		// Tras eliminar el movimiento, las suscripciones activas no deben tumbar la UI.
		if (!transaction || transaction.userId !== userId) {
			return [];
		}

		return await ctx.db
			.query("attachments")
			.withIndex("by_entity", (q) =>
				q.eq("entityType", "transaction").eq("entityId", transactionId),
			)
			.collect();
	},
});

export const create = mutation({
	args: {
		transactionId: v.id("transactions"),
		storageId: v.id("_storage"),
		filename: v.string(),
		mimeType: mimeTypeValidator,
		size: v.number(),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		await requireTransactionOwnership(ctx, userId, args.transactionId);

		if (args.size > MAX_ATTACHMENT_SIZE) {
			throw new Error("File exceeds 10 MB limit");
		}
		validateMimeType(args.mimeType);

		const existing = await ctx.db
			.query("attachments")
			.withIndex("by_entity", (q) =>
				q.eq("entityType", "transaction").eq("entityId", args.transactionId),
			)
			.collect();

		if (existing.length >= MAX_ATTACHMENTS_PER_TRANSACTION) {
			throw new Error("Maximum 5 attachments per transaction");
		}

		return await ctx.db.insert("attachments", {
			userId,
			entityType: "transaction",
			entityId: args.transactionId,
			storageId: args.storageId,
			filename: args.filename.trim() || "archivo",
			mimeType: args.mimeType,
			size: args.size,
			uploadedAt: Date.now(),
		});
	},
});

export const remove = mutation({
	args: {
		attachmentId: v.id("attachments"),
	},
	handler: async (ctx, { attachmentId }) => {
		const userId = await requireUserId(ctx);
		const attachment = await requireAttachmentOwnership(
			ctx,
			userId,
			attachmentId,
		);

		await ctx.storage.delete(attachment.storageId);
		await ctx.db.delete(attachmentId);

		return null;
	},
});

export const getUrl = query({
	args: {
		storageId: v.id("_storage"),
	},
	handler: async (ctx, { storageId }) => {
		const userId = await requireUserId(ctx);
		const attachments = await ctx.db
			.query("attachments")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();

		const owned = attachments.some((a) => a.storageId === storageId);
		if (!owned) {
			return null;
		}

		return await ctx.storage.getUrl(storageId);
	},
});
