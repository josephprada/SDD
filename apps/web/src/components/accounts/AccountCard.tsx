import { ACCOUNT_TYPE_LABELS, CoreIcon } from "@app/lib/core/icons";
import { formatCOP } from "@app/lib/format/currency";
import type { Doc } from "@convex/_generated/dataModel";
import { IconButton } from "@jp-ds";

type AccountCardProps = {
	account: Doc<"accounts">;
	draggable?: boolean;
	isDragging?: boolean;
	isDropTarget?: boolean;
	onDragStart?: (event: React.DragEvent<HTMLElement>) => void;
	onDragOver?: (event: React.DragEvent<HTMLElement>) => void;
	onDrop?: (event: React.DragEvent<HTMLElement>) => void;
	onDragEnd?: () => void;
	onEdit?: () => void;
	onArchive?: () => void;
};

export function AccountCard({
	account,
	draggable = false,
	isDragging = false,
	isDropTarget = false,
	onDragStart,
	onDragOver,
	onDrop,
	onDragEnd,
	onEdit,
	onArchive,
}: AccountCardProps) {
	const isNegative = account.balance < 0;

	return (
		<article
			className={[
				"account-card glass interactive-lift",
				isNegative ? "account-card--negative" : "",
				draggable ? "account-card--draggable" : "",
				isDragging ? "account-card--dragging" : "",
				isDropTarget ? "account-card--drop-target" : "",
			]
				.filter(Boolean)
				.join(" ")}
			draggable={draggable}
			onDragStart={onDragStart}
			onDragOver={onDragOver}
			onDragLeave={() => undefined}
			onDrop={onDrop}
			onDragEnd={onDragEnd}
		>
			<div className="account-card__top">
				<span className="account-card__name">{account.name}</span>
				<div
					className="account-card__actions"
					onMouseDown={(event) => event.stopPropagation()}
					onClick={(event) => event.stopPropagation()}
				>
					{onEdit ? (
						<IconButton aria-label={`Editar ${account.name}`} onClick={onEdit}>
							<CoreIcon name="edit" size={16} />
						</IconButton>
					) : null}
					{onArchive && !account.archived ? (
						<IconButton
							aria-label={`Archivar ${account.name}`}
							onClick={onArchive}
						>
							<CoreIcon name="trash" size={16} />
						</IconButton>
					) : null}
				</div>
			</div>
			<span className="account-card__type">
				{ACCOUNT_TYPE_LABELS[account.type]}
			</span>
			<span
				className={`amount account-card__balance${isNegative ? " amount--negative" : ""}`}
			>
				{formatCOP(account.balance)}
			</span>
		</article>
	);
}
