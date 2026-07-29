# Implementation Plan: MCP Access (Acceso para agentes LLM)

**Branch**: `feat/mcp-access` | **Date**: 2026-07-29 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `changes/mcp-access/spec.md`

## Summary

Change 7 entrega **acceso MCP** a JP-WALLET: el usuario genera **PATs** en Ajustes, conecta cualquier cliente MCP (remoto o stdio) y el agente consulta/opera finanzas con **scopes**. Arquitectura **Opción D**: tokens + gateway RPC en Convex; adaptador MCP en `apps/mcp-server`; HTTPS en VPS (`mcp.wallet.lavalex.co`). Fases A→D (MVP = A+B).

## Technical Context

**Language/Version**: TypeScript, React 19, Convex, Bun workspaces  
**Primary Dependencies**: `@modelcontextprotocol/*` (server + HTTP/stdio), JP-DS, `@convex-dev/auth` (sesión UI), Convex `httpRouter`  
**Storage**: Convex — `apiTokens`, `apiAuditLog`; dominio existente sin tablas financieras nuevas  
**Testing**: QA `quickstart.md`; unit tests de hash/scopes si aplica (`bun test`); `bun run build` + `bun run lint`  
**Target Platform**: Web settings + MCP HTTP en VPS Linux; stdio local desktop  
**Project Type**: Monorepo Bun — `apps/web` + `apps/mcp-server` + `packages/jp-ds` + `convex/`  
**Performance Goals**: RPC tool < 2 s p95 en datasets personales; rate limit 60 rpm/token  
**Constraints**: Default read-only; no deploy key; hash-only secrets; mobile-first Settings; COP/ownership existentes; tax `filed` read-only  
**Scale/Scope**: usuario individual; ~15–25 archivos Convex/UI + package MCP; 4 fases A–D

## Constitution Check

| Gate | Status |
|------|--------|
| Tokens JP-DS (no hex en componentes) | ✅ Settings UI con JP-DS |
| Mobile-first | ✅ Sección tokens usable desde 375 px |
| KISS / YAGNI | ✅ Un RPC gateway; sin chat in-app; sin OAuth marketplace |
| Auth en mutations | ✅ Sesión para gestionar PATs; Bearer PAT para agentes |
| Compat prod | ✅ Tablas nuevas; SPA independiente del proceso MCP |
| Privacidad | ✅ Ownership por `userId` del token; audit |

*Post–Phase 1*: gates ✅ — diseño no introduce LLM propio ni acopla deploy key.

## Project Structure

### Documentation (this feature)

```text
changes/mcp-access/
├── plan.md                 # this file
├── proposal.md
├── design.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── api-tokens.md
│   ├── agent-gateway.md
│   └── mcp-tools.md
├── tasks.md                # /speckit-tasks (pendiente)
└── checklists/requirements.md
```

### Source Code (previsto)

```text
convex/schema.ts
convex/apiTokens.ts
convex/apiAudit.ts
convex/agentGateway.ts          # dispatch tools (internal helpers)
convex/http.ts                  # POST /agent/v1/rpc
convex/lib/apiTokenAuth.ts
convex/lib/apiScopes.ts

apps/web/src/routes/settings.tsx
apps/web/src/components/settings/ApiAccessSection.tsx
apps/web/src/components/settings/CreateApiTokenDialog.tsx
apps/web/src/components/settings/TokenSecretOnceDialog.tsx
apps/web/src/lib/mcp/connectionSnippets.ts

apps/mcp-server/
├── package.json
├── src/index.ts
├── src/http.ts
├── src/stdio.ts
├── src/convexClient.ts
├── src/tools/*
├── src/resources.ts
└── README.md
```

**Structure Decision**: Dominio de acceso en Convex (fuente de verdad authZ); MCP como adaptador de protocolo en workspace `apps/mcp-server`; UI mínima en Settings existente.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected |
|-----------|------------|------------------------------|
| Nuevo app `mcp-server` | Protocolo MCP (streams/HTTP) no encaja como núcleo en Convex | Solo httpActions MCP → frágil; repo aparte → drift |
| Gateway RPC + MCP | Separar authZ de producto vs wire protocol | Exponer 30 httpActions → boilerplate |

## Phase Outputs

| Phase | Artifact | Status |
|-------|----------|--------|
| 0 Research | `research.md` | ✅ |
| 1 Design | `design.md`, `data-model.md`, `contracts/`, `proposal.md` | ✅ |
| 1 QA | `quickstart.md` | ✅ |
| 2 Tasks | `tasks.md` | ✅ |

## Delivery phases (implementation)

| Phase | Scope |
|-------|--------|
| **A** | Schema tokens/audit, `apiTokens` API, Settings UI, hash auth helper |
| **B** | HTTP RPC read tools, `apps/mcp-server` HTTP, snippets, resources |
| **C** | Write tools + destructive confirm + tax filed guard |
| **D** | Stdio, rate limit, VPS/Nginx/systemd, audit UI, retention opcional |
