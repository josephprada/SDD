# Tasks: App Polish Fixes (Change 8)

**Input**: Design documents from `changes/app-polish-fixes/`

**Prerequisites**: Changes 1–7 en base ✅ · `plan.md` / `spec.md` / `design.md` / `data-model.md` / `contracts/` / `research.md` / `quickstart.md` ✅

**Rama**: `feat/app-polish-fixes`

**Tests**: Playwright E2E (US8 / FR-011) + QA `quickstart.md`; unit `bun:test` opcional en helpers; `bun run build` + `bun run lint`

**Visual source of truth**: [`desing.md`](../../desing.md) + contratos `contracts/dashboard-projection.md` / `transaction-overlay.md`

**Organization**: Tasks agrupadas por user story (US1…US8) para entrega incremental e independent testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (archivos distintos, sin depender de tareas incompletas)
- **[Story]**: US1…US8 según `spec.md`
- Incluir rutas de archivo exactas

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Arnés Playwright y scripts sin tocar aún la lógica de producto.

- [x] T001 Añadir `@playwright/test` como devDependency en `apps/web/package.json` (o raíz workspaces) e instalar browsers documentado en README/e2e
- [x] T002 [P] Crear `apps/web/playwright.config.ts` — `baseURL`, projects desktop (~1280) + mobile (≤430), según `contracts/playwright-e2e.md`
- [x] T003 [P] Crear carpeta `apps/web/e2e/` con stub `e2e/.gitkeep` y `e2e/fixtures/auth.ts` (storageState / skip claro si faltan env `E2E_*`)
- [x] T004 [P] Añadir scripts `test:e2e` y `test:e2e:ui` en `package.json` raíz (y/o `apps/web/package.json`)

**Checkpoint**: `bun run test:e2e` arranca (aunque 0 tests o skip por auth).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Helper de body-scroll lock + fallback genie. **Desbloquea** US2/US3 y evita regresiones al tocar modales.

**⚠️ CRITICAL**: Completar antes de US2/US3 (recomendado también antes de E2E de modal).

- [x] T005 Crear helper de ref-count `lockBodyScroll` / `unlockBodyScroll` en `apps/web/src/lib/core/bodyScrollLock.ts` (o path alineado a `lib/core/`)
- [x] T006 Integrar el helper en `apps/web/src/components/ui/Modal.tsx` (reemplazar set directo de `document.body.style.overflow`)
- [x] T007 Integrar el mismo helper en `apps/web/src/components/ui/ConfirmDialog.tsx`
- [x] T008 Añadir timeout fallback de unmount en `apps/web/src/lib/core/useOverlayAnimation.ts` si no llega `animationend` (genie stuck)
- [x] T009 [P] (Opcional) Unit test del ref-count en `apps/web/src/lib/core/bodyScrollLock.test.ts` o `convex`-style `bun:test` si el helper es puro

**Checkpoint**: Abrir Modal+Confirm anidados y cerrar ambos deja `overflow` restaurado; genie no deja overlay fantasma tras timeout.

---

## Phase 3: User Story 1 — Proyección fijos + jerarquía (Priority: P1) 🎯 MVP

**Goal**: “Si pagas fijos pendientes” = disponible − pendingTotal, con mayor relevancia visual que el neto (desktop + móvil).

**Independent Test**: quickstart US1 + E2E-01; D − P visible; proyección primaria vs neto.

### Tests for User Story 1

- [x] T010 [P] [US1] Escribir E2E `apps/web/e2e/dashboard-fixed-projection.spec.ts` (cálculo + jerarquía DOM/CSS primaria) — debe fallar antes del fix

### Implementation for User Story 1

- [x] T011 [US1] Corregir fórmula en `apps/web/src/routes/home.tsx` — `projectedValue = totalBalance - pendingFixedExpenses` (no `net - …`)
- [x] T012 [US1] Pasar `totalBalance` (o proyección ya calculada) a `MonthOverview` y corregir fórmula en `apps/web/src/components/dashboard/MonthOverview.tsx`
- [x] T013 [US1] Ajustar `MetricCard` / markup en `apps/web/src/components/dashboard/MetricCard.tsx` para soportar proyección primaria + neto secundario cuando P&gt;0 (`contracts/dashboard-projection.md`)
- [x] T014 [US1] Actualizar estilos en `apps/web/src/styles/core.css` (`.metric-card__*`, `.month-overview__*`) — proyección tipografía primaria; neto muted/secundario; tokens JP-DS
- [x] T015 [US1] Verificar viewport móvil overview + desktop metrics; ocultar proyección si P=0

**Checkpoint**: US1 usable en Home sin tocar modal/MCP.

---

## Phase 4: User Story 2 — Modal desde Home sin navegar (Priority: P1)

**Goal**: Editar movimiento desde dashboard sin ir a `/transactions`; sin overlays residuales.

**Independent Test**: quickstart US2 + E2E-02; pathname Home; 0 modales al cerrar.

### Tests for User Story 2

- [x] T016 [P] [US2] Escribir E2E `apps/web/e2e/home-edit-transaction.spec.ts` — open desde Home, assert URL no `/transactions`

### Implementation for User Story 2

- [x] T017 [US2] Auditar `apps/web/src/components/dashboard/RecentTransactionsList.tsx` + `home.tsx` + `stores/transactionModal.ts` — garantizar solo `openEdit(id)` sin `navigate`
- [x] T018 [US2] Revisar `apps/web/src/components/transactions/TransactionModalHost.tsx` + `Shell.tsx` — cierre limpio store; sin deep-link accidental a `/transactions` desde Home
- [x] T019 [US2] Asegurar cleanup de query params / overlays al cerrar desde Home en `TransactionModalHost.tsx`

**Checkpoint**: Flujo Home → edit → close estable en desktop (base para US3).

---

## Phase 5: User Story 3 — Scroll tras eliminar (Priority: P1)

**Goal**: Tras eliminar movimiento en móvil, el scroll vuelve a funcionar.

**Independent Test**: quickstart US3 + E2E-05 (si estable); body no queda `overflow: hidden`.

### Tests for User Story 3

- [ ] T020 [P] [US3] Escribir E2E móvil `apps/web/e2e/mobile-delete-scroll.spec.ts` (o proyecto mobile en config) — delete + assert scroll/unlock

### Implementation for User Story 3

- [x] T021 [US3] Ordenar flujo delete en `TransactionModalHost.tsx` — confirm close → modal close → unlock (usar helper T005)
- [x] T022 [US3] Verificar ciclos open→delete→close repetidos no acumulan locks; ajustar ConfirmDialog/Modal si hace falta

**Checkpoint**: US2+US3 verdes en móvil real o Playwright mobile.

---

## Phase 6: User Story 4 — Sin autofocus monto en edit (Priority: P2)

**Goal**: Abrir edición no enfoca el campo monto.

**Independent Test**: quickstart US4 + E2E-03.

### Tests for User Story 4

- [x] T023 [P] [US4] Escribir/ampliar E2E assert `activeElement` ≠ amount input en edit (`apps/web/e2e/…` o spec dedicado)

### Implementation for User Story 4

- [x] T024 [US4] Condicionar autofocus en `apps/web/src/components/transactions/TransactionForm.tsx` — solo create (`!transactionId`); edit sin `focus()`/`select()` al monto

**Checkpoint**: Edit revisable sin teclado saltando al monto.

---

## Phase 7: User Story 5 — Toasts + push (Priority: P1)

**Goal**: No spam de toasts al entrar; push reparado hacia bandeja del SO cuando corresponda.

**Independent Test**: quickstart US5; recarga con historial → 0 toasts; push smoke documentado.

### Implementation for User Story 5

- [x] T025 [US5] Cambiar `apps/web/src/components/notifications/NotificationListener.tsx` — seed `seenRef` / cursor en primer fetch **sin** toast; solo deltas posteriores (`contracts/notifications.md`)
- [x] T026 [P] [US5] Persistir cursor opcional en `sessionStorage` desde el listener o helper `apps/web/src/lib/notifications/toastCursor.ts`
- [x] T027 [US5] En `convex/notificationActions.ts` — al resultado `gone`, eliminar/desactivar suscripción en `pushSubscriptions`
- [x] T028 [P] [US5] Auditar `apps/web/src/lib/push/registerPush.ts`, `apps/web/src/sw.ts` y env VAPID; documentar gaps en `changes/app-polish-fixes/quickstart.md` / notas de design si iOS limitado
- [ ] T029 [US5] (Opcional E2E) Smoke “no toasts al load” en `apps/web/e2e/notifications-toast.spec.ts` si fixtures lo permiten

**Checkpoint**: Login/recarga silenciosa; path push verificado o limitaciones documentadas.

---

## Phase 8: User Story 6 — Adjuntos al crear (Priority: P2)

**Goal**: UI de adjuntar en create; subir tras crear la transacción.

**Independent Test**: quickstart US6 + E2E-04.

### Tests for User Story 6

- [x] T030 [P] [US6] E2E `apps/web/e2e/create-transaction-attachments.spec.ts` — control adjuntar visible en create

### Implementation for User Story 6

- [x] T031 [US6] Exponer sección adjuntos sin `transactionId` en `TransactionForm.tsx` (cola local de `File[]`)
- [x] T032 [US6] Extender `AttachmentUploader.tsx` y/o host para modo “pending files” (mismos MIME/size que edit)
- [x] T033 [US6] En `TransactionModalHost.tsx` (create path) — tras `createTx`, subir pending files y manejar error parcial con feedback

**Checkpoint**: Create+adjunto en un solo flujo.

---

## Phase 9: User Story 7 — MCP list_fixed_expenses (Priority: P2)

**Goal**: Tool MCP con items + `pendingTotal` alineado al dashboard (`read:budgets`).

**Independent Test**: quickstart US7 / curl RPC / cliente MCP.

### Implementation for User Story 7

- [x] T034 [US7] Implementar handler `list_fixed_expenses` en `convex/agentGateway.ts` reutilizando lógica de `fixedExpenses.listUpcomingForPeriod` (`contracts/mcp-fixed-expenses.md`)
- [x] T035 [US7] Registrar tool en catálogo/dispatch del gateway + scope `read:budgets`
- [x] T036 [P] [US7] Registrar tool en `apps/mcp-server/src/tools/read.ts` (+ wire en index/http si aplica)
- [ ] T037 [P] [US7] Actualizar docs contrato espejo si hace falta (`changes/mcp-access/contracts/mcp-tools.md` nota de extensión o solo change 8)

**Checkpoint**: Agente obtiene `pendingTotal` coherente con Home.

---

## Phase 10: User Story 8 — Arnés Playwright completo (Priority: P2)

**Goal**: Suite documentada y verde para escenarios mínimos FR-011.

**Independent Test**: `bun run test:e2e` pasa en entorno con auth fixture.

### Implementation for User Story 8

- [x] T038 [US8] Completar fixtures auth + README corto en `apps/web/e2e/README.md` (comando, env, storageState)
- [x] T039 [US8] Asegurar cobertura E2E-01…E2E-04 (y E2E-05 si estable) según `contracts/playwright-e2e.md`
- [x] T040 [US8] Actualizar `changes/app-polish-fixes/quickstart.md` con comandos reales post-implementación

**Checkpoint**: US8 cierra el change a nivel calidad automatizada UI.

---

## Phase 11: Polish & Cross-Cutting

**Purpose**: Cierre SDD, lint/build, contexto agentes.

- [ ] T041 [P] Actualizar `AGENTS.md` / `.cursor/rules/specify-rules.mdc` — Change 8 implementado / checklist remaining
- [ ] T042 [P] Marcar checklist QA en `changes/app-polish-fixes/quickstart.md` tras pasada manual
- [ ] T043 Ejecutar `bun run lint` + `bun run build` y corregir regresiones del change
- [ ] T044 Revisar `changes/app-polish-fixes/design.md` si hubo desviaciones (notas breves)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (1)**: Inmediato — Playwright scaffold
- **Foundational (2)**: Bloquea US2/US3 (modal/scroll); recomendado antes de E2E modal
- **US1 (3)**: Tras Setup (E2E stub); independiente de modal
- **US2 (4)**: Tras Phase 2
- **US3 (5)**: Tras US2 / Phase 2
- **US4 (6)**: Independiente (solo TransactionForm); puede paralelizar tras Setup
- **US5 (7)**: Independiente de proyección/modal
- **US6 (8)**: Independiente; toca form/host create
- **US7 (9)**: Independiente (Convex + mcp-server)
- **US8 (10)**: Tras specs E2E de US1–US6 escritas e implementación lista
- **Polish (11)**: Tras stories deseadas

### User Story Dependencies

```text
Phase2 (lock)
   ├─ US2 ─→ US3
   ├─ US1 (paralelo)
   ├─ US4 (paralelo)
   ├─ US5 (paralelo)
   ├─ US6 (paralelo)
   └─ US7 (paralelo)
         └─ US8 (agrega/verde suite)
```

### Parallel Opportunities

- T002–T004 en Setup  
- US1 + US4 + US5 + US6 + US7 en paralelo tras Phase 2 (distintos archivos)  
- T036/T037 MCP server vs gateway  
- E2E specs [P] por story mientras se implementa  

---

## Parallel Example: Post–Foundation

```bash
# Developer A
US1: T010–T015 home/MonthOverview/MetricCard/CSS

# Developer B
US2+US3: T016–T022 TransactionModalHost + E2E modal/scroll

# Developer C
US5 + US7: NotificationListener + agentGateway list_fixed_expenses
```

---

## Implementation Strategy

### MVP First

1. Phase 1–2  
2. **US1** (proyección + jerarquía) → demo Home  
3. **US2+US3** (modal/scroll) → desbloquea móvil  

### Incremental

4. US4 autofocus → US6 adjuntos → US5 notifs → US7 MCP  
5. US8 verde E2E + Phase 11 polish  

### Suggested MVP scope

**US1 + Phase 2 + US2/US3** = valor percibido inmediato en Home y bugs bloqueantes.

---

## Notes

- Tests Playwright pedidos explícitamente en spec (US8 / FR-011): incluir y preferir rojo→verde por story.  
- Push OS real puede quedar parcialmente documentado si el entorno E2E no lo cubre (SC-005 manual).  
- Commits: preferir por story o fase lógica.  
- No schema Convex nuevo (research R-09).  
