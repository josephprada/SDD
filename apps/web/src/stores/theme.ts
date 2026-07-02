import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { create } from "zustand";
import {
	type ResolvedTheme,
	type ThemeMode,
	applyTheme,
	cycleTheme,
	readStoredTheme,
} from "../lib/theme/applyTheme";
import { startSystemListener } from "../lib/theme/systemListener";

interface ThemeState {
	mode: ThemeMode;
	resolved: ResolvedTheme;
	initialized: boolean;
	init: () => void;
	set: (mode: ThemeMode, syncServer?: boolean) => void;
	cycle: () => void;
	reconcileFromServer: (serverTheme: ThemeMode | null | undefined) => void;
}

let stopListener: (() => void) | null = null;

export const useThemeStore = create<ThemeState>((set, get) => ({
	mode: "dark",
	resolved: "dark",
	initialized: false,

	init: () => {
		if (get().initialized) {
			return;
		}
		const mode = readStoredTheme();
		const resolved = applyTheme(mode);
		stopListener?.();
		stopListener = startSystemListener(mode);
		set({ mode, resolved, initialized: true });
	},

	set: (mode, syncServer = true) => {
		const resolved = applyTheme(mode);
		stopListener?.();
		stopListener = startSystemListener(mode);
		set({ mode, resolved });

		if (syncServer && typeof window !== "undefined") {
			const sync = (window as Window & { __syncTheme?: (t: ThemeMode) => void })
				.__syncTheme;
			sync?.(mode);
		}
	},

	cycle: () => {
		const next = cycleTheme(get().mode);
		get().set(next);
	},

	reconcileFromServer: (serverTheme) => {
		if (!serverTheme) {
			return;
		}
		get().set(serverTheme, false);
	},
}));

export function ThemeSyncBridge() {
	const updateTheme = useMutation(api.userPreferences.updateTheme);
	const setSync = (mode: ThemeMode) => {
		void updateTheme({ theme: mode });
	};

	if (typeof window !== "undefined") {
		(window as Window & { __syncTheme?: (t: ThemeMode) => void }).__syncTheme =
			setSync;
	}

	return null;
}
