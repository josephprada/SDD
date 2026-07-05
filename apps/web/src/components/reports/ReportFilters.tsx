import { PeriodSwitcher } from "@app/components/dashboard/PeriodSwitcher";
import { addPeriod } from "@app/lib/period";
import type { Id } from "@convex/_generated/dataModel";
import type { GroupingId } from "@jp-ds/index";
import { GROUPING_LABELS } from "@jp-ds/index";

type ReportFiltersProps = {
	grouping: GroupingId;
	anchor: Date;
	categoryId: Id<"categories"> | "";
	accountId: Id<"accounts"> | "";
	categories: Array<{ _id: Id<"categories">; name: string }>;
	accounts: Array<{ _id: Id<"accounts">; name: string }>;
	onGroupingChange: (g: GroupingId) => void;
	onAnchorChange: (d: Date) => void;
	onCategoryChange: (id: Id<"categories"> | "") => void;
	onAccountChange: (id: Id<"accounts"> | "") => void;
};

export function ReportFilters({
	grouping,
	anchor,
	categoryId,
	accountId,
	categories,
	accounts,
	onGroupingChange,
	onAnchorChange,
	onCategoryChange,
	onAccountChange,
}: ReportFiltersProps) {
	return (
		<div className="report-filters glass">
			<div className="report-filters__row report-filters__row--period">
				<label>
					Agrupación
					<select
						value={grouping}
						onChange={(e) => onGroupingChange(e.target.value as GroupingId)}
					>
						{(Object.keys(GROUPING_LABELS) as GroupingId[]).map((g) => (
							<option key={g} value={g}>
								{GROUPING_LABELS[g]}
							</option>
						))}
					</select>
				</label>
				<PeriodSwitcher
					grouping={grouping}
					anchor={anchor}
					onPrev={() => onAnchorChange(addPeriod(grouping, anchor, -1))}
					onNext={() => onAnchorChange(addPeriod(grouping, anchor, 1))}
				/>
			</div>
			<div className="report-filters__row">
				<label>
					Categoría
					<select
						value={categoryId}
						onChange={(e) =>
							onCategoryChange(e.target.value as Id<"categories"> | "")
						}
					>
						<option value="">Todas</option>
						{categories.map((c) => (
							<option key={c._id} value={c._id}>
								{c.name}
							</option>
						))}
					</select>
				</label>
				<label>
					Cuenta
					<select
						value={accountId}
						onChange={(e) =>
							onAccountChange(e.target.value as Id<"accounts"> | "")
						}
					>
						<option value="">Todas</option>
						{accounts.map((a) => (
							<option key={a._id} value={a._id}>
								{a.name}
							</option>
						))}
					</select>
				</label>
			</div>
		</div>
	);
}
