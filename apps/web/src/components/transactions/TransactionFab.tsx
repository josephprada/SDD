import { CoreIcon } from "@app/lib/core/icons";
import { useTransactionModalStore } from "@app/stores/transactionModal";

type TransactionFabProps = {
	className?: string;
};

export function TransactionFab({ className }: TransactionFabProps) {
	const openCreate = useTransactionModalStore((state) => state.openCreate);

	return (
		<button
			type="button"
			className={["tx-fab", "tx-fab--floating", className].filter(Boolean).join(" ")}
			aria-label="Registrar gasto"
			onClick={() => openCreate("expense")}
		>
			<CoreIcon name="plus" size={22} />
		</button>
	);
}
