import { CoreIcon } from "@app/lib/core/icons";
import type { GenieOriginRect } from "@app/lib/motion/genieModal";
import { useGenieOverlay } from "@app/lib/motion/useGenieOverlay";
import { IconButton } from "@jp-ds";
import { type ReactNode, useEffect, useRef } from "react";
import { OverlayPortal } from "./OverlayPortal";

type ModalProps = {
	open: boolean;
	title: string;
	onClose: () => void;
	children: ReactNode;
	/** Rect del botón/trigger. Si se omite, se usa el activeElement al abrir. */
	genieOrigin?: GenieOriginRect | null;
	/** 0–1. Intensidad de la deformación genie. Default: 1 */
	genieIntensity?: number;
	/** ms. Default: 420 */
	genieDuration?: number;
};

export function Modal({
	open,
	title,
	onClose,
	children,
	genieOrigin = null,
	genieIntensity = 1,
	genieDuration,
}: ModalProps) {
	const modalRef = useRef<HTMLDivElement>(null);
	const frozenContentRef = useRef({ title, children });

	if (open) {
		frozenContentRef.current = { title, children };
	}

	const displayTitle = open ? title : frozenContentRef.current.title;
	const displayChildren = open ? children : frozenContentRef.current.children;
	const {
		mounted,
		closing,
		handleAnimationEnd,
		surfaceAnimClass,
		surfaceExtraClass,
	} = useGenieOverlay({
		open,
		surfaceRef: modalRef,
		genieOrigin,
		genieIntensity,
		genieDuration,
		autoCaptureActiveElement: false,
	});

	useEffect(() => {
		if (!mounted) return;

		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};

		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		document.addEventListener("keydown", onKey);

		return () => {
			document.body.style.overflow = previousOverflow;
			document.removeEventListener("keydown", onKey);
		};
	}, [mounted, onClose]);

	useEffect(() => {
		if (!mounted) return;

		const modal = modalRef.current;
		if (!modal) return;

		const mobileMq = window.matchMedia("(max-width: 1023px)");
		const vv = window.visualViewport;

		const clearViewportVars = () => {
			modal.style.removeProperty("--modal-vv-height");
			modal.style.removeProperty("--modal-vv-offset");
		};

		const syncViewport = () => {
			if (!mobileMq.matches || !vv) {
				clearViewportVars();
				return;
			}
			modal.style.setProperty("--modal-vv-height", `${vv.height}px`);
			modal.style.setProperty("--modal-vv-offset", `${vv.offsetTop}px`);
		};

		const scheduleViewportSync = () => {
			syncViewport();
			requestAnimationFrame(syncViewport);
		};

		syncViewport();
		vv?.addEventListener("resize", scheduleViewportSync);
		vv?.addEventListener("scroll", scheduleViewportSync);
		mobileMq.addEventListener("change", scheduleViewportSync);
		modal.addEventListener("focusout", scheduleViewportSync);

		return () => {
			vv?.removeEventListener("resize", scheduleViewportSync);
			vv?.removeEventListener("scroll", scheduleViewportSync);
			mobileMq.removeEventListener("change", scheduleViewportSync);
			modal.removeEventListener("focusout", scheduleViewportSync);
			clearViewportVars();
		};
	}, [mounted]);

	if (!mounted) return null;

	return (
		<OverlayPortal>
			<div
				className={`modal-backdrop${closing ? " modal-backdrop--out" : " modal-backdrop--in"}`}
			>
				<button
					type="button"
					className="backdrop-close"
					aria-label="Cerrar"
					onClick={onClose}
				/>
				<div
					ref={modalRef}
					role="dialog"
					aria-modal="true"
					aria-label={displayTitle}
					className={`modal glass ${surfaceAnimClass} ${surfaceExtraClass}`.trim()}
					onAnimationEnd={(event) => {
						if (event.target !== event.currentTarget) return;
						handleAnimationEnd();
					}}
				>
					<header className="modal__header">
						<h2 className="modal__title">{displayTitle}</h2>
						<IconButton aria-label="Cerrar" onClick={onClose}>
							<CoreIcon name="plus" size={20} className="modal__close-icon" />
						</IconButton>
					</header>
					<div className="modal__body">{displayChildren}</div>
				</div>
			</div>
		</OverlayPortal>
	);
}
