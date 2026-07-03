import { useOverlayAnimation } from "@app/lib/core/useOverlayAnimation";
import { Button } from "@jp-ds";
import { useEffect, useId } from "react";
import { OverlayPortal } from "./OverlayPortal";

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
	const { mounted, closing, handleAnimationEnd } = useOverlayAnimation(open);

	useEffect(() => {
		if (!mounted) return;

		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onCancel();
		};

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		document.addEventListener("keydown", onKey);

		return () => {
			document.body.style.overflow = previousOverflow;
			document.removeEventListener("keydown", onKey);
		};
	}, [mounted, onCancel]);

	if (!mounted) return null;

	return (
		<OverlayPortal>
			<div
				className={`dialog-backdrop${closing ? " modal-backdrop--out" : " modal-backdrop--in"}`}
			>
				<button
					type="button"
					className="backdrop-close"
					aria-label={cancelLabel}
					onClick={onCancel}
				/>
				<div
					role="alertdialog"
					aria-modal="true"
					className={`dialog glass${closing ? " modal--sheet-out" : " modal--sheet-in"}`}
					aria-labelledby={titleId}
					aria-describedby={descId}
					onAnimationEnd={(event) => {
						if (event.target !== event.currentTarget) return;
						handleAnimationEnd();
					}}
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
		</OverlayPortal>
	);
}
