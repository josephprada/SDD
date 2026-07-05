import { formatCOPInputFromRaw } from "@app/lib/format/currency";
import { Input } from "@jp-ds";
import type { InputHTMLAttributes } from "react";

type CurrencyInputProps = Omit<
	InputHTMLAttributes<HTMLInputElement>,
	"value" | "onChange" | "inputMode" | "type"
> & {
	label?: string;
	value: string;
	onChange: (value: string) => void;
};

export function CurrencyInput({
	value,
	onChange,
	onPaste,
	...props
}: CurrencyInputProps) {
	return (
		<Input
			{...props}
			type="text"
			inputMode="numeric"
			autoComplete="off"
			value={value}
			onChange={(event) => onChange(formatCOPInputFromRaw(event.target.value))}
			onPaste={(event) => {
				event.preventDefault();
				const pasted = event.clipboardData.getData("text");
				onChange(formatCOPInputFromRaw(pasted));
				onPaste?.(event);
			}}
		/>
	);
}
