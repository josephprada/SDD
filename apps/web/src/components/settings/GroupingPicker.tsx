import { Modal } from "@app/components/ui/Modal";
import { usePreferencesStore } from "@app/stores/preferences";
import { GROUPING_IDS, GROUPING_LABELS, type GroupingId } from "@jp-ds/index";

type GroupingPickerProps = {
	open: boolean;
	onClose: () => void;
};

export function GroupingPicker({ open, onClose }: GroupingPickerProps) {
	const value = usePreferencesStore((s) => s.defaultGrouping);
	const setDefaultGrouping = usePreferencesStore((s) => s.setDefaultGrouping);

	const handleSelect = (grouping: GroupingId) => {
		setDefaultGrouping(grouping);
		onClose();
	};

	return (
		<Modal open={open} title="Agrupación temporal" onClose={onClose}>
			<div className="grouping-options" role="radiogroup" aria-label="Agrupación">
				{GROUPING_IDS.map((option) => {
					const active = option === value;
					return (
						<button
							key={option}
							type="button"
							role="radio"
							aria-checked={active}
							className={`grouping-option${active ? " grouping-option--active" : ""}`}
							onClick={() => handleSelect(option)}
						>
							<span>{GROUPING_LABELS[option]}</span>
							{active ? (
								<span className="preference-row__value" aria-hidden>
									✓
								</span>
							) : null}
						</button>
					);
				})}
			</div>
		</Modal>
	);
}
