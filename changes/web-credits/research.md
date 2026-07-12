# Research: Web Credits & Savings

## Decision: Amortización colombiana — tres modos

**Rationale**: En Colombia los créditos en pesos usan mayoritariamente **cuota fija** con interés sobre saldo insoluto (amortización gradual). Créditos de vivienda/VIS pueden tener cuota total variable (seguros) o capital mensual más estable. La spec exige no forzar una sola fórmula.

**Modos v1**:

| Modo | Cálculo | Cuándo |
|------|---------|--------|
| `cuota_fija` | PMT + desglose mes a mes | Libre inversión, consumo |
| `capital_constant` | Capital fijo = P/n; interés = saldo × i | Cuota decreciente |
| `manual` | Filas usuario/import | Extracto bancario |

**Conversión tasa mensual `i`**:

- `EA`: `i = (1 + EA)^(1/12) − 1`
- `NAMV`: `i = NAMV / 12`
- `MV`: `i = MV` (decimal)

**Alternatives considered**:
- Solo PMT: insuficiente para VIS y tablas importadas.
- UVR indexado: fuera de scope v1.

## Decision: Abono a capital — recálculo parcial

**Rationale**: Tras abono extraordinario, solo cuotas `pending` pasan a `cancelled` y se regeneran. Cuotas `paid` inmutables. Efectos: `shorten_term` (default) o `lower_installment` — alineado a práctica bancaria colombiana.

**Algoritmo**:
1. `outstandingBalance -= abono.amount`
2. Cancelar filas `pending` (status `cancelled`, conservar auditoría)
3. Regenerar con saldo restante, misma tasa/modo, según `recalcEffect`

**Alternatives considered**:
- Recalcular todo el crédito: rompe historial pagado.
- Solo nota sin recálculo: no proyecta nuevo plazo.

## Decision: Fondo escrow — cuenta genérica vinculada

**Rationale**: Usuarios aíslan el desembolso en una cuenta separada (meta, subcuenta, etc.) sin mezclar con nómina. La app modela esto con `disbursementAccountId` + `accounts.isCreditEscrow`. **Sin nombres ni APIs de banco**.

**Dashboard**: `dashboard.overview` excluye cuentas `isCreditEscrow` del balance personal; query separada `credits.fundSummary`.

**Alternatives considered**:
- Saldo virtual solo en crédito: desincroniza con balances reales de cuentas.
- Mezclar en balance total: confunde patrimonio con fondo restringido.

## Decision: Wizard «Gastar desde fondo»

**Rationale**: Flujo real: escrow → operativa → gasto → (opcional) devolver sobrante. Orquesta mutations existentes de `transactions` + flags `creditId`, `creditDestinationId`, `isCreditFundMovement`.

**Alternatives considered**:
- Solo gasto manual: pierde transferencias intermedias.
- Un solo movimiento neto: no cuadra con extractos bancarios.

## Decision: Destinos vs transacciones

**Rationale**: `creditDestinations` = plan/ejecución del uso del capital (`principal` desglosado). Transacciones = movimiento real de dinero. Un rubro puede existir sin transacción (efectivo); puede vincular `transactionIds[]`.

**Alternatives considered**:
- Solo categorías de gasto: no ligan al crédito ni al desembolso.

## Decision: Metas de ahorro separadas del escrow

**Rationale**: Meta $500k/mes para abono anual sale de **nómina** (`linkedCreditId`), no del fondo $40M de obra. `savingsGoals` reutiliza patrón de aportes; opcional `linkedCreditId` para sugerir abono al llegar a $6M.

## Decision: Recordatorios de cuota

**Rationale**: Reutilizar `notificationLog` + cron diario existente (`notifications.processDaily`). Nuevo tipo `credit_due`. Offsets por crédito default `[3, 0]`.

**Alternatives considered**:
- Email cuotas: diferido (igual que budgets email pausado).

## Decision: Tests unitarios amortización

**Rationale**: `convex/lib/creditAmortization.ts` funciones puras + `bun test`. Casos QA: $40M @ ~1.08% MV; abono $6M/año acorta plazo; cuota fija redondeo peso; última cuota saldo 0.

## Fases deployables

| Fase | Entrega | Deployable |
|------|---------|------------|
| A | Schema + lib amortización | Backend only |
| B | CRUD crédito + cuotas (cuota_fija) | `/credits` lista + detalle básico |
| C | Abonos + simulador | Recálculo funcional |
| D | Destinos + gráfico | Rubros |
| E | Escrow + wizard + filtros | Aislamiento nómina |
| F | Metas ahorro | `/savings` |
| G | Modos manual/capital_constant + recordatorios | Completitud VIS |
| H | Polish + dashboard card | UX final |
