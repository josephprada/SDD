import { NotificationListener } from "@app/components/notifications/NotificationListener";
import { PreferencesSyncBridge } from "@app/components/PreferencesSyncBridge";
import { convex } from "@app/lib/convex/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { Outlet, useNavigate } from "react-router";

/**
 * Convex Auth debe vivir dentro del Router para que `replaceURL` limpie
 * `?code=` vía navigate — evita spinner infinito tras OAuth y doble verify en StrictMode.
 */
export function ConvexAuthShell() {
	const navigate = useNavigate();

	return (
		<ConvexAuthProvider
			client={convex}
			replaceURL={(relativeUrl) => {
				navigate(relativeUrl, { replace: true });
			}}
		>
			<PreferencesSyncBridge />
			<NotificationListener />
			<Outlet />
		</ConvexAuthProvider>
	);
}
