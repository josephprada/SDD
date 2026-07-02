import { Button } from "@jp-ds";
import type { ReactNode } from "react";

type EmptyStateProps = {
	title: string;
	description?: string;
	actionLabel?: string;
	onAction?: () => void;
	icon?: ReactNode;
};

export function EmptyState({
	title,
	description,
	actionLabel,
	onAction,
	icon,
}: EmptyStateProps) {
	return (
		<div className="empty-state glass animate-stagger-item">
			{icon ? <div className="empty-state__icon">{icon}</div> : null}
			<h2 className="empty-state__title">{title}</h2>
			{description ? <p className="empty-state__desc">{description}</p> : null}
			{actionLabel && onAction ? (
				<Button onClick={onAction}>{actionLabel}</Button>
			) : null}
		</div>
	);
}
