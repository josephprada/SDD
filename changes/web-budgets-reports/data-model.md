# Data Model: Web Budgets & Reports

## Budget

**Table**: `budgets` (nueva)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `userId` | `Id<"users">` | Yes | Owner |
| `categoryId` | `Id<"categories">` | Yes | Solo tipo `expense`, no archivada al crear |
| `amount` | `number` | Yes | Límite COP, entero > 0 |
| `periodKey` | `string` | Yes | `"YYYY-MM"` |
| `notes` | `string` | No | Max 200 chars |
| `createdAt` | `number` | Yes | |
| `updatedAt` | `number` | Yes | |

**Indexes**

- `by_user`: `["userId"]`
- `by_user_period`: `["userId", "periodKey"]`
- `by_user_category`: `["userId", "categoryId"]`
- `by_user_cat_period`: `["userId", "categoryId", "periodKey"]` — **unicidad**

**Derived (query, no tabla)**

| Field | Source |
|-------|--------|
| `spent` | Σ `transactions` expense en `periodRange(periodKey)` |
| `remaining` | `amount - spent` |
| `percent` | `spent / amount` |
| `thresholdStatus` | `ok` / `info` / `warning` / `danger` |

---

## FixedExpense

**Table**: `fixedExpenses` (nueva)

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `userId` | `Id<"users">` | Yes | — | Owner |
| `name` | `string` | Yes | — | Max 80 chars |
| `amount` | `number` | Yes | — | COP > 0 |
| `categoryId` | `Id<"categories">` | Yes | — | Tipo expense |
| `dayOfMonth` | `number` | Yes | — | 1–31; clamp en mes corto |
| `reminderOffsets` | `number[]` | Yes | `[2, 0]` | Días antes del vencimiento; incluye 0 = mismo día |
| `emailReminders` | `boolean` | Yes | `true` | |
| `pushReminders` | `boolean` | Yes | `true` | |
| `active` | `boolean` | Yes | `true` | Inactivo = sin recordatorios |
| `notes` | `string` | No | — | Max 200 |
| `createdAt` | `number` | Yes | — | |
| `updatedAt` | `number` | Yes | — | |

**Indexes**

- `by_user`: `["userId"]`
- `by_user_active`: `["userId", "active"]`

**Payment tracking (client state v1, opcional persist)**

Tabla `fixedExpensePayments` **diferida** — v1 marca pagado en localStorage o campo `lastPaidPeriodKey` en la entidad:

| Field | Type | Notes |
|-------|------|-------|
| `lastPaidPeriodKey` | `string?` | `"YYYY-MM"` último mes marcado pagado |

---

## PushSubscription

**Table**: `pushSubscriptions` (nueva)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `userId` | `Id<"users">` | Yes | |
| `endpoint` | `string` | Yes | URL push service |
| `p256dh` | `string` | Yes | Clave cliente |
| `auth` | `string` | Yes | Secreto cliente |
| `userAgent` | `string` | No | Debug |
| `createdAt` | `number` | Yes | |

**Indexes**

- `by_user`: `["userId"]`
- `by_endpoint`: `["endpoint"]` — upsert por dispositivo

---

## NotificationLog

**Table**: `notificationLog` (nueva)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `userId` | `Id<"users">` | Yes | |
| `dedupeKey` | `string` | Yes | Clave única global |
| `type` | union | Yes | Ver abajo |
| `referenceId` | `string` | Yes | ID budget/fixedExpense/period |
| `channel` | `"email" \| "push" \| "in_app"` | Yes | |
| `sentAt` | `number` | Yes | |

**type**: `"fixed_expense_reminder" | "budget_threshold" | "period_report"`

**Indexes**

- `by_dedupeKey`: `["dedupeKey"]` — unique
- `by_user_sent`: `["userId", "sentAt"]`

**dedupeKey format**

```text
{userId}:{type}:{referenceId}:{channel}:{dateKey}
```

---

## UserPreferences (extensión)

**Table**: `userPreferences` (existente)

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `reportEmailEnabled` | `boolean` | `true` | Reporte automático al cierre |
| `pushEnabled` | `boolean` | `false` | Usuario activó push explícitamente |

Campos existentes reutilizados: `notificationsEnabled` (master switch), `defaultGrouping` (dispara cierre de período).

---

## Report Dataset (derivado)

No es tabla. Estructura retornada por `reports.summary`:

```typescript
{
  periodStart: number;
  periodEnd: number;
  periodLabel: string;
  totalIncome: number;
  totalExpense: number;
  net: number;
  byCategory: Array<{
    categoryId: string;
    name: string;
    color: string;
    amount: number;
    percent: number;
  }>;
  timeSeries: Array<{
    bucketStart: number;
    bucketLabel: string;
    income: number;
    expense: number;
  }>;
}
```

---

## Helpers (Convex `lib/`)

| Function | Module | Purpose |
|----------|--------|---------|
| `periodKeyFromDate(date)` | `lib/period.ts` | `"YYYY-MM"` |
| `resolveDueDate(year, month, dayOfMonth)` | `lib/fixedExpenses.ts` | Fecha vencimiento con clamp |
| `aggregateTransactions(txs, filters)` | `lib/reports.ts` | Agregación compartida |
| `buildDedupeKey(...)` | `lib/notifications.ts` | Idempotencia |
| `shouldSendNotification(prefs, channel)` | `lib/notifications.ts` | Gating global + canal |

---

## Client-only

| Key / Module | Purpose |
|--------------|---------|
| `apps/web/public/sw.js` | Service worker push |
| `apps/web/public/manifest.webmanifest` | PWA (generado por vite-plugin-pwa) |
| `apps/web/src/lib/export/pdfExport.ts` | jspdf + html2canvas |
| `apps/web/src/lib/export/csvExport.ts` | CSV del dataset activo |
