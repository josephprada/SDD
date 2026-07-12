import {
	applyGenieModalVars,
	type GenieOriginRect,
	getGenieOriginFromActiveElement,
	prefersReducedMotion,
} from "@app/lib/motion/genieModal";
import { useOverlayAnimation } from "@app/lib/core/useOverlayAnimation";
import { type RefObject, useEffect, useLayoutEffect, useState } from "react";

type UseGenieOverlayOptions = {
	open: boolean;
	surfaceRef: RefObject<HTMLElement | null>;
	genieOrigin?: GenieOriginRect | null;
	genieIntensity?: number;
	genieDuration?: number;
	/** Si true, intenta usar document.activeElement al abrir cuando no hay origin explícito. */
	autoCaptureActiveElement?: boolean;
};

export function useGenieOverlay({
	open,
	surfaceRef,
	genieOrigin = null,
	genieIntensity = 1,
	genieDuration,
	autoCaptureActiveElement = true,
}: UseGenieOverlayOptions) {
	const { mounted, closing, handleAnimationEnd } = useOverlayAnimation(open);
	const [resolvedOrigin, setResolvedOrigin] = useState<GenieOriginRect | null>(
		null,
	);
	const reducedMotion = prefersReducedMotion();

	useEffect(() => {
		if (open) {
			setResolvedOrigin(
				genieOrigin ??
					(autoCaptureActiveElement
						? getGenieOriginFromActiveElement()
						: null),
			);
			return;
		}

		if (!mounted) {
			setResolvedOrigin(null);
		}
	}, [open, mounted, genieOrigin, autoCaptureActiveElement]);

	const useGenie = Boolean(resolvedOrigin) && !reducedMotion;

	useLayoutEffect(() => {
		if (!mounted || !useGenie || !resolvedOrigin) return;

		const sync = () => {
			if (!surfaceRef.current || !resolvedOrigin) return;
			applyGenieModalVars(surfaceRef.current, resolvedOrigin, {
				intensity: genieIntensity,
				duration: genieDuration,
			});
		};

		sync();
		const frame = requestAnimationFrame(sync);
		return () => cancelAnimationFrame(frame);
	}, [
		mounted,
		closing,
		useGenie,
		resolvedOrigin,
		genieIntensity,
		genieDuration,
		surfaceRef,
	]);

	const surfaceAnimClass = useGenie
		? closing
			? "modal--genie-out"
			: "modal--genie-in"
		: closing
			? "modal--sheet-out"
			: "modal--sheet-in";

	const surfaceExtraClass = "";

	return {
		mounted,
		closing,
		handleAnimationEnd,
		useGenie,
		reducedMotion,
		surfaceAnimClass,
		surfaceExtraClass,
		resolvedOrigin,
	};
}
