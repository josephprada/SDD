# Propuesta: Change 8 — App Polish Fixes

**Versión**: 1.0.0  
**Estado**: Completado ✅  
**Change**: app-polish-fixes  
**Creado**: 2026-08-01  
**Cerrado**: 2026-08-01  
**Rama**: `feat/app-polish-fixes` → `testing` → `main`

---

## Intención

Cerrar un lote de **bugs y gaps de UX** percibidos en producción tras Changes 1–7, más una extensión mínima del MCP para gastos fijos y el **primer arnés Playwright** del monorepo, de modo que estas regresiones no vuelvan.

## Alcance

### Dentro del scope

- Proyección “Si pagas fijos pendientes” = disponible − fijos, con **mayor relevancia visual** que el neto  
- Modal de movimiento desde Home sin cambiar de módulo; sin overlays fantasma; scroll móvil tras eliminar  
- Sin autofocus en monto al editar  
- Adjuntos también al **crear** movimiento  
- Anti-spam de toasts al entrar; reparación entrega push a bandeja (Web Push existente)  
- MCP: `list_fixed_expenses` + `pendingTotal` (`read:budgets`)  
- Playwright E2E para escenarios UI del change  

### Fuera del scope

- Rediseño completo del centro de notificaciones  
- CRUD de fijos vía MCP / scopes nuevos  
- FCM / push nativo iOS aparte de Web Push  
- Cobertura E2E de toda la aplicación  

## Dependencias

- Changes 1–7 en `testing`/`main` (dominio, push, MCP gateway)  
- Env VAPID (cliente + Convex) para validar push  
- Credenciales/fixture E2E para Playwright  

## Riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Auth E2E con Google | CI bloqueado | storageState + secrets opcionales; quickstart local |
| Push móvil fragmentado | SC-005 parcial | Auditar env + documentar límites PWA |
| Cola adjuntos post-create | Movimiento sin todos los files | Feedback por archivo; reintentar en edit |

## Éxito

Spec SC-001…SC-008 cumplidos; suite Playwright verde en entorno documentado; MCP responde fijos con precisión alineada al dashboard.
