import { ConfirmDialog } from "@app/components/ui/ConfirmDialog";

type ArchiveCategoryDialogProps = {
	open: boolean;
	categoryName: string;
	onConfirm: () => void;
	onCancel: () => void;
};

export function ArchiveCategoryDialog({
	open,
	categoryName,
	onConfirm,
	onCancel,
}: ArchiveCategoryDialogProps) {
	return (
		<ConfirmDialog
			open={open}
			title="Archivar categoría"
			description={`¿Archivar "${categoryName}"? Los movimientos históricos conservarán esta categoría, pero no aparecerá en nuevos registros.`}
			confirmLabel="Archivar"
			variant="danger"
			onConfirm={onConfirm}
			onCancel={onCancel}
		/>
	);
}
