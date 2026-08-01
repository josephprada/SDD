import { formatCOP } from "@app/lib/format/currency";
import { periodNetLabel, periodSummaryTitle } from "@app/lib/period";
import type { GroupingId } from "@jp-ds/index";
import { PeriodSwitcher } from "./PeriodSwitcher";

type MonthOverviewProps = {
	income: number;
	expense: number;
	/** Disponible (totalBalance) — base de “Si pagas fijos pendientes”. */
	availableBalance?: number;
	pendingFixedExpenses?: number;
	grouping?: GroupingId;
	anchor?: Date;
	onPrev?: () => void;
	onNext?: () => void;
	showSwitcher?: boolean;
};

export function MonthOverview({
	income,
	expense,
	availableBalance,
	pendingFixedExpenses = 0,
	grouping = "month",
	anchor,
	onPrev,
	onNext,
	showSwitcher = false,
}: MonthOverviewProps) {
	const net = income - expense;
	const showProjection =
		pendingFixedExpenses > 0 && availableBalance !== undefined;
	const projectedAfterFixed = showProjection
		? availableBalance - pendingFixedExpenses
		: undefined;
	const max = Math.max(income, expense, 1);
	const incomePct = Math.round((income / max) * 100);
	const expensePct = Math.round((expense / max) * 100);

	return (
		<section
			className="month-overview glass"
			aria-label={periodSummaryTitle(grouping)}
		>
			<div className="month-overview__head">
				<h2 className="section-title">{periodSummaryTitle(grouping)}</h2>
				{showSwitcher && anchor && onPrev && onNext ? (
					<PeriodSwitcher
						grouping={grouping}
						anchor={anchor}
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

			{showProjection && projectedAfterFixed !== undefined ? (
				<div
					className="month-overview__net month-overview__net--primary-projection"
					data-testid="month-overview-projection"
				>
					<span className="month-overview__label month-overview__label--primary">
						Si pagas fijos pendientes
					</span>
					<span
						className={`month-overview__primary-value${
							projectedAfterFixed < 0
								? " tx-amount--expense"
								: " tx-amount--transfer"
						}`}
						data-testid="month-overview-projected-value"
					>
						{projectedAfterFixed < 0 ? "−" : "+"}
						{formatCOP(Math.abs(projectedAfterFixed))}
					</span>
				</div>
			) : null}

			<div
				className={`month-overview__net${
					showProjection ? " month-overview__net--secondary" : ""
				}`}
				data-testid="month-overview-net"
			>
				<span className="month-overview__label">{periodNetLabel(grouping)}</span>
				<span
					className={`tx-amount${net < 0 ? " tx-amount--expense" : " tx-amount--transfer"}`}
					data-testid="month-overview-net-value"
				>
					{net < 0 ? "−" : "+"}
					{formatCOP(Math.abs(net))}
				</span>
			</div>
		</section>
	);
}
