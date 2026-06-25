# Design Brief — web-foundation (Bolt Aurora)

**Change**: `web-foundation`  
**Design system**: [`desing.md`](../../../desing.md) v1.1.0  
**Estilo visual**: **Bolt Aurora** — glassmorphism, auroras verdes, halos bioluminiscentes  
**Convención**: archivos `.pen` en `changes/web-foundation/designs/`

> Propuesta plana archivada en `designs/propose-0/`. Preview HTML de referencia en `designs/propose-alternative-1/preview/`.

---

## Archivos `.pen` (canónicos)

| Archivo | Capability | Contenido |
|---------|------------|-----------|
| `design-system.pen` | `design-system` | Kit JP-DS Aurora + preview móvil 375px |
| `auth-google-oauth.pen` | `auth-google-oauth` | Login móvil + desktop, botón Google glass, theme toggle en header |
| `app-shell.pen` | `app-shell` | Home y Settings móvil, 404 Aurora, Home desktop con sidebar glass |
| `theme-toggle.pen` | `theme-toggle` | Toggle + estados light / dark / system con anillos glow |

---

## Artboards obligatorios (mobile-first)

| Pantalla | Móvil 375×812 | Desktop 1280×900 |
|----------|---------------|------------------|
| Login | ✅ `auth-google-oauth.pen` | ✅ |
| Home (shell) | ✅ `app-shell.pen` | ✅ |
| Settings | ✅ `app-shell.pen` | — |
| 404 | ✅ `app-shell.pen` | — |

---

## Tokens JP-DS en Pencil / código

Variables semánticas + Aurora:

- `color-bg`, `color-surface-1`, `color-surface-2`, `color-surface-glass`, `color-border`
- `color-accent`, `color-accent-deep`, `color-accent-glow`, `color-glass-border`
- `color-text-primary`, `color-text-secondary`, `color-danger`
- `radius-md`, `radius-lg`, `radius-pill`, `font-body`

---

## Motion (desing.md §10)

| Contexto | Tokens |
|----------|--------|
| Mount login card | `duration.slow` + `ease.out` |
| Hover CTA / glow | `duration.fast` |
| Theme switch | `duration.base` |
| 404 float | `duration.slow` (respeta `prefers-reduced-motion`) |

---

## Referencias

- Spec: `../spec.md`
- Tasks: `../tasks.md`
- Arquitectura técnica: `../design.md`
- Icono: `../../../public/icon.svg`
