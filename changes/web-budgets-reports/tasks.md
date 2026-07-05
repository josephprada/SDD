# Tasks: Web Budgets & Reports (Change 4)

**Input**: `changes/web-budgets-reports/spec.md`, `design.md`, `research.md`, `data-model.md`, `contracts/*`, `quickstart.md`

**Prerequisites**: `web-settings` en base ✅ · spec/design ✅

**Rama**: `feat/web-budgets-reports`

**Tests**: QA vía `quickstart.md`, `bun run build`, `bun run lint`.

**Visual source of truth**: [`desing.md`](../../desing.md) + `design.md`

**Fases deployables**: A → B → C → D → E (ver `research.md`)

---

## Phase 1: Setup (deps + PWA skeleton)

**Purpose**: Dependencias y estructura base.

- [ ] T001 Instalar deps `apps/web`: `recharts`, `jspdf`, `html2canvas`, `vite-plugin-pwa`
- [ ] T002 Instalar deps raíz/convex: `web-push`, `pdf-lib`
- [ ] T003 Configurar `vite-plugin-pwa` en `vite.config.ts` — manifest JP-WALLET, theme_color accent
- [ ] T004 Crear `apps/web/public/sw.js` — handlers `push` + `notificationclick` (injectManifest)
- [ ] T005 [P] Crear carpetas `components/budgets`, `components/reports`, `components/notifications`, `lib/export`, `lib/charts`, `lib/push`
- [ ] T006 [P] Crear `apps/web/src/styles/budgets-reports.css` — layout tabs, progress bars, charts
- [ ] T007 Documentar env vars en `quickstart.md` (ya) + snippet `.env.example` si no existe

**Checkpoint**: `bun run build` compila con PWA plugin.

---

## Phase 2: Foundational (schema + lib + prefs)

**Purpose**: Bloquea todas las user stories. ⚠️ Completar antes de UI.

- [ ] T008 Extender `convex/schema.ts` — tablas `budgets`, `fixedExpenses`, `pushSubscriptions`, `notificationLog`
- [ ] T009 [P] Crear `convex/lib/reports.ts` — `aggregateTransactions`, bucket timeSeries
- [ ] T010 [P] Crear `convex/lib/fixedExpenses.ts` — `resolveDueDate`, `nextDueDate`
- [ ] T011 [P] Crear `convex/lib/notifications.ts` — `buildDedupeKey`, `shouldSendNotification`
- [ ] T012 Extender validators en `convex/lib/validators.ts` — periodKey, dayOfMonth, reminderOffsets
- [ ] T013 Extender `userPreferences` schema + `lib/preferences.ts` — `reportEmailEnabled`, `pushEnabled`, defaults
- [ ] T014 Actualizar `convex/userPreferences.ts` — get/update nuevos campos
- [ ] T015 [P] Crear `convex/reports.ts` — query `summary` (sin UI aún)

**Checkpoint**: `bunx convex dev` sin errores; `reports.summary` retorna dataset vacío válido.

---

## Phase 3: User Story 1 — Presupuestos (P1) 🎯

**Goal**: CRUD presupuestos + progreso + umbrales visuales.

**Independent Test**: quickstart §Presupuestos pasos 1–6.

### Implementation

- [ ] T016 [P] [US1] Crear `convex/budgets.ts` — list, create, update, remove
- [ ] T017 [US1] Implementar cálculo progreso + `thresholdStatus` en `budgets.list`
- [ ] T018 [P] [US1] Crear `BudgetProgressBar.tsx` — tokens JP-DS, estados ok/info/warning/danger
- [ ] T019 [P] [US1] Crear `BudgetForm.tsx` + `BudgetList.tsx`
- [ ] T020 [US1] Crear `routes/budgets.tsx` — tab Presupuestos (tab Gastos fijos placeholder)
- [ ] T021 [US1] Wire Convex queries/mutations; selector categoría expense activa
- [ ] T022 [US1] Validación duplicado cat+period → error UI

**Checkpoint**: Presupuestos funcionales sin alertas externas.

---

## Phase 4: User Story 2 — Gastos fijos (P1)

**Goal**: CRUD gastos fijos + próxima fecha + marcar pagado.

**Independent Test**: quickstart §Gastos fijos pasos 7–10.

### Implementation

- [ ] T023 [P] [US2] Crear `convex/fixedExpenses.ts` — list, create, update, remove, markPaid
- [ ] T024 [P] [US2] Crear `FixedExpenseList.tsx`, `FixedExpenseForm.tsx`
- [ ] T025 [P] [US2] Crear `ReminderOffsetsEditor.tsx` — chips/edit offsets, max 5
- [ ] T026 [US2] Completar tab Gastos fijos en `routes/budgets.tsx`
- [ ] T027 [US2] Campo `lastPaidPeriodKey` en schema + UI "Marcar pagado"

**Checkpoint**: Gastos fijos CRUD completo.

---

## Phase 5: User Story 4 — Panel Reportes + export manual (P1)

**Goal**: Gráficos + filtros + CSV/PDF cliente.

**Independent Test**: quickstart §Reportes pasos 11–14.

### Implementation

- [ ] T028 [P] [US4] Crear `lib/charts/chartTheme.ts`
- [ ] T029 [P] [US4] Crear `IncomeExpenseChart.tsx`, `CategoryBreakdownChart.tsx`, `TrendChart.tsx` (Recharts lazy)
- [ ] T030 [P] [US4] Crear `ReportFilters.tsx`, `ReportSummary.tsx`
- [ ] T031 [US4] Crear `routes/reports.tsx` — lazy import charts
- [ ] T032 [P] [US4] Crear `lib/export/csvExport.ts`, `lib/export/pdfExport.ts`
- [ ] T033 [US4] Crear `ReportExportActions.tsx` — botones CSV/PDF
- [ ] T034 [US4] Wire `reports.summary` con filtros período/categoría/cuenta
- [ ] T035 [US4] Estado vacío + agrupación "Otros" + tabla sr-only a11y

**Checkpoint**: Reportes + export manual; **Fase B deployable**.

---

## Phase 6: User Story 3 — Alertas presupuesto in-app (P2)

**Goal**: Toast al cruzar umbral desde transacción.

### Implementation

- [ ] T036 [US3] Crear `InAppToast.tsx` + store/toast helper
- [ ] T037 [US3] `budgets.checkThresholdAfterTransaction` internal mutation
- [ ] T038 [US3] Hook en `transactions.create/update` (expense) → scheduler
- [ ] T039 [US3] Respetar `notificationsEnabled` para toast

**Checkpoint**: quickstart paso 4 con toast.

---

## Phase 7: User Story 5 — Email reportes + recordatorios (P2)

**Goal**: Resend + PDF adjunto + cron cierre período + recordatorios gastos fijos.

### Implementation

- [ ] T040 [P] [US5] Crear `convex/notifications/actions.ts` — `sendEmail` (Resend fetch)
- [ ] T041 [P] [US5] Helper `generateReportPdf` con pdf-lib en action
- [ ] T042 [US5] Crear `convex/notifications/processDaily.ts` + `convex/crons.ts`
- [ ] T043 [US5] `fixedExpenses.processReminders` internal
- [ ] T044 [US5] `reports.processPeriodClosures` internal
- [ ] T045 [US5] `notifications.dispatch` — dedupe + log
- [ ] T046 [US5] Plantillas HTML email (period-report, fixed-expense-reminder, budget-threshold)
- [ ] T047 [P] [US5] Crear `ReportEmailToggle.tsx` en Ajustes
- [ ] T048 [US5] Extender `NotificationsToggle` copy — efecto real documentado

**Checkpoint**: quickstart §Email pasos 15–18; **Fase D deployable**.

---

## Phase 8: User Story 6 — Web Push + PWA (P2)

**Goal**: Suscripción push + envío + onboarding Android.

### Implementation

- [ ] T049 [P] [US6] Crear `lib/push/registerPush.ts` — subscribe/unsubscribe
- [ ] T050 [US6] Mutations `notifications.subscribePush` / `unsubscribePush`
- [ ] T051 [US6] `notifications.sendPush` action con web-push
- [ ] T052 [US6] Integrar dispatch push en reminders + budget threshold
- [ ] T053 [P] [US6] Crear `PushPermissionBanner.tsx` + fila Ajustes "Activar push"
- [ ] T054 [US6] Copy ayuda PWA Android en banner/modal
- [ ] T055 [US6] Prune subscriptions 410 en sendPush

**Checkpoint**: quickstart §Web Push pasos 19–24; **Fase E deployable**.

---

## Phase 9: User Story 7 — Navegación (P3)

- [ ] T056 [US7] Links `/budgets` y `/reports` en `NavDesktop.tsx`
- [ ] T057 [US7] Sección "Finanzas" en `settings.tsx` con links móvil
- [ ] T058 [US7] Registrar rutas en `router.tsx`
- [ ] T059 [P] [US7] QuickAction opcional en dashboard → Reportes

**Checkpoint**: quickstart §Navegación pasos 27–28.

---

## Phase 10: Polish & cross-cutting

- [ ] T060 [P] Responsive 320–1440 px en `/budgets` y `/reports`
- [ ] T061 `prefers-reduced-motion` en animaciones charts/toast
- [ ] T062 Migración/backfill `reportEmailEnabled` defaults en `migrations.ts`
- [ ] T063 Actualizar `AGENTS.md` / `SPEC.md` roadmap si aplica post-merge
- [ ] T064 Ejecutar quickstart completo + `bun run build` + `bun run lint`
- [ ] T065 Verificar prod env vars documentadas para deploy

---

## Phase 11: UI polish & export fixes (sesión 2026-07-05) ✅

**Referencia**: `implementation-notes.md`

### Reportes

- [x] T066 Icono nav Reportes → `chart-line`
- [x] T067 Scroll desktop en shell (`overflow-y` en `shell__main`, `height: 100dvh`)
- [x] T068 Border-radius cards reportes; `PeriodSwitcher` en filtros
- [x] T069 Secciones presupuestos + gastos fijos en `/reports`
- [x] T070 Tooltips gráficas (`ChartTooltip`); evolución acumulada + fix `timeSeries` backend
- [x] T071 Export CSV detallado (movimientos, presupuestos, gastos fijos, serie temporal)
- [x] T072 Export PDF programático jspdf (sin html2canvas); toasts éxito/error

### Navegación & dashboard

- [x] T073 FAB móvil/escritorio en todas las rutas autenticadas
- [x] T074 Menú «Más» móvil (Categorías, Presupuestos, Reportes, Ajustes)
- [x] T075 Quitar accesos directos redundantes en `/settings`
- [x] T076 Dashboard: card últimos movimientos a altura completa; sin scroll interno; cuentas visibles
- [x] T077 Estilos toast (`toast__close`)

### Pendiente deploy notificaciones

- [x] T078 Configurar env Convex: VAPID×3 + Resend (`RESEND_API_KEY`, `EMAIL_FROM`) — email canal pausado (`EMAIL_NOTIFICATIONS_ACTIVE=false`)
- [x] T079 `.env.local`: `VITE_VAPID_PUBLIC_KEY`
- [x] T080 QA push + cron `notifications.processDaily`; email desactivado en UI hasta reactivar dominio

**Checkpoint**: quickstart §Web Push con env vars reales. Email: reactivar flag + toggles cuando se decida el enfoque.

---

**Change 4 cerrado** ✅ (2026-07-05) — merge a `testing`. Presupuestos, gastos fijos, reportes, export CSV/PDF, push + in-app.

---

## Dependency Graph

```text
Phase 1 Setup
    ↓
Phase 2 Foundational ─────────────────────────┐
    ↓                                         │
Phase 3 US1 Presupuestos                      │
    ↓                                         │
Phase 4 US2 Gastos fijos                      │
    ↓                                         │
Phase 5 US4 Reportes (deploy B)               │
    ↓                                         │
Phase 6 US3 Alertas in-app                    │
    ↓                                         │
Phase 7 US5 Email (deploy D) ←───────────────┘
    ↓
Phase 8 US6 Push (deploy E)
    ↓
Phase 9 US7 Navegación
    ↓
Phase 10 Polish
```

## Parallel Opportunities

- T009–T011 lib modules en paralelo tras T008
- T018–T019 componentes budgets en paralelo con T016
- T028–T030 charts en paralelo
- T040–T041 notifications actions en paralelo

---

## MVP Suggestion

**Mínimo usable**: Phases 1–5 (presupuestos + gastos fijos + reportes + export).  
**Notificaciones completas**: + Phases 6–8.

**Total**: 80 tareas · 11 fases (+ polish sesión 2026-07-05)
