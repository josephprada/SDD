import { useEffect, useState } from "react";

/** Fallback if animationend never fires (genie / reduced-motion edge cases). */
const CLOSE_FALLBACK_MS = 700;

export function useOverlayAnimation(open: boolean) {
	const [mounted, setMounted] = useState(open);
	const [closing, setClosing] = useState(false);

	useEffect(() => {
		if (open) {
			setMounted(true);
			setClosing(false);
			return;
		}

		if (mounted) {
			setClosing(true);
		}
	}, [open, mounted]);

	useEffect(() => {
		if (!closing) return;
		const timer = window.setTimeout(() => {
			setMounted(false);
			setClosing(false);
		}, CLOSE_FALLBACK_MS);
		return () => window.clearTimeout(timer);
	}, [closing]);

	const handleAnimationEnd = () => {
		if (!closing) return;
		setMounted(false);
		setClosing(false);
	};

	return { mounted, closing, handleAnimationEnd };
}
