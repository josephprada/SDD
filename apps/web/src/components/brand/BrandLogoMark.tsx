type BrandLogoMarkProps = {
	size?: number;
	className?: string;
};

export function BrandLogoMark({ size = 40, className = "" }: BrandLogoMarkProps) {
	return (
		<span
			className={`brand-logo-mark${className ? ` ${className}` : ""}`}
			style={{ width: size, height: size }}
			aria-hidden
		>
			<img src="/icon.svg" alt="" width={size - 4} height={size - 4} />
		</span>
	);
}
