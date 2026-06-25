import { UserMenu } from "@app/components/auth/UserMenu";

export function Header() {
  return (
    <header className="shell-header glass animate-slide-down">
      <div className="brand-pill glass">
        <img src="/icon.svg" alt="" className="brand-logo" />
        <span style={{ fontWeight: 700, fontSize: "0.85rem", letterSpacing: "0.06em" }}>JP-WALLET</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
        <UserMenu />
      </div>
    </header>
  );
}
