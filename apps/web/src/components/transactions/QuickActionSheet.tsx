import { CoreIcon } from "@app/lib/core/icons";
import { Button } from "@jp-ds";

type QuickAction = "expense" | "income" | "transfer";

type QuickActionSheetProps = {
	open: boolean;
	onSelect: (action: QuickAction) => void;
	onClose: () => void;
};

export function QuickActionSheet({
	open,
	onSelect,
	onClose,
}: QuickActionSheetProps) {
	if (!open) return null;

	return (
		<div className="action-sheet-backdrop">
			<button
				type="button"
				className="backdrop-close"
				aria-label="Cerrar"
				onClick={onClose}
			/>
			<dialog
				open
				className="action-sheet glass animate-slide-up"
				aria-label="Acciones rápidas"
			>
				<h2 className="action-sheet__title">Registrar</h2>
				<div className="action-sheet__grid">
					<Button variant="secondary" onClick={() => onSelect("expense")}>
						Gasto
					</Button>
					<Button variant="secondary" onClick={() => onSelect("income")}>
						Ingreso
					</Button>
					<Button variant="primary" onClick={() => onSelect("transfer")}>
						Transferir
					</Button>
				</div>
				<button type="button" className="action-sheet__close" onClick={onClose}>
					<CoreIcon name="ellipsis" />
					Cerrar
				</button>
			</dialog>
		</div>
	);
}

export type { QuickAction };
