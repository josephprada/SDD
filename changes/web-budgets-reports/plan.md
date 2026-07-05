# Implementation Plan: Web Budgets & Reports

**Branch**: `feat/web-budgets-reports` | **Date**: 2026-07-04 | **Spec**: [spec.md](./spec.md)

## Summary

Change 4 entrega **presupuestos** (límites por categoría), **gastos fijos** (compromisos mensuales con recordatorios configurables), **panel de reportes** (Recharts + export CSV/PDF), **emails automáticos** al cierre de período (Resend) y **Web Push + PWA** para alertas en móvil. Backend: 4 tablas nuevas, crons diarios, actions email/push. Frontend: `/budgets`, `/reports`, extensión Ajustes.

## Technical Context

**Language/Version**: TypeScript 6, React 19, Convex  
**Primary Dependencies**: Recharts, jspdf, html2canvas, vite-plugin-pwa, web-push, pdf-lib, Resend (HTTP)  
**Storage**: Convex — `budgets`, `fixedExpenses`, `pushSubscriptions`, `notificationLog`  
**Testing**: QA manual (`quickstart.md`); `bun run build` + `bun run lint`  
**Target Platform**: Web mobile-first PWA, prod `wallet.lavalex.co`  
**Project Type**: Monorepo Bun — `apps/web` + `packages/jp-ds` + `convex/`  
**Constraints**: Tokens JP-DS; timezone `America/Bogota`; idempotencia notificaciones  
**Scale/Scope**: ~50–70 archivos; 5 fases deployables (A→E)

## Constitution Check

| Gate | Status |
|------|--------|
| Tokens JP-DS (no hex en componentes) | ✅ `chartTheme.ts` lee CSS vars |
| Mobile-first | ✅ Charts responsive; tabs en `/budgets` |
| KISS / YAGNI | ⚠️ Change grande — fases A–E en `tasks.md` |
| Auth en mutations | ✅ `requireUserId` en todos los módulos |
| Compat prod | ✅ Nuevas tablas; prefs con defaults en read |

## Project Structure

### Documentation

```text
changes/web-budgets-reports/
├── plan.md
├── spec.md
├── proposal.md
├── design.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── budgets-api.md
│   ├── fixed-expenses-api.md
│   ├── reports-api.md
│   └── notifications-api.md
├── tasks.md
└── checklists/requirements.md
```

### Source Code

```text
convex/budgets.ts, fixedExpenses.ts, reports.ts, crons.ts
convex/lib/{reports,fixedExpenses,notifications}.ts
convex/notifications/{actions,processDaily}.ts
apps/web/src/routes/{budgets,reports}.tsx
apps/web/src/components/{budgets,reports,notifications}/
apps/web/src/lib/{export,charts,push}/
apps/web/public/sw.js
```

**Structure Decision**: Extender monorepo; agregaciones en `convex/lib/reports.ts`; PWA en Vite.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected |
|-----------|------------|------------------------------|
| 4 tablas + crons + 2 actions | Email + push + recordatorios requieren persistencia e idempotencia | Solo in-app no cumple spec v2 |
| vite-plugin-pwa | Push fiable en Android | Tab browser-only insuficiente |

## Phase Outputs

| Phase | Artifact | Status |
|-------|----------|--------|
| 0 Research | `research.md` | ✅ |
| 1 Design | `design.md`, `data-model.md`, `contracts/` | ✅ |
| 1 QA | `quickstart.md` | ✅ |
| 2 Tasks | `tasks.md` | ✅ |

## Next Command

`/speckit-implement` — ejecutar `tasks.md` por fases A→E.
