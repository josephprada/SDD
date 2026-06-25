import { useState } from "react";
import { Button, Spinner } from "@jp-ds/index";
import { useAuth } from "@app/lib/auth/useAuth";
import { AuroraOrbs } from "@app/components/shell/AuroraOrbs";

export function LoginScreen() {
  const { signInWithGoogle, isLoading } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setPending(true);
      setError(null);
      await signInWithGoogle();
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo completar el inicio de sesión.";
      if (!message.includes("cancelado")) {
        setError(message);
      }
      setPending(false);
    }
  };

  return (
    <div className="login-screen aurora-bg aurora-bg--galaxy">
      <AuroraOrbs />

      <div className="login-screen__body">
        <div className="login-card glass glass--glow animate-stagger">
          <div className="logo-glow animate-stagger-item">
            <img
              src="/icon.svg"
              alt="JP-WALLET"
              className="animate-logo-float animate-glow-pulse"
            />
          </div>
          <h1 className="wordmark animate-stagger-item">JP-WALLET</h1>
          <p
            className="animate-stagger-item"
            style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}
          >
            Tus finanzas, bajo control
          </p>

          <div className="animate-stagger-item" style={{ width: "100%" }}>
            <Button variant="google" fullWidth onClick={handleSignIn} disabled={pending || isLoading}>
              Continuar con Google
            </Button>
          </div>

          {(isLoading || pending) && (
            <div className="animate-stagger-item">
              <Spinner label="Iniciando sesión" />
            </div>
          )}
          {error ? (
            <p className="legal animate-stagger-item" style={{ color: "var(--color-danger)" }}>
              {error}
            </p>
          ) : null}
          <p className="legal animate-stagger-item">Al continuar aceptas nuestros términos de servicio</p>
        </div>
      </div>
    </div>
  );
}
