import { CoreIcon } from "@app/lib/core/icons";
import { useTransactionModalStore } from "@app/stores/transactionModal";
import { NavLink } from "react-router";

type NavMobileProps = {
	showFab?: boolean;
};

export function NavMobile({ showFab = false }: NavMobileProps) {
	const openCreate = useTransactionModalStore((state) => state.openCreate);

	return (
		<nav className="bottom-nav glass" aria-label="Navegación principal">
			<NavLink
				to="/"
				end
				className={({ isActive }) =>
					`nav-item${isActive ? " nav-item--active" : ""}`
				}
			>
				<CoreIcon name="house" size={18} />
				Inicio
			</NavLink>
			<NavLink
				to="/transactions"
				className={({ isActive }) =>
					`nav-item${isActive ? " nav-item--active" : ""}`
				}
			>
				<CoreIcon name="arrow-down-up" size={18} />
				Movimientos
			</NavLink>
			{showFab ? (
				<div className="nav-fab-slot">
					<button
						type="button"
						className="nav-fab"
						aria-label="Registrar gasto"
						onClick={() => openCreate("expense")}
					>
						<CoreIcon name="plus" size={24} />
					</button>
				</div>
			) : null}
			<NavLink
				to="/accounts"
				className={({ isActive }) =>
					`nav-item${isActive ? " nav-item--active" : ""}`
				}
			>
				<CoreIcon name="wallet" size={18} />
				Cuentas
			</NavLink>
			<NavLink
				to="/settings"
				className={({ isActive }) =>
					`nav-item${isActive ? " nav-item--active" : ""}`
				}
			>
				<CoreIcon name="ellipsis" size={18} />
				Más
			</NavLink>
		</nav>
	);
}
