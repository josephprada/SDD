# API Contract: Personal Access Tokens

**Change**: mcp-access  
**Module**: `convex/apiTokens.ts`  
**Auth**: sesión Google (`requireUserId`) — **no** PAT

---

## Types

```typescript
type ApiScope =
  | "read:dashboard"
  | "read:transactions"
  | "write:transactions"
  | "read:accounts"
  | "write:accounts"
  | "read:categories"
  | "write:categories"
  | "read:budgets"
  | "write:budgets"
  | "read:credits"
  | "write:credits"
  | "read:savings"
  | "write:savings"
  | "read:tax"
  | "write:tax"
  | "destructive";

type ApiTokenPublic = {
  _id: Id<"apiTokens">;
  name: string;
  tokenPrefix: string;
  scopes: ApiScope[];
  expiresAt?: number;
  lastUsedAt?: number;
  revokedAt?: number;
  createdAt: number;
  status: "active" | "expired" | "revoked";
};
```

---

## Mutations

### `apiTokens.create`

**Args**:

```ts
{
  name: string;
  scopes: ApiScope[];
  expiresAt?: number; // ms epoch, future
}
```

**Returns**:

```ts
{
  token: ApiTokenPublic;
  tokenPlaintext: string; // SOLO en esta respuesta
}
```

**Errors**:
- `Not authenticated`
- `Too many active tokens` (max 10)
- `Invalid scopes`
- `Invalid expiry`

**Defaults**: si `scopes` vacío → `DEFAULT_READ_SCOPES`.

---

### `apiTokens.revoke`

**Args**: `{ tokenId: Id<"apiTokens"> }`  
**Returns**: `{ ok: true }`  
**Errors**: not found / not owner / already revoked (idempotent ok)

---

## Queries

### `apiTokens.list`

**Args**: `{}`  
**Returns**: `ApiTokenPublic[]` ordenados por `createdAt` desc (incluye revocados recientes; UI puede filtrar).

---

### `apiAudit.listRecent`

**Module**: `convex/apiAudit.ts`  
**Args**: `{ limit?: number }` default 50, max 100  
**Returns**:

```ts
Array<{
  _id: Id<"apiAuditLog">;
  tokenId: Id<"apiTokens">;
  tokenPrefix?: string; // join best-effort
  action: string;
  success: boolean;
  errorCode?: string;
  summary?: string;
  createdAt: number;
}>
```

---

## Security notes

- Nunca retornar `tokenHash` ni `tokenPlaintext` en `list`/`get`.
- `create` es la única respuesta con secreto.
