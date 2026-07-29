# API Contract: Agent Gateway (HTTP RPC)

**Change**: mcp-access  
**Route**: `POST /agent/v1/rpc` en `convex/http.ts`  
**Auth**: `Authorization: Bearer jpw_…` (PAT)

---

## Request

```http
POST /agent/v1/rpc HTTP/1.1
Host: <deployment>.convex.site
Authorization: Bearer jpw_…
Content-Type: application/json

{
  "tool": "get_financial_overview",
  "args": { },
  "confirm": false
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `tool` | string | Yes | Nombre del catálogo MCP/gateway |
| `args` | object | Yes | Puede ser `{}` |
| `confirm` | boolean | No | Requerido `true` si tool destructivo |

---

## Response 200

```json
{
  "ok": true,
  "tool": "get_financial_overview",
  "data": { }
}
```

## Response 4xx/5xx

```json
{
  "ok": false,
  "error": {
    "code": "unauthorized" | "forbidden" | "validation" | "not_found" | "confirmation_required" | "rate_limited" | "conflict" | "internal",
    "message": "Human readable"
  }
}
```

| HTTP | code | Cuándo |
|------|------|--------|
| 401 | `unauthorized` | Token ausente/inválido/revocado/caducado |
| 403 | `forbidden` | Scope insuficiente |
| 400 | `validation` | Args inválidos |
| 404 | `not_found` | Entidad inexistente o no owned (sin leak) |
| 409 | `conflict` | p.ej. tax filed |
| 428 | `confirmation_required` | Falta `confirm: true` |
| 429 | `rate_limited` | Exceso rpm |
| 500 | `internal` | Error inesperado |

---

## Auth algorithm

1. Extraer Bearer token
2. `hash = sha256(pepper? + token)`
3. Lookup `apiTokens` by `tokenHash`
4. Reject si missing / revoked / expired
5. Patch `lastUsedAt` (best-effort)
6. Resolver handler + required scopes
7. Ejecutar con `userId` del token (nunca confiar args `userId`)
8. Insert `apiAuditLog`
9. Return data / error

---

## CORS

- Métodos: `POST`, `OPTIONS`
- Origins: no necesario para server-to-server MCP; si browser clients aparecen, allowlist explícita. V1: sin CORS abierto (`*`).

---

## Versioning

Path `/agent/v1/` — breaking changes → `/agent/v2/`.
