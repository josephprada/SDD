# Data Model: Web Credits & Savings

## Credit

**Table**: `credits` (nueva)

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `userId` | `Id<"users">` | Yes | — | Owner |
| `name` | `string` | Yes | — | Max 80; ej. «Remodelación vivienda» |
| `lender` | `string` | Yes | — | Texto libre; cualquier prestamista |
| `principal` | `number` | Yes | — | COP entero > 0; monto desembolsado |
| `rateType` | `"EA" \| "NAMV" \| "MV"` | Yes | — | Cómo se expresa la tasa |
| `interestRate` | `number` | Yes | — | % según rateType (ej. 1.08 si MV) |
| `termMonths` | `number` | Yes | — | Plazo original en meses |
| `startDate` | `number` | Yes | — | Timestamp inicio / desembolso |
| `paymentDay` | `number` | Yes | — | 1–31; clamp mes corto |
| `scheduleMode` | `"cuota_fija" \| "capital_constant" \| "manual"` | Yes | `cuota_fija` | Modo de tabla |
| `fixedInstallment` | `number` | No | — | Cuota conocida (capital+interés) |
| `defaultRecalcOnAbono` | `"shorten_term" \| "lower_installment"` | Yes | `shorten_term` | Efecto abono extraordinario |
| `targetPayoffDate` | `number` | No | — | Meta aspiracional |
| `insuranceMonthly` | `number` | No | — | Seguro fijo mensual opcional |
| `disbursementAccountId` | `Id<"accounts">` | No | — | Cuenta escrow del desembolso |
| `operatingAccountId` | `Id<"accounts">` | No | — | Cuenta operativa pasarela |
| `outstandingBalance` | `number` | Yes | — | Saldo deuda; denormalizado |
| `reminderOffsets` | `number[]` | Yes | `[3, 0]` | Días antes vencimiento cuota |
| `status` | `"active" \| "paid_off" \| "defaulted"` | Yes | `active` | |
| `notes` | `string` | No | — | Max 500 |
| `createdAt` | `number` | Yes | — | |
| `updatedAt` | `number` | Yes | — | |

**Indexes**

- `by_user`: `["userId"]`
- `by_user_status`: `["userId", "status"]`

---

## CreditPayment

**Table**: `creditPayments` (nueva)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `creditId` | `Id<"credits">` | Yes | |
| `installmentNumber` | `number` | Yes | 1..n |
| `dueDate` | `number` | Yes | Timestamp |
| `paidDate` | `number` | No | |
| `principal` | `number` | Yes | Abono a capital del mes |
| `interest` | `number` | Yes | Interés del mes |
| `insuranceAmount` | `number` | No | |
| `otherFees` | `number` | No | |
| `totalDue` | `number` | Yes | VR cuota total |
| `status` | `"pending" \| "paid" \| "overdue" \| "cancelled"` | Yes | |
| `transactionId` | `Id<"transactions">` | No | Pago vinculado |
| `isProjected` | `boolean` | Yes | `true` si generado; `false` si manual |
| `createdAt` | `number` | Yes | |
| `updatedAt` | `number` | Yes | |

**Indexes**

- `by_credit`: `["creditId"]`
- `by_credit_status`: `["creditId", "status"]`
- `by_credit_due`: `["creditId", "dueDate"]`

---

## CreditCapitalAbono

**Table**: `creditCapitalAbonos` (nueva)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `creditId` | `Id<"credits">` | Yes | |
| `amount` | `number` | Yes | COP > 0 |
| `paidAt` | `number` | Yes | Fecha abono |
| `recalcEffect` | `"shorten_term" \| "lower_installment"` | Yes | |
| `transactionId` | `Id<"transactions">` | No | |
| `notes` | `string` | No | |
| `createdAt` | `number` | Yes | |

**Indexes**

- `by_credit`: `["creditId"]`

---

## CreditDestination

**Table**: `creditDestinations` (nueva)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `creditId` | `Id<"credits">` | Yes | |
| `name` | `string` | Yes | Max 80; ej. «Escaleras» |
| `amount` | `number` | Yes | COP > 0 asignado al rubro |
| `spentAt` | `number` | No | Fecha ejecución |
| `status` | `"planned" \| "in_progress" \| "completed"` | Yes | |
| `transactionIds` | `Id<"transactions">[]` | No | Gastos vinculados |
| `notes` | `string` | No | |
| `createdAt` | `number` | Yes | |
| `updatedAt` | `number` | Yes | |

**Indexes**

- `by_credit`: `["creditId"]`

**Derived (query)**

| Field | Formula |
|-------|---------|
| `totalAllocated` | Σ `amount` destinos activos |
| `unallocated` | `principal - totalAllocated` |

---

## SavingsGoal

**Table**: `savingsGoals` (nueva)

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `userId` | `Id<"users">` | Yes | — | |
| `name` | `string` | Yes | — | Max 80 |
| `targetAmount` | `number` | Yes | — | COP > 0 |
| `currentAmount` | `number` | Yes | `0` | Suma aportes (derivado o persistido) |
| `deadline` | `number` | No | — | |
| `accountId` | `Id<"accounts">` | No | — | Referencia saldo |
| `linkedCreditId` | `Id<"credits">` | No | — | Para sugerir abono anual |
| `icon` | `string` | No | — | |
| `color` | `string` | No | — | Token o seed color |
| `status` | `"active" \| "completed" \| "paused"` | Yes | `active` | |
| `notes` | `string` | No | — | |
| `createdAt` | `number` | Yes | — | |
| `updatedAt` | `number` | Yes | — | |

**Indexes**

- `by_user`: `["userId"]`
- `by_user_status`: `["userId", "status"]`

---

## SavingsContribution

**Table**: `savingsContributions` (nueva)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `goalId` | `Id<"savingsGoals">` | Yes | |
| `amount` | `number` | Yes | COP > 0 |
| `contributedAt` | `number` | Yes | |
| `transactionId` | `Id<"transactions">` | No | |
| `notes` | `string` | No | |
| `createdAt` | `number` | Yes | |

**Indexes**

- `by_goal`: `["goalId"]`

---

## Account (extensión)

**Table**: `accounts` (existente)

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `isCreditEscrow` | `boolean` | Yes | `false` | Excluir de balance personal |

---

## Transaction (extensión)

**Table**: `transactions` (existente)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `creditId` | `Id<"credits">` | No | Movimiento del fondo/cuota |
| `creditDestinationId` | `Id<"creditDestinations">` | No | Rubro asociado |
| `isCreditFundMovement` | `boolean` | No | `true` para wizard escrow |

---

## NotificationLog (extensión tipo)

Nuevo `type`: `credit_due` — dedupeKey `credit_due:{creditId}:{paymentId}:{offset}:{channel}`

---

## State transitions

### Credit

`active` → `paid_off` (saldo 0) | `defaulted` (manual)

### CreditPayment

`pending` → `paid` | `overdue` (cron/query post dueDate) | `cancelled` (recálculo abono)

### SavingsGoal

`active` → `completed` (≥100%) | `paused` ↔ `active`
