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
	onSelect?: () => void;
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
	onSelect,
	onArchive,
}: AccountCardProps) {
	const isNegative = account.balance < 0;

	return (
		<article
			className={[
				"account-card glass interactive-lift",
				isNegative ? "account-card--negative" : "",
				draggable ? "account-card--draggable" : "",
				onSelect ? "account-card--selectable" : "",
				isDragging ? "account-card--dragging" : "",
				isDropTarget ? "account-card--drop-target" : "",
			]
				.filter(Boolean)
				.join(" ")}
			draggable={draggable}
			onClick={onSelect}
			onKeyDown={
				onSelect
					? (event) => {
							if (event.key === "Enter" || event.key === " ") {
								event.preventDefault();
								onSelect();
							}
						}
					: undefined
			}
			role={onSelect ? "button" : undefined}
			tabIndex={onSelect ? 0 : undefined}
			onDragStart={onDragStart}
			onDragOver={onDragOver}
			onDragLeave={() => undefined}
			onDrop={onDrop}
			onDragEnd={onDragEnd}
		>
			<div className="account-card__top">
				<span className="account-card__name">{account.name}</span>
				{onArchive && !account.archived ? (
					<div
						className="account-card__actions"
						onMouseDown={(event) => event.stopPropagation()}
						onClick={(event) => event.stopPropagation()}
					>
						<IconButton
							aria-label={`Archivar ${account.name}`}
							onClick={onArchive}
						>
							<CoreIcon name="trash" size={16} />
						</IconButton>
					</div>
				) : null}
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
