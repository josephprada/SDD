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
export const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
export const MAX_DISPLAY_NAME_LENGTH = 80;

const AVATAR_MIME_TYPES = ["image/jpeg", "image/png"] as const;
export type AvatarMimeType = (typeof AVATAR_MIME_TYPES)[number];

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

export function validateDisplayName(name: string): string {
	const trimmed = validateNonEmptyName(name);
	if (trimmed.length > MAX_DISPLAY_NAME_LENGTH) {
		throw new Error("Name must be at most 80 characters");
	}
	return trimmed;
}

export function validateAvatarMimeType(mimeType: string): AvatarMimeType {
	if (mimeType !== "image/jpeg" && mimeType !== "image/png") {
		throw new Error("Only JPEG and PNG images are allowed");
	}
	return mimeType;
}

export function validateAvatarSize(size: number): void {
	if (size > MAX_AVATAR_SIZE) {
		throw new Error("Image exceeds 2 MB limit");
	}
}

export const MAX_BUDGET_NOTES_LENGTH = 200;
export const MAX_FIXED_EXPENSE_NAME_LENGTH = 80;
export const MAX_REMINDER_OFFSETS = 5;

const PERIOD_KEY_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function validatePeriodKey(periodKey: string): string {
	if (!PERIOD_KEY_RE.test(periodKey)) {
		throw new Error("Invalid period key");
	}
	return periodKey;
}

export function validateDayOfMonth(day: number): number {
	if (!Number.isInteger(day) || day < 1 || day > 31) {
		throw new Error("Day of month must be between 1 and 31");
	}
	return day;
}

export function validateReminderOffsets(offsets: number[]): number[] {
	if (offsets.length === 0 || offsets.length > MAX_REMINDER_OFFSETS) {
		throw new Error("Reminder offsets must have 1 to 5 entries");
	}
	const unique = new Set<number>();
	for (const offset of offsets) {
		if (!Number.isInteger(offset) || offset < 0 || offset > 30) {
			throw new Error("Each reminder offset must be 0–30 days");
		}
		if (unique.has(offset)) {
			throw new Error("Duplicate reminder offsets");
		}
		unique.add(offset);
	}
	return [...offsets].sort((a, b) => b - a);
}

export const MAX_CREDIT_NAME_LENGTH = 80;
export const MAX_CREDIT_NOTES_LENGTH = 500;
export const MAX_DESTINATION_NAME_LENGTH = 80;

export const rateTypeValidator = v.union(
	v.literal("EA"),
	v.literal("NAMV"),
	v.literal("MV"),
);

export const scheduleModeValidator = v.union(
	v.literal("cuota_fija"),
	v.literal("capital_constant"),
	v.literal("manual"),
);

export const abonoRecalcEffectValidator = v.union(
	v.literal("shorten_term"),
	v.literal("lower_installment"),
);

export const creditStatusValidator = v.union(
	v.literal("active"),
	v.literal("paid_off"),
	v.literal("defaulted"),
);

export const creditPaymentStatusValidator = v.union(
	v.literal("pending"),
	v.literal("paid"),
	v.literal("overdue"),
	v.literal("cancelled"),
);

export const destinationStatusValidator = v.union(
	v.literal("planned"),
	v.literal("in_progress"),
	v.literal("completed"),
);

export const savingsGoalStatusValidator = v.union(
	v.literal("active"),
	v.literal("completed"),
	v.literal("paused"),
);

export const savingsGoalSnapshotValidator = v.object({
	name: v.string(),
	targetAmount: v.number(),
	currentAmount: v.number(),
	deadline: v.optional(v.number()),
	accountId: v.optional(v.id("accounts")),
	linkedCreditId: v.optional(v.id("credits")),
	linkedFixedExpenseId: v.optional(v.id("fixedExpenses")),
	icon: v.optional(v.string()),
	color: v.optional(v.string()),
	status: savingsGoalStatusValidator,
	notes: v.optional(v.string()),
	createdAt: v.number(),
	contributions: v.array(
		v.object({
			amount: v.number(),
			contributedAt: v.number(),
			transactionId: v.optional(v.id("transactions")),
			sourceTransactionId: v.optional(v.id("transactions")),
			notes: v.optional(v.string()),
			createdAt: v.number(),
		}),
	),
});

export function validateCreditName(name: string): string {
	const trimmed = validateNonEmptyName(name);
	if (trimmed.length > MAX_CREDIT_NAME_LENGTH) {
		throw new Error("Name must be at most 80 characters");
	}
	return trimmed;
}

export function validateCreditNotes(notes?: string): string | undefined {
	if (!notes?.trim()) return undefined;
	const trimmed = notes.trim();
	if (trimmed.length > MAX_CREDIT_NOTES_LENGTH) {
		throw new Error("Notes must be at most 500 characters");
	}
	return trimmed;
}

export function validateInterestRate(rate: number): number {
	if (typeof rate !== "number" || rate < 0 || rate > 100) {
		throw new Error("Interest rate must be between 0 and 100");
	}
	return rate;
}

export function validateTermMonths(term: number): number {
	if (!Number.isInteger(term) || term < 1 || term > 600) {
		throw new Error("Term must be between 1 and 600 months");
	}
	return term;
}
