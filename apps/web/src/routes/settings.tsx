import { BrandLogoMark } from "@app/components/brand/BrandLogoMark";
import { AppearanceSection } from "@app/components/settings/AppearanceSection";
import { GroupingPicker } from "@app/components/settings/GroupingPicker";
import { LanguagePicker } from "@app/components/settings/LanguagePicker";
import { NotificationsToggle } from "@app/components/settings/NotificationsToggle";
import { PreferenceRow } from "@app/components/settings/PreferenceRow";
import { ProfileEditor } from "@app/components/settings/ProfileEditor";
import { useAuth } from "@app/lib/auth/useAuth";
import { usePreferencesStore } from "@app/stores/preferences";
import {
	GROUPING_LABELS,
	THEME_MODE_LABELS,
} from "@jp-ds/index";
import { Button } from "@jp-ds";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

export function SettingsRoute() {
	const { session, signOut } = useAuth();
	const navigate = useNavigate();
	const [groupingOpen, setGroupingOpen] = useState(false);
	const [languageOpen, setLanguageOpen] = useState(false);

	const mode = usePreferencesStore((s) => s.mode);
	const defaultGrouping = usePreferencesStore((s) => s.defaultGrouping);

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

			<section className="settings-section animate-stagger-item">
				<h2 className="settings-section__title">Perfil</h2>
				<ProfileEditor />
			</section>

			<AppearanceSection />

			<section className="settings-section animate-stagger-item">
				<h2 className="settings-section__title">Preferencias</h2>
				<div className="settings-card glass">
					<PreferenceRow
						title="Agrupación"
						subtitle="Período por defecto del resumen"
						value={GROUPING_LABELS[defaultGrouping]}
						onClick={() => setGroupingOpen(true)}
					/>
					<PreferenceRow
						title="Idioma"
						subtitle="Interfaz de la aplicación"
						value="Español"
						onClick={() => setLanguageOpen(true)}
					/>
					<PreferenceRow
						title="Modo"
						subtitle="Tema visual actual"
						value={THEME_MODE_LABELS[mode]}
						as="div"
					/>
					<div className="settings-row glass">
						<NotificationsToggle />
					</div>
				</div>
			</section>

			<Link
				to="/categories"
				className="settings-row glass interactive-lift animate-stagger-item preference-row"
				style={{ display: "flex", textDecoration: "none", color: "inherit" }}
			>
				<div>
					<div className="settings-row__title">Categorías</div>
					<div className="settings-row__sub">
						Gestionar gastos, ingresos y transferencias
					</div>
				</div>
				<span className="preference-row__chevron" aria-hidden>
					›
				</span>
			</Link>

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

			<GroupingPicker open={groupingOpen} onClose={() => setGroupingOpen(false)} />
			<LanguagePicker open={languageOpen} onClose={() => setLanguageOpen(false)} />
		</div>
	);
}
