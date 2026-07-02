import { CoreIcon } from "@app/lib/core/icons";
import { useTransactionModalStore } from "@app/stores/transactionModal";

export function TransactionFab() {
	const openCreate = useTransactionModalStore((state) => state.openCreate);

	return (
		<button
			type="button"
			className="tx-fab"
			aria-label="Registrar gasto"
			onClick={() => openCreate("expense")}
		>
			<CoreIcon name="plus" size={22} />
		</button>
	);
}
