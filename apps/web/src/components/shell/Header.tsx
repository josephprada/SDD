import { UserMenu } from "@app/components/auth/UserMenu";
import { useThemeStore } from "@app/stores/theme";

export function Header() {
	const resolved = useThemeStore((s) => s.resolved);
	const logoSrc = resolved === "light" ? "/icon-mark-light.svg" : "/icon.svg";

	return (
		<header className="shell-header glass animate-slide-down">
			<div className="brand-pill glass">
				<img src={logoSrc} alt="" className="brand-logo" />
				<span
					style={{
						fontWeight: 700,
						fontSize: "0.85rem",
						letterSpacing: "0.06em",
					}}
				>
					JP-WALLET
				</span>
			</div>
			<div
				style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}
			>
				<UserMenu />
			</div>
		</header>
	);
}
