/**
 * Ref-counted body scroll lock for nested overlays (Modal + ConfirmDialog).
 * Prevents restoring `overflow: hidden` when the inner overlay closes first.
 */

let lockCount = 0;
let previousOverflow: string | null = null;

export function lockBodyScroll(): void {
	if (lockCount === 0 && typeof document !== "undefined") {
		previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
	}
	lockCount += 1;
}

export function unlockBodyScroll(): void {
	if (lockCount === 0) return;
	lockCount -= 1;
	if (lockCount === 0 && typeof document !== "undefined") {
		document.body.style.overflow = previousOverflow ?? "";
		previousOverflow = null;
	}
}

/** Test / recovery helper — forces unlock and clears counter. */
export function resetBodyScrollLockForTests(): void {
	lockCount = 0;
	previousOverflow = null;
	if (typeof document !== "undefined") {
		document.body.style.overflow = "";
	}
}

export function getBodyScrollLockCountForTests(): number {
	return lockCount;
}
