import { ConfirmDialog } from "@app/components/ui/ConfirmDialog";
import type { TaxStatus } from "@app/lib/tax/types";
import { Button } from "@jp-ds";
import { useState } from "react";

type TaxStatusActionsProps = {
	status: TaxStatus;
	busy?: boolean;
	onSetStatus: (status: "draft" | "review" | "filed") => Promise<void>;
	onReopen: () => Promise<void>;
};

export function TaxStatusActions({
	status,
	busy,
	onSetStatus,
	onReopen,
}: TaxStatusActionsProps) {
	const [confirmFiled, setConfirmFiled] = useState(false);
	const [confirmReopen, setConfirmReopen] = useState(false);

	return (
		<>
			{status === "draft" ? (
				<>
					<Button
						type="button"
						variant="secondary"
						disabled={busy}
						onClick={() => onSetStatus("review")}
					>
						Marcar en revisión
					</Button>
					<Button
						type="button"
						disabled={busy}
						onClick={() => setConfirmFiled(true)}
					>
						Marcar presentada
					</Button>
				</>
			) : null}
			{status === "review" ? (
				<>
					<Button
						type="button"
						variant="secondary"
						disabled={busy}
						onClick={() => onSetStatus("draft")}
					>
						Volver a borrador
					</Button>
					<Button
						type="button"
						disabled={busy}
						onClick={() => setConfirmFiled(true)}
					>
						Marcar presentada
					</Button>
				</>
			) : null}
			{status === "filed" ? (
				<Button
					type="button"
					variant="secondary"
					disabled={busy}
					onClick={() => setConfirmReopen(true)}
				>
					Reabrir
				</Button>
			) : null}

			<ConfirmDialog
				open={confirmFiled}
				title="Marcar como presentada"
				description="La declaración quedará en solo lectura hasta que la reabras. ¿Continuar?"
				confirmLabel="Presentada"
				onConfirm={async () => {
					setConfirmFiled(false);
					await onSetStatus("filed");
				}}
				onCancel={() => setConfirmFiled(false)}
			/>
			<ConfirmDialog
				open={confirmReopen}
				title="Reabrir declaración"
				description="Volverá a estado «En revisión» y podrás editar rubros. ¿Continuar?"
				confirmLabel="Reabrir"
				onConfirm={async () => {
					setConfirmReopen(false);
					await onReopen();
				}}
				onCancel={() => setConfirmReopen(false)}
			/>
		</>
	);
}
