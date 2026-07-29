# Research: MCP Access

**Change**: mcp-access  
**Date**: 2026-07-29  
**Status**: Complete — all unknowns resolved for Opción D

---

## R-01 — Transporte MCP remoto

**Decision**: Servidor MCP con **Streamable HTTP** (endpoint `/mcp`) + Bearer auth; stdio como segundo modo del mismo binario.

**Rationale**: El SDK TypeScript oficial (`@modelcontextprotocol/*`) documenta Express + `requireBearerAuth` + `NodeStreamableHTTPServerTransport` / `createMcpHandler`. Es el camino soportado para Claude / Cursor / agentes cloud. Stdio cubre Claude Desktop / Cursor local sin VPS.

**Alternatives considered**:
- Solo stdio → no cumple “cualquier agente remoto”
- MCP puro en Convex httpActions → streams/sesión frágiles en modelo request-scoped
- SSE legacy sin Streamable HTTP → peor compatibilidad a futuro

---

## R-02 — Dónde validar el PAT

**Decision**: Validación **canónica en Convex** (hash → `apiTokens` → `userId` + scopes). El MCP server **reenvía** el `Authorization: Bearer` en cada llamada al gateway Convex; no confía en un “userId” propio.

**Rationale**: Ownership y scopes deben vivir junto al dominio (igual que `requireUserId`). Si el MCP se compromete, sin PAT válido no hay datos. Revocación es inmediata en DB.

**Alternatives considered**:
- Validar solo en el MCP y llamar Convex con deploy key → **rechazado** (deploy key = admin del proyecto)
- Pasar PAT como arg a cada query pública Convex → filtra mal y ensucia API de la app
- Sesión Google embebida en el agente → imposible / UX horrible

---

## R-03 — Forma del bridge MCP → Convex

**Decision**: **Gateway HTTP RPC** en `convex/http.ts`:

`POST https://<deployment>.convex.site/agent/v1/rpc`  
Headers: `Authorization: Bearer jpw_…`  
Body: `{ "tool": "<name>", "args": { … }, "confirm": boolean? }`

El MCP registra tools que internamente hacen ese POST. Convex despacha a handlers internos tipados y escribe audit.

**Rationale**: Un solo punto de auth/scope/audit; el catálogo de tools crece sin multiplicar rutas; el MCP permanece thin (protocol adapter).

**Alternatives considered**:
- Una httpAction por tool → boilerplate y drift
- ConvexHttpClient + JWT de usuario → el agente no tiene OAuth interactivo
- GraphQL BFF aparte → overkill

---

## R-04 — Formato y almacenamiento del token

**Decision**:
- Formato plaintext: `jpw_` + 32 bytes random (base64url) ≈ ~43 chars de secreto
- Guardar: `tokenPrefix` (primeros ~10 chars tras prefijo) + `tokenHash` = SHA-256 hex del secreto completo
- Opcional: pepper `API_TOKEN_PEPPER` en env Convex (recomendado prod)
- Mostrar plaintext **solo** en la respuesta de `apiTokens.create`

**Rationale**: Estándar de PATs (GitHub-like); hash irreversible; prefijo permite identificación en UI/logs sin filtrar el secreto.

**Alternatives considered**:
- JWT firmado como PAT → revocación más compleja (denylist)
- Guardar secreto cifrado reversible → riesgo mayor si hay leak de DB keys

---

## R-05 — Catálogo de scopes

**Decision** (strings estables):

| Scope | Permite |
|-------|---------|
| `read:dashboard` | overview |
| `read:transactions` / `write:transactions` | list/get/create/update |
| `read:accounts` / `write:accounts` | list/create/update/reorder (archive → destructive) |
| `read:categories` / `write:categories` | list/create/update (archive → destructive) |
| `read:budgets` / `write:budgets` | presupuestos + fixed expenses lectura/escritura |
| `read:credits` / `write:credits` | créditos, pagos, abonos, destinos |
| `read:savings` / `write:savings` | metas + aportes |
| `read:tax` / `write:tax` | documentos/items (filed bloquea write) |
| `destructive` | remove/archive irreversibles |

**Default al crear**: todos los `read:*` (atajo UI “Solo lectura”). Escritura y `destructive` opt-in.

**Shortcut UI**: chips “Solo lectura” / “Lectura + escritura (sin borrar)” / “Personalizado”.

---

## R-06 — Confirmación destructiva

**Decision**: Tools destructivos exigen `confirm: true` en args **y** scope `destructive`. Sin ambos → error `confirmation_required` / `forbidden`.

**Rationale**: Cumple FR-011 (doble paso) sin UI del agente; el LLM debe reintentar tras confirmación explícita del usuario.

---

## R-07 — Rate limiting

**Decision**:
- **MCP server**: sliding window en memoria por token prefix (p. ej. 60 req/min)
- **Convex gateway**: rechazo si `lastUsedAt` burst extremo + update `lastUsedAt` best-effort; audit de `rate_limited`

Defaults: 60 rpm / token (ajustable). Suficiente para usuario individual + agentes.

---

## R-08 — SDK / runtime del MCP package

**Decision**: `apps/mcp-server` con Bun (alineado al monorepo), dependencia `@modelcontextprotocol/sdk` (o paquetes `@modelcontextprotocol/server` + express helpers según versión estable al implementar). Node ≥20 compatible para VPS si Bun no está instalado — **preferir Bun** si el VPS lo tiene; fallback Node + `tsx`/build.

**Rationale**: Workspaces ya son `apps/*`; mismo lint/CI. Empaquetar `bun build` → binario/`dist` desplegable.

---

## R-09 — Deploy VPS

**Decision**:
- Proceso systemd (o pm2) en VPS escuchando `127.0.0.1:3100` (ejemplo)
- Nginx vhost `mcp.wallet.lavalex.co` → proxy_pass + TLS Certbot
- Env: `CONVEX_URL` / `CONVEX_SITE_URL`, `MCP_HOST`, `PORT`
- Health: `GET /healthz` sin auth

Precedente: `jarvis.lavalex.co` → proceso local.

---

## R-10 — Límites de producto

**Decision**:
- Máx. **10** tokens activos (no revocados) por usuario
- Retención audit: **90 días** (cron opcional en fase D; v1 puede retener sin purge)
- Expiry presets UI: 30d / 90d / nunca (con warning)

---

## R-11 — Superficie de tools (intención, no 1:1 mutation dump)

**Decision**: Tools nombrados por intención (fase B lectura; fase C escritura). Ejemplos:

Lectura: `get_financial_overview`, `list_transactions`, `list_accounts`, `list_budgets`, `list_credits`, `list_savings_goals`, `get_spending_summary`, `list_tax_documents`, `get_tax_document`

Escritura: `create_transaction`, `update_transaction`, `upsert_budget`, `create_savings_goal`, `contribute_to_goal`, `create_tax_item`, …

Destructivo: `delete_transaction`, `archive_account`, … con `confirm`

Resources: `jpwallet://overview`, `jpwallet://budgets/active`, `jpwallet://credits/active`

Prompts (fase D opcional): `monthly_review`, `savings_plan`

---

## Open items deferred to implementation (no blockers)

- Versión exacta del paquete MCP al pinnear en `package.json` (elegir latest stable en implement)
- Si Certbot DNS para subdominio `mcp.wallet` vs path `wallet.lavalex.co/mcp` — **preferir subdominio** (SPEC); path como fallback si DNS tarda
