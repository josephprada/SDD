import { Spinner } from "@jp-ds/index";

export function LoadingScreen({ label = "Cargando…" }: { label?: string }) {
	return (
		<output className="loading-screen shell-bg" aria-live="polite">
			<Spinner label={label} />
			<span className="loading-screen__label">{label}</span>
		</output>
	);
}
