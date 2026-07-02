type SegmentedOption<T extends string> = {
	value: T;
	label: string;
};

type SegmentedControlProps<T extends string> = {
	options: SegmentedOption<T>[];
	value: T;
	onChange: (value: T) => void;
	ariaLabel: string;
};

export function SegmentedControl<T extends string>({
	options,
	value,
	onChange,
	ariaLabel,
}: SegmentedControlProps<T>) {
	return (
		<div className="segmented" role="tablist" aria-label={ariaLabel}>
			{options.map((opt) => (
				<button
					key={opt.value}
					type="button"
					role="tab"
					aria-selected={value === opt.value}
					className={`segmented__item${value === opt.value ? " segmented__item--active" : ""}`}
					onClick={() => onChange(opt.value)}
				>
					{opt.label}
				</button>
			))}
		</div>
	);
}
