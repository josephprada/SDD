import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import "./components.css";

export type CheckboxProps = Omit<
	InputHTMLAttributes<HTMLInputElement>,
	"type" | "onChange"
> & {
	label: ReactNode;
	onChange?: (checked: boolean) => void;
};

export function Checkbox({
	label,
	id,
	className = "",
	checked,
	onChange,
	disabled,
	...props
}: CheckboxProps) {
	const autoId = useId();
	const inputId =
		id ??
		(typeof label === "string" && label.trim()
			? label.toLowerCase().replace(/\s+/g, "-")
			: autoId);

	return (
		<label
			className={`jp-checkbox${disabled ? " jp-checkbox--disabled" : ""} ${className}`.trim()}
			htmlFor={inputId}
		>
			<input
				{...props}
				id={inputId}
				type="checkbox"
				className="jp-checkbox__input"
				checked={checked}
				disabled={disabled}
				onChange={(event) => onChange?.(event.target.checked)}
			/>
			<span className="jp-checkbox__control" aria-hidden />
			<span className="jp-checkbox__label">{label}</span>
		</label>
	);
}
