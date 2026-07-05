import {
	isPushSupported,
	registerPushSubscription,
	unregisterPushSubscription,
} from "@app/lib/push/registerPush";
import { usePreferencesStore } from "@app/stores/preferences";
import { api } from "@convex/_generated/api";
import { Button } from "@jp-ds";
import { useConvexAuth, useConvex, useMutation } from "convex/react";
import { useState } from "react";

export function PushPermissionBanner() {
	const convex = useConvex();
	const { isAuthenticated } = useConvexAuth();
	const pushEnabled = usePreferencesStore((s) => s.pushEnabled);
	const setPushEnabled = usePreferencesStore((s) => s.setPushEnabled);
	const updatePrefs = useMutation(api.userPreferences.update);
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	if (!isAuthenticated || !isPushSupported()) return null;

	const handleEnable = async () => {
		setBusy(true);
		setMessage(null);
		try {
			const ok = await registerPushSubscription(convex);
			if (ok) {
				setPushEnabled(true);
				await updatePrefs({ pushEnabled: true });
				setMessage("Notificaciones push activadas.");
			} else {
				setMessage(
					"No se pudo activar push. Concede permiso en el navegador e instala la app (PWA) en Android.",
				);
			}
		} finally {
			setBusy(false);
		}
	};

	const handleDisable = async () => {
		setBusy(true);
		try {
			await unregisterPushSubscription(convex);
			setPushEnabled(false);
			await updatePrefs({ pushEnabled: false });
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="push-banner glass">
			<div>
				<div className="settings-row__title">Notificaciones push</div>
				<div className="settings-row__sub">
					{pushEnabled
						? "Recibirás avisos en la bandeja del sistema"
						: "Para Android: instala JP-WALLET en pantalla de inicio y permite notificaciones"}
				</div>
				{message ? <p className="push-banner__msg">{message}</p> : null}
			</div>
			{pushEnabled ? (
				<Button type="button" variant="secondary" disabled={busy} onClick={handleDisable}>
					Desactivar
				</Button>
			) : (
				<Button type="button" disabled={busy} onClick={handleEnable}>
					Activar push
				</Button>
			)}
		</div>
	);
}
