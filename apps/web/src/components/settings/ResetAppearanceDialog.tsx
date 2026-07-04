import { ConfirmDialog } from "@app/components/ui/ConfirmDialog";

type ResetAppearanceDialogProps = {
	open: boolean;
	onConfirm: () => void;
	onCancel: () => void;
};

export function ResetAppearanceDialog({
	open,
	onConfirm,
	onCancel,
}: ResetAppearanceDialogProps) {
	return (
		<ConfirmDialog
			open={open}
			title="Restaurar apariencia"
			description="Se revertirán el modo, acento, colores de error y tipografía a los valores por defecto. Tu perfil y otras preferencias no se modificarán."
			confirmLabel="Restaurar"
			cancelLabel="Cancelar"
			onConfirm={onConfirm}
			onCancel={onCancel}
		/>
	);
}
