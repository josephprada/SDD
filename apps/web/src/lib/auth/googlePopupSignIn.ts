import { ConvexHttpClient } from "convex/browser";

const VERIFIER_STORAGE_SUFFIX = "__convexAuthOAuthVerifier";

function verifierStorageKey(convexUrl: string) {
  const namespace = convexUrl.replace(/[^a-zA-Z0-9]/g, "");
  return `${VERIFIER_STORAGE_SUFFIX}_${namespace}`;
}

export async function fetchGoogleOAuthRedirect(convexUrl: string): Promise<string> {
  const client = new ConvexHttpClient(convexUrl);
  const storageKey = verifierStorageKey(convexUrl);
  const existingVerifier = localStorage.getItem(storageKey) ?? undefined;

  if (existingVerifier) {
    localStorage.removeItem(storageKey);
  }

  type AuthSignInResult = { redirect?: string; verifier?: string };

  const result = await (
    client as ConvexHttpClient & {
      action: (name: string, args: Record<string, unknown>) => Promise<AuthSignInResult>;
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

const POPUP_WIDTH = 520;
const POPUP_HEIGHT = 660;

export function openGoogleOAuthPopup(redirectUrl: string): Promise<string> {
  const left = Math.max(0, window.screenX + (window.outerWidth - POPUP_WIDTH) / 2);
  const top = Math.max(0, window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2);

  const popup = window.open(
    redirectUrl,
    "google-oauth",
    `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},left=${left},top=${top},popup=yes`,
  );

  if (!popup) {
    return Promise.reject(new Error("El navegador bloqueó la ventana emergente. Permítela e inténtalo de nuevo."));
  }

  return new Promise((resolve, reject) => {
    const origin = window.location.origin;

    const cleanup = () => {
      window.clearInterval(pollTimer);
      window.clearTimeout(timeoutTimer);
      window.removeEventListener("message", onMessage);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== origin || event.data?.type !== "jp-wallet-oauth-code") {
        return;
      }

      cleanup();

      if (!popup.closed) {
        popup.close();
      }

      if (event.data.error) {
        reject(new Error("Google rechazó el inicio de sesión."));
        return;
      }

      const code = event.data.code as string | undefined;
      if (code) {
        resolve(code);
      } else {
        reject(new Error("No se recibió el código de autorización."));
      }
    };

    window.addEventListener("message", onMessage);

    const pollTimer = window.setInterval(() => {
      if (popup.closed) {
        cleanup();
        reject(new Error("Inicio de sesión cancelado."));
        return;
      }

      try {
        const popupUrl = popup.location.href;
        if (!popupUrl.startsWith(origin)) {
          return;
        }

        const url = new URL(popupUrl);
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");

        if (error) {
          cleanup();
          popup.close();
          reject(new Error("Google rechazó el inicio de sesión."));
          return;
        }

        if (code) {
          cleanup();
          popup.close();
          resolve(code);
        }
      } catch {
        // Cross-origin mientras está en accounts.google.com
      }
    }, 250);

    const timeoutTimer = window.setTimeout(() => {
      cleanup();
      if (!popup.closed) {
        popup.close();
      }
      reject(new Error("Tiempo de espera agotado al iniciar sesión."));
    }, 120_000);
  });
}
