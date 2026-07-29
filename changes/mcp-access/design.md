# Design: MCP Access

**Change**: mcp-access  
**Spec**: `changes/mcp-access/spec.md`  
**Rama**: `feat/mcp-access`

---

## Enfoque Técnico

Change 7 abre un **canal machine-to-machine** para agentes LLM vía MCP, sin sustituir la SPA.

**Opción D**:
1. PATs + scopes + audit en Convex
2. Gateway HTTP RPC autenticado por Bearer (`/agent/v1/rpc`)
3. Adaptador MCP en `apps/mcp-server` (Streamable HTTP + stdio)
4. Deploy remoto en VPS (`mcp.wallet.lavalex.co`)

El LLM razona; JP-WALLET aporta datos y mutaciones con el mismo ownership que la UI.

---

## Decisiones de Arquitectura

| # | Pregunta | Decisión | Tradeoff |
|---|----------|----------|----------|
| D-01 | ¿Repo aparte? | **No** — `apps/mcp-server` en monorepo | Tipos/contratos alineados; un CI |
| D-02 | ¿MCP dentro de Convex? | **No** como núcleo — solo gateway RPC | Protocolo MCP en proceso Node/Bun dedicado |
| D-03 | Auth agentes | **PAT** `jpw_…` hash SHA-256; Bearer | No OAuth interactivo en el agente |
| D-04 | Deploy key | **Prohibido** como identidad de usuario | Evita privilegio de proyecto |
| D-05 | Bridge | **RPC único** `/agent/v1/rpc` | Menos rutas; audit central |
| D-06 | Scopes | Granular read/write por dominio + `destructive` | Default solo lectura |
| D-07 | Destructivo | Scope + `confirm: true` | FR-011 sin UI especial del agente |
| D-08 | Filed tax | Write tax rechazado si `status=filed` | Paridad con UI |
| D-09 | Settings UX | Sección en `/settings` | Reusa change 3 |
| D-10 | Snippets | Remoto (URL+header) + local stdio | Conexión <5 min |
| D-11 | Rate limit | 60 rpm/token (MCP + soft Convex) | Usuario individual |
| D-12 | Max tokens | 10 activos/usuario | Evita proliferación |
| D-13 | Fases | A tokens → B MCP read → C write → D harden/stdio | MVP temprano |
| D-14 | Audit | Tabla `apiAuditLog` por RPC | Visible en Settings (lista reciente) |
| D-15 | Pepper | Env `API_TOKEN_PEPPER` opcional | Defensa en profundidad |
| D-16 | Montos | COP enteros; mismas validaciones dominio | Sin reglas nuevas |

---

## Flujos de datos

### Crear PAT (sesión Google)

```
UI Settings → apiTokens.create({ name, scopes, expiresAt? })
  → requireUserId
  → enforce max 10 activos
  → generate jpw_… ; store prefix+hash
  → return { tokenId, tokenPlaintext, …metadata }  // plaintext solo aquí
```

### Revocar

```
apiTokens.revoke({ tokenId })
  → patch revokedAt=now
  → siguientes RPC → 401
```

### Tool call agente

```
Cliente MCP → Authorization: Bearer jpw_…
  → apps/mcp-server /mcp
  → POST CONVEX_SITE/agent/v1/rpc { tool, args, confirm? }
  → authenticateApiToken(hash)
  → assertScope(tool)
  → dispatch internal handler (reusa lógica dominio)
  → insert apiAuditLog
  → JSON result → MCP tool response
```

### Stdio local (fase D)

```
Cliente spawnea: bun run apps/mcp-server --stdio
  Env/arg: JP_WALLET_TOKEN=jpw_…
  Mismo dispatch al gateway Convex
```

---

## Componentes

### Convex

| Módulo | Rol |
|--------|-----|
| `schema.ts` | `apiTokens`, `apiAuditLog` |
| `apiTokens.ts` | create / list / revoke (sesión) |
| `lib/apiTokenAuth.ts` | hash, verify, scope checks |
| `lib/apiScopes.ts` | catálogo + defaults |
| `agentGateway.ts` | handlers por tool name (internal) |
| `http.ts` | ruta `POST /agent/v1/rpc` (+ opc. CORS restringido) |
| `apiAudit.ts` | listRecent para Settings |

### Web

| Pieza | Rol |
|-------|-----|
| `components/settings/ApiAccessSection.tsx` | lista, crear, revocar, snippets |
| `components/settings/CreateApiTokenDialog.tsx` | nombre, chips scopes, expiry |
| `components/settings/TokenSecretOnceDialog.tsx` | mostrar/copiar una vez |
| `lib/mcp/connectionSnippets.ts` | templates Claude/Cursor/genérico |
| `routes/settings.tsx` | montar sección |

### MCP server (`apps/mcp-server`)

```text
apps/mcp-server/
├── package.json          # @jp-wallet/mcp-server
├── src/
│   ├── index.ts          # CLI: --stdio | --http
│   ├── http.ts           # Streamable HTTP + Bearer passthrough
│   ├── stdio.ts
│   ├── convexClient.ts   # POST rpc
│   ├── tools/            # registerTool wrappers (read / write)
│   ├── resources.ts
│   └── prompts.ts        # fase D
├── README.md
└── Dockerfile?           # opcional; v1: systemd + bun/node
```

---

## Mapa tool → scope (resumen)

Ver `contracts/mcp-tools.md` para firma completa.

| Tool | Scopes | Fase |
|------|--------|------|
| `get_financial_overview` | `read:dashboard` | B |
| `list_transactions` | `read:transactions` | B |
| `get_spending_summary` | `read:dashboard` o `read:transactions` | B |
| `list_accounts` | `read:accounts` | B |
| `list_budgets` | `read:budgets` | B |
| `list_credits` | `read:credits` | B |
| `list_savings_goals` | `read:savings` | B |
| `list_tax_documents` / `get_tax_document` | `read:tax` | B |
| `create_transaction` / `update_transaction` | `write:transactions` | C |
| `upsert_budget` | `write:budgets` | C |
| `create_savings_goal` / `contribute_to_goal` | `write:savings` | C |
| `create_tax_item` / `update_tax_item` | `write:tax` | C |
| `delete_transaction` | `write:transactions` + `destructive` + confirm | C |

---

## UI / IA (información)

| Pantalla | Contenido |
|----------|-----------|
| `/settings` → Acceso agentes | Lista tokens, CTA crear, link a docs/snippets |
| Dialog crear | Nombre, preset scopes, expiry |
| Dialog secreto | Token plaintext + copy + warning |
| Panel audit (mínimo) | Últimos N eventos del usuario |

Mobile-first: lista apilada; dialogs full-sheet en 375 px (patrón settings existente).

---

## Seguridad (checklist diseño)

- [x] Hash-only storage
- [x] Default read-only
- [x] Revoke inmediato
- [x] No deploy key
- [x] Audit writes + denegaciones de scope
- [x] HTTPS en MCP remoto
- [x] Rate limit
- [x] Tax filed read-only vía write path
- [x] Args de audit redactados (sin montos completos opc.; v1: truncar strings largos)

---

## Deploy

```
mcp.wallet.lavalex.co (TLS)
  → Nginx proxy_pass http://127.0.0.1:3100
  → bun apps/mcp-server --http --port 3100
  → Convex Cloud (RPC + datos)
```

CI: build `apps/mcp-server` + rsync/restart systemd en workflow extendido (fase D) o script manual v1 documentado en quickstart.
