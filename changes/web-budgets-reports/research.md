# Research: Web Budgets & Reports

## Decision: Recharts para gráficos

**Rationale**: Librería React-first, responsive, SVG; colores vía props mapeados a `var(--color-*)` de JP-DS. Import diferido en ruta `/reports` para no inflar el bundle inicial (~45 KB gzip vs Chart.js similar). Soporta barras, torta/dona y líneas/área en un solo paquete.

**Alternatives considered**:
- **Chart.js + react-chartjs-2**: canvas; theming más manual; accesibilidad peor que SVG.
- **visx**: máximo control pero más código propio por gráfico; overkill para 3 charts.
- **CSS-only charts**: sin interactividad ni export fácil a PDF.

## Decision: Export PDF manual — `jspdf` + `html2canvas`

**Rationale**: Snapshot WYSIWYG del panel visible (incluye gráficos Recharts renderizados). El usuario exporta lo que ve. Generación 100 % cliente; no carga el backend.

**Alternatives considered**:
- **@react-pdf/renderer**: programático; no captura charts SVG sin reimplementar.
- **window.print()**: inconsistente en móvil; peor UX.

## Decision: PDF en emails — `pdf-lib` server-side (Convex action)

**Rationale**: Los crons no tienen DOM. Generar PDF tabular (resumen + tabla por categoría) con `pdf-lib` en una action es ligero (~200 KB) y no requiere headless browser. El email incluye resumen HTML + PDF adjunto con mismos números.

**Alternatives considered**:
- **Puppeteer/Playwright en action**: demasiado pesado para Convex; cold start lento.
- **Solo HTML en email sin adjunto**: incumple expectativa de PDF del usuario.
- **Reutilizar html2canvas en action**: imposible sin DOM.

## Decision: Email transaccional — Resend

**Rationale**: API HTTP simple (`fetch` desde Convex action), buen deliverability, dominio verificable (`wallet.lavalex.co` / `lavalex.co`). Plantillas React Email opcionales; MVP con HTML string + adjunto base64.

**Alternatives considered**:
- **SendGrid / Mailgun**: equivalentes; Resend menor fricción DX para volumen bajo.
- **SMTP directo desde VPS**: más ops; CI ya despliega frontend, no mail server.
- **Gmail API**: acoplado al OAuth del usuario; no apto para notificaciones del sistema.

**Env vars Convex**: `RESEND_API_KEY`, `EMAIL_FROM` (ej. `JP-WALLET <reportes@wallet.lavalex.co>`).

## Decision: Web Push — `web-push` (VAPID) + Service Worker manual

**Rationale**: Estándar W3C; funciona en Chrome Android con PWA. Paquete `web-push` en Convex action para enviar; SW en `apps/web/public/sw.js` registrado desde cliente. Suscripciones en tabla `pushSubscriptions`.

**Alternatives considered**:
- **Firebase Cloud Messaging**: requiere proyecto Firebase; overkill.
- **OneSignal**: tercero extra; menos control.

**Env vars Convex**: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`mailto:reportes@wallet.lavalex.co`).

**Requisito Android**: PWA instalada + permiso Chrome; documentar en UI onboarding.

## Decision: PWA — `vite-plugin-pwa` (manifest + SW precache)

**Rationale**: Manifest para "Añadir a pantalla de inicio"; plugin genera SW base; extendemos con handler push. Mejora entrega de notificaciones en Android vs pestaña de navegador.

**Alternatives considered**:
- **Solo SW manual sin manifest**: instalación PWA incompleta.
- **App nativa**: fuera de scope.

## Decision: Crons — `convex/crons.ts` + internal mutations

**Rationale**: Convex soporta cron nativo. Un job diario (`0 13 * * *` UTC ≈ 8:00 COT) ejecuta:
1. Recordatorios de gastos fijos (offsets).
2. Cierre de período → email de reporte.

Idempotencia vía `notificationLog`.

**Alternatives considered**:
- **Cron externo (GitHub Actions)**: más moving parts; Convex cron suficiente.
- **Polling desde cliente**: no funciona con app cerrada.

## Decision: Agregaciones compartidas — `convex/lib/reports.ts`

**Rationale**: Una función pura `aggregateTransactions(transactions, filters)` usada por `reports.*`, `dashboard.overview` (refactor opcional) y generación de email. Evita drift entre panel, CSV y PDF.

**Alternatives considered**:
- **Duplicar lógica en cada query**: riesgo de inconsistencia (ya identificado en proposal).

## Decision: Presupuestos vs gastos fijos — tablas separadas

**Rationale**: Modelos de dominio distintos (techo vs compromiso con fecha). UI en `/budgets` con tabs "Presupuestos" | "Gastos fijos" para descubrimiento unificado.

**Alternatives considered**:
- **Un solo tipo "budget" con flag**: confunde UX y queries.
- **Gastos fijos dentro de transacciones recurrentes auto-create**: SPEC §5.3 diferido; solo recordatorios v1.

## Decision: Día del mes 31 en meses cortos

**Rationale**: `resolveDueDay(year, month, dayOfMonth) = min(dayOfMonth, daysInMonth(year, month))`. Ej.: día 31 en febrero → 28/29.

## Decision: Idempotencia de notificaciones

**Rationale**: Clave única en `notificationLog`:

```text
{userId}:{type}:{referenceId}:{channel}:{dateKey}
```

`type`: `fixed_expense_reminder` | `budget_threshold` | `period_report`  
`dateKey`: `YYYY-MM-DD` (día del envío) o `periodKey` para reportes.

## Decision: Timezone

**Rationale**: `America/Bogota` (COT, UTC-5) hardcoded v1 — producto COP/Colombia. Crons en UTC con offset documentado; fechas de recordatorio evaluadas en timezone del usuario.

**Alternatives considered**:
- **Per-user timezone pref**: YAGNI hasta i18n/expansión.

## Decision: Fases de implementación

**Rationale**: Change grande; entregar valor incremental:

| Fase | Entrega |
|------|---------|
| A | Schema + agregaciones + presupuestos UI |
| B | Panel reportes + export manual |
| C | Gastos fijos + recordatorios in-app |
| D | Email (Resend) reportes + recordatorios |
| E | Web Push + PWA |

Cada fase es deployable sin romper la anterior.
