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

- [ ] T001 Crear `convex/lib/creditAmortization.ts` — monthlyRate, PMT, generateScheduleCuotaFija, generateScheduleCapitalConstant
- [ ] T002 Crear `convex/lib/creditRecalc.ts` — recalcAfterAbono (shorten_term / lower_installment)
- [ ] T003 Crear `convex/lib/creditDates.ts` — resolvePaymentDate (día 31 clamp), markOverdue
- [ ] T004 Crear `convex/lib/creditAmortization.test.ts` — casos QA $40M, abono $6M/año, saldo final 0
- [ ] T005 [P] Extender `convex/lib/validators.ts` — rateType, scheduleMode, reminderOffsets crédito
- [ ] T006 [P] Crear `apps/web/src/styles/credits-savings.css` + carpetas `components/credits`, `components/savings`, `lib/credits`

**Checkpoint**: `bun test` pasa amortización.

---

## Phase 2: Schema + extensiones (A)

**Purpose**: Bloquea todas las user stories.

- [ ] T007 Extender `convex/schema.ts` — tablas `credits`, `creditPayments`, `creditCapitalAbonos`, `creditDestinations`, `savingsGoals`, `savingsContributions`
- [ ] T008 Extender `accounts` — `isCreditEscrow: boolean` default false
- [ ] T009 Extender `transactions` — `creditId?`, `creditDestinationId?`, `isCreditFundMovement?`
- [ ] T010 [P] Crear stubs `convex/credits.ts`, `creditPayments.ts`, `creditCapitalAbonos.ts`, `creditDestinations.ts`, `savingsGoals.ts`, `savingsContributions.ts`

**Checkpoint**: `bunx convex dev` sin errores de schema.

---

## Phase 3: US1 — CRUD crédito + cuotas cuota_fija (B)

**Goal**: Crear crédito, generar tabla, listar, detalle cuotas.

- [ ] T011 [US1] `credits.create` / `list` / `get` — modo `cuota_fija`
- [ ] T012 [US1] `creditPayments.listByCredit` + generación en create
- [ ] T013 [US1] `creditPayments.markPaid`
- [ ] T014 [P] [US1] `CreditForm.tsx`, `CreditList.tsx`, `CreditPaymentTable.tsx`
- [ ] T015 [US1] Rutas `/credits`, `/credits/:id` — tab Cuotas
- [ ] T016 [US1] Wire Convex; validación lender/nombre libre (sin banco hardcoded)

**Checkpoint**: quickstart §1 parcial (cuota_fija).

---

## Phase 4: US2 — Abonos + simulador (C)

**Goal**: Abono capital + recálculo + proyección.

- [ ] T017 [US2] `creditCapitalAbonos.create` + list
- [ ] T018 [US2] Integrar `creditRecalc` en mutation abono
- [ ] T019 [US2] `credits.simulatePayoff`
- [ ] T020 [P] [US2] `CapitalAbonoForm.tsx`, `PayoffSimulator.tsx`
- [ ] T021 [US2] Tab **Abonos** en detalle crédito

**Checkpoint**: quickstart §4.

---

## Phase 5: US3 — Destinos / rubros (D)

**Goal**: CRUD rubros + resumen + gráfico.

- [ ] T022 [US3] `creditDestinations` CRUD + totales en `credits.get`
- [ ] T023 [P] [US3] `DestinationList.tsx`, `DestinationForm.tsx`, `DestinationChart.tsx` (Recharts lazy)
- [ ] T024 [US3] Tab **Destinos**; advertencia suma > principal

**Checkpoint**: quickstart §2.

---

## Phase 6: US4 — Fondo escrow + wizard (E)

**Goal**: Aislamiento nómina; gasto desde fondo.

- [ ] T025 [US4] `accounts.linkToCredit`; `isCreditEscrow` en create/update cuenta
- [ ] T026 [US4] `credits.fundSummary`, `listFundMovements`
- [ ] T027 [US4] `credits.spendFromFund` — wizard atómico
- [ ] T028 [US4] Modificar `dashboard.overview` — excluir escrow
- [ ] T029 [US4] Modificar `transactions.list` — `includeCreditMovements` default false
- [ ] T030 [P] [US4] `SpendFromFundWizard.tsx`, `CreditFundCard.tsx` (dashboard P2)
- [ ] T031 [US4] Tab **Movimientos**; regla no-income al vincular escrow

**Checkpoint**: quickstart §3 + §1 balance personal.

---

## Phase 7: US5–US7 — Metas ahorro (F)

**Goal**: `/savings` CRUD + aportes + linkedCreditId.

- [ ] T032 [US7] `savingsGoals` CRUD + `savingsContributions.create`
- [ ] T033 [US7] Progreso %, auto-complete ≥100%
- [ ] T034 [P] [US7] `SavingsGoalList.tsx`, `SavingsGoalForm.tsx`, `ContributionForm.tsx`
- [ ] T035 [US7] Ruta `/savings`; sugerencia abono si linkedCreditId + umbral

**Checkpoint**: quickstart §6.

---

## Phase 8: Modos manual/capital_constant + recordatorios (G)

**Goal**: Completitud VIS; alertas cuota.

- [ ] T036 [US1] Modo `capital_constant` + `manual` en create; `updateManualRow`
- [ ] T037 [US1] Import filas manual UI (sin CSV P1 opcional)
- [ ] T038 [US6] `credits.processReminders` + extender `notifications.processDaily`
- [ ] T039 [US6] Tipo `credit_due` en `notificationLog`

**Checkpoint**: quickstart §1 modo manual; recordatorio push/in-app.

---

## Phase 9: Navegación + polish (H)

**Goal**: Shell, mobile, lint.

- [ ] T040 [US8] `NavDesktop` + `NavMobile` («Más») — Créditos, Ahorros
- [ ] T041 [P] Empty states, loading, a11y tablas
- [ ] T042 `targetPayoffDate` en header crédito
- [ ] T043 Actualizar `AGENTS.md` al cerrar change
- [ ] T044 `bun run build` + `bun run lint` + quickstart completo

**Checkpoint**: Change 5 listo para merge `testing`.

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
**Total**: 44 tareas · 9 fases
