import { Button } from "@jp-ds";
import { useEffect, useId } from "react";

type ConfirmDialogProps = {
	open: boolean;
	title: string;
	description: string;
	confirmLabel?: string;
	cancelLabel?: string;
	variant?: "danger" | "primary";
	onConfirm: () => void;
	onCancel: () => void;
};

export function ConfirmDialog({
	open,
	title,
	description,
	confirmLabel = "Confirmar",
	cancelLabel = "Cancelar",
	variant = "primary",
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	const titleId = useId();
	const descId = useId();

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onCancel();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [open, onCancel]);

	if (!open) return null;

	return (
		<div className="dialog-backdrop">
			<button
				type="button"
				className="backdrop-close"
				aria-label={cancelLabel}
				onClick={onCancel}
			/>
			<div
				role="alertdialog"
				aria-modal="true"
				className="dialog glass animate-modal-in"
				aria-labelledby={titleId}
				aria-describedby={descId}
			>
				<h2 id={titleId} className="dialog__title">
					{title}
				</h2>
				<p id={descId} className="dialog__desc">
					{description}
				</p>
				<div className="dialog__actions">
					<Button variant="secondary" onClick={onCancel}>
						{cancelLabel}
					</Button>
					<Button
						variant={variant === "danger" ? "danger" : "primary"}
						onClick={onConfirm}
					>
						{confirmLabel}
					</Button>
				</div>
			</div>
		</div>
	);
}
