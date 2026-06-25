import { useEffect } from "react";
import { Spinner } from "@jp-ds/index";

export function OAuthCallbackRoute() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const error = url.searchParams.get("error");

    if (window.opener) {
      window.opener.postMessage(
        {
          type: "jp-wallet-oauth-code",
          code: error ? null : code,
          error,
        },
        window.location.origin,
      );
      window.close();
      return;
    }

    if (code) {
      window.location.replace(`/?code=${encodeURIComponent(code)}`);
    } else {
      window.location.replace("/login");
    }
  }, []);

  return (
    <div className="loading-screen shell-bg" role="status" aria-live="polite">
      <Spinner label="Completando inicio de sesión" />
    </div>
  );
}
