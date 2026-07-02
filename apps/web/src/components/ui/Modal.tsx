import { CoreIcon } from "@app/lib/core/icons";
import { IconButton } from "@jp-ds";
import { type ReactNode, useEffect } from "react";

type ModalProps = {
	open: boolean;
	title: string;
	onClose: () => void;
	children: ReactNode;
};

export function Modal({ open, title, onClose, children }: ModalProps) {
	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div className="modal-backdrop">
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
				className="modal glass animate-modal-in"
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
	);
}
