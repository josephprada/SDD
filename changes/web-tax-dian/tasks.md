# Tasks: Web Tax DIAN (Change 6)

**Input**: Design documents from `changes/web-tax-dian/`

**Prerequisites**: Changes 1–5 en base ✅ · `plan.md` / `spec.md` / `design.md` / `data-model.md` / `contracts/` / `research.md` / `quickstart.md` ✅

**Rama**: `feat/web-tax-dian`

**Tests**: libs puras `taxTotals` / `taxSuggest` con `bun test` si aplica; QA `quickstart.md`; `bun run build` + `bun run lint`

**Visual source of truth**: [`desing.md`](../../desing.md) + [`design.md`](./design.md)

**Fases deployables**: A → F (ver `research.md`)

**Organization**: Tasks agrupadas por user story para entrega incremental e independent testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (archivos distintos, sin depender de tareas incompletas)
- **[Story]**: US1…US5 según `spec.md`
- Incluir rutas de archivo exactas

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Carpetas, tipos y catálogos compartidos sin schema aún.

- [x] T001 Crear carpetas `apps/web/src/components/tax/`, `apps/web/src/lib/tax/` y stub `apps/web/src/styles/tax.css`
- [x] T002 [P] Crear tipos `TaxSection`, `TaxStatus`, `TaxSourceType` y labels en `apps/web/src/lib/tax/types.ts`
- [x] T003 [P] Crear catálogo de categorías DIAN v1 (keys + labels ES) en `apps/web/src/lib/tax/categories.ts` y espejo `convex/lib/taxCategories.ts`
- [x] T004 [P] Crear helpers de totales puros en `convex/lib/taxTotals.ts` (sumas por sección + `grandTotal`)

**Checkpoint**: Tipos y catálogos importables; sin UI todavía.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema + módulos Convex base. **Bloquea** todas las user stories.

**⚠️ CRITICAL**: No empezar US hasta completar esta fase.

- [x] T005 Extender `convex/schema.ts` — tablas `taxDocuments`, `taxItems` con indexes `by_user`, `by_user_year`, `by_document`, `by_document_section` (ver `data-model.md`)
- [x] T006 Extender `attachments` en `convex/schema.ts` — `entityType: "transaction" | "taxItem"` y `entityId` compatible (`v.string()` o estrategia D-05 en `design.md`); mantener queries de transacciones
- [x] T007 [P] Extender `convex/lib/validators.ts` — `taxSection`, `taxStatus`, `taxSourceType`, rango `taxYear`
- [x] T008 [P] Crear stubs `convex/taxDocuments.ts`, `convex/taxItems.ts`, `convex/taxSuggestions.ts`
- [x] T009 Actualizar ownership/helpers en `convex/lib/auth.ts` (o módulo dedicado) — `requireTaxDocumentOwnership`, `requireTaxItemOwnership`
- [x] T010 Verificar `bunx convex dev` / codegen sin errores de schema tras T005–T009

**Checkpoint**: Foundation ready — user stories pueden comenzar.

---

## Phase 3: User Story 1 — Crear y gestionar declaración anual (Priority: P1) 🎯 MVP

**Goal**: Crear documento por año, listar, CRUD de rubros por sección, totales visibles.

**Independent Test**: Crear declaración 2025, añadir rubros en Ingresos y Deducciones, ver totales; editar/eliminar rubro.

### Implementation for User Story 1

- [x] T011 [US1] Implementar `taxDocuments.create` / `list` / `get` / `remove` en `convex/taxDocuments.ts` (unicidad año, soft null en get)
- [x] T012 [US1] Implementar `taxItems.create` / `update` / `remove` / `listByDocument` en `convex/taxItems.ts` (validar categoría∈sección, amount≥1, cascade no-adjuntos aún)
- [x] T013 [US1] Integrar `taxTotals` en `list`/`get` para devolver `SectionTotals` + `itemCount`
- [x] T014 [P] [US1] Crear `TaxDocumentList.tsx` y `TaxDocumentCreateForm.tsx` en `apps/web/src/components/tax/`
- [x] T015 [P] [US1] Crear `TaxSectionPanel.tsx`, `TaxItemForm.tsx`, `TaxItemRow.tsx` en `apps/web/src/components/tax/`
- [x] T016 [US1] Crear rutas `apps/web/src/routes/tax.tsx` (listado) y `apps/web/src/routes/tax-detail.tsx` (secciones + CRUD)
- [x] T017 [US1] Registrar rutas `/tax` y `/tax/:documentId` en el router de la app (`apps/web/src/` — archivo de rutas existente)
- [x] T018 [US1] Estilos mobile-first en `apps/web/src/styles/tax.css` + import en entry de estilos; wire Convex en list/detalle
- [x] T019 [US1] Bloquear montos inválidos y mostrar errores amigables vía `formatConvexError` en formularios tax

**Checkpoint**: quickstart §1 y §2 (rubros manuales) — MVP usable sin adjuntos ni sugerencias.

---

## Phase 4: User Story 2 — Adjuntos por rubro (Priority: P1)

**Goal**: Subir/listar/abrir/eliminar JPEG/PNG/PDF por `taxItem`.

**Independent Test**: En un rubro, subir PDF + JPEG, previsualizar, eliminar uno; rechazar tipo inválido.

### Implementation for User Story 2

- [x] T020 [US2] Extender `convex/attachments.ts` — `listByTaxItem`, `createForTaxItem`; adaptar `remove` / ownership para `entityType: "taxItem"`
- [x] T021 [US2] En `taxItems.remove` (y `taxDocuments.remove`) cascade: borrar attachments + `storage` asociados
- [x] T022 [P] [US2] Crear `TaxItemAttachments.tsx` reutilizando patrones de adjuntos de movimientos en `apps/web/src/components/tax/`
- [x] T023 [US2] Integrar zona de adjuntos en `TaxItemForm` / detalle de rubro; mensajes de MIME/tamaño

**Checkpoint**: quickstart §3.

---

## Phase 5: User Story 3 — Auto-poblar desde finanzas (Priority: P2)

**Goal**: Sugerencias efímeras desde cuentas, créditos y movimientos del año; aceptar → `taxItems.create` con `source*`.

**Independent Test**: Con datos previos, “Sugerir desde mis datos” propone ≥1 de Patrimonio/Deudas; aceptar una; no se duplica al regenerar.

### Implementation for User Story 3

- [x] T024 [US3] Implementar mapeo conservador en `convex/lib/taxSuggest.ts` (reglas de `research.md`: accounts→assets, credits→liabilities, income/expense year→income/deductions)
- [x] T025 [US3] Implementar query `taxSuggestions.generate` en `convex/taxSuggestions.ts` (excluir `sourceType+sourceId` ya aceptados)
- [x] T026 [P] [US3] Unit tests de mapeo en `convex/lib/taxSuggest.test.ts` (casos: cuenta, crédito, ingreso agregado, skip duplicado)
- [x] T027 [P] [US3] Crear `TaxSuggestionsSheet.tsx` en `apps/web/src/components/tax/` (checkable accept/discard)
- [x] T028 [US3] Wire botón “Sugerir desde mis datos” en `tax-detail.tsx`; accept llama `taxItems.create` con source fields; idempotencia `TAX_SOURCE_DUPLICATE`

**Checkpoint**: quickstart §4.

---

## Phase 6: User Story 4 — Revisar, cerrar y exportar (Priority: P2)

**Goal**: Estados `draft`/`review`/`filed` + reopen; export CSV/PDF/JSON.

**Independent Test**: Pasar a review, exportar CSV+PDF, marcar filed (read-only), reopen con confirmación.

### Implementation for User Story 4

- [x] T029 [US4] Implementar `taxDocuments.setStatus` / `reopen` / `updateMeta` en `convex/taxDocuments.ts`; mutations de items/adjuntos respetan `TAX_FILED_READONLY`
- [x] T030 [US4] Implementar `taxDocuments.getExportPayload` según `contracts/tax-export-api.md`
- [x] T031 [P] [US4] Crear `apps/web/src/lib/export/taxExport.ts` — `downloadTaxJson` / `downloadTaxCsv` / `downloadTaxPdf` con disclaimer no-oficial
- [x] T032 [P] [US4] Crear `TaxStatusActions.tsx` y `TaxExportMenu.tsx` en `apps/web/src/components/tax/`
- [x] T033 [US4] Integrar acciones de estado + export en `tax-detail.tsx`; ConfirmDialog al filed/reopen; UI read-only cuando `filed`

**Checkpoint**: quickstart §5.

---

## Phase 7: User Story 5 — Resumen y totales (Priority: P3)

**Goal**: Panel de resumen claro + campos manuales renta/impuesto estimado.

**Independent Test**: Con rubros multi-sección, resumen coincide con sumas; guardar estimados y verlos en UI y export.

### Implementation for User Story 5

- [x] T034 [P] [US5] Crear `TaxSummaryPanel.tsx` en `apps/web/src/components/tax/` (totales por sección + disclaimer)
- [x] T035 [US5] Formulario de `estimatedTaxableIncome` / `estimatedTaxDue` vía `updateMeta` en detalle; incluir en export payload (ya en T030)
- [x] T036 [US5] Unit test opcional de totales en `convex/lib/taxTotals.test.ts` si no cubierto antes

**Checkpoint**: SC-004 y acceptance US5.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Nav, a11y mobile, docs y QA de cierre.

- [x] T037 [P] Añadir entrada **Renta** en `apps/web/src/components/shell/NavDesktop.tsx` y `NavMobile.tsx` (MORE_ITEMS) → `/tax`
- [x] T038 Copy disclaimer visible en UI de detalle/resumen (“no es liquidación oficial DIAN”)
- [x] T039 Pasar quickstart.md completo (incl. mobile 375 px) y marcar checklist de cierre
- [x] T040 [P] Actualizar `changes/web-tax-dian/plan.md` Phase Outputs (`tasks.md` ✅) y `AGENTS.md` si hace falta estado
- [x] T041 `bun run lint` + `bun run build` limpios en la rama

**Checkpoint**: Change listo para `/speckit-implement` o implementación manual fase a fase.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Sin dependencias
- **Foundational (Phase 2)**: Depende de Setup — **BLOCKS** todas las US
- **US1 (Phase 3)**: Tras Phase 2 — MVP
- **US2 (Phase 4)**: Tras US1 (necesita `taxItems`)
- **US3 (Phase 5)**: Tras US1 (accept → create item); independiente de US2
- **US4 (Phase 6)**: Tras US1; export mejor con US5 fields pero funciona sin ellos
- **US5 (Phase 7)**: Tras US1; puede ir en paralelo con US3/US4 tras T013
- **Polish (Phase 8)**: Tras US deseadas (mínimo US1+US2+US4 para demo completa)

### User Story Dependencies

| Story | Depende de | Entrega independiente |
|-------|------------|------------------------|
| US1 declaración + rubros | Phase 2 | ✅ `/tax` CRUD + totales |
| US2 adjuntos | US1 | ✅ Soportes por rubro |
| US3 sugerencias | US1 | ✅ Auto-poblar sin adjuntos/export |
| US4 estado + export | US1 | ✅ Filed + archivos |
| US5 resumen | US1 | ✅ Panel + estimados manuales |

### Within Each User Story

- Backend (Convex) antes de wire UI
- Validaciones/errores antes de polish visual
- Story completa antes de avanzar prioridad (salvo [P] explícito)

### Parallel Opportunities

- T002, T003, T004 en paralelo (Setup)
- T007, T008 en paralelo tras schema base
- T014 ∥ T015 (componentes list vs detalle)
- T022 ∥ trabajo UI mientras T020 backend adjuntos (si contrato estable)
- T026 ∥ T027 (tests lib vs sheet UI)
- T031 ∥ T032 (export lib vs status UI)
- Tras US1: US3 y US5 pueden avanzar en paralelo; US2 y US4 también en paralelo entre sí

---

## Parallel Example: User Story 1

```bash
# Tras T011–T013 (API lista):
Task: "T014 TaxDocumentList + CreateForm en apps/web/src/components/tax/"
Task: "T015 TaxSectionPanel + TaxItemForm + TaxItemRow en apps/web/src/components/tax/"
```

## Parallel Example: User Story 3

```bash
Task: "T026 taxSuggest.test.ts"
Task: "T027 TaxSuggestionsSheet.tsx"
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Phase 1 Setup  
2. Phase 2 Foundational  
3. Phase 3 US1  
4. **STOP**: validar quickstart §1–§2  
5. Demo interna

### Incremental Delivery

1. + US2 adjuntos → quickstart §3  
2. + US4 export/estados → ciclo cerrable  
3. + US3 sugerencias → diferenciador  
4. + US5 resumen → polish confianza  
5. Phase 8 nav + QA → merge a `testing`

### Suggested MVP scope

**T001–T019** (Setup + Foundation + US1). Mínimo demable: declaración anual con rubros y totales.

---

## Notes

- No motor UVT / Muisca / XML DIAN (Out of Scope)
- Commits: solo cuando el usuario lo pida
- Tokens JP-DS; mobile-first 375 px
- Idioma UI: español (Colombia)
