# Contract: Notifications (in-app toast + push)

**Change**: app-polish-fixes  
**Consumers**: `NotificationListener`, SW, `notificationActions`, Settings push banner

## In-app toasts

| Evento | Comportamiento |
|--------|----------------|
| Primer fetch de `listRecentInApp` en la sesión/página | Marcar ítems como vistos **sin** toast |
| Ítem nuevo (no en cursor) mientras la sesión está viva | Como máximo **un** toast por clave lógica |
| Recarga / re-login | No re-toastear el mismo historial |

Clave lógica sugerida: `${type}:${referenceId}:${sentAt}` (o id de log si existe).

## Push (sistema)

| Condición | Comportamiento |
|-----------|----------------|
| `notificationsEnabled && pushEnabled` + VAPID OK + sub válida | `web-push` → SW `showNotification` → bandeja OS |
| Endpoint 404/410 (`gone`) | Eliminar/desactivar suscripción en Convex |
| VAPID ausente | No crash; log/skip send |
| App en foreground | Feedback in-app suficiente; no obligatorio duplicar OS |

## Fuera de contrato v1

- Rediseño UI del inbox  
- Canales no-Web-Push  
