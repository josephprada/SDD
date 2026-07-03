import { CoreIcon } from "@app/lib/core/icons";
import { useOverlayAnimation } from "@app/lib/core/useOverlayAnimation";
import { IconButton } from "@jp-ds";
import { type ReactNode, useEffect } from "react";
import { OverlayPortal } from "./OverlayPortal";

type ModalProps = {
	open: boolean;
	title: string;
	onClose: () => void;
	children: ReactNode;
};

export function Modal({ open, title, onClose, children }: ModalProps) {
	const { mounted, closing, handleAnimationEnd } = useOverlayAnimation(open);

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
					role="dialog"
					aria-modal="true"
					aria-label={title}
					className={`modal glass${closing ? " modal--sheet-out" : " modal--sheet-in"}`}
					onAnimationEnd={(event) => {
						if (event.target !== event.currentTarget) return;
						handleAnimationEnd();
					}}
				>
					<header className="modal__header">
						<h2 className="modal__title">{title}</h2>
						<IconButton aria-label="Cerrar" onClick={onClose}>
							<CoreIcon name="plus" size={20} className="modal__close-icon" />
						</IconButton>
					</header>
					<div className="modal__body brand-scroll">{children}</div>
				</div>
			</div>
		</OverlayPortal>
	);
}
