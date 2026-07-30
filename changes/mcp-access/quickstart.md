# Quickstart QA: MCP Access

**Change**: mcp-access · **Rama**: `feat/mcp-access`

---

## Prerrequisitos

- Changes 1–6 en base (`testing` / prod datos de prueba)
- `bun dev` + `bunx convex dev`
- Usuario autenticado con datos financieros (cuentas, txs, presupuestos)
- Fase B+: `apps/mcp-server` corriendo en HTTP local **o** URL de staging
- Cliente MCP de prueba (Cursor / Claude Desktop / MCP Inspector)

---

## Fase A — Tokens

1. Abrir `/settings` → **Acceso para agentes / MCP**
2. Crear token nombre `qa-read`, preset **Solo lectura**, sin caducidad
3. Copiar secreto `jpw_…` (solo una vez)
4. Verificar lista: prefijo visible, scopes read, estado activo
5. Crear segundo token y revocar el primero
6. Intentar usar el revocado en el gateway → **401**

**Esperado**: SC-001; secreto no vuelve a mostrarse; max 10 enforced (opcional stress).

---

## Fase B — MCP lectura

1. Configurar cliente con snippet remoto (URL MCP + Bearer del token activo)
2. Listar tools/resources → deben aparecer overview, list_*, etc.
3. Preguntar / invocar `get_financial_overview`
4. Comparar balances con dashboard web
5. `list_transactions` con rango del mes → coherente con `/transactions`
6. Token solo lectura: intentar tool write (si ya expuesto) → **403**

**Esperado**: SC-002, SC-003, SC-005 (si write aún no existe, skip write).

---

## Fase C — Escritura

1. Crear token con `write:budgets` + `write:transactions` (sin `destructive`)
2. `upsert_budget` / `create_transaction` vía agente
3. Verificar en UI web < 30 s
4. Intentar `delete_transaction` sin destructive → **403**
5. Token con `destructive`: delete sin `confirm` → **428**; con `confirm: true` → OK
6. Tax `filed`: `update_tax_item` → **409**

**Esperado**: SC-006; auditoría con success/fail (SC-007).

---

## Fase D — Hardening / stdio

1. Snippet stdio local con env `JP_WALLET_TOKEN`
2. Rate limit: spamear >60 rpm → **429**
3. Token con expiry corto: esperar / falsear reloj de prueba → **401**
4. Tirar proceso MCP: SPA web sigue OK; cliente MCP falla conexión

---

## Mobile Settings (375 px)

1. Crear / copiar / revocar token en viewport móvil
2. Sin overflow horizontal; botones ≥44 px

**Esperado**: SC-008.

---

## Checklist cierre change

- [x] A tokens + Settings
- [x] B MCP read remoto
- [x] C write + destructive confirm
- [x] D stdio + rate limit + docs deploy VPS
- [x] `bun run lint` (archivos del change) + `bun run build` web + mcp typecheck
- [x] Quickstart pasando en ambiente de prueba **(QA local + MCP Cursor OK 2026-07-29)**

> **2026-07-29:** Change 7 cerrado. Merge `testing` + `main` (prod). MCP VPS: `mcp.wallet.lavalex.co`.
