/** Rectángulo del elemento origen en coordenadas de viewport (getBoundingClientRect). */
export type GenieOriginRect = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export type GenieModalOptions = {
	/** 0–1. Controla skew, clip-path y displacement del filtro SVG. Default: 1 */
	intensity?: number;
	/** ms. Default: 420 (dentro del rango 350–500) */
	duration?: number;
};

export const GENIE_EASE_IN = "cubic-bezier(0.22, 1, 0.36, 1)";
export const GENIE_EASE_OUT = "cubic-bezier(0.55, 0, 1, 0.45)";
export const GENIE_DURATION_MS = 420;

export function prefersReducedMotion(): boolean {
	if (typeof window === "undefined") return false;
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function getGenieOriginRect(element: Element): GenieOriginRect {
	const rect = element.getBoundingClientRect();
	return {
		x: rect.left,
		y: rect.top,
		width: rect.width,
		height: rect.height,
	};
}

export function getGenieOriginFromActiveElement(): GenieOriginRect | null {
	const active = document.activeElement;
	if (active instanceof HTMLElement && active !== document.body) {
		return getGenieOriginRect(active);
	}
	return null;
}

export function getGenieOriginCenter(origin: GenieOriginRect) {
	return {
		x: origin.x + origin.width / 2,
		y: origin.y + origin.height / 2,
	};
}

/**
 * Calcula variables CSS y transform-origin para animar la modal desde/hacia `origin`.
 * Llamar tras el layout (useLayoutEffect + rAF) cuando el nodo modal ya tiene dimensiones.
 */
export function applyGenieModalVars(
	modalEl: HTMLElement,
	origin: GenieOriginRect,
	options?: GenieModalOptions,
): void {
	const intensity = Math.min(1, Math.max(0, options?.intensity ?? 1));
	const duration = options?.duration ?? GENIE_DURATION_MS;
	const modalRect = modalEl.getBoundingClientRect();
	const center = getGenieOriginCenter(origin);

	const originX = center.x - modalRect.left;
	const originY = center.y - modalRect.top;
	const modalCenterX = modalRect.left + modalRect.width / 2;
	const modalCenterY = modalRect.top + modalRect.height / 2;
	const deltaX = center.x - modalCenterX;
	const deltaY = center.y - modalCenterY;

	const anchor: "top" | "bottom" =
		center.y > modalCenterY ? "bottom" : "top";

	modalEl.style.setProperty("--genie-x", `${originX}px`);
	modalEl.style.setProperty("--genie-y", `${originY}px`);
	modalEl.style.setProperty("--genie-dx", `${deltaX}px`);
	modalEl.style.setProperty("--genie-dy", `${deltaY}px`);
	modalEl.style.setProperty("--genie-intensity", String(intensity));
	modalEl.style.setProperty("--genie-warp", String(Math.round(18 * intensity)));
	modalEl.style.setProperty("--genie-skew", `${6 * intensity}deg`);
	modalEl.style.setProperty("--genie-duration", `${duration}ms`);
	modalEl.style.setProperty("--genie-anchor", anchor === "top" ? "0" : "1");
	modalEl.dataset.genieAnchor = anchor;
	modalEl.style.transformOrigin = `${originX}px ${originY}px`;
}

export function clearGenieModalVars(modalEl: HTMLElement): void {
	const props = [
		"--genie-x",
		"--genie-y",
		"--genie-dx",
		"--genie-dy",
		"--genie-intensity",
		"--genie-warp",
		"--genie-skew",
		"--genie-duration",
		"--genie-anchor",
	];
	for (const prop of props) {
		modalEl.style.removeProperty(prop);
	}
	modalEl.style.removeProperty("transform-origin");
	delete modalEl.dataset.genieAnchor;
}
