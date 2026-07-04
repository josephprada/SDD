import { Modal } from "@app/components/ui/Modal";

type LanguagePickerProps = {
	open: boolean;
	onClose: () => void;
};

export function LanguagePicker({ open, onClose }: LanguagePickerProps) {
	return (
		<Modal open={open} title="Idioma" onClose={onClose}>
			<div className="grouping-options" role="radiogroup" aria-label="Idioma">
				<button
					type="button"
					role="radio"
					aria-checked
					className="language-option language-option--active"
					onClick={onClose}
				>
					<span>Español</span>
					<span className="preference-row__value" aria-hidden>
						✓
					</span>
				</button>
				<div
					className="language-option language-option--disabled"
					role="radio"
					aria-checked={false}
					aria-disabled
				>
					<span>English</span>
					<span className="language-option__badge">Próximamente</span>
				</div>
			</div>
		</Modal>
	);
}
