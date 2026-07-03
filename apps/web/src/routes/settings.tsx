import { BrandLogoMark } from "@app/components/brand/BrandLogoMark";
import { useAuth } from "@app/lib/auth/useAuth";
import { Button } from "@jp-ds";
import { Link, useNavigate } from "react-router";

const ROWS = [
	{ title: "Tema", sub: "Oscuro / Claro / Sistema" },
	{ title: "Agrupación", sub: "Mes" },
	{ title: "Idioma", sub: "Español" },
	{ title: "Notificaciones", sub: "Activadas" },
] as const;

export function SettingsRoute() {
	const { session, signOut } = useAuth();
	const navigate = useNavigate();

	const handleSignOut = async () => {
		await signOut();
		navigate("/login", { replace: true });
	};

	return (
		<div className="animate-stagger">
			<div className="page-header animate-stagger-item">
				<div className="dash-header__brand show-desktop">
					<BrandLogoMark size={42} />
					<div>
						<h1 className="page-title">Ajustes</h1>
						<p className="page-subtitle">Preferencias de la aplicación</p>
					</div>
				</div>
				<div className="page-header__mobile show-mobile">
					<BrandLogoMark size={28} />
					<h1 className="page-title">Ajustes</h1>
				</div>
			</div>

			<Link
				to="/categories"
				className="settings-row glass interactive-lift animate-stagger-item"
				style={{ display: "flex", textDecoration: "none", color: "inherit" }}
			>
				<div>
					<div className="settings-row__title">Categorías</div>
					<div className="settings-row__sub">
						Gestionar gastos, ingresos y transferencias
					</div>
				</div>
				<span aria-hidden style={{ color: "var(--color-text-secondary)" }}>
					›
				</span>
			</Link>
			<div
				className="animate-stagger-item"
				style={{ marginTop: "var(--space-4)" }}
			>
				{ROWS.map((row, index) => (
					<div
						key={row.title}
						className="settings-row glass interactive-lift animate-stagger-item"
						style={{ animationDelay: `${(index + 1) * 60}ms` }}
					>
						<div>
							<div className="settings-row__title">{row.title}</div>
							<div className="settings-row__sub">{row.sub}</div>
						</div>
						<span aria-hidden style={{ color: "var(--color-text-secondary)" }}>
							›
						</span>
					</div>
				))}
			</div>

			{session ? (
				<div
					className="settings-sign-out show-mobile animate-stagger-item"
					style={{ marginTop: "var(--space-6)" }}
				>
					<Button variant="secondary" fullWidth onClick={handleSignOut}>
						Cerrar sesión
					</Button>
				</div>
			) : null}
		</div>
	);
}
