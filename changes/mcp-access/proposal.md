# Propuesta: Change 7 — MCP Access (Acceso para agentes LLM)

**Versión**: 1.0.0  
**Estado**: Implementado (pendiente QA usuario)  
**Change**: mcp-access  
**Creado**: 2026-07-27  
**Planificado**: 2026-07-29  
**Implementado**: 2026-07-29  
**Rama**: `feat/mcp-access` (desde `testing`)

---

## Intención

Permitir que **cualquier LLM o runtime de agentes** (Claude, Gemini, OpenAI, Cursor, OpenClaw, etc.) consulte y opere las finanzas del usuario en JP-WALLET mediante **lenguaje natural**, a través de un servidor **MCP (Model Context Protocol)** autenticado con **tokens de acceso personales** generados en Ajustes.

El usuario sigue siendo dueño de sus datos: el agente solo actúa con el alcance (scopes) que el usuario concedió al token.

## Decisión de arquitectura (Opción D)

**Monorepo + capa de acceso en Convex + adaptador MCP desplegado en el VPS.**

| Capa | Ubicación | Rol |
|------|-----------|-----|
| Tokens, scopes, audit, ownership | `convex/` (+ UI en `/settings`) | Fuente de verdad de auth machine-to-machine |
| Adaptador MCP | `apps/mcp-server/` (mismo monorepo) | Protocolo MCP (tools/resources/prompts) |
| Exposición remota | VPS Nginx (p. ej. `mcp.wallet.lavalex.co`) | Conexión fácil desde cualquier agente HTTP |
| Modo local opcional | mismo binario vía stdio | Claude Desktop / Cursor local |

**No** se crea un repo aparte. **No** se implementa el protocolo MCP “puro” dentro de Convex httpActions como núcleo. **No** se usa `CONVEX_DEPLOY_KEY` como identidad de usuario.

```
Agente LLM  --Bearer PAT-->  MCP server (VPS / stdio)
                                 │
                                 ▼
                         Convex (valida hash PAT → userId)
                                 │
                                 ▼
                    queries/mutations existentes (ownership)
```

## Alcance

### Dentro del Scope

- **Personal Access Tokens (PAT)** generados, listados y revocados en `/settings`
- Token mostrado **una sola vez**; almacenamiento solo del **hash** + metadatos
- **Scopes** granulares (lectura/escritura por dominio; destructivo opt-in)
- **Caducidad**, revocación inmediata, `lastUsedAt`
- **Audit log** de operaciones realizadas vía token/MCP
- **Servidor MCP** en monorepo con:
  - transporte remoto (Streamable HTTP / compatible MCP remoto)
  - transporte local stdio (mismo token)
- **Tools orientados a intención** sobre el dominio ya entregado:
  - overview / reportes / análisis
  - cuentas, categorías, transacciones
  - presupuestos, gastos fijos
  - créditos, ahorros/metas
  - declaración de renta (respetando `filed` read-only)
- **Resources** de contexto (resumen, presupuestos activos, créditos)
- **Prompts** MCP opcionales (plan de ahorro, análisis mensual)
- **UX de conexión fácil**: snippets de config para clientes MCP comunes
- **Deploy** del proceso MCP en el VPS detrás de Nginx + TLS
- Actualización de `SPEC.md` §7 (API Tokens) y roadmap Change 7

### Fuera del Scope

- Entrenar o hospedar un LLM propio dentro de JP-WALLET
- Chat embebido en la web (asistente in-app) — change futuro opcional
- OAuth “Sign in with JP-WALLET” para terceros / marketplace público de apps
- Multi-usuario / compartir token entre personas
- OCR, voz, o ejecución autónoma sin agente externo
- Sustituir la UI web; el MCP es canal adicional, no reemplazo
- Abrir el deploy key de Convex a agentes

## Fases de entrega (dentro del change)

| Fase | Contenido | Valor |
|------|-----------|--------|
| **A — Fundación** | Schema tokens + Settings UI + auth Bearer + audit mínimo | Seguridad usable |
| **B — MCP read-only** | Servidor MCP remoto + tools/resources de lectura + docs de conexión | Preguntas y análisis con cualquier LLM |
| **C — Escritura controlada** | Tools create/update con scopes; confirmación/dry-run en destructivos | Planes + CRUD vía lenguaje natural |
| **D — Hardening + stdio** | Rate limit, expiry UX, modo local, quickstart QA | Producción robusta |

MVP demostrable = **A + B**. C y D cierran el change completo Opción D.

## Capabilities

### Nuevas

| Capability | Descripción |
|------------|-------------|
| `api-tokens` | Ciclo de vida de PAT (crear, listar, revocar, scopes, expiry) |
| `mcp-gateway` | Servidor MCP que traduce tools → operaciones de dominio autenticadas |
| `agent-finance-ops` | Operaciones financieras (lectura y escritura scoped) vía agentes |
| `api-audit` | Registro de uso de tokens / tools para trazabilidad |

### Modificadas

| Capability | Descripción |
|------------|-------------|
| `settings-panel` | Nueva sección “Acceso para agentes / MCP” |
| `auth` | Además de sesión Google/JWT, autenticación por Bearer PAT |
| `web-deploy` | Nuevo vhost/proceso para el MCP remoto en el VPS |

## Dependencias

- Changes 1–6 en `testing`/`main` (dominio financiero completo + settings + tax)
- Stack MCP clients del ecosistema (Claude / Cursor / Gemini / OpenAI Agents / OpenClaw)
- Precedente infra: proceso Node en VPS (Jarvis/OpenClaw) + Nginx

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Token filtrado = acceso a finanzas | Hash-only storage, scopes mínimos por defecto (read), revoke, expiry, audit |
| Agente ejecuta borrados masivos | Scope `destructive` opt-in + confirmación / dry-run |
| Expectativa de “IA mágica” sin datos | Copy claro: el LLM razona; JP-WALLET aporta datos y acciones |
| Drift monorepo / tipos | MCP en el mismo repo; reutiliza contratos Convex |
| Superficie de ataque remota | TLS, rate limit, sin deploy key de usuario |

## Éxito

Ver `spec.md` Success Criteria. En síntesis: el usuario genera un token en Ajustes, lo pega en un cliente MCP, y en minutos puede preguntar por sus finanzas y (con scopes) operarlas con lenguaje natural.
