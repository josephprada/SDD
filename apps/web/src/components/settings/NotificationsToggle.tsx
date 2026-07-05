import { usePreferencesStore } from "@app/stores/preferences";

export function NotificationsToggle() {
	const enabled = usePreferencesStore((s) => s.notificationsEnabled);
	const setNotificationsEnabled = usePreferencesStore(
		(s) => s.setNotificationsEnabled,
	);

	return (
		<div className="notifications-row">
			<div>
				<div className="settings-row__title">Notificaciones</div>
				<div className="settings-row__sub">
					Alertas de presupuesto, recordatorios y reportes por email/push
				</div>
			</div>
			<button
				type="button"
				role="switch"
				aria-checked={enabled}
				aria-label={enabled ? "Desactivar notificaciones" : "Activar notificaciones"}
				className={`toggle-switch${enabled ? " toggle-switch--on" : ""}`}
				onClick={() => setNotificationsEnabled(!enabled)}
			>
				<span className="toggle-switch__thumb" />
			</button>
		</div>
	);
}
