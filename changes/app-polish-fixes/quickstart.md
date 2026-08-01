# Quickstart QA: App Polish Fixes

**Change**: app-polish-fixes  
**Rama**: `feat/app-polish-fixes`

## Prerrequisitos

```bash
bun install
bun dev          # apps/web
# Convex dev/prod según entorno
```

Para MCP local: `bun run mcp:dev` + token con `read:budgets`.

Para push: `VITE_VAPID_PUBLIC_KEY` en web + `VAPID_*` en Convex.

## Checklist manual

### US1 — Proyección

1. Anotar Disponible D y fijos pendientes P en Home.  
2. Verificar “Si pagas fijos pendientes” = D − P (no neto − P).  
3. Confirmar que la proyección se lee **antes/más grande** que el neto (desktop + móvil).  
4. Sin fijos pendientes: proyección oculta; neto normal.

### US2 / US3 — Modal + scroll

1. Desktop Home → abrir movimiento reciente → URL sigue en Home; una sola modal.  
2. Cerrar → sin overlay fantasma.  
3. Móvil → eliminar movimiento → scroll de la página funciona.

### US4 — Focus

1. Abrir edit → monto **sin** foco / teclado no salta solo.  
2. Create puede enfocar monto.

### US5 — Notificaciones

1. Con ≥3 notificaciones históricas → recargar → **0** toasts de historial.  
2. (Opcional) Con push ON y app en background → recordatorio aparece en bandeja.

### US6 — Adjuntos create

1. Nuevo movimiento → control adjuntar visible.  
2. Adjuntar imagen/PDF → guardar → adjunto en el movimiento.

### US7 — MCP

```text
Tool: list_fixed_expenses
→ items + pendingTotal alineados al dashboard del mismo período
```

## Playwright

```bash
# tras añadir el arnés en implementación
bun run test:e2e
# o
bun run test:e2e:ui
```

Auth: ver `contracts/playwright-e2e.md` (storageState).

## Build / lint

```bash
bun run lint
bun run build
```
