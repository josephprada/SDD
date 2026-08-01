import { useToastStore } from "@app/stores/toast";
import { api } from "@convex/_generated/api";
import { useConvexAuth, useQuery } from "convex/react";
import { useEffect, useRef } from "react";

const TYPE_LABELS: Record<string, string> = {
	budget_threshold: "Presupuesto",
	fixed_expense_reminder: "Gasto fijo",
	period_report: "Reporte",
};

const CURSOR_KEY = "jpw:notif-toast-cursor";

function notificationKey(item: {
	type: string;
	referenceId: string;
	sentAt: number;
}): string {
	return `${item.type}:${item.referenceId}:${item.sentAt}`;
}

function loadPersistedKeys(): Set<string> {
	try {
		const raw = sessionStorage.getItem(CURSOR_KEY);
		if (!raw) return new Set();
		const parsed = JSON.parse(raw) as string[];
		return new Set(Array.isArray(parsed) ? parsed : []);
	} catch {
		return new Set();
	}
}

function persistKeys(keys: Set<string>): void {
	try {
		sessionStorage.setItem(CURSOR_KEY, JSON.stringify([...keys].slice(-50)));
	} catch {
		// ignore quota / private mode
	}
}

export function NotificationListener() {
	const { isAuthenticated } = useConvexAuth();
	const recent = useQuery(
		api.notifications.listRecentInApp,
		isAuthenticated ? { limit: 5 } : "skip",
	);
	const show = useToastStore((s) => s.show);
	const seenRef = useRef<Set<string>>(loadPersistedKeys());
	const seededRef = useRef(false);

	useEffect(() => {
		if (!recent) return;

		if (!seededRef.current) {
			for (const item of recent) {
				seenRef.current.add(notificationKey(item));
			}
			persistKeys(seenRef.current);
			seededRef.current = true;
			return;
		}

		for (const item of recent) {
			const key = notificationKey(item);
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
		persistKeys(seenRef.current);
	}, [recent, show]);

	return null;
}
