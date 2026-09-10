# Quickstart: notifications-polish

## Prerrequisitos

- Push activado en Ajustes (prod o local con SW)
- VAPID en Convex + `VITE_VAPID_PUBLIC_KEY` alineados

## Probar push foreground vs background

1. App abierta y visible → **Enviar prueba** → toast in-app, **sin** bandeja OS.
2. App en background / cerrada → **Enviar prueba** (desde otro dispositivo o cron) → bandeja OS.
3. Tocar la push → debe abrir `/settings` (prueba) u otra ruta del payload.

## Omitir este mes

1. En Presupuestos / fijos, marcar **Omitir este mes** en un pendiente.
2. Dashboard: baja `pendingTotal` / desaparece de proyección.
3. No deben llegar reminders ni mora de ese fijo hasta reactivar o cambiar de mes.

## Mora +3 / +6

- En dev: ajustar `dayOfMonth` / fecha del sistema o invocar helper de reminders con fecha simulada si se expone.
- En prod: esperar cron diario 13:00 UTC tras 3 o 6 días de vencimiento impago.
