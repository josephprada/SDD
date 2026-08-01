# Design: App Polish Fixes

**Change**: app-polish-fixes  
**Spec**: `changes/app-polish-fixes/spec.md`  
**Rama**: `feat/app-polish-fixes`

---

## Enfoque Técnico

Change 8 es un **lote de correcciones** sobre superficies de Changes 2–7, más la introducción del arnés Playwright. No añade dominio nuevo: corrige fórmulas, ciclo de vida de overlays, UX de formularios, pipeline de notificaciones y un hueco MCP documentado pero no implementado.

---

## Decisiones de Arquitectura

| # | Pregunta | Decisión | Tradeoff |
|---|----------|----------|----------|
| D-01 | Fórmula proyección | `totalBalance − pendingTotal` | Alineado a liquidez; neto ya no alimenta la proyección |
| D-02 | Jerarquía UI | Proyección primaria / neto secundario si P&gt;0 | CSS + posible swap de slots en MetricCard/MonthOverview |
| D-03 | Modal Home | Store-only openEdit; sin navigate | Host global en Shell se mantiene |
| D-04 | Body scroll lock | Helper con ref-count compartido | Un solo owner de `overflow` |
| D-05 | Genie stuck | Timeout fallback en unmount overlay | Evita modal fantasma |
| D-06 | Autofocus | Solo create | Edit = revisión |
| D-07 | Adjuntos create | Cola File[] → upload post-create | Sin drafts en DB |
| D-08 | Toast spam | Seed seen / cursor; solo deltas | sessionStorage opcional |
| D-09 | Push | Auditar VAPID + cleanup `gone` + SW | Sin FCM nativo |
| D-10 | MCP fijos | `list_fixed_expenses` + `pendingTotal`, scope `read:budgets` | Sin scope nuevo |
| D-11 | E2E | Playwright en `apps/web/e2e` | Base reutilizable, no cobertura total app |
| D-12 | Schema | Sin tablas nuevas v1 | KISS |

---

## Flujos de datos

### Proyección dashboard

```
Home
  → overview.totalBalance (Disponible)
  → fixedExpenses.listUpcomingForPeriod → pendingTotal
  → projected = totalBalance - pendingTotal   // si pendingTotal > 0
  → MetricCard / MonthOverview render (proyección primaria)
```

### Editar desde Home

```
RecentTransactionsList.onEdit(id)
  → transactionModal.openEdit(id)   // NO navigate
  → TransactionModalHost (Shell) → Modal + TransactionForm
  → close / save / delete → unlock body + clear store
```

### Create + adjuntos

```
openCreate → TransactionForm (sin transactionId)
  → user picks files → pendingFiles[]
  → submit createTx → id
  → for file of pendingFiles: attachments.create / upload
  → close modal
```

### Notificaciones in-app

```
listRecentInApp
  → first paint: mark all as seen (no toast)
  → subsequent / newer items: toast once
```

### Push (reparación)

```
cron / processReminders → shouldSendPush
  → notificationActions.sendPush (web-push)
  → SW push event → showNotification
  → if endpoint gone → unsubscribePush / delete row
```

### MCP fijos

```
MCP tool list_fixed_expenses
  → POST /agent/v1/rpc { tool, args }
  → assertScope(read:budgets)
  → listUpcomingForPeriod (o equivalente)
  → { items, pendingTotal, period… }
```

---

## Componentes

### Web

| Módulo | Cambio |
|--------|--------|
| `home.tsx` / `MonthOverview` / `MetricCard` | Fórmula + jerarquía |
| `core.css` (métricas) | Estilos primario/secundario |
| Modal / ConfirmDialog / overlay helper | Ref-count lock + genie timeout |
| `TransactionForm` | Autofocus condicional; UI adjuntos + cola |
| `TransactionModalHost` | Orquestar upload post-create; close ordenado |
| `NotificationListener` | Seed / cursor anti-spam |
| Push register + SW | Verificación + cleanup hook si falta |

### Convex / MCP

| Módulo | Cambio |
|--------|--------|
| `agentGateway.ts` | Tool `list_fixed_expenses` |
| `apps/mcp-server` read tools | Registrar tool + tipos |
| `notificationActions` | Persist cleanup on `gone` |

### Playwright

| Artefacto | Rol |
|-----------|-----|
| `playwright.config.ts` | baseURL, projects desktop+mobile |
| `e2e/*.spec.ts` | Escenarios US1, US2, US4, US6 (+ US3 si estable) |
| `e2e/fixtures` | auth storageState |

---

## UI — jerarquía proyección (D-02)

**Desktop (MetricCard del período):**  
- Con P&gt;0: etiqueta primaria “Si pagas fijos pendientes” + valor grande; debajo/neto secundario con label del neto del período.  
- Con P=0: card como hoy (solo neto primario).

**Móvil (MonthOverview):**  
- Misma inversión tipográfica: proyección como cifra principal del bloque proyectado; neto en estilo muted/secundario.

Usar tokens `--text-*`, `--font-size-*` de JP-DS / `desing.md`; no hex.

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| E2E frágil con Google OAuth | Fixture storageState + doc de seed; skip auth en CI si no hay secretos |
| Push iOS Safari limitado | Documentar en quickstart; no bloquear merge si Web Push desktop/Android OK |
| Upload post-create parcial | Toast/error por archivo; movimiento ya creado (paridad con fallos edit) |
| Ref-count lock mal balanceado | Tests unitarios del helper + E2E open/close/delete |

---

## Orden de implementación sugerido

1. Helper overlay lock + genie fallback (desbloquea US2/US3)  
2. Proyección + jerarquía UI (US1)  
3. Autofocus + adjuntos create (US4/US6)  
4. Toasts + push audit/cleanup (US5)  
5. MCP list_fixed_expenses (US7)  
6. Playwright arnés + specs (US8) en paralelo desde el paso 2 cuando UI estabilice  

Detalle de tareas → `/speckit-tasks`.
