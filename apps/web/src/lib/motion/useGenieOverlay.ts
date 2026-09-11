import { takeGenieOrigin } from "@app/lib/core/genieOrigin";
import { useOverlayAnimation } from "@app/lib/core/useOverlayAnimation";
import {
	type GenieOriginRect,
	applyGenieModalVars,
	getGenieOriginFromActiveElement,
	prefersReducedMotion,
} from "@app/lib/motion/genieModal";
import {
	type RefObject,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";

const GENIE_DISPLACEMENT_ID = "genie-displacement-map";

function setSvgWarpScale(scale: number): void {
	const node = document.getElementById(GENIE_DISPLACEMENT_ID);
	if (!node) return;
	node.setAttribute("scale", String(Math.max(0, scale)));
}

function readGenieWarpScale(surface: HTMLElement): number {
	const warp = getComputedStyle(surface)
		.getPropertyValue("--genie-warp")
		.trim();
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
	/** After genie-in ends, drop the enter class so fill-mode cannot keep a crop clip. */
	const [enterSettled, setEnterSettled] = useState(false);
	const reducedMotion = prefersReducedMotion();
	const varsAppliedForOpenRef = useRef(false);

	useEffect(() => {
		if (open) {
			setEnterSettled(false);
			setResolvedOrigin(
				genieOrigin ??
					takeGenieOrigin() ??
					(autoCaptureActiveElement ? getGenieOriginFromActiveElement() : null),
			);
			return;
		}

		if (!mounted) {
			setResolvedOrigin(null);
			setEnterSettled(false);
			varsAppliedForOpenRef.current = false;
		}
	}, [open, mounted, genieOrigin, autoCaptureActiveElement]);

	const useGenie = Boolean(resolvedOrigin) && !reducedMotion;

	useLayoutEffect(() => {
		if (!mounted || !useGenie || !resolvedOrigin) {
			return;
		}

		const surface = surfaceRef.current;
		if (!surface) return;

		if (varsAppliedForOpenRef.current && closing) {
			return;
		}

		applyGenieModalVars(surface, resolvedOrigin, {
			intensity: genieIntensity,
			duration: genieDuration,
		});
		varsAppliedForOpenRef.current = true;
		setSvgWarpScale(0);
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

	const onSurfaceAnimationEnd = (
		event: Pick<AnimationEvent, "target" | "currentTarget" | "animationName">,
	) => {
		if (event.target !== event.currentTarget) return;
		const name = event.animationName || "";

		if (closing) {
			// Ignore cancelled enter animationend when switching to --genie-out.
			if (name && !/out/i.test(name)) return;
			handleAnimationEnd();
			setSvgWarpScale(0);
			varsAppliedForOpenRef.current = false;
			setEnterSettled(false);
			return;
		}

		if (name && !/in/i.test(name)) return;

		// Settle enter: remove modal--genie-in so clip-path/filter from keyframes
		// do not stick (especially circle() aimed at an off-panel desktop trigger).
		const surface = surfaceRef.current;
		if (surface) {
			surface.style.removeProperty("clip-path");
			surface.style.removeProperty("filter");
		}
		setEnterSettled(true);
		setSvgWarpScale(0);
	};

	const surfaceAnimClass = useGenie
		? closing
			? "modal--genie-out"
			: enterSettled
				? ""
				: "modal--genie-in"
		: closing
			? "modal--sheet-out"
			: enterSettled
				? ""
				: "modal--sheet-in";

	const surfaceExtraClass = useGenie ? "modal--genie-warp" : "";

	return {
		mounted,
		closing,
		handleAnimationEnd: onSurfaceAnimationEnd,
		useGenie,
		reducedMotion,
		surfaceAnimClass,
		surfaceExtraClass,
		resolvedOrigin,
	};
}
