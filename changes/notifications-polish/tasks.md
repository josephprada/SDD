# Tasks: notifications-polish (Change 9)

**Rama**: `feat/notifications-polish`  
**Spec**: `changes/notifications-polish/spec.md`  
**Design**: `changes/notifications-polish/design.md`

---

## Phase 1 — Modelo omitir este mes

- [x] T001 Schema: `skippedPeriodKey` opcional en `fixedExpenses`
- [x] T002 Mutation(s) skip / clear skip (o `update` tipado) + auth ownership
- [x] T003 Excluir skip del período en `lib/fixedExpenseUpcoming` (pendingTotal + items)
- [x] T004 UI: acciones “Omitir este mes” / “Reactivar” en lista/detalle de fijos (`budgets`)
- [x] T005 Badge/estado visual “Omitido este mes” (tokens JP-DS, sin hex)

## Phase 2 — Mora +3 / +6

- [x] T006 Helper días de mora desde due date (reusar libs de fecha de fijos)
- [x] T007 Extender `notificationLog.type` + validators con `fixed_expense_overdue`
- [x] T008 En `processReminders` (o mutation hermana): dispatch mora 3 y 6 con dedupe; respetar paid + skip + active + pushReminders/prefs
- [x] T009 Copy ES + `url: "/budgets"`; labels en `NotificationListener`

## Phase 3 — Push foreground + deep links

- [x] T010 SW `push`: no `showNotification` si hay client focused/visible
- [x] T011 SW `notificationclick`: navegar/open a `data.url` también con ventana existente
- [x] T012 Revisar payloads de presupuesto / fijo / crédito / test push (urls + copy)

## Phase 4 — Polish copy triggers existentes

- [x] T013 Mejorar title/body reminders fijos y créditos (nombre, monto, plazo)
- [x] T014 Verificar umbral presupuesto incluye categoría/porcentaje en body si ya hay datos

## Phase 5 — Docs / verify

- [x] T015 Actualizar `AGENTS.md` + `SPEC.md` roadmap (Change 9)
- [x] T016 Quickstart breve: cómo probar foreground vs background + omitir + mora
- [x] T017 QA manual checklist SC-001…SC-005 (`bun run build` OK)

---

## Dependencias

```
T001 → T002 → T003 → T004 → T005
T001 → T006 → T007 → T008 → T009
T010 → T011 → T012
T013 / T014 independientes tras T012
T015–T017 al final
```
