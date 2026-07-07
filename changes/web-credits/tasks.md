# Tasks: Web Credits & Savings (Change 5)

**Input**: `changes/web-credits/spec.md`, `design.md`, `research.md`, `data-model.md`, `contracts/*`, `quickstart.md`

**Prerequisites**: Changes 1–4 en base ✅ · spec/plan ✅

**Rama**: `feat/web-credits`

**Tests**: `convex/lib/creditAmortization.test.ts`; QA `quickstart.md`; `bun run build` + `bun run lint`

**Visual source of truth**: [`desing.md`](../../desing.md) + `design.md`

**Fases deployables**: A → H (ver `research.md`)

---

## Phase 1: Setup + lib amortización (A)

**Purpose**: Fundación testeable sin UI.

- [x] T001 Crear `convex/lib/creditAmortization.ts` — monthlyRate, PMT, generateScheduleCuotaFija, generateScheduleCapitalConstant
- [x] T002 Crear `convex/lib/creditRecalc.ts` — recalcAfterAbono (shorten_term / lower_installment)
- [x] T003 Crear `convex/lib/creditDates.ts` — resolvePaymentDate (día 31 clamp), markOverdue
- [x] T004 Crear `convex/lib/creditAmortization.test.ts` — casos QA $40M, abono $6M/año, saldo final 0
- [x] T005 [P] Extender `convex/lib/validators.ts` — rateType, scheduleMode, reminderOffsets crédito
- [x] T006 [P] Crear `apps/web/src/styles/credits-savings.css` + carpetas `components/credits`, `components/savings`, `lib/credits`

**Checkpoint**: `bun test` pasa amortización.

---

## Phase 2: Schema + extensiones (A)

**Purpose**: Bloquea todas las user stories.

- [x] T007 Extender `convex/schema.ts` — tablas `credits`, `creditPayments`, `creditCapitalAbonos`, `creditDestinations`, `savingsGoals`, `savingsContributions`
- [x] T008 Extender `accounts` — `isCreditEscrow: boolean` default false
- [x] T009 Extender `transactions` — `creditId?`, `creditDestinationId?`, `isCreditFundMovement?`
- [x] T010 [P] Crear stubs `convex/credits.ts`, `creditPayments.ts`, `creditCapitalAbonos.ts`, `creditDestinations.ts`, `savingsGoals.ts`, `savingsContributions.ts`

**Checkpoint**: `bunx convex dev` sin errores de schema.

---

## Phase 3: US1 — CRUD crédito + cuotas cuota_fija (B)

**Goal**: Crear crédito, generar tabla, listar, detalle cuotas.

- [x] T011 [US1] `credits.create` / `list` / `get` — modo `cuota_fija`
- [x] T012 [US1] `creditPayments.listByCredit` + generación en create
- [x] T013 [US1] `creditPayments.markPaid`
- [x] T014 [P] [US1] `CreditForm.tsx`, `CreditList.tsx`, `CreditPaymentTable.tsx`
- [x] T015 [US1] Rutas `/credits`, `/credits/:id` — tab Cuotas
- [x] T016 [US1] Wire Convex; validación lender/nombre libre (sin banco hardcoded)

**Checkpoint**: quickstart §1 parcial (cuota_fija).

---

## Phase 4: US2 — Abonos + simulador (C)

**Goal**: Abono capital + recálculo + proyección.

- [x] T017 [US2] `creditCapitalAbonos.create` + list
- [x] T018 [US2] Integrar `creditRecalc` en mutation abono
- [x] T019 [US2] `credits.simulatePayoff`
- [x] T020 [P] [US2] `CapitalAbonoForm.tsx`, `PayoffSimulator.tsx`
- [x] T021 [US2] Tab **Abonos** en detalle crédito

**Checkpoint**: quickstart §4.

---

## Phase 5: US3 — Destinos / rubros (D)

**Goal**: CRUD rubros + resumen + gráfico.

- [x] T022 [US3] `creditDestinations` CRUD + totales en `credits.get`
- [x] T023 [P] [US3] `DestinationList.tsx`, `DestinationForm.tsx`, `DestinationChart.tsx` (Recharts lazy)
- [x] T024 [US3] Tab **Destinos**; advertencia suma > principal

**Checkpoint**: quickstart §2.

---

## Phase 6: US4 — Fondo escrow + wizard (E)

**Goal**: Aislamiento nómina; gasto desde fondo.

- [x] T025 [US4] `accounts.linkToCredit`; `isCreditEscrow` en create/update cuenta
- [x] T026 [US4] `credits.fundSummary`, `listFundMovements`
- [x] T027 [US4] `credits.spendFromFund` — wizard atómico
- [x] T028 [US4] Modificar `dashboard.overview` — excluir escrow
- [x] T029 [US4] Modificar `transactions.list` — `includeCreditMovements` default false
- [x] T030 [P] [US4] `SpendFromFundWizard.tsx`, `CreditFundCard.tsx` (dashboard P2)
- [x] T031 [US4] Tab **Movimientos**; regla no-income al vincular escrow

**Checkpoint**: quickstart §3 + §1 balance personal.

---

## Phase 7: US5–US7 — Metas ahorro (F)

**Goal**: `/savings` CRUD + aportes + linkedCreditId.

- [x] T032 [US7] `savingsGoals` CRUD + `savingsContributions.create`
- [x] T033 [US7] Progreso %, auto-complete ≥100%
- [x] T034 [P] [US7] `SavingsGoalList.tsx`, `SavingsGoalForm.tsx`, `ContributionForm.tsx`
- [x] T035 [US7] Ruta `/savings`; sugerencia abono si linkedCreditId + umbral

**Checkpoint**: quickstart §6.

---

## Phase 8: Modos manual/capital_constant + recordatorios (G)

**Goal**: Completitud VIS; alertas cuota.

- [x] T036 [US1] Modo `capital_constant` + `manual` en create; `updateManualRow`
- [x] T037 [US1] Import filas manual UI (sin CSV P1 opcional)
- [x] T038 [US6] `credits.processReminders` + extender `notifications.processDaily`
- [x] T039 [US6] Tipo `credit_due` en `notificationLog`

**Checkpoint**: quickstart §1 modo manual; recordatorio push/in-app.

---

## Phase 9: Navegación + polish (H)

**Goal**: Shell, mobile, lint.

- [x] T040 [US8] `NavDesktop` + `NavMobile` («Más») — Créditos, Ahorros
- [x] T041 [P] Empty states, loading, a11y tablas
- [x] T042 `targetPayoffDate` en header crédito
- [x] T043 Actualizar `AGENTS.md` al cerrar change
- [x] T044 `bun run build` + `bun run lint` + quickstart completo

**Checkpoint**: Change 5 listo para merge `testing`.

---

## Phase 10: Iteración UX (post-plan v1.4)

**Goal**: Refinar flujos acordados en sesión 2026-07-05; alinear spec/design.

- [x] T045 Categorías fondo — `creditCategories.ts`, `fundExpenseCategoryIds`, delete vs unlink
- [x] T046 Pago cuota desde Movimientos — `creditPaymentContext`, `creditPaymentRegistration`
- [x] T047 Gasto fondo simplificado — `creditFundSpend.ts`, `creditFundContext`; sin wizard en UI Fondo
- [x] T048 `TransactionForm` — rubro, cuenta default desembolso; `TransactionRow` con `destinationName`
- [x] T049 Rubros `spentTotal` — `creditDestinations.list` + barra progreso en `DestinationList`
- [x] T050 `FieldHelp` en `CreditSettingsForm` + `FundExpenseCategoryPicker`
- [x] T051 Dashboard — `dash-credits` glass, cards internas, total gris alineado con Disponible
- [x] T052 Edición rubros por clic; toast guardar ajustes; eliminar `SpendFromFundWizard` de Fondo
- [x] T053 Actualizar `spec.md`, `design.md`, `tasks.md` con desvíos v1.5

**Checkpoint**: Documentación alineada; listo para siguientes ajustes.

---

## Phase 11: Iteración UX sesión 2026-07-07

**Goal**: Créditos flexibles, dashboard fiable, metas con gasto fijo inteligente, polish transversal.

- [x] T054 Crédito en marcha — `alreadyInProgress`, cuotas pagadas, `trackRemainingOnly`, saldo pendiente; cuentas opcionales en create
- [x] T055 `credits.create` — `startDate` opcional; validación saldo en manual in-progress
- [x] T056 Dashboard — últimos movimientos sin filtro de periodo (`convex/dashboard.ts`)
- [x] T057 Dashboard gastos fijos — widget mes calendario + `pendingTotal` alineado al periodo de métricas (`home.tsx`, `listUpcomingForPeriod`)
- [x] T058 Gastos fijos — deduplicar filas; mejor detección de pagado (`fixedExpensePayments.ts`)
- [x] T059 Metas ahorro — cálculo automático cuota mensual si hay deadline (`computeMonthlySavings.ts`, `SavingsGoalForm.tsx`)
- [x] T060 Categorías — `usageCounts` + subtítulos en `CategoryList`
- [x] T061 `formatConvexError` en créditos, presupuestos, gastos fijos
- [x] T062 JP-DS Input/FormSelect + Modal + `core.css` (métricas, overflow, tooltips)
- [x] T063 Documentar decisiones D-23–D-33 en `design.md`
- [ ] T064 Refactor manual-first créditos (P-01–P-03 en design.md)

**Checkpoint**: Build OK; manual-first créditos queda para siguiente iteración.

---

## Dependency Graph

```text
Phase 1–2 (lib + schema)
    ↓
Phase 3 US1 Crédito base
    ↓
Phase 4 US2 Abonos ←── Phase 7 US7 Metas (paralelo tras schema)
    ↓
Phase 5 US3 Destinos
    ↓
Phase 6 US4 Escrow + wizard
    ↓
Phase 8 Modos + reminders
    ↓
Phase 9 Polish
```

## Parallel Opportunities

- T005–T006 tras T001
- T014–T016 UI tras T011
- T032–T035 metas en paralelo con Phase 5–6 si 2 devs

---

## MVP Suggestion

**Mínimo usable**: Phases 1–5 (crédito + abonos + rubros).  
**Flujo usuario completo**: + Phase 6 (escrow) + Phase 7 (metas).  
**Total**: 64 tareas · 11 fases (+ P-01–P-03 pendientes)
