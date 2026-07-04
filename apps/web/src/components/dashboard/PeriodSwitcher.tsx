import { CoreIcon } from "@app/lib/core/icons";
import { formatPeriodLabel } from "@app/lib/period";
import type { GroupingId } from "@jp-ds/index";

type PeriodSwitcherProps = {
	grouping: GroupingId;
	anchor: Date;
	onPrev: () => void;
	onNext: () => void;
	compact?: boolean;
};

export function PeriodSwitcher({
	grouping,
	anchor,
	onPrev,
	onNext,
	compact = false,
}: PeriodSwitcherProps) {
	const prevLabel =
		grouping === "week"
			? "Semana anterior"
			: grouping === "month"
				? "Mes anterior"
				: grouping === "quarter"
					? "Trimestre anterior"
					: "Semestre anterior";

	const nextLabel =
		grouping === "week"
			? "Semana siguiente"
			: grouping === "month"
				? "Mes siguiente"
				: grouping === "quarter"
					? "Trimestre siguiente"
					: "Semestre siguiente";

	return (
		<div
			className={`month-switcher${compact ? " month-switcher--compact" : ""}`}
		>
			<button
				type="button"
				className="month-switcher__nav"
				aria-label={prevLabel}
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
				<span className="month-switcher__label">
					{formatPeriodLabel(grouping, anchor)}
				</span>
			</div>
			<button
				type="button"
				className="month-switcher__nav"
				aria-label={nextLabel}
				onClick={onNext}
			>
				<CoreIcon name="chevron-right" size={compact ? 16 : 18} />
			</button>
		</div>
	);
}
