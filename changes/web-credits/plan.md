# Implementation Plan: Web Credits & Savings

**Branch**: `feat/web-credits` | **Date**: 2026-07-05 | **Spec**: [spec.md](./spec.md)

## Summary

Change 5 entrega **créditos flexibles** (cuota fija, capital constante, tabla manual), **abonos a capital** con recálculo, **destinos/rubros** del desembolso, **fondo escrow** (cuenta vinculada sin mezclar nómina), **simulador de pago anticipado**, **metas de ahorro** y recordatorios de cuota. Backend: 5 tablas nuevas + extensiones `accounts` y `transactions`. Frontend: `/credits`, `/credits/:id`, `/savings`; asistente «Gastar desde fondo»; dashboard con balance personal excluyendo escrow.

**Agnóstico al banco**: nombres de entidad libres; sin integración ni UI específica de ningún banco.

## Technical Context

**Language/Version**: TypeScript 6, React 19, Convex  
**Primary Dependencies**: Recharts (opcional torta rubros), patrones existentes JP-DS / notifications  
**Storage**: Convex — `credits`, `creditPayments`, `creditCapitalAbonos`, `creditDestinations`, `savingsGoals`, `savingsContributions`  
**Testing**: `convex/lib/creditAmortization.test.ts` (Bun); QA `quickstart.md`; `bun run build` + `bun run lint`  
**Target Platform**: Web mobile-first, prod `wallet.lavalex.co`  
**Project Type**: Monorepo Bun — `apps/web` + `packages/jp-ds` + `convex/`  
**Constraints**: Tokens JP-DS; COP enteros; timezone `America/Bogota`; reutilizar `notificationLog`  
**Scale/Scope**: ~55–75 archivos; 8 fases deployables (A→H)

## Constitution Check

| Gate | Status |
|------|--------|
| Tokens JP-DS (no hex en componentes) | ✅ Gráficos rubros vía CSS vars |
| Mobile-first | ✅ Tabs crédito scroll horizontal; tablas responsive |
| KISS / YAGNI | ⚠️ Change amplio — fases A–H; UVR/revolving fuera |
| Auth en mutations | ✅ `requireUserId` en todos los módulos |
| Compat prod | ✅ Tablas nuevas; campos opcionales en accounts/transactions |
| Sin acoplamiento banco | ✅ Cuentas genéricas; `lender` texto libre |

## Project Structure

### Documentation

```text
changes/web-credits/
├── plan.md
├── spec.md
├── proposal.md
├── design.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── credits-api.md
│   ├── savings-api.md
│   └── credit-fund-api.md
├── tasks.md
└── checklists/requirements.md
```

### Source Code (previsto)

```text
convex/credits.ts, creditPayments.ts, creditCapitalAbonos.ts, creditDestinations.ts
convex/savingsGoals.ts, savingsContributions.ts
convex/lib/creditAmortization.ts, creditRecalc.ts, creditDates.ts
apps/web/src/routes/{credits,savings}.tsx
apps/web/src/routes/credit-detail.tsx (o /credits/:id)
apps/web/src/components/credits/*
apps/web/src/components/savings/*
apps/web/src/lib/credits/
```

**Structure Decision**: Lógica de amortización en lib pura testeable; recálculo post-abono en mutation atómica; wizard de gasto orquesta transferencias + gasto existentes.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected |
|-----------|------------|------------------------------|
| 5 tablas + extensiones | Créditos, cuotas, abonos, rubros, metas | Una tabla monolítica no modela recálculo ni rubros |
| 3 modos amortización | Créditos reales no encajan en una fórmula | Solo cuota fija falla en VIS / extractos bancarios |
| Wizard multi-paso | Flujo escrow→operativa→gasto real del usuario | Un solo gasto pierde trazabilidad y sobrante |

## Phase Outputs

| Phase | Artifact | Status |
|-------|----------|--------|
| 0 Research | `research.md` | ✅ |
| 1 Design | `design.md`, `data-model.md`, `contracts/` | ✅ |
| 1 QA | `quickstart.md` | ✅ |
| 2 Tasks | `tasks.md` | ✅ |

## Next Command

`/speckit-implement` — ejecutar `tasks.md` por fases A→H.
