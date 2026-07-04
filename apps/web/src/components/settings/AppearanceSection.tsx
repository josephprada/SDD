import { usePreferencesStore } from "@app/stores/preferences";
import {
	ACCENT_PRESET_IDS,
	ACCENT_PRESET_LABELS,
	DANGER_PRESET_IDS,
	DANGER_PRESET_LABELS,
} from "@jp-ds/index";
import { Button } from "@jp-ds";
import { useState } from "react";
import {
	ACCENT_SWATCH_COLORS,
	DANGER_SWATCH_COLORS,
	PresetSwatchGrid,
} from "./PresetSwatchGrid";
import { ResetAppearanceDialog } from "./ResetAppearanceDialog";
import { ThemeModePicker } from "./ThemeModePicker";
import { TypographyPresetPicker } from "./TypographyPresetPicker";

export function AppearanceSection() {
	const accentPreset = usePreferencesStore((s) => s.accentPreset);
	const dangerPreset = usePreferencesStore((s) => s.dangerPreset);
	const setAccentPreset = usePreferencesStore((s) => s.setAccentPreset);
	const setDangerPreset = usePreferencesStore((s) => s.setDangerPreset);
	const resetAppearanceLocal = usePreferencesStore((s) => s.resetAppearanceLocal);
	const isDefault = usePreferencesStore((s) => s.isDefaultAppearance());
	const [resetOpen, setResetOpen] = useState(false);

	const handleReset = () => {
		resetAppearanceLocal();
		setResetOpen(false);
	};

	return (
		<section className="settings-section animate-stagger-item" aria-label="Apariencia">
			<h2 className="settings-section__title">Apariencia</h2>
			<div className="settings-card glass">
				<div>
					<span className="settings-field-label">Modo</span>
					<ThemeModePicker />
				</div>

				<div>
					<span className="settings-field-label">Acento</span>
					<PresetSwatchGrid
						options={ACCENT_PRESET_IDS}
						labels={ACCENT_PRESET_LABELS}
						colors={ACCENT_SWATCH_COLORS}
						value={accentPreset}
						onChange={setAccentPreset}
						ariaLabel="Color de acento"
					/>
				</div>

				<div>
					<span className="settings-field-label">Errores y alertas</span>
					<PresetSwatchGrid
						options={DANGER_PRESET_IDS}
						labels={DANGER_PRESET_LABELS}
						colors={DANGER_SWATCH_COLORS}
						value={dangerPreset}
						onChange={setDangerPreset}
						ariaLabel="Color de errores"
					/>
				</div>

				<div>
					<span className="settings-field-label">Tipografía</span>
					<TypographyPresetPicker />
				</div>

				<Button
					variant="secondary"
					fullWidth
					disabled={isDefault}
					onClick={() => setResetOpen(true)}
				>
					Restaurar apariencia por defecto
				</Button>
			</div>

			<ResetAppearanceDialog
				open={resetOpen}
				onConfirm={handleReset}
				onCancel={() => setResetOpen(false)}
			/>
		</section>
	);
}
