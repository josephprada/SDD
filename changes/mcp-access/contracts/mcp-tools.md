# Contract: MCP Tools & Resources

**Change**: mcp-access  
**Implementación**: `apps/mcp-server` + dispatch en `agentGateway`  
**Fases**: B = read, C = write/destructive

Todos los tools pasan por `POST /agent/v1/rpc`. Tipos de args en JSON Schema / Zod en el servidor MCP.

---

## Resources (fase B)

| URI | Scope | Descripción |
|-----|-------|-------------|
| `jpwallet://overview` | `read:dashboard` | Snapshot balances + resumen período actual |
| `jpwallet://budgets/active` | `read:budgets` | Presupuestos activos + progreso |
| `jpwallet://credits/active` | `read:credits` | Créditos activos + saldos |

---

## Tools — Lectura (fase B)

### `get_financial_overview`

- **Scopes**: `read:dashboard`
- **Args**: `{ period?: "week" | "month" | "quarter" | "semester" }` (default preferencia usuario o `month`)
- **Returns**: mirror de `dashboard.overview` (balances, ingresos/gastos período, recientes resumidos)

### `list_transactions`

- **Scopes**: `read:transactions`
- **Args**: `{ from?: number; to?: number; accountId?: string; categoryId?: string; limit?: number }`
- **Returns**: lista resumida (id, date, amount, type, category, account, notes)

### `get_spending_summary`

- **Scopes**: `read:dashboard` **o** `read:transactions`
- **Args**: `{ from: number; to: number }`
- **Returns**: totales + breakdown por categoría (vía `reports.summary` o equivalente)

### `list_accounts` / `list_categories`

- **Scopes**: `read:accounts` / `read:categories`
- **Args**: `{ includeArchived?: boolean }`

### `list_budgets`

- **Scopes**: `read:budgets`
- **Args**: `{ period?: string }`

### `list_credits`

- **Scopes**: `read:credits`
- **Args**: `{ status?: "active" | "all" }`

### `list_savings_goals`

- **Scopes**: `read:savings`
- **Args**: `{}`

### `list_tax_documents`

- **Scopes**: `read:tax`
- **Args**: `{}`

### `get_tax_document`

- **Scopes**: `read:tax`
- **Args**: `{ documentId: string; includeItems?: boolean }`

---

## Tools — Escritura (fase C)

### `create_transaction`

- **Scopes**: `write:transactions`
- **Args**: campos obligatorios alineados a `transactions.create` (type, amount, accountId, categoryId, date, notes?)
- **Validation**: amount COP entero > 0

### `update_transaction`

- **Scopes**: `write:transactions`
- **Args**: `{ transactionId: string; …patch }`

### `upsert_budget`

- **Scopes**: `write:budgets`
- **Args**: categoría + límite + período según contrato budgets existente

### `create_savings_goal` / `contribute_to_goal`

- **Scopes**: `write:savings`

### `create_tax_item` / `update_tax_item`

- **Scopes**: `write:tax`
- **Conflict**: document `filed` → `conflict`

---

## Tools — Destructivo (fase C)

### `delete_transaction`

- **Scopes**: `write:transactions` + `destructive`
- **Args**: `{ transactionId: string; confirm: true }`
- Sin `confirm: true` → `confirmation_required`

### `archive_account` / `archive_category` / `remove_budget` / …

Misma regla: scope write del dominio + `destructive` + `confirm: true`.

---

## Prompts (fase D, opcional)

| Name | Uso |
|------|-----|
| `monthly_review` | Guía al LLM a llamar overview + spending_summary |
| `savings_plan` | Guía a leer ingresos/gastos/metas y proponer aporte |

Los prompts **no** mutan solos; instruyen al modelo a usar tools.

---

## Error mapping MCP

El adaptador MCP convierte `error.code` del gateway en `isError: true` + texto para el modelo, sin exponer stack traces.
