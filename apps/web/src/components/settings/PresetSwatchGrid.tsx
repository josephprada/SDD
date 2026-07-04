type PresetSwatchGridProps<T extends string> = {
	options: readonly T[];
	labels: Record<T, string>;
	colors: Record<T, string>;
	value: T;
	onChange: (value: T) => void;
	ariaLabel: string;
};

export function PresetSwatchGrid<T extends string>({
	options,
	labels,
	colors,
	value,
	onChange,
	ariaLabel,
}: PresetSwatchGridProps<T>) {
	return (
		<div className="preset-swatch-grid" role="radiogroup" aria-label={ariaLabel}>
			{options.map((option) => {
				const active = option === value;
				return (
					<button
						key={option}
						type="button"
						role="radio"
						aria-checked={active}
						className={`preset-swatch${active ? " preset-swatch--active" : ""}`}
						onClick={() => onChange(option)}
					>
						<span
							className="preset-swatch__color"
							style={{ backgroundColor: colors[option] }}
							aria-hidden
						/>
						<span className="preset-swatch__label">{labels[option]}</span>
					</button>
				);
			})}
		</div>
	);
}

export const ACCENT_SWATCH_COLORS = {
	"green-bolt": "#07fba2",
	"cyan-neon": "#22d3ee",
	"amber-gold": "#fbbf24",
	"violet-pulse": "#a78bfa",
	"coral-heat": "#fb7185",
} as const;

export const DANGER_SWATCH_COLORS = {
	"red-classic": "#ef4444",
	"rose-soft": "#f43f5e",
	"orange-alert": "#f97316",
	"crimson-deep": "#dc2626",
} as const;
