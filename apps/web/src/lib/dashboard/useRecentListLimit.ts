import { type RefObject, useEffect, useState } from "react";

const ROW_HEIGHT = 58;
const MIN_LIMIT = 5;
const MAX_LIMIT = 30;
const DEFAULT_LIMIT = 10;

export function useRecentListLimit(
	containerRef: RefObject<HTMLElement | null>,
	enabled: boolean,
) {
	const [limit, setLimit] = useState(DEFAULT_LIMIT);

	useEffect(() => {
		if (!enabled) {
			setLimit(8);
			return;
		}

		const element = containerRef.current;
		if (!element) return;

		const updateLimit = () => {
			const header = element.querySelector<HTMLElement>(".section-header");
			const headerHeight = header?.offsetHeight ?? 40;
			const styles = getComputedStyle(element);
			const padding =
				parseFloat(styles.paddingTop) + parseFloat(styles.paddingBottom);
			const available = element.clientHeight - headerHeight - padding;
			const count = Math.max(
				MIN_LIMIT,
				Math.min(MAX_LIMIT, Math.floor(available / ROW_HEIGHT)),
			);
			setLimit((previous) => (previous === count ? previous : count));
		};

		updateLimit();
		const observer = new ResizeObserver(updateLimit);
		observer.observe(element);
		return () => observer.disconnect();
	}, [containerRef, enabled]);

	return limit;
}
