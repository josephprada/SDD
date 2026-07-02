import { formatCOP } from "@app/lib/format/currency";
import { MonthSwitcher } from "./MonthSwitcher";

type MonthOverviewProps = {
	income: number;
	expense: number;
	month?: Date;
	onPrev?: () => void;
	onNext?: () => void;
	showSwitcher?: boolean;
};

export function MonthOverview({
	income,
	expense,
	month,
	onPrev,
	onNext,
	showSwitcher = false,
}: MonthOverviewProps) {
	const net = income - expense;
	const max = Math.max(income, expense, 1);
	const incomePct = Math.round((income / max) * 100);
	const expensePct = Math.round((expense / max) * 100);

	return (
		<section className="month-overview glass" aria-label="Resumen del mes">
			<div className="month-overview__head">
				<h2 className="section-title">Este mes</h2>
				{showSwitcher && month && onPrev && onNext ? (
					<MonthSwitcher
						month={month}
						onPrev={onPrev}
						onNext={onNext}
						compact
					/>
				) : null}
			</div>

			<div className="month-overview__row">
				<div className="month-overview__line">
					<span className="month-overview__label">Ingresos</span>
					<span className="tx-amount tx-amount--income">
						+{formatCOP(income)}
					</span>
				</div>
				<div className="month-overview__track">
					<div
						className="month-overview__bar month-overview__bar--income"
						style={{ width: `${incomePct}%` }}
					/>
				</div>
			</div>

			<div className="month-overview__row">
				<div className="month-overview__line">
					<span className="month-overview__label">Gastos</span>
					<span className="tx-amount tx-amount--expense">
						−{formatCOP(expense)}
					</span>
				</div>
				<div className="month-overview__track">
					<div
						className="month-overview__bar month-overview__bar--expense"
						style={{ width: `${expensePct}%` }}
					/>
				</div>
			</div>

			<div className="month-overview__net">
				<span className="month-overview__label">Neto del mes</span>
				<span
					className={`tx-amount${net < 0 ? " tx-amount--expense" : " tx-amount--income"}`}
				>
					{net < 0 ? "−" : "+"}
					{formatCOP(Math.abs(net))}
				</span>
			</div>
		</section>
	);
}
