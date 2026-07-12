import { Button } from "@jp-ds";
import { captureGenieOrigin } from "@app/lib/core/genieOrigin";

type FormModalFooterProps = {
	onCancel: () => void;
	onDelete?: () => void;
	deleteLabel?: string;
	loading?: boolean;
	submitDisabled?: boolean;
	submitLabel?: string;
	savingLabel?: string;
};

export function FormModalFooter({
	onCancel,
	onDelete,
	deleteLabel = "Eliminar",
	loading = false,
	submitDisabled = false,
	submitLabel = "Guardar",
	savingLabel = "Guardando…",
}: FormModalFooterProps) {
	return (
		<div className="form-panel__actions modal__footer">
			<Button type="button" variant="secondary" onClick={onCancel}>
				Cancelar
			</Button>
			{onDelete ? (
				<Button
					type="button"
					variant="danger"
					onClick={(event) => {
						captureGenieOrigin(event.currentTarget);
						onDelete();
					}}
					disabled={loading}
				>
					{deleteLabel}
				</Button>
			) : null}
			<Button type="submit" disabled={loading || submitDisabled}>
				{loading ? savingLabel : submitLabel}
			</Button>
		</div>
	);
}
