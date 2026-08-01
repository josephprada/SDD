# Contract: Transaction overlay lifecycle

**Change**: app-polish-fixes  
**Consumers**: Shell `TransactionModalHost`, Modal, ConfirmDialog, Home, Playwright US2/US3/US4

## Open from Home

| Acción | Resultado |
|--------|-----------|
| Seleccionar movimiento en recientes (Home) | `transactionModal` → edit; **pathname permanece Home** (`/` o ruta home) |
| Cerrar modal | Store clear; **0** dialogs/overlays visibles; body scroll unlocked |

## Body scroll lock

- Un único mecanismo con **ref-count** (o equivalente): N overlays abiertos → lock; 0 → restore overflow original.
- Nested Modal + ConfirmDialog MUST NOT dejar `overflow: hidden` al cerrar ambos.

## Delete (móvil)

1. Confirm → éxito delete → cerrar confirm → cerrar modal → unlock.  
2. Tras eso, el contenedor principal scrolleable responde a gesture/wheel.

## Focus

| Modo | Autofocus monto |
|------|-----------------|
| create | permitido |
| edit | **prohibido** |

## Attachments

| Modo | UI adjuntar |
|------|-------------|
| create | **visible** (cola local hasta existir id) |
| edit | visible (status quo) |

## Genie / animation

- Si `animationend` no dispara en ≤ timeout documentado en design, forzar unmount del overlay.
