# Implementation Plan: Web Tax DIAN (Declaración de Renta)

**Branch**: `feat/web-tax-dian` | **Date**: 2026-07-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `changes/web-tax-dian/spec.md`

## Summary

Change 6 entrega un **organizador anual de declaración de renta (DIAN Colombia)**: un documento por año gravable, cinco secciones (Patrimonio, Deudas, Ingresos, Deducciones, Rentas exentas), CRUD de rubros, adjuntos por rubro, sugerencias asistidas desde cuentas/créditos/movimientos, estados `draft` → `review` → `filed`, y exportación PDF/CSV/JSON. **No** calcula UVT ni presenta ante DIAN.

Backend: tablas `taxDocuments`, `taxItems`; extensión de `attachments` para `taxItem`. Frontend: `/tax`, `/tax/:documentId`. Reutiliza JP-DS, auth, export y patrones de adjuntos existentes.

## Technical Context

**Language/Version**: TypeScript 6, React 19, Convex  
**Primary Dependencies**: Patrones existentes JP-DS, Convex file storage, export CSV/PDF (jsPDF o lib actual de reportes), sin librería fiscal externa  
**Storage**: Convex — `taxDocuments`, `taxItems`; `attachments` con `entityType: "taxItem"`  
**Testing**: Libs puras de sugerencias/totales con `bun test` si aplica; QA `quickstart.md`; `bun run build` + `bun run lint`  
**Target Platform**: Web mobile-first, prod `wallet.lavalex.co`  
**Project Type**: Monorepo Bun — `apps/web` + `packages/jp-ds` + `convex/`  
**Performance Goals**: Listar declaraciones y abrir un año con ≤100 rubros sin degradación perceptible; sugerencias en <3 s para datasets típicos de un usuario individual  
**Constraints**: Tokens JP-DS; COP enteros; timezone `America/Bogota`; `requireUserId` en todas las APIs; un documento por usuario/año; sin XML Muisca  
**Scale/Scope**: ~25–40 archivos; 6 fases deployables (A→F)

## Constitution Check

| Gate | Status |
|------|--------|
| Tokens JP-DS (no hex en componentes) | ✅ UI solo tokens / componentes JP-DS |
| Mobile-first | ✅ Listado + detalle por secciones desde 375 px |
| KISS / YAGNI | ✅ Organizador sin motor UVT; catálogos fijos v1 |
| Auth en mutations | ✅ `requireUserId` + ownership en documentos/rubros/adjuntos |
| Compat prod | ✅ Tablas nuevas; attachments extendido con migración suave |
| Privacidad | ✅ Declaraciones solo del usuario autenticado |

*Post–Phase 1*: gates siguen ✅ — diseño no introduce motor fiscal ni acoplamiento DIAN.

## Project Structure

### Documentation (this feature)

```text
changes/web-tax-dian/
├── plan.md
├── proposal.md
├── design.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── tax-api.md
│   ├── tax-suggestions-api.md
│   └── tax-export-api.md
├── tasks.md                 # /speckit-tasks (aún no)
└── checklists/requirements.md
```

### Source Code (previsto)

```text
convex/schema.ts                 # + taxDocuments, taxItems; attachments.entityType
convex/taxDocuments.ts
convex/taxItems.ts
convex/taxSuggestions.ts         # query de sugerencias (read-only aggregation)
convex/lib/taxCategories.ts      # catálogos por sección
convex/lib/taxTotals.ts          # sumas puras
convex/lib/taxSuggest.ts         # mapeo cuentas/créditos/txs → sugerencias
convex/attachments.ts            # list/create/remove para taxItem

apps/web/src/routes/tax.tsx
apps/web/src/routes/tax-detail.tsx
apps/web/src/components/tax/*
apps/web/src/lib/tax/categories.ts
apps/web/src/lib/tax/types.ts
apps/web/src/lib/export/taxExport.ts   # CSV/JSON/PDF declaración
apps/web/src/components/shell/Nav*.tsx # entrada Renta / Tax
```

**Structure Decision**: Dominio Convex dedicado (`tax*`) + libs puras para totales/sugerencias; adjuntos reutilizan storage y módulo `attachments` ampliado; UI en rutas `/tax` siguiendo el patrón list→detail de créditos.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected |
|-----------|------------|------------------------------|
| Extender `attachments` multi-entidad | SPEC y consistencia con movimientos | Tabla `taxAttachments` duplica upload/MIME/límites |
| Módulo de sugerencias separado | Agrega cuentas+créditos+txs sin ensuciar CRUD | Meter lógica en `taxDocuments.get` hincha la query |

## Phase Outputs

| Phase | Artifact | Status |
|-------|----------|--------|
| 0 Research | `research.md` | ✅ |
| 1 Design | `design.md`, `data-model.md`, `contracts/`, `proposal.md` | ✅ |
| 1 QA | `quickstart.md` | ✅ |
| 2 Tasks | `tasks.md` | ⏳ `/speckit-tasks` |
