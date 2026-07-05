export const chartTooltipWrapperStyle = {
	background: "transparent",
	border: "none",
	boxShadow: "none",
	padding: 0,
} as const;

export function getChartColors(): {
	accent: string;
	danger: string;
	muted: string;
	text: string;
} {
	const root = getComputedStyle(document.documentElement);
	return {
		accent: root.getPropertyValue("--color-accent").trim() || "#07FBA2",
		danger: root.getPropertyValue("--color-danger").trim() || "#EF4444",
		muted: root.getPropertyValue("--color-text-muted").trim() || "#94A3B8",
		text: root.getPropertyValue("--color-text-primary").trim() || "#F8FAFC",
	};
}
