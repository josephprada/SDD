# API Contract: Fixed Expenses (Convex)

**Change**: web-budgets-reports  
**Module**: `convex/fixedExpenses.ts`

---

## Queries

### `fixedExpenses.list`

**Auth**: required

**Args**: `{ includeInactive?: boolean }`

**Returns**

```ts
Array<{
  _id: Id<"fixedExpenses">;
  name: string;
  amount: number;
  categoryId: Id<"categories">;
  categoryName: string;
  dayOfMonth: number;
  reminderOffsets: number[];
  emailReminders: boolean;
  pushReminders: boolean;
  active: boolean;
  nextDueDate: number;
  lastPaidPeriodKey?: string;
  isPaidCurrentPeriod: boolean;
}>
```

---

## Mutations

### `fixedExpenses.create`

**Args**

```ts
{
  name: string;
  amount: number;
  categoryId: Id<"categories">;
  dayOfMonth: number;
  reminderOffsets?: number[];  // default [2, 0]
  emailReminders?: boolean;
  pushReminders?: boolean;
  notes?: string;
}
```

**Validation**: `reminderOffsets` 1–5 items, each 0–30, unique sorted desc.

---

### `fixedExpenses.update` / `fixedExpenses.remove`

Standard CRUD by `id`.

---

### `fixedExpenses.markPaid`

**Args**: `{ id, periodKey?: string }` — default mes actual.

---

## Internal

### `fixedExpenses.processReminders`

Invocado por cron. Para cada gasto fijo activo, si `today === dueDate - offset`, dispatch reminder.
