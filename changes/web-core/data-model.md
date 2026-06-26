# Data Model: Web Core

## Account

**Table**: `accounts`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `userId` | `Id<"users">` | Yes | Owner |
| `name` | `string` | Yes | Trimmed, non-empty |
| `type` | `"cash" | "bank" | "credit"` | Yes | Account kind |
| `initialBalance` | `number` | Yes | Integer COP |
| `balance` | `number` | Yes | Integer COP, denormalized |
| `archived` | `boolean` | Yes | Hidden from new selectors |
| `createdAt` | `number` | Yes | Timestamp |
| `updatedAt` | `number` | Yes | Timestamp |
| `archivedAt` | `number` | No | Timestamp |

**Indexes**

- `by_user`: `["userId"]`
- `by_user_archived`: `["userId", "archived"]`

**State transitions**

- `active -> archived`
- No `archived -> active` in this change unless implementation chooses to expose restore.

## Category

**Table**: `categories` (extends existing table)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `userId` | `Id<"users">` | Yes | Owner |
| `name` | `string` | Yes | Unique per user/type among active categories |
| `icon` | `string` | Yes | Emoji/string icon |
| `color` | `string` | Yes | Existing seed colors retained; UI should normalize future values |
| `type` | `"expense" | "income" | "transfer"` | Yes | Category kind |
| `archived` | `boolean` | Yes | Hidden from new selectors |
| `isSystem` | `boolean` | Yes | Protects Transferencia |
| `createdAt` | `number` | Yes | Timestamp |
| `updatedAt` | `number` | Yes | Timestamp |
| `archivedAt` | `number` | No | Timestamp |

**Indexes**

- `by_user`: `["userId"]`
- `by_user_type`: `["userId", "type"]`
- `by_user_type_archived`: `["userId", "type", "archived"]`

## Transaction

**Table**: `transactions`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `userId` | `Id<"users">` | Yes | Owner |
| `type` | `"income" | "expense" | "transfer"` | Yes | Controls balance delta |
| `amount` | `number` | Yes | Integer COP, `> 0` |
| `date` | `number` | Yes | Timestamp chosen by user |
| `accountId` | `Id<"accounts">` | Yes | Account, or origin for transfer |
| `toAccountId` | `Id<"accounts">` | Transfer only | Destination account |
| `categoryId` | `Id<"categories">` | Yes | Must match type |
| `notes` | `string` | No | Searchable text |
| `createdAt` | `number` | Yes | Timestamp |
| `updatedAt` | `number` | Yes | Timestamp |

**Indexes**

- `by_user`: `["userId"]`
- `by_user_date`: `["userId", "date"]`
- `by_user_account`: `["userId", "accountId"]`
- `by_user_category`: `["userId", "categoryId"]`

**Balance deltas**

| Transaction type | Account delta |
|------------------|---------------|
| `income` | `accountId += amount` |
| `expense` | `accountId -= amount` |
| `transfer` | `accountId -= amount`, `toAccountId += amount` |

## Attachment

**Table**: `attachments`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `userId` | `Id<"users">` | Yes | Owner |
| `entityType` | `"transaction"` | Yes | Only transaction attachments in Change 2 |
| `entityId` | `Id<"transactions">` | Yes | Parent transaction |
| `storageId` | `Id<"_storage">` | Yes | Convex storage |
| `filename` | `string` | Yes | Original name |
| `mimeType` | `"image/jpeg" | "image/png" | "application/pdf"` | Yes | Whitelist |
| `size` | `number` | Yes | Max 10 MB |
| `uploadedAt` | `number` | Yes | Timestamp |

**Indexes**

- `by_user`: `["userId"]`
- `by_entity`: `["entityType", "entityId"]`

## DashboardOverview

Derived read model returned by `dashboard.overview`.

```ts
type DashboardOverview = {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  recentTransactions: TransactionSummary[];
  activeAccounts: AccountSummary[];
};
```
