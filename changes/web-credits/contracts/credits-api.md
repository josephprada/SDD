# API Contract: Credits (Convex)

**Change**: web-credits  
**Modules**: `convex/credits.ts`, `convex/creditPayments.ts`, `convex/creditCapitalAbonos.ts`, `convex/creditDestinations.ts`

---

## Queries

### `credits.list`

**Auth**: required

**Args**: `{}`

**Returns**

```ts
Array<{
  _id: Id<"credits">;
  name: string;
  lender: string;
  principal: number;
  outstandingBalance: number;
  status: "active" | "paid_off" | "defaulted";
  nextPayment?: { dueDate: number; totalDue: number; installmentNumber: number };
}>
```

---

### `credits.get`

**Args**: `{ creditId: Id<"credits"> }`

**Returns**: Credit + `paymentsSummary` + `destinationsSummary` + linked account names (user-defined)

---

### `credits.simulatePayoff`

**Args**

```ts
{
  creditId: Id<"credits">;
  annualAbonoAmount: number;
  years?: number;
}
```

**Returns**: `{ projectedPayoffDate, monthsRemaining, totalInterestPaid }`

---

### `creditPayments.listByCredit`

**Args**: `{ creditId }`  
**Returns**: Array of payment rows ordered by `installmentNumber`

---

### `creditCapitalAbonos.list`

**Args**: `{ creditId }`

---

### `creditDestinations.list`

**Args**: `{ creditId }`  
**Returns**: rows + `{ totalAllocated, unallocated }`

---

## Mutations

### `credits.create`

**Args**

```ts
{
  name: string;
  lender: string;
  principal: number;
  rateType: "EA" | "NAMV" | "MV";
  interestRate: number;
  termMonths: number;
  startDate: number;
  paymentDay: number;
  scheduleMode: "cuota_fija" | "capital_constant" | "manual";
  fixedInstallment?: number;
  insuranceMonthly?: number;
  disbursementAccountId?: Id<"accounts">;
  operatingAccountId?: Id<"accounts">;
  targetPayoffDate?: number;
  notes?: string;
}
```

**Side effects**: Genera `creditPayments`; opcional marca `isCreditEscrow` en cuenta

**Errors**: `VALIDATION`, `ACCOUNT_NOT_OWNED`

---

### `creditPayments.markPaid`

**Args**: `{ paymentId, paidDate, transactionId? }`

---

### `creditCapitalAbonos.create`

**Args**

```ts
{
  creditId: Id<"credits">;
  amount: number;
  paidAt: number;
  recalcEffect?: "shorten_term" | "lower_installment";
  transactionId?: Id<"transactions">;
  notes?: string;
}
```

**Side effects**: Recálculo cuotas pending

---

### `creditDestinations.create` / `update` / `remove`

Standard CRUD; warn if `totalAllocated > principal`

---

### `credits.spendFromFund`

**Args**

```ts
{
  creditId: Id<"credits">;
  destinationId: Id<"creditDestinations">;
  amount: number;
  expenseAccountId?: Id<"accounts">; // default operatingAccountId
  categoryId: Id<"categories">;
  returnRemainder: boolean;
  notes?: string;
}
```

**Side effects**: 1–3 transactions (transfer out, expense, optional transfer back)

---

## Internal

### `credits.processReminders`

Invocado por `notifications.processDaily`; tipos `credit_due`.
