import { CoreIcon } from "@app/lib/core/icons";
import { NavLink } from "react-router";

export function NavMobile() {
	return (
		<nav className="bottom-nav glass" aria-label="Navegación principal">
			<NavLink
				to="/"
				end
				className={({ isActive }) =>
					`nav-item${isActive ? " nav-item--active" : ""}`
				}
			>
				<CoreIcon name="house" size={20} />
				Inicio
			</NavLink>
			<NavLink
				to="/transactions"
				className={({ isActive }) =>
					`nav-item${isActive ? " nav-item--active" : ""}`
				}
			>
				<CoreIcon name="arrow-down-up" size={20} />
				Movimientos
			</NavLink>
			<NavLink
				to="/accounts"
				className={({ isActive }) =>
					`nav-item${isActive ? " nav-item--active" : ""}`
				}
			>
				<CoreIcon name="wallet" size={20} />
				Cuentas
			</NavLink>
			<NavLink
				to="/settings"
				className={({ isActive }) =>
					`nav-item${isActive ? " nav-item--active" : ""}`
				}
			>
				<CoreIcon name="ellipsis" size={20} />
				Más
			</NavLink>
		</nav>
	);
}
