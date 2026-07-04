import type { ReactNode } from "react";

type PreferenceRowProps = {
	title: string;
	subtitle?: string;
	value?: string;
	onClick?: () => void;
	as?: "button" | "div";
	children?: ReactNode;
};

export function PreferenceRow({
	title,
	subtitle,
	value,
	onClick,
	as = "button",
	children,
}: PreferenceRowProps) {
	const content = (
		<>
			<div>
				<div className="settings-row__title">{title}</div>
				{subtitle ? (
					<div className="settings-row__sub">{subtitle}</div>
				) : null}
			</div>
			{children ?? (
				<>
					{value ? (
						<span className="preference-row__value">{value}</span>
					) : null}
					{onClick ? (
						<span className="preference-row__chevron" aria-hidden>
							›
						</span>
					) : null}
				</>
			)}
		</>
	);

	if (as === "div") {
		return (
			<div className="settings-row glass interactive-lift preference-row">{content}</div>
		);
	}

	return (
		<button
			type="button"
			className="settings-row glass interactive-lift preference-row"
			onClick={onClick}
		>
			{content}
		</button>
	);
}
