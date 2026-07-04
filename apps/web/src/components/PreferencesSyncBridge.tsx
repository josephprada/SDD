import { api } from "@convex/_generated/api";
import {
	type AccentPresetId,
	type DangerPresetId,
	type GroupingId,
	type TypographyPresetId,
} from "@jp-ds/index";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect } from "react";
import {
	type ServerPreferences,
	type ThemeMode,
	usePreferencesStore,
} from "../stores/preferences";

type SyncPayload = {
	theme?: ThemeMode;
	accentPreset?: AccentPresetId;
	dangerPreset?: DangerPresetId;
	typographyPreset?: TypographyPresetId;
	defaultGrouping?: GroupingId;
	notificationsEnabled?: boolean;
	resetAppearance?: boolean;
};

export function PreferencesSyncBridge() {
	const { isAuthenticated } = useConvexAuth();
	const prefs = useQuery(
		api.userPreferences.get,
		isAuthenticated ? {} : "skip",
	);
	const updatePreferences = useMutation(api.userPreferences.update);
	const resetAppearance = useMutation(api.userPreferences.resetAppearance);
	const reconcile = usePreferencesStore((s) => s.reconcileFromServer);

	useEffect(() => {
		if (prefs) {
			reconcile(prefs as ServerPreferences);
		}
	}, [prefs, reconcile]);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const sync = (payload: SyncPayload) => {
			if (payload.resetAppearance) {
				void resetAppearance({});
				return;
			}

			const patch = {
				theme: payload.theme,
				accentPreset: payload.accentPreset,
				dangerPreset: payload.dangerPreset,
				typographyPreset: payload.typographyPreset,
				defaultGrouping: payload.defaultGrouping,
				notificationsEnabled: payload.notificationsEnabled,
			};

			const hasValue = Object.values(patch).some((value) => value !== undefined);
			if (hasValue) {
				void updatePreferences(patch);
			}
		};

		(
			window as Window & {
				__syncPreferences?: (payload: SyncPayload) => void;
			}
		).__syncPreferences = sync;

		return () => {
			delete (window as Window & { __syncPreferences?: unknown })
				.__syncPreferences;
		};
	}, [updatePreferences, resetAppearance]);

	return null;
}
