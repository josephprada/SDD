# Data Model: App Polish Fixes

**Change**: app-polish-fixes  
**Date**: 2026-08-01

---

## Resumen

**Sin tablas Convex nuevas** en v1. Se reutilizan entidades existentes; este documento fija semántica y campos lógicos usados por los fixes.

---

## Entidades existentes (relevantes)

### AvailableBalance (métrica UI)

| Campo lógico | Fuente | Notas |
|--------------|--------|-------|
| `totalBalance` | `overview` / dashboard query | Card “Disponible” |

### FixedExpensePendingSet

| Campo | Fuente | Notas |
|-------|--------|-------|
| `items[]` | `fixedExpenses.listUpcomingForPeriod` | Puede ir `limit`-ado en UI |
| `pendingTotal` | misma query | **Total completo** del período (no limitado) |
| `periodStart` / `periodEnd` | args | Alineado al período del dashboard |

**Regla de proyección**: `afterFixed = totalBalance - pendingTotal` cuando `pendingTotal > 0`.

### Transaction (movimiento)

| Campo | Uso en change |
|-------|----------------|
| `_id` | Edit modal; upload adjuntos |
| amount, … | Form create/edit |
| Attachments | Create: cola local hasta existir `_id` |

### PendingAttachment (cliente, efímero)

| Campo | Tipo | Notas |
|-------|------|-------|
| `file` | `File` | En memoria hasta create |
| `name` / `type` / `size` | meta | Validar con mismos límites que edit |

No se persiste como tabla.

### InAppNotificationCursor (cliente)

| Campo | Persistencia | Notas |
|-------|--------------|-------|
| `seenKeys` o `lastSeenAt` | memoria + opcional `sessionStorage` | Evita toast de historial al mount |

### PushSubscription

| Campo | Tabla | Notas |
|-------|-------|-------|
| endpoint, keys | `pushSubscriptions` | Cleanup si send → gone |

### NotificationLog

| Campo | Uso |
|-------|-----|
| `type`, `referenceId`, `sentAt`, `channel` | Toast key / listRecentInApp |

---

## Contratos MCP (lectura)

### FixedExpensesListResult

```ts
{
  periodStart: number; // ms
  periodEnd: number;
  pendingTotal: number; // COP entero
  items: Array<{
    id: string;
    name: string;
    amount: number;
    // campos ya usados en UI/API de fijos (due, paid, category…)
  }>;
}
```

Scope: `read:budgets`. Ownership: `userId` del PAT.

---

## Validaciones

- `pendingTotal` ≥ 0; montos COP enteros  
- Adjuntos create: mismos MIME/size que `AttachmentUploader`  
- MCP sin scope → rechazo authz (igual que otras tools)  

## Transiciones

- Overlay: open → (confirm?) → close → unlocked  
- Create+files: draft files → create tx → uploading → done/error parcial  
- Toast cursor: empty → seeded (silent) → live toasts only  
