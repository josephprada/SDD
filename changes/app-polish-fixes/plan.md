# Implementation Plan: App Polish Fixes

**Branch**: `feat/app-polish-fixes` | **Date**: 2026-08-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `changes/app-polish-fixes/spec.md`

## Summary

Change 8 corrige y endurece superficies ya entregadas: proyección **disponible − fijos** con jerarquía visual correcta; ciclo de vida de modal/scroll al editar/eliminar movimientos desde Home; UX de foco y adjuntos en create; anti-spam de toasts + reparación del pipeline push; extensión MCP `list_fixed_expenses` / `pendingTotal`; y **primer arnés Playwright** para E2E/UI de estos escenarios.

## Technical Context

**Language/Version**: TypeScript, React 19, Convex, Bun workspaces  
**Primary Dependencies**: JP-DS, React Router, VitePWA / service worker, `web-push`, MCP server existente (`apps/mcp-server`), **Playwright** (nuevo)  
**Storage**: Convex — sin tablas nuevas previstas; reusa `fixedExpenses`, `notificationLog`, `pushSubscriptions`, `attachments`, gateway MCP  
**Testing**: Playwright E2E (UI del change) + `bun:test` unitario en `convex/lib` donde aporte (proyección pura / overlay lock); QA `quickstart.md`  
**Target Platform**: SPA web mobile-first (`apps/web`); MCP HTTP/stdio; push Web Push (navegador/PWA)  
**Project Type**: Monorepo Bun — `apps/web` + `apps/mcp-server` + `packages/jp-ds` + `convex/`  
**Performance Goals**: Sin regresiones percibidas en Home; suite E2E smoke &lt; ~5 min local  
**Constraints**: Tokens JP-DS; mobile-first; KISS (arreglar causa raíz, no frameworks nuevos salvo Playwright); no rediseñar centro de notificaciones; MCP solo lectura de fijos  
**Scale/Scope**: ~15–25 archivos tocados; 8 user stories; sin feature de dominio nuevo

## Constitution Check

| Gate | Status |
|------|--------|
| Tokens JP-DS (no hex hardcode) | ✅ Jerarquía visual con tokens tipográficos/color existentes |
| Mobile-first | ✅ Overview móvil + E2E viewport ≤430 px |
| KISS / YAGNI | ✅ Fixes acotados; Playwright solo escenarios del change |
| Auth / ownership | ✅ MCP fijos vía `read:budgets` + PAT existente |
| Compat prod | ✅ Sin migraciones de schema previstas |
| Privacidad | ✅ Sin ampliar scopes destructivos |

*Post–Phase 1*: gates ✅ — diseño no introduce LLM, chat ni tablas nuevas.

## Project Structure

### Documentation (this feature)

```text
changes/app-polish-fixes/
├── plan.md                 # this file
├── proposal.md
├── design.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── dashboard-projection.md
│   ├── transaction-overlay.md
│   ├── notifications.md
│   ├── mcp-fixed-expenses.md
│   └── playwright-e2e.md
├── tasks.md                # /speckit-tasks (pendiente)
└── checklists/requirements.md
```

### Source Code (previsto)

```text
# Dashboard proyección + jerarquía
apps/web/src/routes/home.tsx
apps/web/src/components/dashboard/MetricCard.tsx
apps/web/src/components/dashboard/MonthOverview.tsx
apps/web/src/styles/core.css          # o CSS module existente de métricas

# Modal / scroll / delete
apps/web/src/components/shell/Shell.tsx
apps/web/src/components/transactions/TransactionModalHost.tsx
apps/web/src/components/transactions/TransactionForm.tsx
apps/web/src/stores/transactionModal.ts
packages/jp-ds/.../Modal.tsx         # o apps/web Modal wrapper
# ConfirmDialog + useOverlayAnimation / body scroll lock helper

# Adjuntos en create
apps/web/src/components/attachments/AttachmentUploader.tsx
apps/web/src/components/transactions/TransactionModalHost.tsx

# Notificaciones
apps/web/src/components/notifications/NotificationListener.tsx
apps/web/src/lib/push/registerPush.ts
apps/web/src/sw.ts
convex/notifications.ts
convex/notificationActions.ts
convex/lib/notifications.ts

# MCP fijos
convex/agentGateway.ts
apps/mcp-server/src/tools/read.ts
# (+ types/scopes docs si hace falta)

# Playwright (nuevo)
apps/web/playwright.config.ts   # o e2e/ en raíz — ver research R-08
apps/web/e2e/**/*.spec.ts
package.json                    # scripts test:e2e
```

**Structure Decision**: Monorepo existente; sin paquetes nuevos salvo deps Playwright. Artefactos SDD en `changes/app-polish-fixes/` (convención del repo, no `specs/`).

## Complexity Tracking

> Sin violaciones de constitución que requieran justificación.
