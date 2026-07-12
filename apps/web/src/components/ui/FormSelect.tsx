import type { ReactNode } from "react";
import { FieldHelp } from "@app/components/ui/FieldHelp";

export const SELECT_PLACEHOLDER = "Seleccionar";

type FormSelectProps = {
	label: string;
	id: string;
	value: string;
	onChange: (value: string) => void;
	hint?: string;
	required?: boolean;
	disabled?: boolean;
	/** Empty-state label. `false` hides the placeholder option. Default: "Seleccionar" */
	placeholder?: string | false;
	children: ReactNode;
	className?: string;
};

export function FormSelect({
	label,
	id,
	value,
	onChange,
	hint,
	required,
	disabled,
	placeholder = SELECT_PLACEHOLDER,
	children,
	className,
}: FormSelectProps) {
	const showPlaceholder = placeholder !== false;
	const isPlaceholderSelected = showPlaceholder && value === "";

	return (
		<div className={className}>
			<div className="field-label-row">
				<label className="jp-input-label" htmlFor={id}>
					{label}
				</label>
				{hint ? <FieldHelp text={hint} /> : null}
			</div>
			<select
				id={id}
				className={`jp-input${isPlaceholderSelected ? " jp-input--placeholder" : ""}`}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				required={required}
				disabled={disabled}
			>
				{showPlaceholder ? (
					<option value="" className="jp-select-placeholder">
						{placeholder}
					</option>
				) : null}
				{children}
			</select>
		</div>
	);
}
