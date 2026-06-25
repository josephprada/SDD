# Design Brief — web-foundation

**Change**: `web-foundation`  
**Design system**: [`desing.md`](../../../desing.md) v1.1.0  
**Convención**: archivos `.pen` en `changes/web-foundation/designs/`

---

## Archivos `.pen`

| Archivo | Capability | Contenido |
|---------|------------|-----------|
| `design-system.pen` | `design-system` | Tokens JP-DS + componentes reutilizables (Button, Input, IconButton, Avatar, Spinner) + preview móvil 375px |
| `auth-google-oauth.pen` | `auth-google-oauth` | Login móvil 375 + desktop 1280, botón Google OAuth, theme toggle en header |
| `app-shell.pen` | `app-shell` | Home y Settings móvil, 404 móvil, Home desktop con sidebar |
| `theme-toggle.pen` | `theme-toggle` | Componente toggle + estados light / dark / system |

---

## Artboards obligatorios (mobile-first)

| Pantalla | Móvil 375×812 | Desktop 1280×900 |
|----------|---------------|------------------|
| Login | ✅ `auth-google-oauth.pen` | ✅ |
| Home (shell) | ✅ `app-shell.pen` | ✅ |
| Settings | ✅ `app-shell.pen` | — (misma estructura en Change 2 si aplica) |
| 404 | ✅ `app-shell.pen` | — |

---

## Variables JP-DS en Pencil

Usar siempre variables (no hex sueltos):

- `color-bg`, `color-surface-1`, `color-surface-2`, `color-border`
- `color-accent`, `color-accent-deep`, `color-text-primary`, `color-text-secondary`, `color-danger`
- `space-4`, `space-5`, `radius-md`, `radius-pill`, `font-body`

---

## Motion (desing.md §10)

Anotar en frames cuando aplique:

| Contexto | Tokens |
|----------|--------|
| Mount de lista | `duration.base` + `ease.out` + `stagger.item` (60ms) |
| Modal / sheet | `duration.slow` + `ease.out` |
| Error form | `shake.*` |
| Theme switch | `duration.fast` |

---

## Componentes — 8 estados (Pencil)

Cada componente reusable debe documentar en notas o frames hijos:

Default · Hover · Press · Focus · Disabled · Loading · Error (si aplica) · Success (si aplica)

---

## Referencias

- Spec: `../spec.md`
- Arquitectura técnica: `../design.md`
- Icono: `../../../public/icon.svg`
