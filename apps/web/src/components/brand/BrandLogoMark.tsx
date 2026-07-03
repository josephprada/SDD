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
	const markHeight = height ?? size;
	const iconSize = Math.round(Math.min(size, markHeight) - 8);

	return (
		<span
			className={`brand-logo-mark${className ? ` ${className}` : ""}`}
			style={{ width: size, height: markHeight }}
			aria-hidden
		>
			<img
				src="/icon.svg"
				alt=""
				width={iconSize}
				height={iconSize}
			/>
		</span>
	);
}
