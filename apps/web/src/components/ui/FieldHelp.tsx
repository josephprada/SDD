import { CoreIcon } from "@app/lib/core/icons";

type FieldHelpProps = {
	text: string;
};

export function FieldHelp({ text }: FieldHelpProps) {
	if (!text.trim()) return null;

	return (
		<span className="field-help">
			<button
				type="button"
				className="field-help__trigger"
				aria-label="Más información"
			>
				<CoreIcon name="circle-help" size={14} />
			</button>
			<span role="tooltip" className="field-help__tooltip">
				{text}
			</span>
		</span>
	);
}
