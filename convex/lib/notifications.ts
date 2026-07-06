import type { Id } from "../_generated/dataModel";
import type { ResolvedUserPreferences } from "./preferences";

export type NotificationType =
	| "fixed_expense_reminder"
	| "budget_threshold"
	| "period_report"
	| "credit_due";

export type NotificationChannel = "email" | "push" | "in_app";

/** Paused until email notifications are re-enabled (Resend + domain). */
export const EMAIL_NOTIFICATIONS_ACTIVE = false;

export function buildDedupeKey(
	userId: Id<"users">,
	type: NotificationType,
	referenceId: string,
	channel: NotificationChannel,
	dateKey: string,
): string {
	return `${userId}:${type}:${referenceId}:${channel}:${dateKey}`;
}

export function shouldSendExternal(
	prefs: ResolvedUserPreferences,
): boolean {
	return prefs.notificationsEnabled;
}

export function shouldSendEmail(
	prefs: ResolvedUserPreferences,
	type: NotificationType,
): boolean {
	if (!EMAIL_NOTIFICATIONS_ACTIVE) return false;
	if (!shouldSendExternal(prefs)) return false;
	if (type === "period_report") return prefs.reportEmailEnabled;
	return true;
}

export function shouldSendPush(prefs: ResolvedUserPreferences): boolean {
	return shouldSendExternal(prefs) && prefs.pushEnabled;
}

export type ThresholdStatus = "ok" | "info" | "warning" | "danger";

export function thresholdStatus(percent: number): ThresholdStatus {
	if (percent >= 1) return "danger";
	if (percent >= 0.8) return "warning";
	if (percent >= 0.5) return "info";
	return "ok";
}

export function thresholdLabel(status: ThresholdStatus): string {
	switch (status) {
		case "info":
			return "50";
		case "warning":
			return "80";
		case "danger":
			return "100";
		default:
			return "";
	}
}
