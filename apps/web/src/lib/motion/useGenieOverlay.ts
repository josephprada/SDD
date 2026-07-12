import { takeGenieOrigin } from "@app/lib/core/genieOrigin";
import {
	applyGenieModalVars,
	type GenieOriginRect,
	getGenieOriginFromActiveElement,
	prefersReducedMotion,
} from "@app/lib/motion/genieModal";
import { useOverlayAnimation } from "@app/lib/core/useOverlayAnimation";
import { type RefObject, useEffect, useLayoutEffect, useState } from "react";

const GENIE_DISPLACEMENT_ID = "genie-displacement-map";

function setSvgWarpScale(scale: number): void {
	const node = document.getElementById(GENIE_DISPLACEMENT_ID);
	if (!node) return;
	node.setAttribute("scale", String(Math.max(0, scale)));
}

function readGenieWarpScale(surface: HTMLElement): number {
	const warp = getComputedStyle(surface).getPropertyValue("--genie-warp").trim();
	const scale = Number.parseFloat(warp);
	return Number.isFinite(scale) ? scale : 0;
}

type UseGenieOverlayOptions = {
	open: boolean;
	surfaceRef: RefObject<HTMLElement | null>;
	genieOrigin?: GenieOriginRect | null;
	genieIntensity?: number;
	genieDuration?: number;
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
					takeGenieOrigin() ??
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
			if (closing) {
				surfaceRef.current.style.removeProperty("--genie-warp");
				setSvgWarpScale(readGenieWarpScale(surfaceRef.current));
			} else {
				setSvgWarpScale(0);
			}
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

	useEffect(() => {
		if (!mounted || !useGenie || !closing) {
			setSvgWarpScale(0);
			return;
		}

		let frame = 0;
		const tick = () => {
			const surface = surfaceRef.current;
			if (surface) {
				setSvgWarpScale(readGenieWarpScale(surface));
			}
			frame = requestAnimationFrame(tick);
		};
		frame = requestAnimationFrame(tick);
		return () => {
			cancelAnimationFrame(frame);
			setSvgWarpScale(0);
		};
	}, [mounted, useGenie, closing, surfaceRef]);

	const surfaceAnimClass = useGenie
		? closing
			? "modal--genie-out"
			: "modal--genie-in"
		: closing
			? "modal--sheet-out"
			: "modal--sheet-in";

	const surfaceExtraClass = useGenie ? "modal--genie-warp" : "";

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
