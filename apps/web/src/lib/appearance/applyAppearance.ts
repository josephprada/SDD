import {
	type AccentPresetId,
	type DangerPresetId,
	DEFAULT_APPEARANCE,
	DEFAULT_GROUPING,
	DEFAULT_LANGUAGE,
	DEFAULT_NOTIFICATIONS_ENABLED,
	isAccentPresetId,
	isDangerPresetId,
	isGroupingId,
	normalizeTypographyPreset,
	type GroupingId,
	type TypographyPresetId,
} from "@jp-ds/index";
import {
	type ThemeMode,
	applyTheme,
	readStoredTheme,
} from "../theme/applyTheme";
import { startSystemListener } from "../theme/systemListener";

const STORAGE_KEYS = {
	accent: "jp-wallet.accentPreset",
	danger: "jp-wallet.dangerPreset",
	font: "jp-wallet.typographyPreset",
} as const;

export type StoredAppearance = {
	accentPreset: AccentPresetId;
	dangerPreset: DangerPresetId;
	typographyPreset: TypographyPresetId;
};

export function readStoredAppearance(): StoredAppearance {
	const accent = localStorage.getItem(STORAGE_KEYS.accent);
	const danger = localStorage.getItem(STORAGE_KEYS.danger);
	const font = localStorage.getItem(STORAGE_KEYS.font);

	return {
		accentPreset:
			accent && isAccentPresetId(accent)
				? accent
				: DEFAULT_APPEARANCE.accentPreset,
		dangerPreset:
			danger && isDangerPresetId(danger)
				? danger
				: DEFAULT_APPEARANCE.dangerPreset,
		typographyPreset: normalizeTypographyPreset(font),
	};
}

export function applyAppearanceToDocument(partial: Partial<StoredAppearance>) {
	const current = readStoredAppearance();
	const next = { ...current, ...partial };

	document.documentElement.dataset.accent = next.accentPreset;
	document.documentElement.dataset.danger = next.dangerPreset;
	document.documentElement.dataset.font = next.typographyPreset;

	localStorage.setItem(STORAGE_KEYS.accent, next.accentPreset);
	localStorage.setItem(STORAGE_KEYS.danger, next.dangerPreset);
	localStorage.setItem(STORAGE_KEYS.font, next.typographyPreset);

	return next;
}

export function applyInitialAppearance() {
	const stored = readStoredAppearance();
	document.documentElement.dataset.accent = stored.accentPreset;
	document.documentElement.dataset.danger = stored.dangerPreset;
	document.documentElement.dataset.font = stored.typographyPreset;
}

export function readStoredGrouping(): GroupingId {
	const stored = localStorage.getItem("jp-wallet.defaultGrouping");
	return stored && isGroupingId(stored) ? stored : DEFAULT_GROUPING;
}

export function readStoredLanguage(): "es" | "en" {
	return DEFAULT_LANGUAGE;
}

export function readStoredNotificationsEnabled(): boolean {
	const stored = localStorage.getItem("jp-wallet.notificationsEnabled");
	if (stored === "false") return false;
	if (stored === "true") return true;
	return DEFAULT_NOTIFICATIONS_ENABLED;
}

export { readStoredTheme, applyTheme, startSystemListener };
export type { ThemeMode, AccentPresetId, DangerPresetId, TypographyPresetId, GroupingId };
