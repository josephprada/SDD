export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "theme";
const CYCLE: ThemeMode[] = ["light", "dark", "system"];

export function readStoredTheme(): ThemeMode {
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored === "light" || stored === "dark" || stored === "system") {
		return stored;
	}
	return "dark";
}

export function resolveTheme(mode: ThemeMode): ResolvedTheme {
	if (mode === "system") {
		return window.matchMedia("(prefers-color-scheme: dark)").matches
			? "dark"
			: "light";
	}
	return mode;
}

export function applyTheme(mode: ThemeMode): ResolvedTheme {
	const resolved = resolveTheme(mode);
	document.documentElement.dataset.theme = resolved;
	document.documentElement.dataset.themeMode = mode;
	localStorage.setItem(STORAGE_KEY, mode);
	return resolved;
}

export function cycleTheme(current: ThemeMode): ThemeMode {
	const index = CYCLE.indexOf(current);
	const next = CYCLE[(index + 1) % CYCLE.length] ?? "dark";
	return next;
}
