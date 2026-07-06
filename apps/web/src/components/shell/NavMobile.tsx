import { CoreIcon, type CoreIconName } from "@app/lib/core/icons";
import { useTransactionModalStore } from "@app/stores/transactionModal";
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router";

type NavMobileProps = {
	showFab?: boolean;
};

const MORE_ITEMS: Array<{ to: string; label: string; icon: CoreIconName }> = [
	{ to: "/credits", label: "Créditos", icon: "landmark" },
	{ to: "/savings", label: "Ahorros", icon: "wallet" },
	{ to: "/categories", label: "Categorías", icon: "tags" },
	{ to: "/budgets", label: "Presupuestos", icon: "badge-dollar-sign" },
	{ to: "/reports", label: "Reportes", icon: "chart-line" },
	{ to: "/settings", label: "Ajustes", icon: "settings" },
];

const MORE_PATHS = new Set(MORE_ITEMS.map((item) => item.to));

export function NavMobile({ showFab = true }: NavMobileProps) {
	const openCreate = useTransactionModalStore((state) => state.openCreate);
	const location = useLocation();
	const [moreOpen, setMoreOpen] = useState(false);

	const isMoreActive = MORE_PATHS.has(location.pathname);

	useEffect(() => {
		setMoreOpen(false);
	}, [location.pathname]);

	useEffect(() => {
		if (!moreOpen) return;

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") setMoreOpen(false);
		};

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [moreOpen]);

	return (
		<>
			{moreOpen ? (
				<button
					type="button"
					className="nav-more__backdrop"
					aria-label="Cerrar menú"
					onClick={() => setMoreOpen(false)}
				/>
			) : null}

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
				<div className="nav-more">
					<button
						type="button"
						className={`nav-item nav-more__trigger${isMoreActive ? " nav-item--active" : ""}${moreOpen ? " nav-item--open" : ""}`}
						aria-expanded={moreOpen}
						aria-haspopup="menu"
						onClick={() => setMoreOpen((open) => !open)}
					>
						<CoreIcon name="ellipsis" size={18} />
						Más
					</button>
					{moreOpen ? (
						<div
							className="nav-more__menu glass animate-menu-in"
							role="menu"
							aria-label="Más opciones"
						>
							{MORE_ITEMS.map((item) => (
								<NavLink
									key={item.to}
									to={item.to}
									role="menuitem"
									className={({ isActive }) =>
										`nav-more__item${isActive ? " nav-more__item--active" : ""}`
									}
									onClick={() => setMoreOpen(false)}
								>
									<CoreIcon name={item.icon} size={18} />
									<span>{item.label}</span>
								</NavLink>
							))}
						</div>
					) : null}
				</div>
			</nav>
		</>
	);
}
