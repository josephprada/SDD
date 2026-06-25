import "./components.css";

export interface SpinnerProps {
  label?: string;
}

export function Spinner({ label = "Cargando" }: SpinnerProps) {
  return (
    <div className="jp-spinner" role="status" aria-label={label}>
      <div className="jp-spinner__ring" />
    </div>
  );
}
