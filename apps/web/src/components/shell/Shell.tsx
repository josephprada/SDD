import { Outlet, useLocation } from "react-router";
import { TransactionFab } from "@app/components/transactions/TransactionFab";
import { TransactionModalHost } from "@app/components/transactions/TransactionModalHost";
import { NavDesktop } from "./NavDesktop";
import { NavMobile } from "./NavMobile";
import { SkipToContent } from "./SkipToContent";

const TRANSACTION_FAB_ROUTES = new Set([
	"/",
	"/transactions",
	"/accounts",
	"/categories",
	"/settings",
]);

export function Shell() {
	const location = useLocation();
	const showTransactionFab = TRANSACTION_FAB_ROUTES.has(location.pathname);

	return (
		<div
			className={`shell shell-bg${showTransactionFab ? " shell--with-fab" : ""}`}
		>
			<SkipToContent />
			<NavDesktop />
			<div className="shell-content">
				<main id="main-content" className="shell__main">
					<div
						key={location.pathname}
						className="page-content animate-page-enter"
					>
						<Outlet />
					</div>
				</main>
			</div>
			{showTransactionFab ? <TransactionFab /> : null}
			<TransactionModalHost />
			<NavMobile showFab={showTransactionFab} />
		</div>
	);
}
