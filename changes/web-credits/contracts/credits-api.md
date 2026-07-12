# API Contract: Credits (Convex)

**Change**: web-credits  
**Modules**: `convex/credits.ts`, `convex/creditPayments.ts`, `convex/creditCapitalAbonos.ts`, `convex/creditDestinations.ts`

**v1.6**: perfiles adaptativos, creación mínima, `setupStatus`.

---

## Types

```typescript
type CreditProfile =
  | "free_purpose"
  | "housing_improvement"
  | "debt_consolidation"
  | "tangible_product"
  | "intangible_service"
  | "p2p_agreement";

type SetupStatus = "draft" | "ready" | "active";

type LinkedAsset = {
  kind: "vehicle" | "goods" | "service" | "other";
  label: string;
  vendor?: string;
  identifier?: string;
};

type InformalAgreement = {
  counterpartyName?: string;
  relationship?: string;
  notes?: string;
};
```

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
  creditProfile: CreditProfile;
  setupStatus: SetupStatus;
  lender?: string;
  principal?: number;
  outstandingBalance?: number;
  status: "active" | "paid_off" | "defaulted";
  nextPayment?: { dueDate: number; totalDue: number; installmentNumber: number };
}>
```

---

### `credits.get`

**Args**: `{ creditId: Id<"credits"> }`

**Returns**: Credit + `paymentsSummary` + `destinationsSummary` + linked account names +:

```ts
{
  missingFields: string[];       // ej. ["principal", "termMonths"]
  profileWarnings?: string[];  // ej. datos conservados ocultos
}
```

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

**Errors**: `CREDIT_DRAFT` si `setupStatus === "draft"`

---

### `creditPayments.listByCredit`

**Args**: `{ creditId }`  
**Returns**: Array of payment rows ordered by `installmentNumber` (vacío si `draft`)

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

**Args** — v1.6: solo `name` obligatorio

```ts
{
  name: string;                          // REQUIRED
  creditProfile?: CreditProfile;         // default free_purpose
  lender?: string;
  principal?: number;
  rateType?: "EA" | "NAMV" | "MV";
  interestRate?: number;
  termMonths?: number;
  startDate?: number;
  paymentDay?: number;
  scheduleMode?: "cuota_fija" | "capital_constant" | "manual";
  fixedInstallment?: number;
  insuranceMonthly?: number;
  disbursementAccountId?: Id<"accounts">;
  paymentAccountId?: Id<"accounts">;
  registerDisbursementIncome?: boolean;
  alreadyInProgress?: boolean;
  paidInstallmentsCount?: number;
  trackRemainingOnly?: boolean;
  outstandingBalance?: number;
  fundExpenseCategoryIds?: Id<"categories">[];
  newFundExpenseCategoryNames?: string[];
  linkedAsset?: LinkedAsset;
  informalAgreement?: InformalAgreement;
  targetPayoffDate?: number;
  notes?: string;
}
```

**Side effects**:
- Si faltan datos mínimos para cuotas → `setupStatus: draft`; **no** inserta `creditPayments`
- Si datos completos y caller pide generar (flag futuro o `ensurePaymentSchedule` inmediato) → `setupStatus: active` + schedule
- Opcional marca `isCreditEscrow` en cuenta desembolso

**Errors**: `VALIDATION`, `ACCOUNT_NOT_OWNED`

---

### `credits.update`

**Args**: campos editables incl. financieros (`principal`, `rateType`, `termMonths`, etc.) y metadata. Regeneración de cuotas pending solo si explícito o vía `ensurePaymentSchedule`.

---

### `credits.updateSetupProfile`

**Args**

```ts
{
  creditId: Id<"credits">;
  creditProfile: CreditProfile;
  preserveIncompatibleData: boolean;
}
```

**Side effects**:
- `preserveIncompatibleData: true` → mueve campos incompatibles a `profileMetadata`
- `preserveIncompatibleData: false` → limpia campos incompatibles (no borra cuotas pagadas, abonos, tx históricas, destinos con gastos)

**Errors**: `VALIDATION`, `CREDIT_NOT_FOUND`

---

### `credits.ensurePaymentSchedule`

**Args**: `{ creditId: Id<"credits"> }`

**Side effects**: Valida datos mínimos; genera `creditPayments`; `setupStatus: active`

**Errors**: `INCOMPLETE_SETUP`, `VALIDATION`

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

**Errors**: `CREDIT_DRAFT`

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
  expenseAccountId?: Id<"accounts">;
  categoryId: Id<"categories">;
  returnRemainder: boolean;
  notes?: string;
}
```

**Side effects**: 1–3 transactions (transfer out, expense, optional transfer back)

**Errors**: `DISBURSEMENT_ACCOUNT_REQUIRED`

---

## Internal

### `credits.processReminders`

Invocado por `notifications.processDaily`; tipos `credit_due`. Skip `setupStatus === "draft"`.
