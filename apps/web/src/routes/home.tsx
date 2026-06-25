export function HomeRoute() {
  return (
    <div className="animate-stagger">
      <h1 className="page-title animate-stagger-item">Dashboard</h1>
      <div
        className="metrics-row animate-stagger-item"
        style={{ marginTop: "var(--space-4)", marginBottom: "var(--space-4)" }}
      >
        <div className="stat-card glass interactive-lift">
          <span className="stat-card__label">Balance</span>
          <span className="stat-card__value">€2.480</span>
        </div>
        <div className="stat-card glass stat-card--accent interactive-lift">
          <span className="stat-card__label">Ahorro</span>
          <span className="stat-card__value">+12%</span>
        </div>
      </div>
      <div className="hero-card glass interactive-lift animate-stagger-item">
        <strong>Resumen financiero</strong>
        <span style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
          Gráficos y métricas en Change 2
        </span>
      </div>
    </div>
  );
}
