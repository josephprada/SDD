import type { GenieOriginRect } from "@app/lib/motion/genieModal";
import { useGenieOverlay } from "@app/lib/motion/useGenieOverlay";
import { Button } from "@jp-ds";
import { useEffect, useId, useRef } from "react";
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
	genieOrigin?: GenieOriginRect | null;
	genieIntensity?: number;
	genieDuration?: number;
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
	genieOrigin = null,
	genieIntensity = 1,
	genieDuration,
}: ConfirmDialogProps) {
	const titleId = useId();
	const descId = useId();
	const dialogRef = useRef<HTMLDivElement>(null);
	const {
		mounted,
		closing,
		handleAnimationEnd,
		surfaceAnimClass,
		surfaceExtraClass,
	} = useGenieOverlay({
		open,
		surfaceRef: dialogRef,
		genieOrigin,
		genieIntensity,
		genieDuration,
		autoCaptureActiveElement: false,
	});

	const frozenContentRef = useRef({ title, description });
	if (open) {
		frozenContentRef.current = { title, description };
	}
	const displayTitle = open ? title : frozenContentRef.current.title;
	const displayDescription = open
		? description
		: frozenContentRef.current.description;

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
					ref={dialogRef}
					role="alertdialog"
					aria-modal="true"
					className={`dialog glass ${surfaceAnimClass} ${surfaceExtraClass}`.trim()}
					aria-labelledby={titleId}
					aria-describedby={descId}
					onAnimationEnd={(event) => {
						if (event.target !== event.currentTarget) return;
						handleAnimationEnd();
					}}
				>
					<h2 id={titleId} className="dialog__title">
						{displayTitle}
					</h2>
					<p id={descId} className="dialog__desc">
						{displayDescription}
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
