# Design: Notifications Polish + Fijos omitidos

**Change**: notifications-polish  
**Spec**: `changes/notifications-polish/spec.md`  
**Rama**: `feat/notifications-polish`

---

## Enfoque

Extender el pipeline de notificaciones existente (`dispatch` → in_app / `sendPush` → SW) y el dominio de `fixedExpenses`, sin centro de notificaciones nuevo ni FCM nativo.

---

## Decisiones

| # | Pregunta | Decisión | Tradeoff |
|---|----------|----------|----------|
| D-01 | Suppress push en foreground | En SW `push`: si hay `WindowClient` focused/visible, **no** llamar `showNotification`; in-app ya cubre vía `notificationLog` + `NotificationListener` | Depende de SW; no requiere heartbeat al server |
| D-02 | Deep link al click | `notificationclick` siempre `navigate`/`openWindow` a `data.url` (también si hay client abierto) | Evita solo-focus sin ruta |
| D-03 | Omitir este mes | Campo `skippedPeriodKey?: string` en `fixedExpenses` (= `YYYY-MM`) | KISS; sin tabla de skips |
| D-04 | Pending / proyección | `fixedExpenseUpcoming` / MCP excluyen items con `skippedPeriodKey === currentPeriodKey` | Una sola regla |
| D-05 | Mora +3 / +6 | En `processReminders` (o helper): días desde due date del mes = 3 o 6, impago, no skip → dispatch tipo `fixed_expense_overdue` | Reusa cron 13:00 UTC |
| D-06 | Nuevo type en log | Añadir `fixed_expense_overdue` al union de `notificationLog` + labels toast | Dedupe propio |
| D-07 | Copy | Templates ES con nombre + monto + “hace N días” / “vence…” | Sin i18n framework |
| D-08 | URLs | Fijos/presupuesto → `/budgets`; crédito → `/credits` o `/credits/:id` si trivial | Evitar rutas rotas |

---

## Schema

```ts
// fixedExpenses — añadir:
skippedPeriodKey: v.optional(v.string()), // "2026-09"

// notificationLog.type — añadir literal:
"fixed_expense_overdue"
```

Mutations: `skipThisMonth`, `clearSkipThisMonth` (o `update({ skippedPeriodKey })`).

---

## Flujos

### Push vs foreground

```
sendPush → Push Service → SW "push"
  → clients.matchAll({ type: "window", includeUncontrolled: true })
  → if some client.focused || visibilityState === "visible"
       → skip showNotification  // in-app toast via Convex subscription
  → else showNotification(title, body, { data: { url } })
```

### Omitir este mes

```
UI "Omitir este mes"
  → patch skippedPeriodKey = currentPeriodKey
  → listUpcoming / pendingTotal requery → excluido
  → processReminders: continue si skippedPeriodKey === currentPeriodKey
```

### Mora

```
dueDate = dayOfMonth en mes actual (misma lib que reminders)
daysOverdue = today - dueDate (en días calendario)
if daysOverdue ∈ {3, 6} && !paid && !skipped && active
  → dispatch fixed_expense_overdue, dedupeSuffix: `overdue-${daysOverdue}`
```

---

## Archivos tocados (previstos)

| Área | Archivos |
|------|----------|
| Schema / Convex | `convex/schema.ts`, `fixedExpenses.ts`, `lib/fixedExpenseUpcoming.ts`, `crons` path reminders, `notifications.ts` types, `NotificationListener` labels |
| SW / push | `apps/web/src/sw.ts`, posiblemente contracts |
| UI fijos | `FixedExpenseForm` / list actions en `budgets.tsx` |
| Docs | `AGENTS.md`, `SPEC.md` roadmap |

---

## Testing

- Manual: Enviar prueba con app abierta vs cerrada  
- Manual: Omitir fijo → dashboard pending baja; cron/mora no dispara (simular date o offset en dev)  
- Unit-ish: helper `daysOverdue` / skip filter en `fixedExpenseUpcoming`  

---

## No hacer

- Heartbeat “app abierta” al backend  
- Preferencias por canal en Ajustes (diferido)  
- Email  
