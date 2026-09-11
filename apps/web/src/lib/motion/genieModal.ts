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
 * Layout box ignoring active CSS animations/transforms.
 * Required because genie keyframes use `animation-fill-mode: both`, so a normal
 * getBoundingClientRect() already includes the 0% transform and corrupts --genie-*.
 * Safe to call in useLayoutEffect before paint.
 */
export function readLayoutClientRect(el: HTMLElement): DOMRect {
	const prev = {
		animation: el.style.animation,
		transition: el.style.transition,
		transform: el.style.transform,
		filter: el.style.filter,
		clipPath: el.style.clipPath,
		willChange: el.style.willChange,
	};

	el.style.setProperty("animation", "none", "important");
	el.style.setProperty("transition", "none", "important");
	el.style.setProperty("transform", "none", "important");
	el.style.setProperty("filter", "none", "important");
	el.style.setProperty("clip-path", "none", "important");
	el.style.setProperty("will-change", "auto", "important");

	void el.offsetWidth;
	const rect = el.getBoundingClientRect();
	const snapshot = new DOMRect(rect.x, rect.y, rect.width, rect.height);

	const restore = (cssName: string, value: string) => {
		if (value) el.style.setProperty(cssName, value);
		else el.style.removeProperty(cssName);
	};

	restore("animation", prev.animation);
	restore("transition", prev.transition);
	restore("transform", prev.transform);
	restore("filter", prev.filter);
	restore("clip-path", prev.clipPath);
	restore("will-change", prev.willChange);

	return snapshot;
}

/**
 * Calcula variables CSS y transform-origin para animar la modal desde/hacia `origin`.
 * Llamar en useLayoutEffect con geometría congelada (no re-medir a mitad de animación).
 */
export function applyGenieModalVars(
	modalEl: HTMLElement,
	origin: GenieOriginRect,
	options?: GenieModalOptions,
): void {
	const intensity = Math.min(1, Math.max(0, options?.intensity ?? 1));
	const duration = options?.duration ?? GENIE_DURATION_MS;
	const modalRect = readLayoutClientRect(modalEl);
	const center = getGenieOriginCenter(origin);

	const width = Math.max(modalRect.width, 1);
	const height = Math.max(modalRect.height, 1);

	// Raw origin relative to the untransformed modal box (may sit outside on desktop).
	const rawX = center.x - modalRect.left;
	const rawY = center.y - modalRect.top;

	// Clamp clip-path anchors so funnel tips stay within an expanded modal box.
	// Keeps the genie aim toward the trigger without degenerate polygons off-screen.
	const padX = width * 0.2;
	const padY = height * 0.2;
	const originX = Math.min(width + padX, Math.max(-padX, rawX));
	const originY = Math.min(height + padY, Math.max(-padY, rawY));

	const modalCenterX = modalRect.left + width / 2;
	const modalCenterY = modalRect.top + height / 2;
	const deltaX = center.x - modalCenterX;
	const deltaY = center.y - modalCenterY;

	const anchor: "top" | "bottom" = center.y > modalCenterY ? "bottom" : "top";

	modalEl.style.setProperty("--genie-x", `${originX}px`);
	modalEl.style.setProperty("--genie-y", `${originY}px`);
	modalEl.style.setProperty("--genie-dx", `${deltaX}px`);
	modalEl.style.setProperty("--genie-dy", `${deltaY}px`);
	modalEl.style.setProperty("--genie-intensity", String(intensity));
	modalEl.style.removeProperty("--genie-warp");
	modalEl.style.setProperty("--genie-skew", `${6 * intensity}deg`);
	modalEl.style.setProperty("--genie-duration", `${duration}ms`);
	modalEl.style.setProperty("--genie-anchor", anchor === "top" ? "0" : "1");
	modalEl.dataset.genieAnchor = anchor;
	// transform-origin uses raw aim so scale collapses toward the real trigger.
	modalEl.style.transformOrigin = `${rawX}px ${rawY}px`;
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
