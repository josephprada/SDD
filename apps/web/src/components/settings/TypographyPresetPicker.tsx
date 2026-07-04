import { usePreferencesStore } from "@app/stores/preferences";
import {
	TYPOGRAPHY_PRESET_IDS,
	TYPOGRAPHY_PRESET_LABELS,
	type TypographyPresetId,
} from "@jp-ds/index";
import type { CSSProperties } from "react";

const PREVIEW_STYLES: Record<TypographyPresetId, CSSProperties> = {
	"inter-default": {
		fontFamily: '"Inter", system-ui, sans-serif',
		fontStyle: "normal",
		fontWeight: 400,
	},
	"formal-serif": {
		fontFamily: '"Playfair Display", Georgia, serif',
		fontStyle: "normal",
		fontWeight: 500,
		letterSpacing: "0.015em",
	},
	"elegant-italic": {
		fontFamily: '"Cormorant Garamond", Georgia, serif',
		fontStyle: "italic",
		fontWeight: 500,
		letterSpacing: "0.025em",
	},
	handwriting: {
		fontFamily: '"Caveat", cursive',
		fontStyle: "normal",
		fontWeight: 500,
		fontSize: "1.25rem",
		letterSpacing: "0.04em",
	},
};

const AMOUNT_PREVIEW_STYLES: Record<TypographyPresetId, CSSProperties> = {
	"inter-default": {
		fontFamily: '"JetBrains Mono", ui-monospace, monospace',
		fontWeight: 600,
		letterSpacing: "-0.01em",
	},
	"formal-serif": {
		fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
		fontWeight: 500,
	},
	"elegant-italic": {
		fontFamily: '"Cormorant Garamond", Georgia, serif',
		fontStyle: "italic",
		fontWeight: 600,
		fontSize: "1.125rem",
		letterSpacing: "0.02em",
	},
	handwriting: {
		fontFamily: '"Caveat", cursive',
		fontWeight: 600,
		fontSize: "1.35rem",
		letterSpacing: "0.03em",
	},
};

export function TypographyPresetPicker() {
	const value = usePreferencesStore((s) => s.typographyPreset);
	const setTypographyPreset = usePreferencesStore((s) => s.setTypographyPreset);

	return (
		<div className="typography-preset-list" role="radiogroup" aria-label="Tipografía">
			{TYPOGRAPHY_PRESET_IDS.map((preset) => {
				const active = preset === value;
				const previewStyle = PREVIEW_STYLES[preset];
				const amountStyle = AMOUNT_PREVIEW_STYLES[preset];
				return (
					<button
						key={preset}
						type="button"
						role="radio"
						aria-checked={active}
						className={`typography-preset${active ? " typography-preset--active" : ""}`}
						onClick={() => setTypographyPreset(preset)}
					>
						<span
							className="typography-preset__sample-title"
							style={previewStyle}
						>
							Aa
						</span>
						<span
							className="typography-preset__sample-body"
							style={previewStyle}
						>
							{TYPOGRAPHY_PRESET_LABELS[preset]} — texto de ejemplo
						</span>
						<span
							className="typography-preset__sample-amount"
							style={amountStyle}
						>
							$ 1.250.000
						</span>
					</button>
				);
			})}
		</div>
	);
}
