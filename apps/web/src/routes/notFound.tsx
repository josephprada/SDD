import { Button } from "@jp-ds/index";
import { Link } from "react-router";

export function NotFoundRoute() {
	return (
		<div className="not-found-content shell-bg" style={{ minHeight: "60vh" }}>
			<p className="error-404__code" aria-hidden>
				404
			</p>
			<h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>
				Página no encontrada
			</h1>
			<p style={{ color: "var(--color-text-secondary)", maxWidth: "18rem" }}>
				La ruta que buscas no existe o fue movida.
			</p>
			<Link to="/" style={{ textDecoration: "none" }}>
				<Button variant="primary">Volver al inicio</Button>
			</Link>
		</div>
	);
}
