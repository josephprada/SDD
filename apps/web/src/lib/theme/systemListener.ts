import type { ThemeMode } from "./applyTheme";
import { resolveTheme } from "./applyTheme";

type Listener = (resolved: "light" | "dark") => void;

let mediaQuery: MediaQueryList | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<Listener>();

function notify() {
	const resolved = resolveTheme("system");
	for (const listener of listeners) {
		listener(resolved);
	}
}

function onSystemChange() {
	if (debounceTimer) {
		clearTimeout(debounceTimer);
	}
	debounceTimer = setTimeout(notify, 100);
}

export function startSystemListener(mode: ThemeMode) {
	if (typeof window === "undefined") {
		return () => {};
	}

	mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
	const handler = () => {
		if (mode === "system") {
			onSystemChange();
		}
	};

	mediaQuery.addEventListener("change", handler);

	return () => {
		mediaQuery?.removeEventListener("change", handler);
		if (debounceTimer) {
			clearTimeout(debounceTimer);
		}
	};
}

export function subscribeSystemTheme(listener: Listener) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}
