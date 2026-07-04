import { usePreferencesStore } from "@app/stores/preferences";
import { THEME_MODE_LABELS, type ThemeMode } from "@jp-ds/index";

const MODES: ThemeMode[] = ["dark", "light", "system"];

export function ThemeModePicker() {
	const mode = usePreferencesStore((s) => s.mode);
	const setTheme = usePreferencesStore((s) => s.setTheme);

	return (
		<div className="theme-mode-picker" role="radiogroup" aria-label="Modo de tema">
			{MODES.map((option) => {
				const active = option === mode;
				return (
					<button
						key={option}
						type="button"
						role="radio"
						aria-checked={active}
						className={`theme-mode-picker__btn${active ? " theme-mode-picker__btn--active" : ""}`}
						onClick={() => setTheme(option)}
					>
						{THEME_MODE_LABELS[option]}
					</button>
				);
			})}
		</div>
	);
}
