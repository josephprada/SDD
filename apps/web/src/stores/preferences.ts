import {
	type AccentPresetId,
	type DangerPresetId,
	DEFAULT_APPEARANCE,
	DEFAULT_GROUPING,
	DEFAULT_LANGUAGE,
	DEFAULT_NOTIFICATIONS_ENABLED,
	isDefaultAppearance,
	type GroupingId,
	type TypographyPresetId,
} from "@jp-ds/index";
import { create } from "zustand";
import {
	type ThemeMode,
	applyAppearanceToDocument,
	applyInitialAppearance,
	applyTheme,
	readStoredAppearance,
	readStoredGrouping,
	readStoredNotificationsEnabled,
	readStoredTheme,
	startSystemListener,
} from "../lib/appearance/applyAppearance";
import type { ResolvedTheme } from "../lib/theme/applyTheme";

export type ServerPreferences = {
	theme: ThemeMode;
	accentPreset: AccentPresetId;
	dangerPreset: DangerPresetId;
	typographyPreset: TypographyPresetId;
	defaultGrouping: GroupingId;
	language: "es" | "en";
	notificationsEnabled: boolean;
	reportEmailEnabled: boolean;
	pushEnabled: boolean;
};

interface PreferencesState {
	mode: ThemeMode;
	resolved: ResolvedTheme;
	accentPreset: AccentPresetId;
	dangerPreset: DangerPresetId;
	typographyPreset: TypographyPresetId;
	defaultGrouping: GroupingId;
	language: "es" | "en";
	notificationsEnabled: boolean;
	reportEmailEnabled: boolean;
	pushEnabled: boolean;
	initialized: boolean;
	init: () => void;
	setTheme: (mode: ThemeMode, syncServer?: boolean) => void;
	setAccentPreset: (preset: AccentPresetId, syncServer?: boolean) => void;
	setDangerPreset: (preset: DangerPresetId, syncServer?: boolean) => void;
	setTypographyPreset: (preset: TypographyPresetId, syncServer?: boolean) => void;
	setDefaultGrouping: (grouping: GroupingId, syncServer?: boolean) => void;
	setNotificationsEnabled: (enabled: boolean, syncServer?: boolean) => void;
	setReportEmailEnabled: (enabled: boolean, syncServer?: boolean) => void;
	setPushEnabled: (enabled: boolean, syncServer?: boolean) => void;
	resetAppearanceLocal: () => void;
	reconcileFromServer: (prefs: ServerPreferences | null | undefined) => void;
	isDefaultAppearance: () => boolean;
}

let stopListener: (() => void) | null = null;

type SyncPayload = {
	theme?: ThemeMode;
	accentPreset?: AccentPresetId;
	dangerPreset?: DangerPresetId;
	typographyPreset?: TypographyPresetId;
	defaultGrouping?: GroupingId;
	notificationsEnabled?: boolean;
	reportEmailEnabled?: boolean;
	pushEnabled?: boolean;
	resetAppearance?: boolean;
};

function queueSync(partial: SyncPayload) {
	if (typeof window === "undefined") return;
	const sync = (
		window as Window & { __syncPreferences?: (payload: SyncPayload) => void }
	).__syncPreferences;
	sync?.(partial);
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
	mode: DEFAULT_APPEARANCE.theme,
	resolved: "dark",
	accentPreset: DEFAULT_APPEARANCE.accentPreset,
	dangerPreset: DEFAULT_APPEARANCE.dangerPreset,
	typographyPreset: DEFAULT_APPEARANCE.typographyPreset,
	defaultGrouping: DEFAULT_GROUPING,
	language: DEFAULT_LANGUAGE,
	notificationsEnabled: DEFAULT_NOTIFICATIONS_ENABLED,
	reportEmailEnabled: false,
	pushEnabled: false,
	initialized: false,

	init: () => {
		if (get().initialized) return;

		applyInitialAppearance();
		const appearance = readStoredAppearance();
		const mode = readStoredTheme();
		const resolved = applyTheme(mode);
		stopListener?.();
		stopListener = startSystemListener(mode);

		set({
			mode,
			resolved,
			accentPreset: appearance.accentPreset,
			dangerPreset: appearance.dangerPreset,
			typographyPreset: appearance.typographyPreset,
			defaultGrouping: readStoredGrouping(),
			notificationsEnabled: readStoredNotificationsEnabled(),
			language: DEFAULT_LANGUAGE,
			initialized: true,
		});
	},

	setTheme: (mode, syncServer = true) => {
		const resolved = applyTheme(mode);
		stopListener?.();
		stopListener = startSystemListener(mode);
		set({ mode, resolved });
		if (syncServer) queueSync({ theme: mode });
	},

	setAccentPreset: (preset, syncServer = true) => {
		applyAppearanceToDocument({ accentPreset: preset });
		set({ accentPreset: preset });
		if (syncServer) queueSync({ accentPreset: preset });
	},

	setDangerPreset: (preset, syncServer = true) => {
		applyAppearanceToDocument({ dangerPreset: preset });
		set({ dangerPreset: preset });
		if (syncServer) queueSync({ dangerPreset: preset });
	},

	setTypographyPreset: (preset, syncServer = true) => {
		applyAppearanceToDocument({ typographyPreset: preset });
		set({ typographyPreset: preset });
		if (syncServer) queueSync({ typographyPreset: preset });
	},

	setDefaultGrouping: (grouping, syncServer = true) => {
		localStorage.setItem("jp-wallet.defaultGrouping", grouping);
		set({ defaultGrouping: grouping });
		if (syncServer) queueSync({ defaultGrouping: grouping });
	},

	setNotificationsEnabled: (enabled, syncServer = true) => {
		localStorage.setItem("jp-wallet.notificationsEnabled", String(enabled));
		set({ notificationsEnabled: enabled });
		if (syncServer) queueSync({ notificationsEnabled: enabled });
	},

	setReportEmailEnabled: (enabled, syncServer = true) => {
		localStorage.setItem("jp-wallet.reportEmailEnabled", String(enabled));
		set({ reportEmailEnabled: enabled });
		if (syncServer) queueSync({ reportEmailEnabled: enabled });
	},

	setPushEnabled: (enabled, syncServer = true) => {
		localStorage.setItem("jp-wallet.pushEnabled", String(enabled));
		set({ pushEnabled: enabled });
		if (syncServer) queueSync({ pushEnabled: enabled });
	},

	resetAppearanceLocal: () => {
		get().setTheme(DEFAULT_APPEARANCE.theme, false);
		get().setAccentPreset(DEFAULT_APPEARANCE.accentPreset, false);
		get().setDangerPreset(DEFAULT_APPEARANCE.dangerPreset, false);
		get().setTypographyPreset(DEFAULT_APPEARANCE.typographyPreset, false);
		queueSync({ resetAppearance: true });
	},

	reconcileFromServer: (prefs) => {
		if (!prefs) return;
		get().setTheme(prefs.theme, false);
		get().setAccentPreset(prefs.accentPreset, false);
		get().setDangerPreset(prefs.dangerPreset, false);
		get().setTypographyPreset(prefs.typographyPreset, false);
		get().setDefaultGrouping(prefs.defaultGrouping, false);
		get().setNotificationsEnabled(prefs.notificationsEnabled, false);
		get().setReportEmailEnabled(prefs.reportEmailEnabled, false);
		get().setPushEnabled(prefs.pushEnabled, false);
		set({ language: prefs.language === "en" ? "es" : prefs.language });
	},

	isDefaultAppearance: () =>
		isDefaultAppearance({
			theme: get().mode,
			accentPreset: get().accentPreset,
			dangerPreset: get().dangerPreset,
			typographyPreset: get().typographyPreset,
		}),
}));

export type { ThemeMode, ResolvedTheme, AccentPresetId, DangerPresetId, TypographyPresetId, GroupingId };
