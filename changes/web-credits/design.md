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
| D-06 | Balance personal | **Excluir** cuentas con `excludeFromPersonalFinance` (legado: `isCreditEscrow` sin flag) **y** `type !== credit` en card Disponible | Tarjeta `credits.fundSummary` aparte |
| D-07 | Movimientos crédito | **`creditId` en transactions**; listado personal filtra por cuenta aislada / fund movement, **no** oculta pagos de cuota | Vista principal limpia sin perder cuotas |
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
| D-23 | Crédito ya en marcha | **`alreadyInProgress`** + cuotas pagadas opcionales + `trackRemainingOnly` + saldo pendiente (obligatorio en manual) | `resolveInProgressCreditSchedule` en create |
| D-24 | Cuentas en create crédito | **Desembolso y pago opcionales**; desembolso condicionado a switch «Incluye desembolso» | Completa en Ajustes después |
| D-25 | Fecha inicio crédito | **Opcional** en create; default hoy vía `resolvePaymentDate` | Calendario de cuotas sin bloquear creación |
| D-26 | Dashboard movimientos | **Últimos movimientos globales** (todos los tiempos); ingresos/gastos del card siguen filtrados por periodo activo | Evita ver solo 2 txs del mes con historial largo |
| D-27 | Gastos fijos en dashboard | **Widget** = mes calendario del ancla; **pendingTotal métricas** = mismo `periodStart/End` que ingresos/gastos | No mezclar semana con deuda fija del mes completo |
| D-28 | Listado gastos fijos próximos | **Una fila por gasto/mes**; excluir pagados (`isPaidCurrentPeriod` + `lastPaidTransactionId` en rango) | Sin barrido multi-mes que duplicaba filas |
| D-29 | Meta + gasto fijo | **Cuota mensual sugerida** = `ceil(objetivo / meses hasta deadline)`; editable manualmente | `apps/web/src/lib/savings/computeMonthlySavings.ts` |
| D-30 | Categorías | **`categories.usageCounts`** en subtítulo (movimientos, gastos fijos, presupuestos, créditos, metas) | Solo lectura informativa |
| D-31 | Errores Convex UI | **`formatConvexError`** — mensajes amigables en formularios | `apps/web/src/lib/convex/formatError.ts` |
| D-32 | JP-DS Input fecha | Placeholder muted + icono calendario apagado si vacío | `packages/jp-ds/components/Input.tsx` |
| D-33 | FormSelect / Modal | Placeholder «Seleccionar» muted; modal form flex sin recorte en móvil | Paridad visual JP-DS |
| D-34 | Perfil adaptativo | **`creditProfile`** persistido; ortogonal a `scheduleMode` | UX por propósito, no por fórmula bancaria |
| D-35 | Creación mínima | Solo **`name`** obligatorio; `setupStatus: draft` sin cuotas | Compatible con créditos ya en marcha parcialmente documentados |
| D-36 | Wizard creación | **2 pasos**: `CreditProfilePicker` → formulario por perfil | Primer wizard multi-paso en dominio créditos |
| D-37 | Cambio de perfil | Confirmación **conservar / eliminar** datos incompatibles | Cuotas pagadas y tx históricas siempre conservadas |
| D-38 | Activación cuotas | Schedule solo en acción explícita si `setupStatus !== active` | Evita `ensureSchedule` en drafts |
| D-39 | Progreso cuotas UI | **Barra % pagadas** en detalle; card cuotas pendientes oculta en móvil | Sustituye card «Saldo deuda» |
| D-40 | Tab Destinos | **`usesDestinationsTab(profile)`** — oculto en `tangible_product`, `intangible_service` | Menos ruido en perfiles sin rubros |
| D-41 | Simulador abonos | **`PayoffSimulator` no montado** en tab Abonos v1.7 | Query backend conservada |
| D-42 | Categorías fondo create | **Solo existentes** en `FundExpenseCategoryPicker` | Sin `newNames` en UI |
| D-43 | Gasto fijo create | **`createFixedExpense` default `true`** | Opt-out explícito |
| D-44 | Edición cuotas | **`creditPaymentEdit.ts`** + batch UI en `CreditPaymentTable` | manual + cuota_fija + capital_constant |
| D-45 | Reportes cross-module | **`ReportCreditsSection`**, **`ReportSavingsSection`** + export CSV/PDF | Estado actual, no filtrado por período |
| D-46 | Motion genie modales | **`useGenieOverlay`**, bloom in / genie out, `genie-modal.css`, SVG warp | `ConfirmDialog` sin `.modal` en móvil |
| D-47 | Aislamiento | **Por cuenta** (`accounts.excludeFromPersonalFinance`), no por `creditId` blanket | Pagos de cuota visibles en movimientos/neto |
| D-48 | Check «aislar» crédito | Sync **solo cuenta desembolso** vía `syncDisbursementAccountIsolation` | Desembolso/fondo fuera; cuotas dentro |
| D-49 | Pago cuota en metrics | Flag **`isCreditInstallmentPayment`** → siempre cuenta en personal finance | Aunque se pague desde escrow |
| D-50 | Dashboard «Disponible» | `totalBalance` = cuentas personales **sin** `type: credit` | Deuda tarjeta no resta el disponible |
| D-51 | Transfer → meta aislada | Cuenta como **gasto** del mes (`transferToIsolatedCountsAsExpense`) | Alinea neto con salida de disponible |
| D-52 | Delete movimiento UX | `transactions.get` / `attachments.listByTransaction` soft (null/`[]`); modal cierra antes del delete | Evita ErrorBoundary por suscripción huérfana |

### Cierre v1.7 (2026-07-12) ✅

Change **web-credits** cerrado. Pendientes v1.6 migrados o absorbidos en iteración UX.

| # | Tema | Estado |
|---|------|--------|
| P-01 | Creación mínima + wizard 2 pasos | ✅ |
| P-02 | Barra progreso cuotas (sustituye installment card planificada) | ✅ |
| P-03 | Ajustes ampliados + cambio perfil | ✅ |
| P-04 | `creditProfileRegistry.ts` | ✅ |
| P-05 | Cambio perfil (modales en `CreditSettingsForm`) | ✅ |
| P-06 | Backend `setupStatus` + recalc abonos | ✅ |

### Iteración finanzas personales (2026-07-15) ✅ — rama `testing`

Post-cierre web-credits: aislamiento alineado al producto real (JP-Apartament + metas).

| # | Tema | Estado |
|---|------|--------|
| F-01 | Schema cuenta `excludeFromPersonalFinance` + checkbox en `AccountForm` | ✅ |
| F-02 | `convex/lib/personalFinance.ts` — cuentas excluídas, cuotas, transfer→meta | ✅ |
| F-03 | Dashboard Disponible + copy «Si pagas fijos pendientes» | ✅ |
| F-04 | Soft queries al borrar movimiento (attachments / get) | ✅ |

**Fuente de verdad de docs:** `testing`. Merges a `main`/prod solo cuando se pida explícitamente.

---

## Perfiles adaptativos (`creditProfileRegistry`)

**Archivo:** `apps/web/src/lib/credits/creditProfileRegistry.ts`

```typescript
type CreditProfile =
  | "free_purpose"
  | "housing_improvement"
  | "debt_consolidation"
  | "tangible_product"
  | "intangible_service"
  | "p2p_agreement";

type SetupStatus = "draft" | "ready" | "active";
```

### Defaults por perfil (sugerencias, no bloqueos)

| Perfil | `hasDisbursement` sugerido | Rubros sugeridos | `scheduleMode` default | Campos extra |
|--------|---------------------------|------------------|------------------------|--------------|
| `free_purpose` | true | no | `cuota_fija` | — |
| `housing_improvement` | true | sí (plantillas obra) | `manual` | seguros, meta pago |
| `debt_consolidation` | true | sí (deudas liquidadas) | `cuota_fija` | — |
| `tangible_product` | false | no | `cuota_fija` | producto, comercio, referencia |
| `intangible_service` | false | no | `cuota_fija` | servicio, proveedor |
| `p2p_agreement` | false | no | `manual` | contraparte, relación, notas |

### Datos mínimos para generar cuotas

`principal`, `rateType`, `interestRate`, `termMonths`, `paymentDay`, `scheduleMode` — validados en `ensurePaymentSchedule`, no en `create`.

### Matriz cambio de perfil

| Acción usuario | Backend |
|----------------|---------|
| Conservar | Datos incompatibles → `profileMetadata`; UI oculta hasta perfil compatible |
| Eliminar | Limpia campos incompatibles (`linkedAsset`, categorías fondo huérfanas); **no** borra cuotas `paid`, abonos, destinos con historial, tx vinculadas |

---

## Flujo de datos

```
accounts (isCreditEscrow) ◄── disbursementAccountId ── credits
         │                         creditProfile            │
         │                         setupStatus              │
         │         creditPayments ◄── amortización (solo si active)
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
notifications.processDaily ──► credit_due (skip draft)
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
| `list` | query | Activos + drafts + próxima cuota + saldo |
| `get` | query | Detalle + `creditProfile`, `setupStatus`, `missingFields[]` |
| `create` | mutation | Mínimo `{ name }`; no genera schedule si draft |
| `update` | mutation | Params editables incl. financieros y perfil |
| `updateSetupProfile` | mutation | Cambio perfil + `preserveIncompatibleData: boolean` |
| `remove` | mutation | Soft archive si tiene historial |
| `fundSummary` | query | Saldo escrow vs asignado |
| `simulatePayoff` | query | Proyección abonos (skip draft) |
| `ensurePaymentSchedule` | mutation | Genera cuotas si datos mínimos OK |
| `spendFromFund` | mutation | Wizard transfer+gasto+devolución (legacy) |

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

- `convex/dashboard.ts` — Disponible + gastos con `personalFinanceExpenseAmount`
- `convex/lib/personalFinance.ts` — exclusión por cuenta, cuotas, transfer→meta
- `convex/transactions.ts` — args opcionales `creditId`, etc.; filtro list; `get` soft
- `convex/attachments.ts` — `listByTransaction` soft si tx borrada
- `convex/notifications/processDaily` — `credits.processReminders`

---

## Frontend

### Rutas

| Path | Componente |
|------|------------|
| `/credits` | Lista créditos + CTA crear (wizard 2 pasos) |
| `/credits/:id` | Detalle tabs; banner si `setupStatus: draft` |
| `/savings` | Lista metas |

### Tabs detalle crédito

1. **Cuotas** — `CreditPaymentTable`, toolbar acciones, checks, editar valor, marcar pagada
2. **Abonos** — lista + form (sin simulador UI v1.7)
3. **Destinos** — condicional por perfil (`usesDestinationsTab`)
4. **Ajustes** — icono engranaje; `CreditSettingsForm` + cambio perfil

### Componentes clave

```text
components/credits/
  CreditCreateWizard.tsx, CreditProfilePicker.tsx
  CreditList.tsx, CreditForm.tsx
  CreditPaymentTable.tsx, CapitalAbonoForm.tsx
  DestinationList.tsx, DestinationChart.tsx
  CreditSettingsForm.tsx, FundExpenseCategoryPicker.tsx
components/reports/
  ReportCreditsSection.tsx, ReportSavingsSection.tsx
components/ui/
  Modal.tsx, ConfirmDialog.tsx, GenieModalSvgDefs.tsx
lib/motion/
  genieModal.ts, useGenieOverlay.ts, useGenieModalOrigin.ts
lib/core/
  genieOrigin.ts
lib/credits/
  creditProfileRegistry.ts, types.ts
styles/
  genie-modal.css, credits-savings.css, budgets-reports.css
```

### Nav

- Desktop sidebar: Créditos, Ahorros
- Móvil menú «Más»: mismas entradas

### Estilos

`apps/web/src/styles/credits-savings.css` — tabs, tablas amortización, progress rubros.

---

## Integración dashboard

```typescript
// dashboard.overview
// - totalBalance (UI «Disponible»): cuentas !excluded && type !== "credit"
// - monthlyExpense: expenses personales + transferencias hacia cuentas aisladas
// - personalFinance: convex/lib/personalFinance.ts
// Optional card: CreditFundCard — credits.fundSummary per active credit
```

### Reglas `personalFinance` (fuente de verdad)

| Caso | ¿Cuenta en Disponible? | ¿Cuenta en Gastos/Neto? |
|------|------------------------|-------------------------|
| Cuenta con `excludeFromPersonalFinance` / escrow legacy | No | Movimientos **desde** ella: no (salvo cuota) |
| Cuenta `type: credit` (tarjeta) | No (disponible) | Compras **sí** (expense) |
| Pago cuota (`isCreditInstallmentPayment`) | N/A | **Sí** siempre |
| Movimiento fondo (`isCreditFundMovement`) | N/A | No |
| Transfer personal → meta/ahorro aislado | Baja origen | **Sí** (como gasto) |
| Transfer interna entre cuentas personales | Neto 0 | No |
---

## Seguridad

- Todas las queries/mutations: `requireUserId` + ownership `credit.userId`
- `disbursementAccountId` debe pertenecer al mismo usuario
- Wizard valida saldos suficientes en escrow/operativa

---

## Referencia QA (usuario)

Montos del caso real en `quickstart.md` — **solo QA**, no constantes en código.
