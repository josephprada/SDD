import { useThemeStore } from "@app/stores/theme";

type BrandLogoMarkProps = {
	size?: number;
	height?: number;
	className?: string;
};

export function BrandLogoMark({
	size = 40,
	height,
	className = "",
}: BrandLogoMarkProps) {
	const resolved = useThemeStore((s) => s.resolved);
	const markHeight = height ?? size;
	const inset = size <= 32 ? 4 : size <= 42 ? 6 : 8;
	const iconSize = Math.round(Math.min(size, markHeight) - inset);
	const src = resolved === "light" ? "/icon-mark-light.svg" : "/icon.svg";

	return (
		<span
			className={`brand-logo-mark${className ? ` ${className}` : ""}`}
			style={{ width: size, height: markHeight }}
			aria-hidden
		>
			<img src={src} alt="" width={iconSize} height={iconSize} />
		</span>
	);
}
