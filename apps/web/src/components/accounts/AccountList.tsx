import { CoreIcon } from "@app/lib/core/icons";
import type { Doc } from "@convex/_generated/dataModel";
import { useRef, useState } from "react";
import { AccountCard } from "./AccountCard";

type AccountListProps = {
	accounts: Doc<"accounts">[];
	onCreate?: () => void;
	onEdit?: (account: Doc<"accounts">) => void;
	onArchive?: (account: Doc<"accounts">) => void;
	onReorder?: (draggedId: string, targetId: string) => void;
};

export function AccountList({
	accounts,
	onCreate,
	onEdit,
	onArchive,
	onReorder,
}: AccountListProps) {
	const [draggingId, setDraggingId] = useState<string | null>(null);
	const [dropTargetId, setDropTargetId] = useState<string | null>(null);
	const suppressClickRef = useRef(false);

	const canReorder = Boolean(onReorder) && accounts.length > 1;

	const handleDragStart = (
		event: React.DragEvent<HTMLElement>,
		account: Doc<"accounts">,
	) => {
		if (!canReorder) {
			event.preventDefault();
			return;
		}
		setDraggingId(account._id);
		event.dataTransfer.effectAllowed = "move";
		event.dataTransfer.setData("text/plain", account._id);
	};

	const startDrag = (
		event: React.DragEvent<HTMLElement>,
		account: Doc<"accounts">,
	) => {
		if ((event.target as HTMLElement).closest(".account-card__actions")) {
			event.preventDefault();
			return;
		}
		handleDragStart(event, account);
	};

	const handleDragOver = (
		event: React.DragEvent<HTMLElement>,
		account: Doc<"accounts">,
	) => {
		if (!draggingId || draggingId === account._id || !canReorder) return;

		event.preventDefault();
		event.dataTransfer.dropEffect = "move";
		setDropTargetId(account._id);
	};

	const handleDrop = (
		event: React.DragEvent<HTMLElement>,
		account: Doc<"accounts">,
	) => {
		event.preventDefault();
		if (!draggingId || draggingId === account._id) return;

		onReorder?.(draggingId, account._id);
		setDraggingId(null);
		setDropTargetId(null);
	};

	const handleDragEnd = () => {
		suppressClickRef.current = true;
		requestAnimationFrame(() => {
			suppressClickRef.current = false;
		});
		setDraggingId(null);
		setDropTargetId(null);
	};

	const handleOpen = (account: Doc<"accounts">) => {
		if (suppressClickRef.current) return;
		onEdit?.(account);
	};

	return (
		<div className="account-grid card-stagger">
			{accounts.map((account) => (
				<AccountCard
					key={account._id}
					account={account}
					draggable={canReorder}
					isDragging={draggingId === account._id}
					isDropTarget={dropTargetId === account._id}
					onDragStart={(event) => startDrag(event, account)}
					onDragOver={(event) => handleDragOver(event, account)}
					onDrop={(event) => handleDrop(event, account)}
					onDragEnd={handleDragEnd}
					onSelect={onEdit ? () => handleOpen(account) : undefined}
					onArchive={onArchive ? () => onArchive(account) : undefined}
				/>
			))}
			{onCreate ? (
				<button type="button" className="account-add" onClick={onCreate}>
					<CoreIcon name="plus" size={20} />
					Nueva cuenta
				</button>
			) : null}
		</div>
	);
}
