import { type RefObject, useEffect, useState } from "react";

const ROW_HEIGHT = 64;
const SECTION_HEADER = 56;
const MIN_LIMIT = 5;
const MAX_LIMIT = 30;
const DEFAULT_LIMIT = 12;

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
			const list = element.querySelector<HTMLElement>(".tx-rows");
			const firstRow = list?.querySelector<HTMLElement>(".tx-row");
			const rowHeight =
				firstRow?.getBoundingClientRect().height ?? ROW_HEIGHT;
			const available = element.clientHeight - SECTION_HEADER;
			const count = Math.max(
				MIN_LIMIT,
				Math.min(MAX_LIMIT, Math.floor(available / rowHeight)),
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
