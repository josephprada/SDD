export type OriginRect = {
	x: number;
	y: number;
	width: number;
	height: number;
};

/** Intensidad del warp SVG (feDisplacementMap scale). 0 = off, 12–24 típico, >30 agresivo. */
export const GENIE_WARP_SCALE = 16;

let lastOrigin: OriginRect | null = null;

export function setGenieOrigin(rect: OriginRect | null): void {
	lastOrigin = rect;
}

/** Lee el origen capturado sin consumirlo (útil al montar la modal). */
export function peekGenieOrigin(): OriginRect | null {
	return lastOrigin;
}

/** Consume el origen capturado (opcional; la modal suele hacer peek + guardar en ref). */
export function takeGenieOrigin(): OriginRect | null {
	const origin = lastOrigin;
	lastOrigin = null;
	return origin;
}

export function getOriginRect(
	element: Element | EventTarget | null | undefined,
): OriginRect | null {
	if (!element || !(element instanceof Element)) return null;
	const rect = element.getBoundingClientRect();
	if (rect.width <= 0 && rect.height <= 0) return null;
	return {
		x: rect.x,
		y: rect.y,
		width: rect.width,
		height: rect.height,
	};
}

/** Captura y guarda el origen desde el target del evento (botón, fila, etc.). */
export function captureGenieOrigin(
	element: Element | EventTarget | null | undefined,
): OriginRect | null {
	const rect = getOriginRect(element);
	setGenieOrigin(rect);
	return rect;
}

export function prefersReducedMotion(): boolean {
	if (typeof window === "undefined") return false;
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Calcula transform-origin (%) relativo al panel de la modal
 * para que scale/clip-path apunten al botón de origen.
 */
export function computeGenieTransformOrigin(
	modalRect: DOMRect,
	origin: OriginRect,
): { xPercent: number; yPercent: number } {
	const cx = origin.x + origin.width / 2;
	const cy = origin.y + origin.height / 2;
	const width = Math.max(modalRect.width, 1);
	const height = Math.max(modalRect.height, 1);
	const xPercent = ((cx - modalRect.left) / width) * 100;
	const yPercent = ((cy - modalRect.top) / height) * 100;
	return {
		xPercent: clamp(xPercent, -40, 140),
		yPercent: clamp(yPercent, -40, 140),
	};
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}
