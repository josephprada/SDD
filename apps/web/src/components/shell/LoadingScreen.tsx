import { Spinner } from "@jp-ds/index";

export function LoadingScreen({ label = "Cargando…" }: { label?: string }) {
  return (
    <div className="loading-screen shell-bg" role="status" aria-live="polite">
      <Spinner label={label} />
      <span className="loading-screen__label">{label}</span>
    </div>
  );
}
