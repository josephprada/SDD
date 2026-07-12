import { Outlet, useLocation } from "react-router";
import { InAppToastHost } from "@app/components/notifications/InAppToastHost";
import { TransactionFab } from "@app/components/transactions/TransactionFab";
import { TransactionModalHost } from "@app/components/transactions/TransactionModalHost";
import { NavDesktop } from "./NavDesktop";
import { NavMobile } from "./NavMobile";
import { SkipToContent } from "./SkipToContent";

export function Shell() {
	const location = useLocation();

	return (
		<div className="shell shell-bg shell--with-fab">
			<SkipToContent />
			<NavDesktop />
			<div className="shell-content">
				<main id="main-content" className="shell__main brand-scroll">
					<div
						key={location.pathname}
						className="page-content animate-page-enter"
					>
						<Outlet />
					</div>
				</main>
			</div>
			<TransactionFab />
			<TransactionModalHost />
			<InAppToastHost />
			<NavMobile />
		</div>
	);
}
