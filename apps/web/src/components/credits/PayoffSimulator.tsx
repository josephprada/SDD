import { CurrencyInput } from "@app/components/ui/CurrencyInput";
import { formatCOP } from "@app/lib/format/currency";
import { formatFullDate } from "@app/lib/format/date";
import { parseCOPInput } from "@app/lib/format/currency";
import { Button, Input } from "@jp-ds";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

type PayoffSimulatorProps = {
	creditId: Id<"credits">;
};

export function PayoffSimulator({ creditId }: PayoffSimulatorProps) {
	const [annualRaw, setAnnualRaw] = useState("6000000");
	const [years, setYears] = useState("30");
	const [run, setRun] = useState(false);
	const annualAmount = parseCOPInput(annualRaw) ?? 0;

	const result = useQuery(
		api.credits.simulatePayoff,
		run && annualAmount > 0
			? {
					creditId,
					annualAbonoAmount: annualAmount,
					years: Number.parseInt(years, 10) || 30,
				}
			: "skip",
	);

	return (
		<div className="credit-panel-form glass">
			<h3 className="section-title">Simulador de pago anticipado</h3>
			<div className="credit-form-grid">
				<CurrencyInput
					label="Abono anual (COP)"
					value={annualRaw}
					onChange={(v) => {
						setAnnualRaw(v);
						setRun(false);
					}}
				/>
				<Input
					label="Horizonte (años)"
					value={years}
					onChange={(e) => {
						setYears(e.target.value);
						setRun(false);
					}}
				/>
				<div className="credit-form-grid__full credit-panel-form__actions">
					<Button
						type="button"
						onClick={() => setRun(true)}
						disabled={annualAmount <= 0}
					>
						Simular
					</Button>
				</div>
			</div>
			{result ? (
				<div className="credit-summary">
					<div className="credit-summary__item">
						<span className="credit-summary__label">Meses restantes</span>
						<strong>{result.monthsRemaining}</strong>
					</div>
					<div className="credit-summary__item">
						<span className="credit-summary__label">Fecha estimada</span>
						<strong>{formatFullDate(result.projectedPayoffDate)}</strong>
					</div>
					<div className="credit-summary__item">
						<span className="credit-summary__label">Interés total</span>
						<strong>{formatCOP(result.totalInterestPaid)}</strong>
					</div>
				</div>
			) : null}
		</div>
	);
}
