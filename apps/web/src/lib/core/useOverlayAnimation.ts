import { useEffect, useState } from "react";

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

	const handleAnimationEnd = () => {
		if (!closing) return;
		setMounted(false);
		setClosing(false);
	};

	return { mounted, closing, handleAnimationEnd };
}
