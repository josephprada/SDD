import type { QuickAction } from "@app/components/transactions/QuickActionSheet";
import { CoreIcon } from "@app/lib/core/icons";

type QuickActionsProps = {
	onAction?: (action: QuickAction) => void;
};

const actions: {
	id: QuickAction;
	label: string;
	icon: "minus" | "plus" | "arrow-right-left";
	variant: "primary" | "secondary";
}[] = [
	{ id: "expense", label: "Registrar gasto", icon: "minus", variant: "primary" },
	{ id: "income", label: "Registrar ingreso", icon: "plus", variant: "secondary" },
	{
		id: "transfer",
		label: "Transferir",
		icon: "arrow-right-left",
		variant: "secondary",
	},
];

export function QuickActions({ onAction }: QuickActionsProps) {
	return (
		<section className="quick-actions glass" aria-label="Acciones rápidas">
			<h2 className="quick-actions__title">Acciones rápidas</h2>
			<div className="quick-actions__stack">
				{actions.map((action) => (
					<button
						key={action.id}
						type="button"
						className={`quick-actions__btn quick-actions__btn--${action.variant}`}
						onClick={() => onAction?.(action.id)}
					>
						<CoreIcon name={action.icon} size={18} />
						<span>{action.label}</span>
					</button>
				))}
			</div>
		</section>
	);
}
