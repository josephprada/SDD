import { formatDigitsInputFromRaw } from "@app/lib/format/currency";
import { Input } from "@jp-ds";
import type { InputHTMLAttributes } from "react";

type DigitsInputProps = Omit<
	InputHTMLAttributes<HTMLInputElement>,
	"value" | "onChange" | "inputMode" | "type"
> & {
	label?: string;
	value: string;
	onChange: (value: string) => void;
	maxLength?: number;
};

export function DigitsInput({
	value,
	onChange,
	maxLength,
	onPaste,
	...props
}: DigitsInputProps) {
	const format = (raw: string) => formatDigitsInputFromRaw(raw, maxLength);

	return (
		<Input
			{...props}
			type="text"
			inputMode="numeric"
			autoComplete="off"
			value={value}
			onChange={(event) => onChange(format(event.target.value))}
			onPaste={(event) => {
				event.preventDefault();
				const pasted = event.clipboardData.getData("text");
				onChange(format(pasted));
				onPaste?.(event);
			}}
		/>
	);
}
