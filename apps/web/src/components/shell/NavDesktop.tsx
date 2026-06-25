import { NavLink } from "react-router";

export function NavDesktop() {
  return (
    <aside className="sidebar glass animate-slide-in-left" aria-label="Sidebar">
      <div className="brand-pill">
        <img src="/icon.svg" alt="" className="brand-logo brand-logo--sidebar" />
        <span style={{ fontWeight: 700, letterSpacing: "0.06em" }}>JP-WALLET</span>
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
        <NavLink
          to="/"
          end
          className={({ isActive }) => `sidebar-link${isActive ? " sidebar-link--active" : ""}`}
        >
          Inicio
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) => `sidebar-link${isActive ? " sidebar-link--active" : ""}`}
        >
          Ajustes
        </NavLink>
      </nav>
    </aside>
  );
}
