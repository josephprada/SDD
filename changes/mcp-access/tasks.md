# Tasks: MCP Access (Change 7)

**Input**: Design documents from `changes/mcp-access/`

**Prerequisites**: Changes 1–6 en base ✅ · `plan.md` / `spec.md` / `design.md` / `data-model.md` / `contracts/` / `research.md` / `quickstart.md` ✅

**Rama**: `feat/mcp-access`

**Tests**: QA `quickstart.md`; `bun run build` + `bun run lint` (sin suite TDD obligatoria)

**Visual source of truth**: [`desing.md`](../../desing.md) + Settings patterns existentes

**Fases deployables**: A → D (ver `plan.md` / `research.md`) — MVP = A+B ≈ US1+US2+US3

**Organization**: Tasks agrupadas por user story para entrega incremental e independent testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (archivos distintos, sin depender de tareas incompletas)
- **[Story]**: US1…US5 según `spec.md`
- Incluir rutas de archivo exactas

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Scaffold del package MCP y constantes compartidas sin schema aún.

- [x] T001 Crear workspace `apps/mcp-server/` con `package.json` (`@jp-wallet/mcp-server`), `tsconfig.json` y `README.md` stub; registrar en workspaces raíz si hace falta (`package.json`)
- [x] T002 [P] Crear stubs `apps/mcp-server/src/index.ts`, `http.ts`, `stdio.ts`, `convexClient.ts`, `resources.ts` y carpeta `apps/mcp-server/src/tools/`
- [x] T003 [P] Crear catálogo de scopes + defaults + labels ES en `convex/lib/apiScopes.ts` (espejo tipado usable desde web vía contrato o re-export)
- [x] T004 [P] Crear helpers de hash/generate token (SHA-256 + prefijo `jpw_`, pepper opcional `API_TOKEN_PEPPER`) en `convex/lib/apiTokenAuth.ts`
- [x] T005 [P] Crear tipos/presets de UI para scopes y snippets en `apps/web/src/lib/mcp/types.ts`

**Checkpoint**: Package MCP importable; scopes/hash helpers listos; sin UI ni schema.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema + auth PAT + esqueleto HTTP RPC. **Bloquea** todas las user stories.

**⚠️ CRITICAL**: No empezar US hasta completar esta fase.

- [x] T006 Extender `convex/schema.ts` — tablas `apiTokens` y `apiAuditLog` con indexes `by_user`, `by_token_hash`, `by_user_created`, `by_token_created` (ver `data-model.md`)
- [x] T007 [P] Extender `convex/lib/validators.ts` — validator de `apiScope` / lista de scopes
- [x] T008 [P] Crear stubs `convex/apiTokens.ts`, `convex/apiAudit.ts`, `convex/agentGateway.ts`
- [x] T009 Implementar `authenticateApiToken` / `assertScope` / `recordAudit` en `convex/lib/apiTokenAuth.ts` (lookup hash, revoked/expired, lastUsedAt)
- [x] T010 Registrar `POST /agent/v1/rpc` en `convex/http.ts` — parse Bearer, body `{ tool, args, confirm? }`, respuesta JSON ok/error según `contracts/agent-gateway.md` (dispatch aún stub `not_implemented`)
- [x] T011 Verificar `bunx convex codegen` / `convex dev` sin errores de schema tras T006–T010

**Checkpoint**: Foundation ready — user stories pueden comenzar.

---

## Phase 3: User Story 1 — Generar y gestionar tokens (Priority: P1) 🎯 MVP (parte A)

**Goal**: Crear/listar/revocar PATs desde Ajustes; secreto una sola vez; scopes y caducidad.

**Independent Test**: quickstart §Fase A — crear token solo lectura, copiar secreto, listar sin secreto, revocar → 401 en RPC.

### Implementation for User Story 1

- [x] T012 [US1] Implementar `apiTokens.create` / `list` / `revoke` en `convex/apiTokens.ts` según `contracts/api-tokens.md` (max 10 activos, default `DEFAULT_READ_SCOPES`, plaintext solo en create)
- [x] T013 [US1] Implementar `apiAudit.listRecent` en `convex/apiAudit.ts`
- [x] T014 [P] [US1] Crear `CreateApiTokenDialog.tsx` en `apps/web/src/components/settings/` (nombre, presets scopes, expiry 30/90/nunca)
- [x] T015 [P] [US1] Crear `TokenSecretOnceDialog.tsx` en `apps/web/src/components/settings/` (mostrar/copiar `jpw_…` + warning)
- [x] T016 [US1] Crear `ApiAccessSection.tsx` en `apps/web/src/components/settings/` — lista tokens (prefijo, scopes, status, lastUsed, revoke) + CTA crear + lista audit reciente
- [x] T017 [US1] Montar sección en `apps/web/src/routes/settings.tsx` + estilos mobile-first reutilizando `settings-*` / JP-DS
- [x] T018 [US1] Wire errores amigables (`formatConvexError` o equivalente) en create/revoke

**Checkpoint**: US1 usable en `/settings` sin MCP aún; create+revoke verificables con curl al gateway (401 tras revoke).

---

## Phase 4: User Story 2 — Conectar un agente externo (Priority: P1) 🎯 MVP (parte B conexión)

**Goal**: Snippets de conexión + servidor MCP HTTP que autentica con Bearer y descubre el catálogo (tools pueden ser read stub o reales de US3).

**Independent Test**: Copiar snippet, conectar cliente MCP / Inspector, ver tools listados; token inválido → error auth claro.

### Implementation for User Story 2

- [x] T019 [P] [US2] Implementar `apps/web/src/lib/mcp/connectionSnippets.ts` — templates remoto (URL + Authorization) y local stdio (placeholder env)
- [x] T020 [US2] Mostrar snippets copiables en `ApiAccessSection.tsx` (tras crear token o panel ayuda) — Claude/Cursor/genérico
- [x] T021 [US2] Implementar `apps/mcp-server/src/convexClient.ts` — `POST` a `CONVEX_SITE_URL/agent/v1/rpc` reenviando Bearer
- [x] T022 [US2] Implementar HTTP MCP Streamable + Bearer passthrough en `apps/mcp-server/src/http.ts` + entry `apps/mcp-server/src/index.ts` (`--http --port`)
- [x] T023 [US2] Añadir `GET /healthz` sin auth en el servidor MCP
- [x] T024 [US2] Documentar env (`CONVEX_SITE_URL`, `PORT`, `JP_WALLET_TOKEN` para stdio futuro) y uso local en `apps/mcp-server/README.md`

**Checkpoint**: Cliente MCP descubre servidor; auth inválida falla; snippets en Settings.

---

## Phase 5: User Story 3 — Consultar y analizar finanzas (Priority: P1) 🎯 MVP (parte B lectura)

**Goal**: Tools/resources de solo lectura sobre overview, txs, cuentas, presupuestos, créditos, ahorros, tax, reportes.

**Independent Test**: quickstart §Fase B — `get_financial_overview` y listados coherentes con la app; write con token read → 403.

### Implementation for User Story 3

- [x] T025 [US3] Implementar dispatch read en `convex/agentGateway.ts` — mapa tool→handler + scope check + audit (`get_financial_overview`, `list_transactions`, `get_spending_summary`, `list_accounts`, `list_categories`, `list_budgets`, `list_credits`, `list_savings_goals`, `list_tax_documents`, `get_tax_document`)
- [x] T026 [US3] Conectar `http.ts` RPC al dispatch real (reemplazar stub `not_implemented` para tools read)
- [x] T027 [P] [US3] Registrar tools read en `apps/mcp-server/src/tools/read.ts` (schemas Zod/JSON + llamadas `convexClient`)
- [x] T028 [P] [US3] Implementar resources `jpwallet://overview`, `jpwallet://budgets/active`, `jpwallet://credits/active` en `apps/mcp-server/src/resources.ts`
- [x] T029 [US3] Wire tools/resources en el server MCP (`index.ts` / `http.ts`)
- [x] T030 [US3] Asegurar errores `forbidden`/`unauthorized` mapeados a respuestas MCP `isError` sin stack traces

**Checkpoint**: MVP A+B completo — preguntar “cómo voy este mes” con datos reales vía agente.

---

## Phase 6: User Story 4 — Planes presupuestos y ahorro (Priority: P2)

**Goal**: Crear/ajustar presupuestos y metas/aportes con scopes `write:budgets` / `write:savings`.

**Independent Test**: Token con esos writes — crear presupuesto y meta vía agente; visible en UI; sin scope → 403.

### Implementation for User Story 4

- [x] T031 [US4] Handlers `upsert_budget`, `create_savings_goal`, `contribute_to_goal` en `convex/agentGateway.ts` (reutilizar mutations existentes; validar COP)
- [x] T032 [P] [US4] Registrar tools write budgets/savings en `apps/mcp-server/src/tools/write-plans.ts`
- [x] T033 [US4] Audit success/fail para estas tools; rechazar args incompletos con `validation`

**Checkpoint**: quickstart §Fase C parcial (presupuestos/ahorros).

---

## Phase 7: User Story 5 — CRUD financiero controlado (Priority: P2)

**Goal**: Escritura de transacciones (y writes de dominio restantes) + destructivo con confirm + tax filed guard.

**Independent Test**: create/update tx vía agente; delete sin `destructive` → 403; sin `confirm` → 428; tax filed → 409.

### Implementation for User Story 5

- [x] T034 [US5] Handlers `create_transaction`, `update_transaction` en `convex/agentGateway.ts` (`write:transactions`)
- [x] T035 [US5] Handlers destructivos (`delete_transaction`, y archive/remove acordados en `contracts/mcp-tools.md`) — requieren `destructive` + `confirm: true`
- [x] T036 [US5] Handlers tax write `create_tax_item` / `update_tax_item` con guard `filed` → `conflict` en `convex/agentGateway.ts`
- [x] T037 [P] [US5] Opcional fase C: writes `accounts`/`categories` mínimos si caben en contrato; si no, documentar diferido en `contracts/mcp-tools.md`
- [x] T038 [P] [US5] Registrar tools write/destructive en `apps/mcp-server/src/tools/write-ops.ts`
- [x] T039 [US5] Verificar audit en denegaciones de scope y confirmation_required

**Checkpoint**: CRUD controlado vía MCP; paridad reglas UI en tax filed.

---

## Phase 8: Polish & Cross-Cutting (Fase D)

**Purpose**: Stdio, rate limit, deploy VPS, docs, QA cierre.

- [x] T040 Implementar transporte stdio en `apps/mcp-server/src/stdio.ts` + flag `--stdio` leyendo `JP_WALLET_TOKEN`
- [x] T041 Actualizar snippets stdio reales en `apps/web/src/lib/mcp/connectionSnippets.ts` y README MCP
- [x] T042 Rate limit 60 rpm/token en `apps/mcp-server` (memoria) y respuesta `429` / code `rate_limited` alineada al gateway
- [x] T043 [P] Documentar deploy VPS (systemd/Nginx `mcp.wallet.lavalex.co`, env, healthcheck) en `apps/mcp-server/README.md` y/o `changes/mcp-access/quickstart.md`
- [x] T044 [P] Documentar `API_TOKEN_PEPPER` en `.env.example` / docs Convex del change
- [x] T045 [P] Prompts MCP opcionales `monthly_review` / `savings_plan` en `apps/mcp-server/src/prompts.ts` (si tiempo; si no, marcar diferido en README)
- [x] T046 Actualizar `AGENTS.md` / `changes/mcp-access/plan.md` Phase Outputs tasks ✅; proposal estado si aplica
- [x] T047 `bun run lint` + `bun run build` (+ build mcp-server) limpios
- [x] T048 Ejecutar checklist `changes/mcp-access/quickstart.md` end-to-end y anotar resultado

**Checkpoint**: Change 7 completo Opción D listo para merge a `testing` cuando se pida.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (1)** → sin deps
- **Foundational (2)** → bloquea US
- **US1 (3)** → tokens + Settings (fase A)
- **US2 (4)** → necesita US1 (token real) + foundation HTTP
- **US3 (5)** → necesita US2 (MCP up) + gateway
- **US4 (6)** / **US5 (7)** → necesitan US3 (pipeline MCP→RPC)
- **Polish (8)** → tras US deseadas (mínimo tras US3 para MVP)

### User Story Dependencies

```text
US1 (tokens) ──► US2 (conectar) ──► US3 (lectura) ──┬──► US4 (planes)
                                                    └──► US5 (CRUD)
```

US4 y US5 pueden ir en paralelo tras US3.

### Parallel Opportunities

- T002–T005 en Setup
- T007–T008 en Foundational
- T014–T015 dialogs en US1
- T027–T028 tools/resources en US3
- T032 vs T031 (tool register vs gateway) con cuidado de contrato
- T043–T045 docs en Polish

---

## Parallel Example: User Story 1

```bash
# Tras T012–T013 (API Convex):
Task: "CreateApiTokenDialog.tsx"
Task: "TokenSecretOnceDialog.tsx"
# Luego T016 ApiAccessSection integra ambos
```

---

## Implementation Strategy

### MVP First (A+B = US1+US2+US3)

1. Phase 1 Setup  
2. Phase 2 Foundational  
3. Phase 3 US1 — tokens en Settings  
4. Phase 4 US2 — MCP HTTP + snippets  
5. Phase 5 US3 — read tools  
6. **STOP y validar** quickstart A+B  
7. Continuar US4/US5 + Polish para cierre Change 7  

### Incremental Delivery

| Entrega | Stories | Valor |
|---------|---------|-------|
| MVP | US1–US3 | Preguntar finanzas a cualquier LLM |
| Completo | +US4–US5 + Polish | Planes + CRUD + prod harden |

---

## Notes

- [P] = archivos distintos, sin deps rotas
- No exponer `CONVEX_DEPLOY_KEY` al MCP client
- Default scopes = solo `read:*`
- Destructivo = scope + `confirm: true`
- Pepper `API_TOKEN_PEPPER` opcional pero recomendado en prod (ver `research.md` R-04)
- Commit por grupo lógico / story cuando el usuario lo pida
