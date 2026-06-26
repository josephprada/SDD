# Tasks: Web Core (Change 2)

**Input**: `changes/web-core/spec.md`, `design.md`, `research.md`, `data-model.md`, `contracts/convex-api.md`, `quickstart.md`, `ui-ux.md`, `designs/design-brief.md`, `designs/webcore.pen`

**Prerequisites**: `web-foundation` completado ✅ · spec/design/data-model/contracts ✅ · artboards Pencil base + estados secundarios ✅

**Visual source of truth**: [`desing.md`](../../desing.md) + `changes/web-core/designs/webcore.pen`

**Tests**: No hay solicitud explícita de TDD. Se omiten tareas formales de test-first; se incluyen validaciones manuales, `bun run build`, `bun run lint` y checks del `quickstart.md`.

**Nota de implementación**: mantener `accounts.balance` denormalizado y actualizado solo desde mutations de dominio; validar ownership en todas las queries/mutations Convex.

**Extension Hooks**:

**Optional Pre-Hook**: git  
Command: `/speckit.git.commit`  
Description: Auto-commit before task generation  
Prompt: Commit outstanding changes before task generation?  
To execute manually: `/speckit.git.commit`

---

## Phase 1: Setup (Estructura Core)

**Purpose**: Preparar rutas, carpetas, helpers y contratos de UI compartidos para implementar dominios core.

- [ ] T001 Crear estructura de carpetas core en `apps/web/src/components/{dashboard,accounts,transactions,categories,attachments}/`
- [ ] T002 [P] Crear rutas placeholder `apps/web/src/routes/accounts.tsx`, `apps/web/src/routes/transactions.tsx`, `apps/web/src/routes/categories.tsx`
- [ ] T003 [P] Crear helpers de moneda COP en `apps/web/src/lib/format/currency.ts`
- [ ] T004 [P] Crear helpers de fecha/rango mensual en `apps/web/src/lib/format/date.ts`
- [ ] T005 [P] Crear constantes de iconografía core en `apps/web/src/lib/core/icons.ts` (`house`, `arrow-down-up`, `wallet`, `tags`, `settings`)
- [ ] T006 Crear tipos compartidos de formularios/filtros en `apps/web/src/lib/core/types.ts`
- [ ] T007 Actualizar `apps/web/src/routes/router.tsx` para registrar `/accounts`, `/transactions`, `/categories`

**Checkpoint**: Las rutas core existen y renderizan placeholders protegidos dentro del shell.

---

## Phase 2: Foundational (Convex Schema + Utilidades Bloqueantes)

**Purpose**: Extender schema y helpers de dominio. Esta fase bloquea todas las historias.

⚠️ Ninguna US debe empezar hasta completar esta fase.

- [ ] T008 Modificar `convex/schema.ts` para añadir tabla `accounts` con índices `by_user`, `by_user_archived`
- [ ] T009 Modificar `convex/schema.ts` para añadir tabla `transactions` con índices `by_user`, `by_user_date`, `by_user_account`, `by_user_category`
- [ ] T010 Modificar `convex/schema.ts` para añadir tabla `attachments` con índices `by_user`, `by_entity`
- [ ] T011 Modificar `convex/schema.ts` para extender `categories` con `archived`, `isSystem`, `updatedAt`, `archivedAt` e índices por tipo/archived
- [ ] T012 Modificar `convex/seed.ts` para asegurar categorías default con `archived: false`, `isSystem`, `updatedAt` y categoría sistema `Transferencia`
- [ ] T013 Crear helpers de auth/ownership en `convex/lib/auth.ts` para resolver usuario autenticado y validar ownership
- [ ] T014 Crear validadores de dominio en `convex/lib/validators.ts` para tipos de cuenta, categoría, transacción, adjunto y enteros COP
- [ ] T015 Crear helpers de saldo en `convex/lib/balance.ts` para calcular deltas `income`, `expense`, `transfer`
- [ ] T016 Crear mutation dev opcional `convex/migrations.ts` para backfill de categorías existentes (`archived`, `isSystem`, `updatedAt`)

**Checkpoint**: `bunx convex dev` genera tipos sin errores y los tipos `_generated` reflejan las tablas nuevas.

---

## Phase 3: User Story 1 — Gestión de Cuentas (Priority: P1) 🎯 MVP

**Goal**: Crear, listar, editar y archivar cuentas con saldo inicial y saldo visible, incluyendo saldos negativos permitidos.

**Independent Test**: Crear cuenta `Efectivo` con `$ 100.000`; editar nombre/tipo; archivar cuenta y confirmar que no aparece en selectores nuevos.

### Implementation

- [ ] T017 [US1] Crear `convex/accounts.ts` con query `list({ includeArchived })` ordenada por `createdAt`
- [ ] T018 [US1] Implementar mutation `accounts.create` en `convex/accounts.ts` con `initialBalance` default `$ 0` y `balance = initialBalance`
- [ ] T019 [US1] Implementar mutation `accounts.update` en `convex/accounts.ts` sin alterar `balance`
- [ ] T020 [US1] Implementar mutation `accounts.archive` en `convex/accounts.ts` con soft delete y `archivedAt`
- [ ] T021 [P] [US1] Crear `apps/web/src/components/accounts/AccountCard.tsx` con estado visual para saldo negativo
- [ ] T022 [P] [US1] Crear `apps/web/src/components/accounts/AccountForm.tsx` con validación de nombre y saldo inicial
- [ ] T023 [P] [US1] Crear `apps/web/src/components/accounts/AccountList.tsx` con empty state y grid responsive
- [ ] T024 [US1] Implementar `apps/web/src/routes/accounts.tsx` conectando `accounts.list/create/update/archive`
- [ ] T025 [US1] Añadir acción `Crear cuenta` y link `Ver todas las cuentas` desde dashboard/components hacia `/accounts`

**Checkpoint**: `/accounts` permite CRUD básico de cuentas y muestra saldos en formato COP.

---

## Phase 4: User Story 2 — Gestión de Categorías (Priority: P1)

**Goal**: Crear, editar y archivar categorías por tipo, protegiendo categorías de sistema.

**Independent Test**: Crear categoría `Mascotas` de gasto; bloquear duplicado `Comida`; bloquear editar/archivar `Transferencia`.

### Implementation

- [ ] T026 [US2] Crear `convex/categories.ts` con query `list({ type, includeArchived })`
- [ ] T027 [US2] Implementar mutation `categories.create` en `convex/categories.ts` con validación de duplicado activo por `userId + type`
- [ ] T028 [US2] Implementar mutation `categories.update` en `convex/categories.ts` bloqueando `isSystem`
- [ ] T029 [US2] Implementar mutation `categories.archive` en `convex/categories.ts` bloqueando `isSystem` y preservando históricos
- [ ] T030 [P] [US2] Crear `apps/web/src/components/categories/CategoryList.tsx` con segmented control `Gastos/Ingresos/Transferencias`
- [ ] T031 [P] [US2] Crear `apps/web/src/components/categories/CategoryForm.tsx` con selector visual de icono/color y errores de duplicado
- [ ] T032 [P] [US2] Crear `apps/web/src/components/categories/ArchiveCategoryDialog.tsx` con copy de preservación histórica
- [ ] T033 [US2] Implementar `apps/web/src/routes/categories.tsx` conectando list/create/update/archive
- [ ] T034 [US2] Hacer que categorías archivadas no aparezcan en selectores de nuevos movimientos en `apps/web/src/components/transactions/TransactionForm.tsx`

**Checkpoint**: `/categories` permite gestión completa y respeta categorías sistema/archivadas.

---

## Phase 5: User Story 3 — Movimientos y Transferencias (Priority: P1)

**Goal**: Registrar, editar, eliminar, buscar y filtrar ingresos/gastos/transferencias ajustando saldos por delta.

**Independent Test**: Crear gasto `$ 25.000`, editarlo a `$ 40.000`, eliminarlo; transferir `$ 20.000` entre cuentas y verificar ambos saldos.

### Implementation

- [ ] T035 [US3] Crear `convex/transactions.ts` con query `list` para fecha, cuenta, categoría, monto, búsqueda textual y `limit`
- [ ] T036 [US3] Crear query `transactions.recent` en `convex/transactions.ts` con default `5` y máximo `20`
- [ ] T037 [US3] Implementar mutation `transactions.create` en `convex/transactions.ts` validando amount, ownership, categoría compatible y deltas
- [ ] T038 [US3] Implementar mutation `transactions.update` en `convex/transactions.ts` revirtiendo delta anterior y aplicando delta nuevo
- [ ] T039 [US3] Implementar mutation `transactions.remove` en `convex/transactions.ts` revirtiendo saldo y eliminando adjuntos asociados
- [ ] T040 [US3] Implementar validación de transferencia origen ≠ destino en `convex/transactions.ts`
- [ ] T041 [P] [US3] Crear `apps/web/src/components/transactions/TransactionFilters.tsx` con search, chips y filtros inline desktop
- [ ] T042 [P] [US3] Crear `apps/web/src/components/transactions/TransactionList.tsx` con cards mobile y tabla desktop
- [ ] T043 [P] [US3] Crear `apps/web/src/components/transactions/TransactionForm.tsx` con tipo, monto, fecha, cuentas, categoría visual, nota y validaciones
- [ ] T044 [P] [US3] Crear `apps/web/src/components/accounts/TransferForm.tsx` para transferencia origen/destino
- [ ] T045 [US3] Implementar `apps/web/src/routes/transactions.tsx` conectando list/create/update/remove y estados sin resultados
- [ ] T046 [US3] Integrar FAB mobile del shell/dashboard con action sheet `Gasto/Ingreso/Transferir` en `apps/web/src/components/transactions/QuickActionSheet.tsx`

**Checkpoint**: `/transactions` permite registrar y corregir movimientos; saldos se mantienen consistentes.

---

## Phase 6: User Story 4 — Dashboard Real (Priority: P1)

**Goal**: Reemplazar home placeholder por dashboard con balance total, resumen mensual, selector de mes, cuentas activas, recientes y acciones rápidas.

**Independent Test**: Con cuentas/transacciones creadas, abrir `/` y verificar balance agregado, ingresos/gastos del mes, recientes y acciones precargadas.

### Implementation

- [ ] T047 [US4] Crear `convex/dashboard.ts` con query `overview({ monthStart, monthEnd, recentLimit })`
- [ ] T048 [US4] Agregar agregación mensual en `convex/dashboard.ts` usando transacciones del rango seleccionado
- [ ] T049 [US4] Asegurar que `dashboard.overview` excluye cuentas archivadas de `activeAccounts`
- [ ] T050 [P] [US4] Crear `apps/web/src/components/dashboard/DashboardBalanceCard.tsx`
- [ ] T051 [P] [US4] Crear `apps/web/src/components/dashboard/MonthSwitcher.tsx` con navegación mes anterior/siguiente
- [ ] T052 [P] [US4] Crear `apps/web/src/components/dashboard/MonthOverview.tsx` con barras proporcionales Ingresos/Gastos y Neto
- [ ] T053 [P] [US4] Crear `apps/web/src/components/dashboard/RecentTransactionsList.tsx`
- [ ] T054 [P] [US4] Crear `apps/web/src/components/dashboard/QuickActions.tsx` para desktop y mapping del FAB mobile
- [ ] T055 [US4] Reemplazar placeholder en `apps/web/src/routes/home.tsx` por dashboard real conectado a `dashboard.overview`
- [ ] T056 [US4] Implementar empty state de dashboard sin cuentas en `apps/web/src/routes/home.tsx`

**Checkpoint**: `/` refleja datos reales y permite cambiar el mes visualizado sin afectar el balance total.

---

## Phase 7: User Story 5 — Adjuntos de Movimientos (Priority: P2)

**Goal**: Subir, listar, previsualizar/descargar y eliminar imágenes/PDF por transacción con límite 5 y 10 MB.

**Independent Test**: Adjuntar JPEG válido, ver preview; adjuntar PDF y descargar; rechazar `.docx` y archivo >10 MB; eliminar adjunto y confirmar storage/metadata.

### Implementation

- [ ] T057 [US5] Crear `convex/attachments.ts` con mutation `generateUploadUrl`
- [ ] T058 [US5] Implementar query `attachments.listByTransaction` en `convex/attachments.ts` validando ownership
- [ ] T059 [US5] Implementar mutation `attachments.create` en `convex/attachments.ts` validando MIME, tamaño, ownership y máximo 5 adjuntos
- [ ] T060 [US5] Implementar mutation `attachments.remove` en `convex/attachments.ts` borrando metadata y archivo de storage
- [ ] T061 [US5] Implementar query `attachments.getUrl` en `convex/attachments.ts`
- [ ] T062 [P] [US5] Crear `apps/web/src/components/attachments/AttachmentUploader.tsx` con validación cliente de tipo/tamaño/límite
- [ ] T063 [P] [US5] Crear `apps/web/src/components/attachments/AttachmentList.tsx` con preview imagen, PDF y eliminación
- [ ] T064 [US5] Integrar `AttachmentUploader` y `AttachmentList` en `apps/web/src/components/transactions/TransactionForm.tsx`
- [ ] T065 [US5] Integrar eliminación de adjuntos al eliminar transacción en `convex/transactions.ts`

**Checkpoint**: Los adjuntos funcionan dentro del detalle/formulario de movimiento y respetan validaciones de cliente y servidor.

---

## Phase 8: Shell, Navegación y Estados Cruzados

**Purpose**: Conectar navegación core, componentes compartidos y estados comunes derivados del diseño Pencil.

- [ ] T066 Actualizar `apps/web/src/components/shell/NavMobile.tsx` con Inicio `house`, Movimientos `arrow-down-up`, Cuentas `wallet`, Más `ellipsis` y FAB central
- [ ] T067 Actualizar `apps/web/src/components/shell/NavDesktop.tsx` con usuario arriba, navegación core y marca según `public/icon.svg`
- [ ] T068 Crear `apps/web/src/components/ui/EmptyState.tsx` para dashboard/listas vacías
- [ ] T069 Crear `apps/web/src/components/ui/ConfirmDialog.tsx` para archivar categoría/cuenta y eliminar movimientos/adjuntos
- [ ] T070 Crear `apps/web/src/components/ui/FieldError.tsx` o patrón equivalente para errores con `aria-describedby`
- [ ] T071 Crear `apps/web/src/components/ui/SegmentedControl.tsx` si se reutiliza en transacciones/categorías
- [ ] T072 Crear `apps/web/src/components/ui/CategoryChoice.tsx` para selección visual de categorías con seleccionada primero

**Checkpoint**: Mobile y desktop comparten navegación/iconografía y estados visuales consistentes.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Validación responsive, accesibilidad, performance y cierre de documentación.

- [ ] T073 Validar manualmente flujo `quickstart.md` completo en `http://localhost:5173`
- [ ] T074 Ejecutar `bun run build` desde raíz y corregir errores de TypeScript/build
- [ ] T075 Ejecutar `bun run lint` desde raíz y corregir errores introducidos
- [ ] T076 Revisar responsive 320/375/768/1024/1280 en Dashboard, Movimientos, Cuentas, Categorías y Adjuntos
- [ ] T077 Verificar accesibilidad de formularios en `apps/web/src/components/{accounts,transactions,categories,attachments}/` (labels, foco, `aria-describedby`)
- [ ] T078 Verificar que estados negativos no dependan solo de color en `AccountCard`, `MonthOverview` y listas de movimientos
- [ ] T079 Verificar `prefers-reduced-motion` en formularios/dialogs/action sheet según `ui-ux.md`
- [ ] T080 Actualizar `changes/web-core/quickstart.md` con cualquier ajuste real del flujo QA post-implementación
- [ ] T081 Actualizar `changes/web-core/spec.md` con decisiones de implementación si se desvía del diseño aprobado
- [ ] T082 Revisar `changes/web-core/designs/design-brief.md` y marcar cualquier variante no implementada

---

## Dependencies & Execution Order

### Phase Dependencies

```text
Phase 1 (Setup)
  → Phase 2 (Foundational)
    → US1 Accounts ∥ US2 Categories
      → US3 Transactions/Transfers
        → US4 Dashboard ∥ US5 Attachments
          → Phase 8 Shell/Estados
            → Phase 9 Polish
```

- **Phase 2** bloquea todas las US porque define schema, ownership, validadores y deltas.
- **US1 Accounts** y **US2 Categories** pueden avanzar en paralelo tras Phase 2.
- **US3 Transactions** depende de cuentas/categorías activas y de sus invariantes.
- **US4 Dashboard** depende de datos de cuentas/transacciones, pero sus componentes UI pueden empezar en paralelo.
- **US5 Attachments** depende de transacciones para ownership, pero uploader/lista pueden empezar en paralelo.

### User Story Dependencies

| Story | Depende de | Entrega independiente |
|-------|------------|----------------------|
| US1 cuentas | Phase 2 | ✅ `/accounts` CRUD + saldos |
| US2 categorías | Phase 2 | ✅ `/categories` CRUD + protección sistema |
| US3 movimientos | US1, US2 | ✅ `/transactions` CRUD + saldos correctos |
| US4 dashboard | US1, US3 | ✅ `/` dashboard real |
| US5 adjuntos | US3 | ✅ adjuntos en detalle/form movimiento |

### Parallel Opportunities

```bash
# Setup helpers en paralelo
T002, T003, T004, T005

# Foundational helpers en paralelo tras schema
T013, T014, T015

# Tras Phase 2
T017-T025  # US1 cuentas
T026-T034  # US2 categorías

# UI de movimientos en paralelo con backend transactions
T041, T042, T043, T044

# UI dashboard en paralelo con dashboard.overview
T050, T051, T052, T053, T054

# Adjuntos UI en paralelo con backend attachments
T062, T063
```

---

## Implementation Strategy

### MVP First

1. Completar Phase 1 + Phase 2.
2. Completar US1 cuentas y US2 categorías.
3. Completar US3 movimientos/transferencias.
4. **STOP & VALIDATE**: quickstart pasos 1–10 (cuenta → gasto → editar → transferencia).
5. Implementar US4 dashboard real.
6. Implementar US5 adjuntos.

### Entrega Incremental

1. **Cuentas + Categorías**: base operativa de selectores y formularios.
2. **Movimientos**: libro de transacciones con saldos correctos.
3. **Dashboard**: lectura rápida y acciones.
4. **Adjuntos**: evidencia documental.
5. **Polish**: responsive, a11y, QA y documentación.

### Commit Sugerido (cuando el usuario lo pida)

- Commit 1: schema + helpers Convex.
- Commit 2: cuentas + categorías.
- Commit 3: movimientos + transferencias.
- Commit 4: dashboard.
- Commit 5: adjuntos + polish.

---

## Notes

- Diseño visual aprobado en `changes/web-core/designs/webcore.pen`; no introducir galaxia en pantallas autenticadas.
- Marca: usar `public/icon.svg` como fuente de verdad del logo.
- Mobile: acciones de movimiento desde FAB central; desktop: panel `Acciones rápidas`.
- Categoría en formularios: selector visual de icono + nombre; la seleccionada se muestra primero.
- Saldos negativos permitidos en MVP para `cash`, `bank` y `credit`, con señal visual.
- Adjuntos: máximo 5 por transacción, 10 MB por archivo, tipos `image/jpeg`, `image/png`, `application/pdf`.
- Hooks opcionales de Spec Kit (`speckit.git.commit`) disponibles antes/después de tasks; no ejecutados porque los commits solo se realizan por solicitud explícita.

---

## Extension Hooks

**Optional Hook**: git  
Command: `/speckit.git.commit`  
Description: Auto-commit after task generation  
Prompt: Commit task changes?  
To execute manually: `/speckit.git.commit`
