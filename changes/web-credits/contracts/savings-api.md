# API Contract: Savings Goals (Convex)

**Change**: web-credits  
**Modules**: `convex/savingsGoals.ts`, `convex/savingsContributions.ts`

---

## Queries

### `savingsGoals.list`

**Auth**: required

**Args**: `{ status?: "active" | "completed" | "paused" }`

**Returns**

```ts
Array<{
  _id: Id<"savingsGoals">;
  name: string;
  targetAmount: number;
  currentAmount: number;
  percent: number;
  remaining: number;
  deadline?: number;
  linkedCreditId?: Id<"credits">;
  status: string;
}>
```

---

### `savingsGoals.get`

**Args**: `{ goalId }` — incluye `contributions[]`

---

## Mutations

### `savingsGoals.create`

**Args**

```ts
{
  name: string;
  targetAmount: number;
  deadline?: number;
  accountId?: Id<"accounts">;
  linkedCreditId?: Id<"credits">;
  icon?: string;
  color?: string;
  notes?: string;
}
```

---

### `savingsContributions.create`

**Args**

```ts
{
  goalId: Id<"savingsGoals">;
  amount: number;
  contributedAt: number;
  transactionId?: Id<"transactions">;
  notes?: string;
}
```

**Side effects**: Actualiza `currentAmount`; si ≥ target → `status: completed`; si `linkedCreditId` y umbral anual → flag `suggestAbono` en response

---

### `savingsGoals.update` / `pause` / `resume` / `archive`

Standard lifecycle
