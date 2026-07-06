import type { ReactNode } from "react";
import { FieldHelp } from "@app/components/ui/FieldHelp";

type FormSelectProps = {
	label: string;
	id: string;
	value: string;
	onChange: (value: string) => void;
	hint?: string;
	required?: boolean;
	disabled?: boolean;
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
	children,
	className,
}: FormSelectProps) {
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
				className="jp-input"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				required={required}
				disabled={disabled}
			>
				{children}
			</select>
		</div>
	);
}
