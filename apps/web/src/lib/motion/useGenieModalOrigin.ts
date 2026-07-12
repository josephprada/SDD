import { useCallback, useState } from "react";
import {
	type GenieOriginRect,
	getGenieOriginRect,
} from "@app/lib/motion/genieModal";

type MouseLikeEvent = {
	currentTarget: EventTarget | null;
};

/**
 * Captura el rectángulo del botón (u otro trigger) que abre una modal.
 *
 * @example
 * const { origin, captureFromEvent, resetOrigin } = useGenieModalOrigin();
 *
 * <Button onClick={(e) => { captureFromEvent(e); setOpen(true); }}>Abrir</Button>
 * <Modal open={open} genieOrigin={origin} onClose={() => { setOpen(false); resetOrigin(); }} />
 */
export function useGenieModalOrigin() {
	const [origin, setOrigin] = useState<GenieOriginRect | null>(null);

	const captureFromElement = useCallback((element: Element) => {
		setOrigin(getGenieOriginRect(element));
	}, []);

	const captureFromEvent = useCallback(
		(event: MouseLikeEvent) => {
			if (event.currentTarget instanceof Element) {
				captureFromElement(event.currentTarget);
			}
		},
		[captureFromElement],
	);

	const resetOrigin = useCallback(() => {
		setOrigin(null);
	}, []);

	return {
		origin,
		captureFromElement,
		captureFromEvent,
		resetOrigin,
	};
}
