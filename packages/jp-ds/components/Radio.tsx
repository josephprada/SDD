import { type InputHTMLAttributes, type ReactNode, useId } from "react";
import "./components.css";

export type RadioProps = Omit<
	InputHTMLAttributes<HTMLInputElement>,
	"type" | "onChange" | "size"
> & {
	label: ReactNode;
	/** Optional secondary line under the label */
	description?: ReactNode;
	onChange?: (checked: boolean) => void;
};

export function Radio({
	label,
	description,
	id,
	className = "",
	checked,
	onChange,
	disabled,
	name,
	value,
	...props
}: RadioProps) {
	const autoId = useId();
	const inputId =
		id ??
		(typeof label === "string" && label.trim()
			? `radio-${label.toLowerCase().replace(/\s+/g, "-")}`
			: autoId);

	return (
		<label
			className={`jp-radio${disabled ? " jp-radio--disabled" : ""}${
				checked ? " jp-radio--checked" : ""
			} ${className}`.trim()}
			htmlFor={inputId}
		>
			<input
				{...props}
				id={inputId}
				type="radio"
				className="jp-radio__input"
				name={name}
				value={value}
				checked={checked}
				disabled={disabled}
				onChange={(event) => onChange?.(event.target.checked)}
			/>
			<span className="jp-radio__control" aria-hidden />
			<span className="jp-radio__text">
				<span className="jp-radio__label">{label}</span>
				{description ? (
					<span className="jp-radio__description">{description}</span>
				) : null}
			</span>
		</label>
	);
}
