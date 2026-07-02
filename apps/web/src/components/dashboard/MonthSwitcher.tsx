import { CoreIcon } from "@app/lib/core/icons";
import { formatMonthYear } from "@app/lib/format/date";

type MonthSwitcherProps = {
	month: Date;
	onPrev: () => void;
	onNext: () => void;
	compact?: boolean;
};

export function MonthSwitcher({
	month,
	onPrev,
	onNext,
	compact = false,
}: MonthSwitcherProps) {
	return (
		<div
			className={`month-switcher${compact ? " month-switcher--compact" : ""}`}
		>
			<button
				type="button"
				className="month-switcher__nav"
				aria-label="Mes anterior"
				onClick={onPrev}
			>
				<CoreIcon name="chevron-left" size={compact ? 16 : 18} />
			</button>
			<div className="month-switcher__label-group">
				<CoreIcon
					name="calendar"
					size={compact ? 12 : 14}
					className="month-switcher__calendar"
				/>
				<span className="month-switcher__label">{formatMonthYear(month)}</span>
			</div>
			<button
				type="button"
				className="month-switcher__nav"
				aria-label="Mes siguiente"
				onClick={onNext}
			>
				<CoreIcon name="chevron-right" size={compact ? 16 : 18} />
			</button>
		</div>
	);
}
