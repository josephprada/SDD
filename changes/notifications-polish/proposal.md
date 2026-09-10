# Propuesta: Change 9 — Notifications Polish + Fijos omitidos

**Versión**: 1.0.0  
**Estado**: En curso  
**Change**: notifications-polish  
**Creado**: 2026-09-10  
**Rama**: `feat/notifications-polish` → `testing` → `main`

---

## Intención

Con Web Push ya operativo, pulir la **experiencia de notificaciones** (copy, deep links, push solo fuera de foreground) y cerrar gaps de gastos fijos: **mora +3/+6 días** y estado **“omitir este mes”** para no spam ni ruido en dashboard cuando el usuario sabe que no pagará un fijo (p. ej. ahorro).

## Alcance

### Dentro del scope

- Conservar triggers existentes: presupuesto 80/100, reminders de fijos (offsets), créditos  
- Copy accionable + deep link al tocar (presupuesto / fijos / crédito)  
- Push OS **solo si la app no está en foreground**; en foreground → toast in-app  
- Mora de fijo no pagado: push/in-app a **+3** y **+6** días tras vencimiento  
- Estado **omitir este mes** por fijo (`skippedPeriodKey`): excluye pendientes dashboard/proyección y todas las notificaciones de ese fijo en el período  
- UI: Omitir este mes / Reactivar en fijos  

### Fuera del scope

- Centro de notificaciones / historial dedicado  
- Resumen diario o semanal nuevo  
- Reactivar email de reportes (Resend)  
- Toggles granulares por tipo en Ajustes (diferido)  
- FCM nativo / APNs  

## Capabilities

### New Capabilities
- `fixed-expense-skip-month`: omitir un fijo en el período corriente  
- `fixed-expense-overdue`: avisos a +3 y +6 días sin pagar  

### Modified Capabilities
- `notifications-delivery`: copy, deep links, suppress push en foreground  
- `fixed-expenses-pending`: pendingTotal / proyección respetan skip del mes  

## Approach

- Schema: `skippedPeriodKey` opcional en `fixedExpenses`  
- Cron `processReminders`: mora por días desde due date; skip si pagado o `skippedPeriodKey === periodKey`  
- SW `push`: `clients.matchAll` → si hay ventana focused/visible, no `showNotification`  
- notificationclick: navegar a `url` del payload (también con client abierto)  

## Riesgos

| Riesgo | Likelihood | Mitigación |
|--------|------------|------------|
| SW no detecta “visible” igual en todos los Android | Med | Heurística focused \|\| visibilityState; documentar |
| Skip olvidado al mes siguiente | Low | Skip atado a `periodKey`; caduca solo |
| Spam mora si offsets mal | Low | Dedupe por día + tipo overdue |

## Rollback

Revert merge del change; campo `skippedPeriodKey` opcional no rompe lecturas previas.

## Success Criteria

- [ ] Push no aparece en bandeja con app en foreground; sí con app en background  
- [ ] Mora +3/+6 solo si impago y no omitido  
- [ ] Omitir este mes quita el fijo de pendientes/proyección y de notificaciones  
- [ ] Deep link abre la ruta correcta al tocar la push  
