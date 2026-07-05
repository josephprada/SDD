import { usePreferencesStore } from "@app/stores/preferences";

export function ReportEmailToggle() {
	const enabled = usePreferencesStore((s) => s.reportEmailEnabled);
	const setReportEmailEnabled = usePreferencesStore((s) => s.setReportEmailEnabled);

	return (
		<div className="notifications-row">
			<div>
				<div className="settings-row__title">Reportes por email</div>
				<div className="settings-row__sub">
					Recibe un resumen al cerrar cada período (según tu agrupación)
				</div>
			</div>
			<button
				type="button"
				role="switch"
				aria-checked={enabled}
				aria-label={
					enabled ? "Desactivar reportes por email" : "Activar reportes por email"
				}
				className={`toggle-switch${enabled ? " toggle-switch--on" : ""}`}
				onClick={() => setReportEmailEnabled(!enabled)}
			>
				<span className="toggle-switch__thumb" />
			</button>
		</div>
	);
}
