import { Spinner } from "@jp-ds/index";

type LoadingScreenProps = {
	label?: string;
	/** Usa fondo y tokens de marca (p. ej. flujo de login). */
	brand?: boolean;
};

export function LoadingScreen({
	label = "Cargando…",
	brand = false,
}: LoadingScreenProps) {
	return (
		<output
			className={`loading-screen ${brand ? "aurora-bg" : "shell-bg"}`}
			aria-live="polite"
		>
			<Spinner label={label} />
			<span className="loading-screen__label">{label}</span>
		</output>
	);
}
