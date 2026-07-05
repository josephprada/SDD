import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { useEffect, useRef } from "react";

export function useReconcileFixedExpensePayments() {
	const reconcile = useMutation(api.fixedExpenses.reconcilePayments);
	const ran = useRef(false);

	useEffect(() => {
		if (ran.current) return;
		ran.current = true;
		void reconcile({});
	}, [reconcile]);
}
