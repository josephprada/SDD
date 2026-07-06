# Design: Web Credits & Savings

**Change**: web-credits  
**Spec**: `changes/web-credits/spec.md`  
**Rama**: `feat/web-credits`

---

## Enfoque Técnico

Change 5 materializa **créditos** (pasivo), **fondo escrow** (cuenta vinculada genérica), **rubros de inversión**, **abonos a capital**, **metas de ahorro** y **recordatorios de cuota** sobre `web-core` (cuentas, transacciones) y `web-budgets-reports` (notificaciones).

**Principio**: agnóstico al banco — `lender` y nombres de cuenta son texto libre del usuario; cero integración bancaria.

Backend: 5 tablas nuevas; extensiones `accounts.isCreditEscrow`, `transactions.creditId`; libs puras `creditAmortization`, `creditRecalc`.

Frontend: `/credits`, `/credits/:id` (tabs), `/savings`; gasto fondo vía modal Movimientos; dashboard filtrado.

---

## Decisiones de Arquitectura

| # | Pregunta | Decisión | Tradeoff |
|---|----------|----------|----------|
| D-01 | Amortización | **Lib pura** `convex/lib/creditAmortization.ts` | Testeable; 3 modos |
| D-02 | Tasas | **EA / NAMV / MV** explícito en UI | Usuario elige convención |
| D-03 | Redondeo | **Peso entero**; última cuota ajusta residuo | Alineado bancos COP |
| D-04 | Abono recálculo | **Cancel pending + regenerate** | Historial `paid` intacto |
| D-05 | Escrow | **`disbursementAccountId` + `isCreditEscrow`** | No saldo virtual duplicado |
| D-06 | Balance personal | **Excluir escrow** en `dashboard.overview` | Tarjeta `credits.fundSummary` aparte |
| D-07 | Movimientos crédito | **`creditId` en transactions**; filtro default off en `/transactions` | Vista principal limpia |
| D-08 | Gasto fondo | **Gasto único** `creditFundSpend` desde modal Movimientos; `spendFromFund` legacy | UX más simple que wizard 3 txs |
| D-09 | Rubros | **Tabla `creditDestinations`** + `spentTotal` en list | ≠ categorías gasto |
| D-10 | Metas | **Tabla propia**; `linkedCreditId` opcional | ≠ escrow obra |
| D-11 | Desembolso | **No income** — ajuste `initialBalance` escrow al vincular | Evita inflar nómina |
| D-12 | Recordatorios | **Extender cron** `processDaily` + `credit_due` | Reutiliza push/in-app |
| D-13 | Gráfico rubros | **Recharts Pie** lazy en detalle crédito | Mismo patrón reports |
| D-14 | Simulador | **Query** `credits.simulatePayoff` | Sin persistir |
| D-15 | Manual schedule | **Import CSV opcional P2**; filas UI P1 | VIS extracto |
| D-16 | Bancos | **Sin hardcode** nombres/ APIs | Solo campos libres |
| D-17 | Categorías fondo | **`fundExpenseCategoryIds`** + `linkedCreditPurpose` en categories | Sync en create/update; delete vs unlink al borrar crédito |
| D-18 | Pago cuota | **`creditPaymentContext`** + `transactions.create` | Cuota desde modal Movimientos |
| D-19 | UX rubros | **Edición por clic** en tarjeta | Sin botón lápiz |
| D-20 | UX hints | **`FieldHelp`** en ajustes crédito | Paridad con CreditForm |
| D-21 | Dashboard créditos | **Card `dash-credits` glass** + cards internas | Total muted alineado con Disponible |
| D-22 | Pestaña Fondo | **Listado read-only**; gastos vía Movimientos | Sin wizard en detalle |

---

## Flujo de datos

```
accounts (isCreditEscrow) ◄── disbursementAccountId ── credits
         │                                              │
         │         creditPayments ◄── amortización      │
         │              │                               │
transactions ◄─────────┼── creditCapitalAbonos          │
  creditId             │                               │
  creditDestinationId  │                               │
         │             ▼                               │
         └── creditFundSpend / transactions ──► creditDestinations
                                              │
savingsGoals ◄── linkedCreditId (abono)       │
savingsContributions                          │
         │                                    │
notifications.processDaily ──► credit_due     │
dashboard.overview (excl. escrow)             │
credits.fundSummary ──────────────────────────┘
```

---

## Lib: `convex/lib/creditAmortization.ts`

```typescript
monthlyRate(rateType, interestRate): number
computeFixedInstallment(principal, i, termMonths): number
generateScheduleCuotaFija(params): CreditPaymentRow[]
generateScheduleCapitalConstant(params): CreditPaymentRow[]
recalcAfterAbono(params): CreditPaymentRow[]
simulateAnnualAbonos(params): { payoffDate, monthsRemaining }
```

**Tests** (`creditAmortization.test.ts`):
- $40M, MV 1.08%, 120 meses → primera cuota ~coherente extracto QA
- Abono $6M/año × N → payoff ≤ 72 meses
- Última fila saldo 0

---

## Módulos backend

### `convex/credits.ts`

| Export | Tipo | Descripción |
|--------|------|-------------|
| `list` | query | Activos + próxima cuota + saldo |
| `get` | query | Detalle + resumen rubros + cuentas vinculadas |
| `create` | mutation | Genera schedule según modo |
| `update` | mutation | Params editables; no regenera pagadas |
| `remove` | mutation | Soft archive si tiene historial |
| `fundSummary` | query | Saldo escrow vs asignado |
| `simulatePayoff` | query | Proyección abonos |
| `spendFromFund` | mutation | Wizard transfer+gasto+devolución |

### `convex/creditPayments.ts`

| Export | Tipo | Descripción |
|--------|------|-------------|
| `listByCredit` | query | Tabla amortización |
| `markPaid` | mutation | + link transaction |
| `updateManualRow` | mutation | Solo modo manual, pending |

### `convex/creditCapitalAbonos.ts`

| Export | Tipo | Descripción |
|--------|------|-------------|
| `list` | query | Historial abonos |
| `create` | mutation | Abono + recálculo |

### `convex/creditDestinations.ts`

| Export | Tipo | Descripción |
|--------|------|-------------|
| `list` | query | Rubros + totales + **`spentTotal`** |
| `create` / `update` / `remove` | mutation | CRUD |

### `convex/savingsGoals.ts` + `savingsContributions.ts`

CRUD metas + aportes; `suggestAbono` internal si `linkedCreditId` y umbral.

### Extensiones

- `convex/dashboard.ts` — excluir `isCreditEscrow` del total
- `convex/transactions.ts` — args opcionales `creditId`, etc.; filtro list
- `convex/notifications/processDaily` — `credits.processReminders`

---

## Frontend

### Rutas

| Path | Componente |
|------|------------|
| `/credits` | Lista créditos + CTA crear |
| `/credits/:id` | Detalle tabs: Cuotas \| Abonos \| Destinos \| Movimientos |
| `/savings` | Lista metas |

### Tabs detalle crédito

1. **Cuotas** — `CreditPaymentTable`, marcar pagada
2. **Abonos** — `CapitalAbonoList`, form + simulador
3. **Destinos** — `DestinationList` (spentTotal + progreso), torta, form rubro (clic para editar)
4. **Fondo** — gastos del crédito (`listFundMovements`); clic → editar transacción
5. **Ajustes** — `CreditSettingsForm` con `FieldHelp`

### Componentes clave

```text
components/credits/
  CreditList.tsx, CreditForm.tsx, CreditDetailHeader.tsx
  CreditPaymentTable.tsx, CapitalAbonoForm.tsx, PayoffSimulator.tsx
  DestinationList.tsx, DestinationChart.tsx
  CreditSettingsForm.tsx, FundExpenseCategoryPicker.tsx, FieldHelp.tsx, FormSelect.tsx
  CreditFundCard.tsx (dashboard `dash-credits`)
components/savings/
  SavingsGoalList.tsx, SavingsGoalForm.tsx, ContributionList.tsx
```

### Nav

- Desktop sidebar: Créditos, Ahorros
- Móvil menú «Más»: mismas entradas

### Estilos

`apps/web/src/styles/credits-savings.css` — tabs, tablas amortización, progress rubros.

---

## Integración dashboard

```typescript
// dashboard.overview — exclude isCreditEscrow accounts from totalBalance
// Optional card: CreditFundCard — calls credits.fundSummary per active credit
```

---

## Seguridad

- Todas las queries/mutations: `requireUserId` + ownership `credit.userId`
- `disbursementAccountId` debe pertenecer al mismo usuario
- Wizard valida saldos suficientes en escrow/operativa

---

## Referencia QA (usuario)

Montos del caso real en `quickstart.md` — **solo QA**, no constantes en código.
