import { Spinner } from "@jp-ds/index";
import { useEffect, useRef } from "react";

function notifyPopupOpener(code: string | null, error: string | null) {
	window.opener?.postMessage(
		{
			type: "jp-wallet-oauth-code",
			code: error ? null : code,
			error,
		},
		window.location.origin,
	);
}

/**
 * Solo para OAuth en popup (desktop). En móvil el callback es `/login?code=…`
 * y `ConvexAuthProvider` completa el sign-in automáticamente.
 */
export function OAuthCallbackRoute() {
	const started = useRef(false);

	useEffect(() => {
		if (started.current) {
			return;
		}
		started.current = true;

		const search = window.location.search;
		const isPopupFlow =
			window.opener != null && window.opener !== window;

		if (!isPopupFlow) {
			window.location.replace(`/login${search}`);
			return;
		}

		const url = new URL(window.location.href);
		notifyPopupOpener(
			url.searchParams.get("code"),
			url.searchParams.get("error"),
		);
		window.close();
	}, []);

	return (
		<output className="loading-screen shell-bg" aria-live="polite">
			<Spinner label="Completando inicio de sesión" />
		</output>
	);
}
