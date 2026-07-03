import { ConvexHttpClient } from "convex/browser";

const VERIFIER_STORAGE_SUFFIX = "__convexAuthOAuthVerifier";

function verifierStorageKey(convexUrl: string) {
	const namespace = convexUrl.replace(/[^a-zA-Z0-9]/g, "");
	return `${VERIFIER_STORAGE_SUFFIX}_${namespace}`;
}

export async function fetchGoogleOAuthRedirect(
	convexUrl: string,
): Promise<string> {
	const client = new ConvexHttpClient(convexUrl);
	const storageKey = verifierStorageKey(convexUrl);
	const existingVerifier = localStorage.getItem(storageKey) ?? undefined;

	if (existingVerifier) {
		localStorage.removeItem(storageKey);
	}

	type AuthSignInResult = { redirect?: string; verifier?: string };

	const result = await (
		client as ConvexHttpClient & {
			action: (
				name: string,
				args: Record<string, unknown>,
			) => Promise<AuthSignInResult>;
		}
	).action("auth:signIn", {
		provider: "google",
		params: { redirectTo: "/oauth-callback" },
		verifier: existingVerifier,
	});

	if (!result.redirect || !result.verifier) {
		throw new Error("No se pudo iniciar el flujo de Google.");
	}

	localStorage.setItem(storageKey, result.verifier);
	return result.redirect;
}

/** Popups OAuth no son fiables en móvil / touch. */
export function shouldUseOAuthRedirect(): boolean {
	if (typeof window === "undefined") {
		return false;
	}
	const ua = navigator.userAgent;
	const isMobileUA =
		/Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
			ua,
		);
	if (isMobileUA) {
		return true;
	}
	return (
		window.matchMedia("(max-width: 768px)").matches ||
		window.matchMedia("(pointer: coarse)").matches
	);
}

export const OAUTH_NEXT_STORAGE_KEY = "jp-wallet-oauth-next";

const POPUP_WIDTH = 520;
const POPUP_HEIGHT = 660;
const OAUTH_CHANNEL = "jp-wallet-oauth";

function isPopupClosed(popup: Window): boolean | null {
	try {
		return popup.closed;
	} catch {
		// COOP puede bloquear popup.closed mientras el popup está en Google
		return null;
	}
}

function closePopup(popup: Window) {
	try {
		if (!popup.closed) {
			popup.close();
		}
	} catch {
		// COOP puede bloquear popup.close en algunos navegadores
	}
}

export function openGoogleOAuthPopup(redirectUrl: string): Promise<string> {
	const left = Math.max(
		0,
		window.screenX + (window.outerWidth - POPUP_WIDTH) / 2,
	);
	const top = Math.max(
		0,
		window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2,
	);

	const popup = window.open(
		redirectUrl,
		"google-oauth",
		`width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},popup=yes`,
	);

	if (!popup) {
		return Promise.reject(
			new Error(
				"El navegador bloqueó la ventana emergente. Permítela e inténtalo de nuevo.",
			),
		);
	}

	return new Promise((resolve, reject) => {
		const origin = window.location.origin;
		let settled = false;
		const channel = new BroadcastChannel(OAUTH_CHANNEL);

		const settle = (
			handler: "resolve" | "reject",
			value: string | Error,
		) => {
			if (settled) {
				return;
			}
			settled = true;
			cleanup();
			if (handler === "resolve") {
				resolve(value as string);
			} else {
				reject(value);
			}
		};

		const cleanup = () => {
			window.clearInterval(pollTimer);
			window.clearTimeout(timeoutTimer);
			window.removeEventListener("message", onMessage);
			channel.removeEventListener("message", onChannelMessage);
			channel.close();
		};

		const handleOAuthResult = (code: string | null, error: string | null) => {
			closePopup(popup);

			if (error) {
				settle("reject", new Error("Google rechazó el inicio de sesión."));
				return;
			}

			if (code) {
				settle("resolve", code);
			} else {
				settle(
					"reject",
					new Error("No se recibió el código de autorización."),
				);
			}
		};

		const onMessage = (event: MessageEvent) => {
			if (
				event.origin !== origin ||
				event.data?.type !== "jp-wallet-oauth-code"
			) {
				return;
			}

			handleOAuthResult(
				(event.data.code as string | null) ?? null,
				(event.data.error as string | null) ?? null,
			);
		};

		const onChannelMessage = (event: MessageEvent) => {
			if (event.data?.type !== "jp-wallet-oauth-code") {
				return;
			}

			handleOAuthResult(
				(event.data.code as string | null) ?? null,
				(event.data.error as string | null) ?? null,
			);
		};

		window.addEventListener("message", onMessage);
		channel.addEventListener("message", onChannelMessage);

		const pollTimer = window.setInterval(() => {
			const closed = isPopupClosed(popup);
			if (closed === true) {
				settle("reject", new Error("Inicio de sesión cancelado."));
				return;
			}

			if (closed === null) {
				return;
			}

			try {
				const popupUrl = popup.location.href;
				if (!popupUrl.startsWith(origin)) {
					return;
				}

				const url = new URL(popupUrl);
				handleOAuthResult(
					url.searchParams.get("code"),
					url.searchParams.get("error"),
				);
			} catch {
				// Cross-origin mientras está en accounts.google.com
			}
		}, 250);

		const timeoutTimer = window.setTimeout(() => {
			closePopup(popup);
			settle(
				"reject",
				new Error("Tiempo de espera agotado al iniciar sesión."),
			);
		}, 120_000);
	});
}
