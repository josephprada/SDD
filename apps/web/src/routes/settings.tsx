const ROWS = [
  { title: "Tema", sub: "Oscuro / Claro / Sistema" },
  { title: "Agrupación", sub: "Mes" },
  { title: "Idioma", sub: "Español" },
  { title: "Notificaciones", sub: "Activadas" },
] as const;

export function SettingsRoute() {
  return (
    <div className="animate-stagger">
      <h1 className="page-title animate-stagger-item">Ajustes</h1>
      <div className="animate-stagger-item" style={{ marginTop: "var(--space-4)" }}>
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
    </div>
  );
}
