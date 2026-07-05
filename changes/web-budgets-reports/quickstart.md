# Quickstart: Web Budgets & Reports

## Precondiciones

- Rama: `feat/web-budgets-reports`
- Base: `web-settings` mergeada en `testing`
- Convex dev + `.env.local`
- Notas de implementación: `implementation-notes.md`

---

## Configuración de entorno (paso a paso)

### A. Claves VAPID (Web Push)

En la raíz del repo:

```bash
npx web-push generate-vapid-keys
```

Salida típica:

```text
Public Key:  BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U
Private Key: UUxI4O8-FbR_JAodzfV5cvqK-0SCS3Jgpj23TZ0r3M
```

### B. Convex Dashboard → Environment Variables

1. Abre [dashboard.convex.dev](https://dashboard.convex.dev).
2. Selecciona el proyecto (dev y luego prod por separado).
3. **Settings** → **Environment Variables** → **Add**.
4. Añade cada variable:

| Variable | Valor | Notas |
|----------|-------|-------|
| `RESEND_API_KEY` | `re_...` | API key de [resend.com](https://resend.com) → API Keys |
| `EMAIL_FROM` | `JP-WALLET <reportes@wallet.lavalex.co>` | Debe usar dominio **verificado** en Resend |
| `VAPID_PUBLIC_KEY` | Clave pública del paso A | Sin comillas |
| `VAPID_PRIVATE_KEY` | Clave privada del paso A | **Nunca** en el frontend |
| `VAPID_SUBJECT` | `mailto:reportes@wallet.lavalex.co` | Formato `mailto:` obligatorio para web-push |

5. Guarda. Convex redeploya funciones automáticamente.

**Resend — dominio verificado**

- En Resend → **Domains** → añade `wallet.lavalex.co` (o el dominio de prod).
- Hasta verificar, en dev puedes usar el dominio de prueba de Resend (`onboarding@resend.dev`) cambiando `EMAIL_FROM` temporalmente.

### C. `.env.local` en la raíz del monorepo

Crea o edita `/home/jp/SDD/.env.local`:

```bash
# Convex (si no lo tienes ya)
CONVEX_DEPLOYMENT=dev:tu-deployment
VITE_CONVEX_URL=https://tu-deployment.convex.cloud

# Web Push — misma clave pública que en Convex
VITE_VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U
```

Reinicia el dev server tras cambiar `.env.local`:

```bash
# Ctrl+C en bun dev, luego:
bun dev
```

### D. Probar cron de notificaciones manualmente

El cron automático corre **cada día a las 8:00 COT** (13:00 UTC) vía `convex/crons.ts` → `notifications.processDaily`.

Para simular sin esperar:

1. Convex Dashboard → **Functions**.
2. Busca `notifications:processDaily` (tipo **internalMutation**).
3. Pulsa **Run** (sin argumentos `{}`).
4. Eso dispara:
   - Recordatorios de **gastos fijos** (`fixedExpenses.processReminders`)
   - Emails de **cierre de período** (`reports.processPeriodClosures`)

**Requisitos para que envíe algo**

- Usuario con `notificationsEnabled` ON en Ajustes.
- Para email de reporte: `reportEmailEnabled` ON.
- Gasto fijo con `emailReminders`/`pushReminders` y offset que coincida con hoy (o ajustar fecha en dev).
- `RESEND_API_KEY` y `EMAIL_FROM` configurados (si no, verás `RESEND_API_KEY not set` en logs de Convex).

**Alternativa CLI** (si tienes `convex` configurado):

```bash
bunx convex run notifications:processDaily --no-push
```

(El nombre exacto puede variar; en dashboard es más fiable para internal mutations.)

---

## Comandos

```bash
bun install
bunx convex dev
bun dev
```

App: `http://localhost:5173`

---

## QA — Presupuestos

1. Login → `/budgets` tab **Presupuestos**.
2. Crear presupuesto "Comida" $500.000 mes actual.
3. Verificar barra de progreso vs transacciones existentes.
4. Registrar gasto que cruce 80 % → toast in-app (notificaciones ON).
5. Intentar duplicar presupuesto misma categoría/mes → error.
6. Editar monto y eliminar.

---

## QA — Gastos fijos

7. Tab **Gastos fijos** → crear "Cuota" $200.000 día 10, offsets `[2, 0]`.
8. Verificar próxima fecha y lista del mes.
9. Marcar como pagado → estado visual mes actual.
10. Desactivar gasto → sin recordatorios.

---

## QA — Reportes

11. `/reports` → gráficas con datos reales + secciones presupuestos/gastos fijos.
12. Cambiar filtro trimestre / categoría / cuenta → actualización < 1 s.
13. Export CSV → reporte detallado (movimientos, presupuestos, etc.).
14. Export PDF → tablas legibles (sin gráficas; mismo contenido que CSV).

---

## QA — Email

15. Ajustes → **Reportes por email** ON.
16. Ejecutar `notifications.processDaily` en Convex Dashboard → email en bandeja.
17. Verificar PDF adjunto y no duplicado al re-ejecutar (dedupe en `notificationLog`).
18. Recordatorio gasto fijo → email día offset (simular con cron manual).

---

## QA — Web Push (Android recomendado)

19. Ajustes → activar notificaciones → **Activar push**.
20. Conceder permiso Chrome.
21. Instalar PWA ("Añadir a pantalla de inicio").
22. Disparar recordatorio (cron manual) → notificación en bandeja.
23. Tap notificación → abre `/budgets` o `/reports` según tipo.
24. Denegar permiso → email sigue funcionando; UI muestra ayuda.

---

## QA — Navegación

25. Desktop: sidebar con Presupuestos, Reportes (`chart-line`).
26. Móvil: FAB `+` visible en Inicio, Presupuestos, Reportes, etc.
27. Móvil: «Más» despliega Categorías, Presupuestos, Reportes, Ajustes.
28. Ajustes sin links redundantes a otros módulos.
29. Viewports 375 px y 1280 px.

---

## Checks

```bash
bun run build
bun run lint
```

---

## Siguiente paso

1. Completar T078–T080 (env vars + QA email/push).
2. Merge a `testing` / `main` según flujo del equipo.
