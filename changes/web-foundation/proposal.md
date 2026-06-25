# Propuesta: Change 1 — Web Foundation

**Versión**: 1.0.0
**Estado**: Borrador
**Change**: web-foundation
**Creado**: 2026-06-21

---

## Intención

Establecer la capa foundational visible de JP-WALLET en su versión web: autenticación con Google OAuth, app shell con ruteo protegido, paquete de Design System (JP-DS), y theme toggle básico. Este change desbloquea todos los cambios downstream (Core, Config, Reportes, Renta, Créditos).

## Alcance

### Dentro del Scope

- **Setup de workspaces Bun**: monorepo con `apps/web` (Vite) + `packages/jp-ds` + `convex/`
- **Design System JP-DS**: tokens (color/typography/spacing) en light + dark + componentes base (Button, Input, IconButton, Avatar, Spinner)
- **App shell**: header (brand + theme toggle + user menu), `<Outlet />` principal, bottom nav móvil / sidebar desktop, skip-to-content
- **Ruteo React Router v6/v7**: `/login` público, `/` y `/settings` protegidos como placeholders, 404, loader de auth guard
- **Google OAuth end-to-end**: Convex auth action, validación server-side de ID-token, primer login crea usuario + seed de categorías por defecto, persistencia de sesión
- **Theme toggle** (light/dark/system) persistido en `localStorage` pre-auth y `userPreferences` post-auth, FOUC-safe
- **Motion tokens module**: `src/lib/motion/tokens.ts` exportando duration, easing, springs, distance, stagger, shake según `desing.md` v1.0.0

### Fuera del Scope

- Pantallas de dominio (Dashboard, Transacciones, Cuentas — Change 2+)
- Schema completo de Convex (solo `users` + `userPreferences` en este change)
- Notificaciones, offline, push (v2)
- Password / multi-cuenta / biométrico / i18n más allá de español
- Gastos compartidos, declaración de renta, créditos, gráficos, exports (cambios posteriores)

## Capabilities

### Capabilities Nuevas

| Capability | Tipo | Descripción |
|------------|------|-------------|
| `app-shell` | NUEVA | Layout chrome, guard de ruta protegida, breakpoints responsivos, skip-to-content |
| `auth-google-oauth` | NUEVA | Flujo OAuth 2.0, validación server-side de token, provisioning de primer login + seed de categorías, lifecycle de sesión |
| `design-system` | NUEVA | Paquete JP-DS — contrato de tokens + API de componentes base |
| `theme-toggle` | NUEVA | Máquina de estados light/dark/system, persistencia, listener de sistema, render FOUC-safe |

### Capabilities Modificadas

Ninguna (proyecto greenfield en este branch).

## Enfoque

### Setup Técnico

- **Bun workspaces** con tres paquetes: `apps/web` (Vite + React 19 + TS6), `packages/jp-ds` (tokens + componentes), `convex/` (backend serverless)
- **Convex Auth** valida Google ID tokens server-side en una HTTP action dedicada
- **React Router v7** con `createBrowserRouter` y loader raíz que chequea sesión y redirige a `/login` si no está autenticado
- **JP-DS** expone CSS custom properties (`--color-surface-1`, etc.) + imports tipados de componentes (`<Button>`, `<Input>`)
- **Theme store** en Zustand; inline `<script>` en `index.html` setea `data-theme` antes del primer paint para evitar FOUC

### Flujo de Auth

```
App Launch → Root loader chequea sesión
├── Sesión activa → user + theme → render <Outlet /> (/)
├── Sin sesión → redirect a /login
└── /login → click "Continuar con Google"
    ├── Popup Google Identity Services
    ├── ID token devuelto al cliente
    ├── Convex action valida token contra Google
    ├── ¿Usuario nuevo? → crea user + seed categorías (SPEC §4.4.1)
    └── Sesión persistida → redirect a /
```

### Almacenamiento de Preferencias

- **Pre-auth**: `localStorage.theme` (light/dark/system)
- **Post-auth**: tabla `userPreferences` en Convex (theme, defaultGrouping, language, notificationsEnabled — solo `theme` se usa en este change)
- **System listener**: `matchMedia('(prefers-color-scheme: dark)')` actualiza tema si está en modo system

### Design System JP-DS

- Tokens en CSS custom properties agrupados por concern (`color.css`, `typography.css`, `spacing.css`, `motion.css`, `dark.css` con overrides)
- Componentes base: `Button`, `Input`, `IconButton`, `Avatar`, `Spinner` — consumen tokens vía `var(--*)` y exponen props tipadas
- Motion tokens exportados desde `packages/jp-ds/src/motion.ts` re-exportando `src/lib/motion/tokens.ts` de `apps/web`

### Motion Tokens

Implementación de `desing.md` v1.0.0 §10:

- `duration.*` (instant, fast, base, slow, dramatic, shimmer)
- `ease.*` (in, out, inOut) + `spring.*` (gentle, bouncy, snap)
- `distance.*` (tiny, short, medium, long, dramatic)
- `stagger.*` (item, group) + `shake.*` (oscillations, duration)
- Consumibles desde JP-DS y desde `apps/web` vía alias `@jp-ds/motion`

## Áreas Afectadas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `apps/web/src/{routes,components/shell,components/auth,stores,lib/motion}/` | Nuevo | Router, shell, UI de auth, theme store, motion tokens |
| `apps/web/index.html`, `main.tsx`, `vite.config.ts`, `tsconfig.json` | Modificado | Script pre-paint de theme, router root, alias `@jp-ds/*` |
| `packages/jp-ds/` | Nuevo | Tokens + componentes base |
| `convex/auth.config.ts`, `convex/http.ts` | Nuevo | Google provider + HTTP action |
| `convex/schema.ts` | Modificado | Solo `users` + `userPreferences` |
| `convex/users.ts`, `convex/seed.ts` | Nuevo | Provisioning + seed de categorías |
| `package.json` | Modificado | Bun workspaces + scripts |

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| Misconfig de OAuth bloquea primer login | Media | `.env.example` documentado; fail-fast en dev |
| Convex Auth choice locks-in | Media | Wrapper `useAuth()` thin; swap posible después |
| FOUC en dark mode en primer paint | Media | Inline `<script>` pre-paint `data-theme`; test Playwright |
| WCAG AA contrast falla en dark mode | Baja | Review de tokens + auditoría Lighthouse |
| Interop Bun + Vite + Convex | Media | Pinear versiones; documentar en `changes/web-foundation/design.md` |
| Race condition con `prefers-color-scheme` | Baja | `matchMedia` listener con debounce en writes |

## Plan de Rollback

Change foundational — sin rollback parcial razonable. `git revert` del merge commit; limpiar filas de usuarios seeded en Convex dev vía dashboard. Estado pre-change recuperable en <1 minuto.

## Dependencias

- Google Cloud OAuth client ID + secret (variables de entorno)
- Convex cloud project (scaffolded)
- Decisión de sdd-design: `@convex-dev/auth` vs implementación hand-rolled
- `react-router` v6/v7, `zustand`, Google Identity Services SDK
- `desing.md` v1.0.0 (contrato visual JP-DS y motion tokens)

## Criterios de Éxito

- [ ] Click en "Continuar con Google" completa OAuth → aterriza en `/`
- [ ] Primer login crea `users` + seedea categorías de SPEC §4.4.1
- [ ] Usuario recurrente skipea `/login` vía sesión persistida
- [ ] Shell renderiza header + main + nav responsiva (bottom nav móvil, sidebar desktop)
- [ ] Theme toggle cicla light → dark → system; persiste across reloads y devices
- [ ] Sin FOUC en primer paint (dark mode no parpadea)
- [ ] JP-DS consumible vía `@jp-ds/tokens` y `@jp-ds/components` en ambos temas
- [ ] Shell y auth respetan `prefers-reduced-motion` (`desing.md` §10.8 y §11)
- [ ] WCAG 2.1 AA contrast verificado en light + dark
- [ ] Motion tokens exportados desde `src/lib/motion/tokens.ts` y consumidos por JP-DS