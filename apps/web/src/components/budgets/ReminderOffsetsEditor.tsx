import { DigitsInput } from "@app/components/ui/DigitsInput";
import { Button } from "@jp-ds";
import { useState } from "react";

type ReminderOffsetsEditorProps = {
	value: number[];
	onChange: (offsets: number[]) => void;
};

export function ReminderOffsetsEditor({
	value,
	onChange,
}: ReminderOffsetsEditorProps) {
	const [draft, setDraft] = useState("");

	const addOffset = () => {
		const n = Number.parseInt(draft, 10);
		if (Number.isNaN(n) || n < 0 || n > 30) return;
		if (value.includes(n) || value.length >= 5) return;
		onChange([...value, n].sort((a, b) => b - a));
		setDraft("");
	};

	const remove = (n: number) => onChange(value.filter((v) => v !== n));

	return (
		<div className="reminder-offsets">
			<span className="jp-input-label">Recordatorios (días antes)</span>
			<div className="reminder-offsets__chips">
				{value.map((n) => (
					<button
						key={n}
						type="button"
						className="reminder-offsets__chip"
						onClick={() => remove(n)}
					>
						{n === 0 ? "Mismo día" : `${n} días antes`} ×
					</button>
				))}
			</div>
			<div className="reminder-offsets__add">
				<DigitsInput
					label="Añadir días de antelación"
					value={draft}
					onChange={setDraft}
					maxLength={2}
					placeholder="Ej. 2"
				/>
				<Button type="button" variant="secondary" onClick={addOffset}>
					Añadir
				</Button>
			</div>
		</div>
	);
}
