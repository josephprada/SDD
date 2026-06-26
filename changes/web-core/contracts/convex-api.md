# Contract: Convex API for Web Core

## Auth

All queries and mutations require an authenticated user. If `getAuthUserId(ctx)` returns `null`, handlers must throw `Not authenticated` or return `null` only for read APIs explicitly documented as nullable.

All IDs passed by the client must be verified for ownership before read/write.

## `accounts`

### `accounts.list`

```ts
args: {
  includeArchived?: boolean;
}
returns: Account[]
```

Returns user accounts ordered by `createdAt` ascending. Defaults to active accounts only.

### `accounts.create`

```ts
args: {
  name: string;
  type: "cash" | "bank" | "credit";
  initialBalance?: number;
}
returns: Id<"accounts">
```

Validation:

- `name` trimmed and non-empty
- `initialBalance` defaults to `0`
- amount integer COP

### `accounts.update`

```ts
args: {
  accountId: Id<"accounts">;
  name: string;
  type: "cash" | "bank" | "credit";
}
returns: null
```

Does not alter `balance`.

### `accounts.archive`

```ts
args: {
  accountId: Id<"accounts">;
}
returns: null
```

Sets `archived: true`. Physical delete is out of scope when historical transactions exist.

## `categories`

### `categories.list`

```ts
args: {
  type?: "income" | "expense" | "transfer";
  includeArchived?: boolean;
}
returns: Category[]
```

Defaults to active categories only.

### `categories.create`

```ts
args: {
  name: string;
  icon: string;
  color: string;
  type: "income" | "expense" | "transfer";
}
returns: Id<"categories">
```

Validation:

- no duplicate active `name` for same `userId + type`
- `isSystem` is always `false` for user-created categories

### `categories.update`

```ts
args: {
  categoryId: Id<"categories">;
  name: string;
  icon: string;
  color: string;
}
returns: null
```

Rejects `isSystem` categories.

### `categories.archive`

```ts
args: {
  categoryId: Id<"categories">;
}
returns: null
```

Rejects `isSystem` categories.

## `transactions`

### `transactions.list`

```ts
args: {
  dateFrom?: number;
  dateTo?: number;
  accountId?: Id<"accounts">;
  categoryId?: Id<"categories">;
  amountMin?: number;
  amountMax?: number;
  search?: string;
  limit?: number;
}
returns: TransactionListItem[]
```

Returns newest first. Search covers notes, account name and category name.

### `transactions.recent`

```ts
args: {
  limit?: number;
}
returns: TransactionListItem[]
```

Defaults to `5`, max `20`.

### `transactions.create`

```ts
args: {
  type: "income" | "expense" | "transfer";
  amount: number;
  date: number;
  accountId: Id<"accounts">;
  toAccountId?: Id<"accounts">;
  categoryId: Id<"categories">;
  notes?: string;
}
returns: Id<"transactions">
```

Applies balance deltas before/with insert in one mutation.

### `transactions.update`

```ts
args: {
  transactionId: Id<"transactions">;
  type: "income" | "expense" | "transfer";
  amount: number;
  date: number;
  accountId: Id<"accounts">;
  toAccountId?: Id<"accounts">;
  categoryId: Id<"categories">;
  notes?: string;
}
returns: null
```

Reverts the previous delta, then applies the new delta.

### `transactions.remove`

```ts
args: {
  transactionId: Id<"transactions">;
}
returns: null
```

Deletes transaction attachments first, reverts balance delta, then deletes the transaction.

## `attachments`

### `attachments.generateUploadUrl`

```ts
args: {}
returns: string
```

### `attachments.listByTransaction`

```ts
args: {
  transactionId: Id<"transactions">;
}
returns: Attachment[]
```

### `attachments.create`

```ts
args: {
  transactionId: Id<"transactions">;
  storageId: Id<"_storage">;
  filename: string;
  mimeType: "image/jpeg" | "image/png" | "application/pdf";
  size: number;
}
returns: Id<"attachments">
```

Rejects files over 10 MB and non-whitelisted MIME types.

### `attachments.remove`

```ts
args: {
  attachmentId: Id<"attachments">;
}
returns: null
```

Deletes metadata and Convex storage file.

### `attachments.getUrl`

```ts
args: {
  storageId: Id<"_storage">;
}
returns: string | null
```

## `dashboard`

### `dashboard.overview`

```ts
args: {
  monthStart: number;
  monthEnd: number;
  recentLimit?: number;
}
returns: {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  activeAccounts: AccountSummary[];
  recentTransactions: TransactionListItem[];
}
```
