# API Contract: Reports (Convex)

**Change**: web-budgets-reports  
**Module**: `convex/reports.ts`

---

## Queries

### `reports.summary`

**Auth**: required

**Args**

```ts
{
  periodStart: number;
  periodEnd: number;
  categoryId?: Id<"categories">;
  accountId?: Id<"accounts">;
  grouping?: "week" | "month" | "quarter" | "semester";  // bucket size for timeSeries
}
```

**Returns**: Ver `data-model.md` — Report Dataset.

**Rules**:
- Excluye `type === "transfer"`.
- Top N categorías + bucket "Otros" si > 8 categorías.

---

## Internal

### `reports.generatePeriodReport`

**Args**: `{ userId, grouping, periodKey }`  
**Returns**: Report Dataset + user email — para action de email.

### `reports.processPeriodClosures`

Cron: usuarios con `reportEmailEnabled`, detecta período cerrado ayer según `defaultGrouping`, envía una vez.
