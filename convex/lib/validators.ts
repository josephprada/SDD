import { v } from "convex/values";

export const accountTypeValidator = v.union(
	v.literal("cash"),
	v.literal("bank"),
	v.literal("credit"),
);

export const categoryTypeValidator = v.union(
	v.literal("expense"),
	v.literal("income"),
	v.literal("transfer"),
);

export const transactionTypeValidator = v.union(
	v.literal("income"),
	v.literal("expense"),
	v.literal("transfer"),
);

export const mimeTypeValidator = v.union(
	v.literal("image/jpeg"),
	v.literal("image/png"),
	v.literal("application/pdf"),
);

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS_PER_TRANSACTION = 5;

export function validateNonEmptyName(name: string): string {
	const trimmed = name.trim();
	if (trimmed.length === 0) {
		throw new Error("Name is required");
	}
	return trimmed;
}

export function validateCopAmount(amount: number, field = "amount"): number {
	if (!Number.isInteger(amount)) {
		throw new Error(`${field} must be an integer`);
	}
	if (amount < 0) {
		throw new Error(`${field} cannot be negative`);
	}
	return amount;
}

export function validatePositiveCopAmount(amount: number): number {
	if (!Number.isInteger(amount)) {
		throw new Error("Amount must be an integer");
	}
	if (amount <= 0) {
		throw new Error("Amount must be greater than zero");
	}
	return amount;
}

export function validateMimeType(
	mimeType: string,
): "image/jpeg" | "image/png" | "application/pdf" {
	if (
		mimeType !== "image/jpeg" &&
		mimeType !== "image/png" &&
		mimeType !== "application/pdf"
	) {
		throw new Error("File type not allowed");
	}
	return mimeType;
}
