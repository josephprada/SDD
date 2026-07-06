import type { FixedExpensePaymentTarget } from "@app/lib/budgets/fixedExpensePayment";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useCallback, useState } from "react";

export function useFixedExpensePayment() {
	const accounts = useQuery(api.accounts.list, { includeArchived: false }) ?? [];
	const markPaid = useMutation(api.fixedExpenses.markPaid);
	const [target, setTarget] = useState<FixedExpensePaymentTarget | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const openPayment = useCallback((item: FixedExpensePaymentTarget) => {
		setError("");
		setTarget(item);
	}, []);

	const closePayment = useCallback(() => {
		setTarget(null);
		setError("");
	}, []);

	const confirmPayment = useCallback(
		async (accountId: Id<"accounts">) => {
			if (!target) return;
			setLoading(true);
			setError("");
			try {
				await markPaid({
					id: target.id as Id<"fixedExpenses">,
					accountId,
					dueDate: target.dueDate,
					periodKey: target.periodKey,
				});
				closePayment();
			} catch (e) {
				setError(
					e instanceof Error ? e.message : "Error al registrar el pago",
				);
			} finally {
				setLoading(false);
			}
		},
		[target, markPaid, closePayment],
	);

	return {
		accounts,
		target,
		paymentOpen: target !== null,
		openPayment,
		closePayment,
		confirmPayment,
		loading,
		error,
	};
}
