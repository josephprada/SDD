# API Contract: Credit Fund & Dashboard (Convex)

**Change**: web-credits  
**Modules**: `convex/credits.ts`, `convex/dashboard.ts`, `convex/transactions.ts`, `convex/accounts.ts`

---

## Queries

### `credits.fundSummary`

**Args**: `{ creditId }`

**Returns**

```ts
{
  disbursementAccountId?: Id<"accounts">;
  escrowBalance: number;
  principal: number;
  totalAllocated: number;
  unallocated: number;
  operatingAccountId?: Id<"accounts">;
}
```

---

### `credits.listFundMovements`

**Args**: `{ creditId, limit?: number }`

**Returns**: Transactions where `creditId` matches, newest first

---

### `dashboard.overview` (modificado)

**Behavior change**: `totalBalance` excluye cuentas con `isCreditEscrow === true`

**New optional field**: `creditFundCards?: Array<{ creditId, name, escrowBalance }>`

---

### `transactions.list` (modificado)

**Args** (extensión)

```ts
{
  // ...existing filters
  includeCreditMovements?: boolean; // default false
  creditId?: Id<"credits">;
}
```

---

## Mutations

### `accounts.create` / `update` (modificado)

**Args** (extensión): `isCreditEscrow?: boolean`

---

### `accounts.linkToCredit`

**Args**

```ts
{
  accountId: Id<"accounts">;
  creditId: Id<"credits">;
  role: "disbursement" | "operating";
}
```

Sets `disbursementAccountId` or `operatingAccountId` on credit; sets `isCreditEscrow: true` when role is disbursement

---

## Rules

- Desembolso inicial: al vincular escrow, opción `setEscrowBalanceToPrincipal: true` ajusta `accounts.balance` sin crear transaction `income`
- Movimientos con `isCreditFundMovement: true` ocultos en listado default
