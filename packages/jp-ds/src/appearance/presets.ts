export const ACCENT_PRESET_IDS = [
	"green-bolt",
	"cyan-neon",
	"amber-gold",
	"violet-pulse",
	"coral-heat",
] as const;

export type AccentPresetId = (typeof ACCENT_PRESET_IDS)[number];

export const DANGER_PRESET_IDS = [
	"red-classic",
	"rose-soft",
	"orange-alert",
	"crimson-deep",
] as const;

export type DangerPresetId = (typeof DANGER_PRESET_IDS)[number];

export const TYPOGRAPHY_PRESET_IDS = [
	"inter-default",
	"formal-serif",
	"elegant-italic",
	"handwriting",
] as const;

export type TypographyPresetId = (typeof TYPOGRAPHY_PRESET_IDS)[number];

export const GROUPING_IDS = ["week", "month", "quarter", "semester"] as const;
export type GroupingId = (typeof GROUPING_IDS)[number];

export type ThemeMode = "light" | "dark" | "system";

export type AppearancePrefs = {
	theme: ThemeMode;
	accentPreset: AccentPresetId;
	dangerPreset: DangerPresetId;
	typographyPreset: TypographyPresetId;
};

export const DEFAULT_APPEARANCE: AppearancePrefs = {
	theme: "dark",
	accentPreset: "green-bolt",
	dangerPreset: "red-classic",
	typographyPreset: "inter-default",
};

export const DEFAULT_GROUPING: GroupingId = "month";
export const DEFAULT_LANGUAGE = "es" as const;
export const DEFAULT_NOTIFICATIONS_ENABLED = true;

export const ACCENT_PRESET_LABELS: Record<AccentPresetId, string> = {
	"green-bolt": "Green Bolt",
	"cyan-neon": "Cian neón",
	"amber-gold": "Ámbar dorado",
	"violet-pulse": "Violeta pulso",
	"coral-heat": "Coral intenso",
};

export const DANGER_PRESET_LABELS: Record<DangerPresetId, string> = {
	"red-classic": "Rojo clásico",
	"rose-soft": "Rosa suave",
	"orange-alert": "Naranja alerta",
	"crimson-deep": "Carmesí profundo",
};

export const TYPOGRAPHY_PRESET_LABELS: Record<TypographyPresetId, string> = {
	"inter-default": "Moderna",
	"formal-serif": "Formal",
	"elegant-italic": "Elegante",
	handwriting: "Manuscrita",
};

/** Maps removed preset IDs stored in legacy data/localStorage. */
export const LEGACY_TYPOGRAPHY_PRESET_MAP: Record<string, TypographyPresetId> = {
	"dm-sans": "formal-serif",
	"source-sans": "elegant-italic",
	"system-native": "handwriting",
};

export function normalizeTypographyPreset(value: string | null | undefined): TypographyPresetId {
	if (value && isTypographyPresetId(value)) {
		return value;
	}
	if (value && value in LEGACY_TYPOGRAPHY_PRESET_MAP) {
		return LEGACY_TYPOGRAPHY_PRESET_MAP[value];
	}
	return DEFAULT_APPEARANCE.typographyPreset;
}

export const GROUPING_LABELS: Record<GroupingId, string> = {
	week: "Semana",
	month: "Mes",
	quarter: "Trimestre",
	semester: "Semestre",
};

export const THEME_MODE_LABELS: Record<ThemeMode, string> = {
	light: "Claro",
	dark: "Oscuro",
	system: "Sistema",
};

export function isAccentPresetId(value: string): value is AccentPresetId {
	return (ACCENT_PRESET_IDS as readonly string[]).includes(value);
}

export function isDangerPresetId(value: string): value is DangerPresetId {
	return (DANGER_PRESET_IDS as readonly string[]).includes(value);
}

export function isTypographyPresetId(value: string): value is TypographyPresetId {
	return (TYPOGRAPHY_PRESET_IDS as readonly string[]).includes(value);
}

export function isGroupingId(value: string): value is GroupingId {
	return (GROUPING_IDS as readonly string[]).includes(value);
}

export function isDefaultAppearance(prefs: AppearancePrefs): boolean {
	return (
		prefs.theme === DEFAULT_APPEARANCE.theme &&
		prefs.accentPreset === DEFAULT_APPEARANCE.accentPreset &&
		prefs.dangerPreset === DEFAULT_APPEARANCE.dangerPreset &&
		prefs.typographyPreset === DEFAULT_APPEARANCE.typographyPreset
	);
}
