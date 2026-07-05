# API Contract: Budgets (Convex)

**Change**: web-budgets-reports  
**Module**: `convex/budgets.ts`

---

## Queries

### `budgets.list`

**Auth**: required

**Args**

```ts
{ periodKey: string }  // "YYYY-MM"
```

**Returns**

```ts
Array<{
  _id: Id<"budgets">;
  categoryId: Id<"categories">;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  amount: number;
  spent: number;
  remaining: number;
  percent: number;
  thresholdStatus: "ok" | "info" | "warning" | "danger";
  notes?: string;
}>
```

---

## Mutations

### `budgets.create`

**Args**

```ts
{
  categoryId: Id<"categories">;
  amount: number;
  periodKey: string;
  notes?: string;
}
```

**Errors**: `Not authenticated`, `VALIDATION`, `CONFLICT` (duplicado cat+period), `CATEGORY_NOT_EXPENSE`

---

### `budgets.update`

**Args**: `{ id, amount?, notes? }`

---

### `budgets.remove`

**Args**: `{ id }`

---

## Internal

### `budgets.checkThresholdAfterTransaction`

**Args**: `{ userId, categoryId, date }`  
**Effect**: Si cruza 80 % o 100 % → `notifications.dispatch` type `budget_threshold`.
