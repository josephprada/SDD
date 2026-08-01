# Research: App Polish Fixes

**Change**: app-polish-fixes  
**Date**: 2026-08-01  
**Status**: Complete — unknowns from planning resolved

---

## R-01 — Fórmula “Si pagas fijos pendientes”

**Decision**: Proyección = **`Disponible − pendingTotal`**, donde Disponible es `overview.totalBalance` (misma card “Disponible”) y `pendingTotal` viene de `fixedExpenses.listUpcomingForPeriod` (ya correcto en backend).

**Rationale**: Hoy Home y `MonthOverview` usan `net − pendingTotal` (`home.tsx`, `MonthOverview.tsx`). El neto del período no representa liquidez; el usuario pidió explícitamente disponible − fijos. El backend ya suma pending completo aunque `limit` recorte items.

**Alternatives considered**:
- Neto − fijos (status quo) → rechazado por spec
- Disponible filtrado por cuenta “personal finance” → fuera de alcance; usar la misma métrica UI “Disponible”

---

## R-02 — Jerarquía visual proyección > neto

**Decision**: En desktop y móvil, cuando `pendingTotal > 0`, la proyección es el **valor primario** del bloque (tamaño/contraste de métrica principal); el neto pasa a línea secundaria (estilo actual de `projected`). Sin fijos pendientes, el neto recupera el estilo primario.

**Rationale**: Hoy la proyección es `text-xs` muted bajo el neto (`core.css`). Invertir roles tipográficos/CSS cumple FR-001b sin inventar una quinta MetricCard obligatoria. Layout exacto en `design.md` (D-02).

**Alternatives considered**:
- Card separada solo para proyección → más ruido en grid desktop
- Ocultar el neto cuando hay fijos → pierde contexto del período

---

## R-03 — Modal desde Home + scroll stuck

**Decision**:
1. Mantener store `transactionModal.openEdit(id)` **sin** `navigate` a `/transactions`.
2. Introducir **ref-count / helper único** de `document.body` overflow lock compartido por Modal y ConfirmDialog (anidados hoy restauran `"hidden"` al cerrar confirm → body queda bloqueado).
3. Añadir **fallback timeout** en animación genie (`useOverlayAnimation`) si no llega `animationend` (overlay fantasma).
4. En delete: orden determinista close confirm → close modal → unlock; forzar unlock en cleanup.

**Rationale**: Exploración: Home ya no navega en el path feliz; síntomas de redirect + modal flotante encajan con Shell host global + remount de página / genie stuck / deep-link. El scroll móvil es reproducible con lock anidado.

**Alternatives considered**:
- Desmontar TransactionModalHost por ruta → rompe deep-links y FAB global
- Solo CSS `overscroll-behavior` → no arregla body overflow

---

## R-04 — Autofocus monto

**Decision**: Autofocus + select en monto **solo en create** (`!transactionId`). Edit: sin focus automático al monto.

**Rationale**: `TransactionForm` hace `focus()` incondicional en mount. Spec: revisar ≠ editar.

**Alternatives considered**: Focus en primer campo de texto / título → innecesario; ninguno en create también válido, pero create se beneficia de captura rápida.

---

## R-05 — Adjuntos en create

**Decision**: **Cola local de archivos** en el formulario/host de create; tras `transactions.create` exitoso, subir con el mismo pipeline que `AttachmentUploader` (tipos/tamaños actuales). Mostrar UI de adjuntar también sin `transactionId`.

**Rationale**: Uploader requiere id; gate UI `transactionId` oculta la sección. Cola post-create evita drafts en schema.

**Alternatives considered**:
- Crear transacción draft vacía primero → estados huérfanos si el usuario cancela
- Subir a storage anónimo y linkear después → más superficie de seguridad

---

## R-06 — Anti-spam toasts + push

**Decision**:
1. **Toasts**: al primer payload de `listRecentInApp`, **sembrar** `seenRef` (o persistir `lastSeenAt` en `sessionStorage`) **sin** toast; solo toast para ítems nuevos posteriores (sentAt / id &gt; cursor).
2. **Push**: auditar VAPID en Convex + `VITE_VAPID_PUBLIC_KEY`; limpiar suscripciones `gone` (404/410) tras `sendPush`; verificar SW `showNotification`; documentar requisitos PWA/iOS en quickstart. No rediseñar el centro de notificaciones.

**Rationale**: `NotificationListener` toastea todo el historial porque `seenRef` nace vacío. Push ya tiene path completo (`registerPush` → `subscribePush` → `notificationActions.sendPush`); fallos típicos = env, prefs `pushEnabled`, subs muertas, restricciones iOS.

**Alternatives considered**:
- Eliminar toasts por completo → pierde feedback en foreground
- Solo badge sin toast → cambio de producto mayor
- FCM nativo → fuera de alcance (Web Push existente)

---

## R-07 — MCP `list_fixed_expenses`

**Decision**: Nueva tool **`list_fixed_expenses`** en `agentGateway` + `apps/mcp-server` con scope **`read:budgets`** (ya documentado en research mcp-access como lectura de fijos, nunca implementado). Args: período opcional (default = período actual app). Resultado: `{ items, pendingTotal, periodStart, periodEnd }` alineado a `listUpcomingForPeriod`.

**Rationale**: Paridad con lo que el dashboard usa para proyección; agentes pueden hacer disponible − pendingTotal con overview existente.

**Alternatives considered**:
- Extender `list_budgets` → mezcla dominios y rompe contrato
- Scope `read:fixed_expenses` nuevo → drift de tokens existentes
- Solo `pendingTotal` sin lista → insuficiente para explicar incertidumbre

---

## R-08 — Playwright

**Decision**: Introducir Playwright en **`apps/web`** (`playwright.config.ts`, `e2e/`), scripts raíz `test:e2e` / `test:e2e:ui`. Auth: storageState con usuario de prueba (env `E2E_*`) o bypass documentado si Convex Auth lo permite en staging; smoke mínimo autenticado. Cubrir US1 (cálculo + jerarquía DOM), US2 (Home sin path `/transactions`), US4 (autofocus), US6 (adjuntos visibles en create); US3 scroll si estable. Fuera de E2E: push OS real, tools MCP (contract/manual).

**Rationale**: Cero arnés E2E hoy; Playwright es estándar Vite/React y pedido explícito. Colocar junto a la app simplifica `baseURL` y fixtures.

**Alternatives considered**:
- Cypress → más pesado; usuario pidió Playwright
- Solo bun:test unit → no cubre modal/scroll/DOM hierarchy
- E2E en raíz monorepo sin package web → paths más confusos

---

## R-09 — ¿Schema Convex nuevo?

**Decision**: **No** para v1. Opcional futuro: `notificationLog.readAt` / preferencia lastSeen — no necesario si sessionStorage + seed en vivo bastan.

**Rationale**: KISS; evita migración y backfill.
