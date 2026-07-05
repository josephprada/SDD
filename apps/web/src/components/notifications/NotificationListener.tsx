import { useToastStore } from "@app/stores/toast";
import { api } from "@convex/_generated/api";
import { useConvexAuth, useQuery } from "convex/react";
import { useEffect, useRef } from "react";

const TYPE_LABELS: Record<string, string> = {
	budget_threshold: "Presupuesto",
	fixed_expense_reminder: "Gasto fijo",
	period_report: "Reporte",
};

export function NotificationListener() {
	const { isAuthenticated } = useConvexAuth();
	const recent = useQuery(
		api.notifications.listRecentInApp,
		isAuthenticated ? { limit: 5 } : "skip",
	);
	const show = useToastStore((s) => s.show);
	const seenRef = useRef<Set<string>>(new Set());

	useEffect(() => {
		if (!recent) return;
		for (const item of recent) {
			const key = `${item.type}:${item.referenceId}:${item.sentAt}`;
			if (seenRef.current.has(key)) continue;
			seenRef.current.add(key);
			show({
				title: TYPE_LABELS[item.type] ?? "JP-WALLET",
				body:
					item.type === "budget_threshold"
						? "Has cruzado un umbral de presupuesto"
						: item.type === "fixed_expense_reminder"
							? "Tienes un pago próximo"
							: "Nuevo reporte disponible",
				url: item.type === "period_report" ? "/reports" : "/budgets",
			});
		}
	}, [recent, show]);

	return null;
}
