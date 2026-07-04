# Implementation Plan: Web Settings

**Branch**: `feat/web-settings` | **Date**: 2026-07-04 | **Spec**: [spec.md](./spec.md)

## Summary

Completar `/settings` con **perfil editable** (nombre + avatar), sección **Apariencia** (modo, presets acento/errores/tipografía, reset), preferencias de producto y dashboard acoplado al período. Backend: extender `userProfiles` + `userPreferences`. Frontend: presets JP-DS vía `data-*`, store Zustand, pre-paint, `ProfileEditor`.

## Technical Context

**Language/Version**: TypeScript 6, React 19, Convex  
**Primary Dependencies**: Vite, Zustand, `@convex-dev/auth`, JP-DS  
**Storage**: Convex `userPreferences` + localStorage (FOUC)  
**Testing**: QA manual (`quickstart.md`); `bun run build` + `bun run lint`  
**Target Platform**: Web mobile-first (375–1440 px), prod `wallet.lavalex.co`  
**Project Type**: Monorepo Bun — `apps/web` + `packages/jp-ds` + `convex/`  
**Constraints**: WCAG AA en presets; sin color picker libre; logo marca fijo  
**Scale/Scope**: ~20–25 archivos nuevos/modificados; perfil + ajustes + dashboard

## Constitution Check

*Constitution template no ratificada — gates del proyecto:*

| Gate | Status |
|------|--------|
| Tokens JP-DS (no hex en componentes) | ✅ Presets en CSS/TS centralizado |
| Mobile-first | ✅ Ajustes diseñados 375 px primero |
| KISS / YAGNI | ✅ Sin i18n completo ni Web Push |
| Auth en mutations | ✅ `requireUserId` / `getAuthUserId` |
| Compat prod | ✅ Backfill migration opcional |

## Project Structure

### Documentation

```text
changes/web-settings/
├── plan.md              # This file
├── spec.md
├── proposal.md
├── design.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/user-preferences-api.md
├── tasks.md
└── checklists/requirements.md
```

### Source Code

```text
packages/jp-ds/src/appearance/
packages/jp-ds/tokens/*-presets.css
convex/userPreferences.ts, schema.ts, migrations.ts, dashboard.ts
apps/web/src/stores/preferences.ts
apps/web/src/lib/appearance/, lib/period/
apps/web/src/components/settings/
apps/web/src/routes/settings.tsx, home.tsx
apps/web/index.html
```

**Structure Decision**: Extender monorepo existente; presets viven en JP-DS; lógica de período en `apps/web`.

## Complexity Tracking

Sin violaciones que requieran justificación adicional.

## Phase Outputs

| Phase | Artifact | Status |
|-------|----------|--------|
| 0 Research | `research.md` | ✅ |
| 1 Design | `design.md`, `data-model.md`, `contracts/` | ✅ |
| 1 QA | `quickstart.md` | ✅ |
| 2 Tasks | `tasks.md` | ✅ |

## Next Command

`/speckit-implement` — ejecutar tareas en `tasks.md`.
