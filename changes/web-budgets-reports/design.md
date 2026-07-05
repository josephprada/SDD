# Design: Web Budgets & Reports

**Change**: web-budgets-reports  
**Spec**: `changes/web-budgets-reports/spec.md`  
**Rama**: `feat/web-budgets-reports`

---

## Enfoque Técnico

Change 4 materializa **presupuestos**, **gastos fijos**, **reportes visuales**, **email transaccional** y **Web Push** sobre la base de `web-core` (transacciones) y `web-settings` (agrupación temporal, `notificationsEnabled`).

Backend: tablas `budgets`, `fixedExpenses`, `pushSubscriptions`, `notificationLog`; módulos `convex/budgets.ts`, `convex/fixedExpenses.ts`, `convex/reports.ts`, `convex/notifications/` (actions + crons).

Frontend: rutas `/budgets` (tabs Presupuestos | Gastos fijos), `/reports`; Recharts lazy-loaded; export PDF/CSV cliente; PWA + registro push.

---

## Decisiones de Arquitectura

| # | Pregunta | Decisión | Tradeoff |
|---|----------|----------|----------|
| D-01 | Librería gráficos | **Recharts** (lazy en `/reports`) | Bundle inicial protegido |
| D-02 | Export PDF manual | **jspdf** programático (cliente) | Tabular detallado; sin gráficas (html2canvas incompatible con JP-DS CSS) |
| D-03 | PDF email | **pdf-lib** en Convex action | Tabular sin charts; números = panel |
| D-04 | Email provider | **Resend** | Requiere API key + dominio verificado |
| D-05 | Web Push | **web-push** VAPID + SW | Android necesita PWA para fiabilidad |
| D-06 | PWA | **vite-plugin-pwa** | Manifest + precache assets |
| D-07 | Crons | **convex/crons.ts** diario 8:00 COT | Un job; idempotencia en DB |
| D-08 | Agregaciones | **`convex/lib/reports.ts`** compartido | Refactor dashboard opcional |
| D-09 | UI gastos fijos | Tab en **`/budgets`** | Un hub financiero proactivo |
| D-10 | Presupuesto período | **`periodKey` YYYY-MM** | Alineado a mes calendario |
| D-11 | Día 31 | **Clamp** al último día del mes | Predecible en febrero |
| D-12 | Master switch | **`notificationsEnabled`** bloquea email+push | In-app badge al abrir app si off |
| D-13 | Report email | **`reportEmailEnabled`** separado | Usuario puede silenciar solo reportes |
| D-14 | Timezone | **`America/Bogota`** v1 | Suficiente para COP |
| D-15 | Chart colors | Props → `getComputedStyle` tokens | Sin hex en componentes |

---

## Flujo de datos

```
                    ┌─────────────────┐
                    │  transactions   │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
  budgets.list+progress   reports.summary    dashboard.overview
         │                   │                   │
         ▼                   ▼                   │
    /budgets tab 1      /reports charts          │
         │                   │                   │
         ▼                   ├─ csvExport (client)│
  threshold alert      └─ pdfExport (client)     │
         │                                        │
         ▼                                        │
  notifications.send (in-app / email / push) ◄────┘

fixedExpenses ──► cron daily ──► reminder check ──► email + push
userPreferences.defaultGrouping ──► cron ──► period closed? ──► report email
```

---

## Schema Convex (nuevo)

Ver `data-model.md`. Validators en `convex/lib/validators.ts`:

```typescript
periodKeyValidator = v.string() // regex /^\d{4}-\d{2}$/
dayOfMonthValidator = v.number() // 1-31, validated in handler
reminderOffsetsValidator = v.array(v.number()) // min 1, max 5 offsets, 0-30
```

---

## Módulos backend

### `convex/budgets.ts`

| Export | Tipo | Descripción |
|--------|------|-------------|
| `list` | query | Presupuestos de `periodKey` + progreso derivado |
| `create` | mutation | Unicidad cat+period |
| `update` | mutation | Monto/notas |
| `remove` | mutation | Hard delete |
| `checkThresholdAfterTransaction` | internal mutation | Post-hook desde `transactions.create/update` |

### `convex/fixedExpenses.ts`

| Export | Tipo | Descripción |
|--------|------|-------------|
| `list` | query | Activos + próxima fecha |
| `create` / `update` / `remove` | mutation | CRUD |
| `markPaid` | mutation | Set `lastPaidPeriodKey` |
| `processReminders` | internal mutation | Invocado por cron |

### `convex/reports.ts`

| Export | Tipo | Descripción |
|--------|------|-------------|
| `summary` | query | Dataset completo con filtros |
| `generatePeriodReport` | internal query | Para email action |

### `convex/notifications/`

| Export | Tipo | Descripción |
|--------|------|-------------|
| `sendEmail` | internal action | Resend API |
| `sendPush` | internal action | web-push |
| `dispatch` | internal mutation | Orquesta canales + log |
| `subscribePush` / `unsubscribePush` | mutation | CRUD subscriptions |

### `convex/crons.ts`

```typescript
crons.daily(
  "notifications-daily",
  { hourUTC: 13, minuteUTC: 0 }, // ~8:00 COT
  internal.notifications.processDaily,
);
```

`processDaily`:
1. `fixedExpenses.processReminders`
2. `reports.processPeriodClosures`

---

## Frontend — rutas y componentes

### Rutas (`router.tsx`)

| Path | Componente |
|------|------------|
| `/budgets` | `BudgetsRoute` — tabs Presupuestos / Gastos fijos |
| `/reports` | `ReportsRoute` — lazy charts |

### Componentes nuevos

```text
apps/web/src/
├── routes/budgets.tsx
├── routes/reports.tsx
├── components/budgets/
│   ├── BudgetList.tsx
│   ├── BudgetForm.tsx
│   ├── BudgetProgressBar.tsx
│   ├── FixedExpenseList.tsx
│   ├── FixedExpenseForm.tsx
│   └── ReminderOffsetsEditor.tsx
├── components/reports/
│   ├── ReportFilters.tsx
│   ├── IncomeExpenseChart.tsx
│   ├── CategoryBreakdownChart.tsx
│   ├── TrendChart.tsx
│   ├── ReportSummary.tsx
│   └── ReportExportActions.tsx
├── components/notifications/
│   ├── PushPermissionBanner.tsx
│   └── InAppToast.tsx
├── lib/export/pdfExport.ts
├── lib/export/csvExport.ts
├── lib/charts/chartTheme.ts
└── lib/push/registerPush.ts
```

### Navegación

- **NavDesktop**: links Presupuestos (`chart-pie` o `target`), Reportes (`bar-chart`).
- **NavMobile**: en `/settings` sección "Finanzas" con links, o reemplazar un ítem — **decisión**: filas en Ajustes + acceso desde dashboard QuickAction (opcional fase polish).

### Ajustes (extensión)

- `ReportEmailToggle` — `reportEmailEnabled`
- `PushSetupRow` — activar push + link ayuda PWA
- Ampliar copy de `NotificationsToggle` — ahora sí tiene efecto real

---

## Gráficos — theming

`chartTheme.ts` lee tokens en runtime:

```typescript
export function chartColors() {
  const root = getComputedStyle(document.documentElement);
  return {
    accent: root.getPropertyValue("--color-accent").trim(),
    danger: root.getPropertyValue("--color-danger").trim(),
    muted: root.getPropertyValue("--color-text-muted").trim(),
    // categorías: category.color del backend
  };
}
```

Recharts: `<ResponsiveContainer>`, leyenda accesible, `aria-label` en contenedor, tabla oculta `.sr-only` con mismos datos.

---

## Email — plantillas

| Template | Trigger | Contenido |
|----------|---------|-----------|
| `period-report` | Cierre período | Asunto: "Tu resumen {periodLabel}"; HTML resumen; adjunto PDF |
| `fixed-expense-reminder` | Cron offset | "Recuerda: {name} — {amount} vence {date}" |
| `budget-threshold` | Transacción | "Presupuesto {category} al {pct}%" |

From: `EMAIL_FROM` env. Reply-to: opcional noreply.

---

## Web Push — flujo Android

1. Usuario activa notificaciones en Ajustes.
2. UI muestra banner: "Para recibir avisos en el móvil, instala la app y permite notificaciones".
3. `registerPush()` → `Notification.requestPermission()` → `pushManager.subscribe(VAPID_PUBLIC)`.
4. Mutation `subscribePush` persiste subscription.
5. Cron/action envía payload `{ title, body, url: "/budgets" }`.
6. SW `push` event → `showNotification`; `notificationclick` → `clients.openWindow(url)`.

**Limitación documentada**: sin PWA instalada en Android, push puede no entregar con app cerrada; email es fallback.

---

## Integración transacciones → presupuesto

En `transactions.create` / `update` (expense):

```typescript
if (prefs.notificationsEnabled) {
  await ctx.scheduler.runAfter(0, internal.budgets.checkThresholdAfterTransaction, {
    userId, categoryId, transactionDate,
  });
}
```

`checkThresholdAfterTransaction` compara umbral anterior vs nuevo; si cruza 80 o 100 hacia arriba → `notifications.dispatch`.

---

## Env vars (Convex + Vite)

| Var | Dónde | Uso |
|-----|-------|-----|
| `RESEND_API_KEY` | Convex | Email |
| `EMAIL_FROM` | Convex | Remitente |
| `VAPID_PUBLIC_KEY` | Convex + Vite (`import.meta.env`) | Push subscribe |
| `VAPID_PRIVATE_KEY` | Convex | Push send |
| `VAPID_SUBJECT` | Convex | mailto: |

Documentar en `changes/web-budgets-reports/quickstart.md` y `GITHUB_SECRETS` si aplica CI.

---

## Estructura de archivos (implementación)

```text
convex/
├── schema.ts                    # +4 tablas
├── budgets.ts
├── fixedExpenses.ts
├── reports.ts
├── crons.ts
├── lib/reports.ts
├── lib/fixedExpenses.ts
├── lib/notifications.ts
└── notifications/
    ├── actions.ts               # sendEmail, sendPush
    └── processDaily.ts

apps/web/
├── vite.config.ts               # + vite-plugin-pwa
├── public/sw.js                 # push handler (injectManifest)
├── src/routes/budgets.tsx
├── src/routes/reports.tsx
└── src/components/{budgets,reports,notifications}/

packages/jp-ds/                  # ProgressBar, Toast si no existen
```

---

## Riesgos técnicos mitigados

| Riesgo | Mitigación |
|--------|------------|
| Bundle size | `React.lazy` en `/reports`; Recharts tree-shake |
| Resend spam | Dominio verificado; rate limit por user en cron |
| Push sin entrega | Email fallback; UI honesta |
| PDF email sin gráficos | PDF tabular + HTML con números; export manual con charts |
| Cron duplicado | `notificationLog.dedupeKey` unique index |

---

## Dependencias npm (nuevas)

**apps/web**: `recharts`, `jspdf`, `html2canvas`, `vite-plugin-pwa`  
**convex** (package.json raíz o convex/): `web-push`, `pdf-lib`  
**convex actions**: `resend` vía `fetch` (sin SDK obligatorio)

---

## QA

Ver `quickstart.md` — viewports 375/1280, permisos push, email en Resend dashboard, cron manual vía Convex dashboard.
