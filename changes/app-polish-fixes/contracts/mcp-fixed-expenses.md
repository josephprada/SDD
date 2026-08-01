# Contract: MCP `list_fixed_expenses`

**Change**: app-polish-fixes  
**Extiende**: `changes/mcp-access/contracts/mcp-tools.md`  
**Scope**: `read:budgets`

## Tool

**Name**: `list_fixed_expenses`

### Input (JSON)

| Campo | Tipo | Required | Notas |
|-------|------|----------|-------|
| `periodStart` | number (ms) | no | Default: inicio período actual (misma convención app) |
| `periodEnd` | number (ms) | no | Default: fin período actual |
| `limit` | number | no | Limita `items`; **no** altera `pendingTotal` |

### Output (JSON)

```json
{
  "periodStart": 0,
  "periodEnd": 0,
  "pendingTotal": 0,
  "items": [
    {
      "id": "…",
      "name": "…",
      "amount": 0
    }
  ]
}
```

Campos adicionales de ítem (dueDate, paid, categoryId, …) permitidos si ya existen en API interna.

### Errors

| Caso | Resultado |
|------|-----------|
| Sin `read:budgets` | authz reject (igual otras tools) |
| Token inválido | 401 |

### Invariante

`pendingTotal` MUST coincidir con el total que usa el dashboard para la proyección del mismo período (misma elegibilidad de fijos).
