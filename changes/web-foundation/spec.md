# Change 1 — Web Foundation

**Versión**: 1.0.0
**Estado**: Borrador
**Change**: web-foundation
**Creado**: 2026-06-21

---

## Propuesta

### Intención
Establecer la capa foundational visible de JP-WALLET en su versión web: autenticación con Google OAuth, app shell con ruteo protegido, paquete de Design System (JP-DS), y theme toggle básico. Este change desbloquea todos los cambios downstream (Core, Config, Reportes, Renta, Créditos).

### Alcance

**Dentro del Scope:**
- Setup de workspaces Bun: `apps/web` (Vite) + `packages/jp-ds` + `convex/`
- Design System JP-DS: tokens (color/typography/spacing) en light + dark + componentes base (Button, Input, IconButton, Avatar, Spinner)
- App shell: header (brand + theme toggle + user menu), `<Outlet />` principal, bottom nav móvil / sidebar desktop, skip-to-content
- Ruteo React Router v6/v7: `/login` público, `/` y `/settings` protegidos, 404, auth guard loader
- Google OAuth end-to-end: validación server-side de ID-token, primer login crea usuario + seed de categorías (SPEC §4.4.1)
- Theme toggle light/dark/system persistido en `localStorage` pre-auth y `userPreferences` post-auth, FOUC-safe
- Motion tokens module según `desing.md` v1.0.0

**Fuera del Scope:**
- Pantallas de dominio (Dashboard, Transacciones, Cuentas — Change 2+)
- Schema completo de Convex (solo `users` + `userPreferences`)
- Notificaciones, offline, push (v2)
- Password / multi-cuenta / biométrico / i18n más allá de español

### Capabilities

| Capability | Tipo | Descripción |
|------------|------|-------------|
| `app-shell` | NUEVA | Layout chrome, guard de ruta protegida, breakpoints responsivos, skip-to-content |
| `auth-google-oauth` | NUEVA | Flujo OAuth 2.0, validación server-side, provisioning + seed de categorías, lifecycle de sesión |
| `design-system` | NUEVA | Paquete JP-DS — contrato de tokens + API de componentes base |
| `theme-toggle` | NUEVA | Máquina de estados light/dark/system, persistencia, listener de sistema, render FOUC-safe |

---

## Especificación

### Dominio: app-shell

#### Requisito: Layout Chrome
El sistema DEBE renderizar header, área principal y navegación en todas las rutas autenticadas.

**Escenario: Renderizado en ruta autenticada**
- GIVEN usuario autenticado navegando a `/`
- WHEN el shell monta
- THEN DEBE mostrar header, `<main>` con el `<Outlet />`, y navegación responsiva

**Escenario: Skip-to-content**
- GIVEN usuario navegando con teclado
- WHEN presiona Tab al cargar la página
- THEN el enlace "Saltar al contenido" DEBE ser el primer elemento focuseable

#### Requisito: Auth Guard
El sistema DEBE redirigir a `/login` cuando no hay sesión activa en rutas protegidas.

**Escenario: Sin sesión en ruta protegida**
- GIVEN usuario sin sesión accediendo a `/`
- WHEN el loader raíz ejecuta
- THEN DEBE redirigir a `/login` con `?next` conteniendo la ruta original

**Escenario: Sesión activa**
- GIVEN usuario con sesión válida
- WHEN navega a `/`
- THEN DEBE renderizar el shell sin redirigir

#### Requisito: Navegación Responsiva
El sistema DEBE alternar entre bottom nav (móvil) y sidebar (desktop) según viewport.

**Escenario: Viewport móvil**
- GIVEN viewport < 768px
- WHEN el shell renderiza
- THEN DEBE mostrar bottom navigation fija

**Escenario: Viewport desktop**
- GIVEN viewport ≥ 1024px
- WHEN el shell renderiza
- THEN DEBE mostrar sidebar lateral persistente

#### Requisito: Página 404
El sistema DEBE mostrar una página 404 cuando la ruta no existe.

**Escenario: Ruta inexistente**
- GIVEN ruta `/ruta-inexistente`
- WHEN el router matchea
- THEN DEBE renderizar el componente 404 con link de regreso a `/`

---

### Dominio: auth-google-oauth

#### Requisito: Inicio de Flujo OAuth
El sistema DEBE iniciar OAuth 2.0 con Google al click en "Continuar con Google".

**Escenario: Click en botón Google**
- GIVEN usuario en `/login`
- WHEN hace click en "Continuar con Google"
- THEN DEBE abrir popup de Google Identity Services y DEBE NO redirigir la pestaña principal

**Escenario: Cancelación del popup**
- GIVEN popup de Google abierto
- WHEN el usuario cierra el popup sin autorizar
- THEN el sistema DEBE permanecer en `/login` sin mostrar error bloqueante

#### Requisito: Validación Server-Side del Token
El sistema DEBE validar el ID-token contra Google server-side antes de crear sesión.

**Escenario: Token válido**
- GIVEN ID-token de Google recibido
- WHEN la Convex action lo valida contra Google
- THEN DEBE retornar un JWT de sesión y los datos del usuario

**Escenario: Token inválido o expirado**
- GIVEN ID-token manipulado o expirado
- WHEN la action lo recibe
- THEN DEBE rechazar con error y DEBE NO crear ningún usuario

#### Requisito: Provisioning de Primer Login
El sistema DEBE crear el `user` y seedear las categorías por defecto en el primer login exitoso.

**Escenario: Primer login**
- GIVEN usuario nuevo que completa OAuth
- WHEN la action confirma que no existe `user` con ese `googleSub`
- THEN DEBE crear el `user`, las 13 categorías de SPEC §4.4.1 y DEBE redirigir a `/`

**Escenario: Login recurrente**
- GIVEN usuario existente que completa OAuth
- WHEN la action confirma el `googleSub`
- THEN DEBE cargar el perfil existente y DEBE NO duplicar categorías

#### Requisito: Cierre de Sesión
El sistema DEBE limpiar la sesión local y redirigir a `/login` al cerrar sesión.

**Escenario: Logout desde user menu**
- GIVEN usuario autenticado en `/`
- WHEN hace click en "Cerrar sesión" del user menu
- THEN DEBE limpiar cookies/JWT y DEBE redirigir a `/login`

---

### Dominio: design-system

#### Requisito: Contrato de Tokens
JP-DS DEBE exponer tokens de color, tipografía y espaciado como CSS custom properties en light y dark.

**Escenario: Tokens aplicados en light**
- GIVEN `<html data-theme="light">`
- WHEN un componente lee `var(--color-surface-1)`
- THEN DEBE resolver al valor definido en `tokens/color.css`

**Escenario: Overrides en dark**
- GIVEN `<html data-theme="dark">`
- WHEN un componente lee `var(--color-surface-1)`
- THEN DEBE resolver al valor definido en `tokens/dark.css`

#### Requisito: Componentes Base
JP-DS DEBE exportar Button, Input, IconButton, Avatar y Spinner con API tipada.

**Escenario: Import desde app**
- GIVEN `apps/web` consumiendo JP-DS
- WHEN importa `<Button variant="primary">`
- THEN DEBE renderizar usando tokens y DEBE aceptar props tipadas

**Escenario: Estado disabled**
- GIVEN un `<Button disabled>`
- WHEN el usuario interactúa
- THEN DEBE tener opacidad 0.5 y `pointer-events: none`

#### Requisito: Contraste WCAG AA
JP-DS DEBE garantizar contraste mínimo 4.5:1 entre texto y fondo en light y dark.

**Escenario: Auditoría light y dark**
- GIVEN tokens en ambos temas
- WHEN se ejecuta auditoría Lighthouse
- THEN DEBE reportar contraste ≥ 4.5:1 en todos los pares texto/fondo

---

### Dominio: theme-toggle

#### Requisito: Máquina de Estados de Tema
El sistema DEBE mantener un estado `{light, dark, system}` y aplicarlo al `<html>`.

**Escenario: Ciclo light → dark → system**
- GIVEN usuario autenticado
- WHEN hace click en el toggle sucesivamente
- THEN el estado DEBE ciclar light → dark → system → light y DEBE persistir en `userPreferences`

**Escenario: Toggle pre-auth**
- GIVEN usuario sin sesión
- WHEN toggle el tema
- THEN DEBE persistir en `localStorage.theme` y DEBE NO requerir cuenta

#### Requisito: Listener de Sistema
El sistema DEBE reaccionar a cambios en `prefers-color-scheme` cuando el modo es `system`.

**Escenario: Cambio de SO a dark**
- GIVEN tema en modo `system` con SO en light
- WHEN el usuario cambia el SO a dark
- THEN el `<html data-theme>` DEBE actualizarse a `dark` sin recarga

#### Requisito: Render FOUC-Safe
El sistema DEBE evitar parpadeo de tema incorrecto en el primer paint.

**Escenario: Recarga en dark**
- GIVEN `userPreferences.theme = "dark"`
- WHEN el navegador carga `/`
- THEN el `<html data-theme="dark">` DEBE estar presente antes del primer paint del CSS

**Escenario: Primer load sin preferencia**
- GIVEN usuario nuevo sin `localStorage.theme` y SO en light
- WHEN carga la app por primera vez
- THEN DEBE aplicar light por defecto

---

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

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| Misconfig de OAuth bloquea primer login | Media | `.env.example` documentado; fail-fast en dev |
| Convex Auth choice locks-in | Media | Wrapper `useAuth()` thin; swap posible después |
| FOUC en dark mode en primer paint | Media | Inline `<script>` pre-paint `data-theme`; test Playwright |
| WCAG AA contrast falla en dark mode | Baja | Review de tokens + auditoría Lighthouse |
| Interop Bun + Vite + Convex | Media | Pinear versiones; documentar en `changes/web-foundation/design.md` |
| Race condition con `prefers-color-scheme` | Baja | `matchMedia` listener con debounce en writes |

## Dependencias

- Google Cloud OAuth client ID + secret (variables de entorno)
- Convex cloud project (scaffolded)
- Decisión de sdd-design: `@convex-dev/auth` vs implementación hand-rolled
- `react-router` v6/v7, `zustand`, Google Identity Services SDK
- `desing.md` v1.0.0 (contrato visual JP-DS y motion tokens)

## Estructura de Archivos

```
jp-wallet/
├── apps/web/
│   ├── index.html                      # Inline pre-paint data-theme
│   ├── main.tsx                        # Router root + theme bootstrap
│   ├── vite.config.ts                  # Alias @jp-ds/*
│   └── src/
│       ├── routes/                     # /login, /, /settings, 404
│       ├── components/
│       │   ├── shell/                  # Header, Nav, SkipToContent
│       │   └── auth/                   # Login screen, UserMenu
│       ├── stores/                     # Zustand: auth, theme
│       └── lib/motion/tokens.ts        # duration, ease, spring, distance, stagger, shake
├── packages/jp-ds/
│   ├── tokens/
│   │   ├── color.css                   # Light tokens
│   │   ├── dark.css                    # Dark overrides
│   │   ├── typography.css
│   │   ├── spacing.css
│   │   └── motion.css
│   ├── components/                     # Button, Input, IconButton, Avatar, Spinner
│   └── motion.ts                       # Re-export motion tokens
└── convex/
    ├── schema.ts                       # users + userPreferences
    ├── auth.config.ts                  # Google provider
    ├── http.ts                         # OAuth callback action
    ├── users.ts                        # Provisioning
    └── seed.ts                         # Default categories seed
```