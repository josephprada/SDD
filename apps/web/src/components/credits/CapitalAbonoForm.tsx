import { CurrencyInput } from "@app/components/ui/CurrencyInput";
import { FieldError } from "@app/components/ui/FieldError";
import { FormModalFooter } from "@app/components/ui/FormModalFooter";
import { FormSelect } from "@app/components/ui/FormSelect";
import {
	RECALC_EFFECT_OPTIONS,
	type AbonoRecalcEffect,
} from "@app/lib/credits/types";
import { parseCOPInput } from "@app/lib/format/currency";
import { toDateInputValue } from "@app/lib/format/date";
import { Input } from "@jp-ds";
import { useState } from "react";

type CapitalAbonoFormProps = {
	onSubmit: (values: {
		amount: number;
		paidAt: number;
		recalcEffect: AbonoRecalcEffect;
		notes?: string;
	}) => Promise<void>;
	onCancel: () => void;
	loading?: boolean;
	error?: string;
};

export function CapitalAbonoForm({
	onSubmit,
	onCancel,
	loading,
	error,
}: CapitalAbonoFormProps) {
	const [amountRaw, setAmountRaw] = useState("");
	const [paidAt, setPaidAt] = useState(toDateInputValue(Date.now()));
	const [recalcEffect, setRecalcEffect] =
		useState<AbonoRecalcEffect>("shorten_term");
	const [notes, setNotes] = useState("");

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		const amount = parseCOPInput(amountRaw);
		if (amount === null || amount <= 0) return;
		await onSubmit({
			amount,
			paidAt: new Date(paidAt).getTime(),
			recalcEffect,
			notes: notes.trim() || undefined,
		});
	};

	return (
		<form className="tx-form tx-form--modal" onSubmit={handleSubmit} noValidate>
			<div className="tx-form__scroll brand-scroll credit-form-grid credit-form-grid--single">
				<CurrencyInput
					label="Monto abono (COP)"
					value={amountRaw}
					onChange={setAmountRaw}
					required
				/>
				<Input
					label="Fecha abono"
					type="date"
					value={paidAt}
					onChange={(e) => setPaidAt(e.target.value)}
					required
				/>
				<FormSelect
					id="abono-recalc-effect"
					label="¿Qué hace este abono con las cuotas?"
					value={recalcEffect}
					onChange={(v) => setRecalcEffect(v as AbonoRecalcEffect)}
					className="credit-form-grid__full"
				>
					{RECALC_EFFECT_OPTIONS.map((opt) => (
						<option key={opt.value} value={opt.value}>
							{opt.label}
						</option>
					))}
				</FormSelect>
				<Input
					label="Notas (opcional)"
					value={notes}
					onChange={(e) => setNotes(e.target.value)}
					className="credit-form-grid__full"
				/>
				<div className="credit-form-grid__full">
					<FieldError message={error} />
				</div>
			</div>
			<FormModalFooter
				onCancel={onCancel}
				loading={loading}
				submitLabel="Registrar abono"
			/>
		</form>
	);
}
