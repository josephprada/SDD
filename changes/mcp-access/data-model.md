# Data Model: MCP Access

## ApiToken

**Table**: `apiTokens` (nueva)

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `userId` | `Id<"users">` | Yes | — | Owner |
| `name` | `string` | Yes | — | Max 80; label humano |
| `tokenPrefix` | `string` | Yes | — | p.ej. `jpw_ab12cd` para UI/logs |
| `tokenHash` | `string` | Yes | — | SHA-256 hex (± pepper) |
| `scopes` | `string[]` | Yes | — | Ver catálogo |
| `expiresAt` | `number` | No | — | ms epoch; omit = sin caducidad |
| `lastUsedAt` | `number` | No | — | actualizado en RPC exitoso/auth |
| `revokedAt` | `number` | No | — | set → inactivo |
| `createdAt` | `number` | Yes | — | |
| `updatedAt` | `number` | Yes | — | |

**Indexes**

- `by_user`: `["userId"]`
- `by_token_hash`: `["tokenHash"]` — lookup auth O(1)
- `by_user_prefix`: `["userId", "tokenPrefix"]` — opcional UX

**Validation**

- `name` trim 1…80
- `scopes` ⊆ catálogo; al menos un scope
- Default create: todos los `read:*` si UI manda preset “Solo lectura”
- Máx. 10 documentos con `revokedAt` undefined por `userId`
- Auth rechazo si `revokedAt` set **o** `expiresAt < now`

**State**

| Estado | Condición |
|--------|-----------|
| active | `!revokedAt` && (`!expiresAt` \|\| `expiresAt > now`) |
| expired | `!revokedAt` && `expiresAt <= now` |
| revoked | `revokedAt` set |

No hay “un-revoke”; crear token nuevo.

**Plaintext** (nunca en DB):

```text
jpw_<base64url 32 bytes>
```

---

## ApiAuditLog

**Table**: `apiAuditLog` (nueva)

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `userId` | `Id<"users">` | Yes | — | |
| `tokenId` | `Id<"apiTokens">` | Yes | — | |
| `action` | `string` | Yes | — | tool name o `auth_failed` / `forbidden` / `rate_limited` |
| `success` | `boolean` | Yes | — | |
| `errorCode` | `string` | No | — | p.ej. `forbidden`, `validation`, `not_found` |
| `summary` | `string` | No | — | args redactados, max 500 |
| `createdAt` | `number` | Yes | — | |

**Indexes**

- `by_user_created`: `["userId", "createdAt"]`
- `by_token_created`: `["tokenId", "createdAt"]`

**Retention**: objetivo 90 días (cron fase D); v1 sin purge automático.

---

## Scope catalog (constantes TS)

```typescript
export const API_SCOPES = [
  "read:dashboard",
  "read:transactions",
  "write:transactions",
  "read:accounts",
  "write:accounts",
  "read:categories",
  "write:categories",
  "read:budgets",
  "write:budgets",
  "read:credits",
  "write:credits",
  "read:savings",
  "write:savings",
  "read:tax",
  "write:tax",
  "destructive",
] as const;

export type ApiScope = (typeof API_SCOPES)[number];

export const DEFAULT_READ_SCOPES: ApiScope[] = API_SCOPES.filter((s) =>
  s.startsWith("read:"),
);
```

---

## Relationships

```text
users 1──* apiTokens
users 1──* apiAuditLog
apiTokens 1──* apiAuditLog
```

No FK cascade Convex: al revocar token se conservan audits; al borrar usuario (fuera de scope) — N/A este change.

---

## Entity mapping (spec → schema)

| Spec entity | Persistencia |
|-------------|--------------|
| ApiToken | `apiTokens` |
| ApiAuditEvent | `apiAuditLog` |
| McpToolSurface | contrato `contracts/mcp-tools.md` (código en MCP + gateway) |
| ConnectionProfile | generado en cliente (`connectionSnippets.ts`) |
