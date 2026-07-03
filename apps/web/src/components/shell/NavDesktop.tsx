import { useAuth } from "@app/lib/auth/useAuth";
import { CoreIcon } from "@app/lib/core/icons";
import { Avatar } from "@jp-ds";
import { NavLink, useNavigate } from "react-router";

export function NavDesktop() {
	const { session, signOut } = useAuth();
	const navigate = useNavigate();

	const handleSignOut = async () => {
		await signOut();
		navigate("/login", { replace: true });
	};

	return (
		<aside className="sidebar glass animate-slide-in-left" aria-label="Sidebar">
			{session ? (
				<div className="sidebar-user">
					<Avatar src={session.picture} alt="" name={session.name} />
					<div className="sidebar-user__meta">
						<span className="sidebar-user__name">{session.name}</span>
						<span className="sidebar-user__email">{session.email}</span>
					</div>
				</div>
			) : null}

			<nav
				className="sidebar-nav"
			>
				<NavLink
					to="/"
					end
					className={({ isActive }) =>
						`sidebar-link${isActive ? " sidebar-link--active" : ""}`
					}
				>
					<CoreIcon name="house" size={18} />
					Inicio
				</NavLink>
				<NavLink
					to="/transactions"
					className={({ isActive }) =>
						`sidebar-link${isActive ? " sidebar-link--active" : ""}`
					}
				>
					<CoreIcon name="arrow-down-up" size={18} />
					Movimientos
				</NavLink>
				<NavLink
					to="/accounts"
					className={({ isActive }) =>
						`sidebar-link${isActive ? " sidebar-link--active" : ""}`
					}
				>
					<CoreIcon name="wallet" size={18} />
					Cuentas
				</NavLink>
				<NavLink
					to="/categories"
					className={({ isActive }) =>
						`sidebar-link${isActive ? " sidebar-link--active" : ""}`
					}
				>
					<CoreIcon name="tags" size={18} />
					Categorías
				</NavLink>
				<NavLink
					to="/settings"
					className={({ isActive }) =>
						`sidebar-link${isActive ? " sidebar-link--active" : ""}`
					}
				>
					<CoreIcon name="settings" size={18} />
					Ajustes
				</NavLink>
			</nav>

			{session ? (
				<div className="sidebar-footer">
					<button
						type="button"
						className="sidebar-sign-out"
						onClick={handleSignOut}
					>
						Cerrar sesión
					</button>
				</div>
			) : null}
		</aside>
	);
}
