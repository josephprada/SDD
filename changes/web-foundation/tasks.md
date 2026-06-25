# Tasks: Web Foundation (Change 1)

**Input**: `changes/web-foundation/spec.md`, `design.md`, `desing.md` v1.1.0, diseños Bolt Aurora en `changes/web-foundation/designs/*.pen`

**Prerequisites**: `spec.md` ✅ · `design.md` (plan técnico) ✅ · `.pen` artboards ✅

**Visual source of truth**: [`desing.md`](../../desing.md) + artboards Pencil:
- `designs/design-system.pen` — kit JP-DS + preview móvil 375
- `designs/auth-google-oauth.pen` — login móvil + desktop (Bolt Aurora)
- `designs/app-shell.pen` — home, settings, 404, desktop
- `designs/theme-toggle.pen` — toggle light/dark/system

**Nota de alineación**: `desing.md` define **dark-first** como default. Implementar dark por defecto en pre-paint y primer load (no light como en escenario legacy de spec).

**Tests**: No solicitados explícitamente en spec — omitidos. Validación manual + Lighthouse contrast en fase Polish.

---

## Phase 1: Setup (Monorepo + Workspaces)

**Purpose**: Migrar scaffold Vite raíz → monorepo Bun (`apps/web` + `packages/jp-ds` + `convex/`)

- [ ] T001 Configurar workspaces Bun en `package.json` raíz (`apps/web`, `packages/jp-ds`)
- [ ] T002 Crear `bunfig.toml` con `workspaces = true`
- [ ] T003 Crear `tsconfig.json` raíz con project references y paths `@jp-ds/*`, `@app/*`
- [ ] T004 [P] Mover app Vite a `apps/web/` (`index.html`, `vite.config.ts`, `src/`, `public/` symlink o copy)
- [ ] T005 [P] Crear `packages/jp-ds/package.json` y `packages/jp-ds/tsconfig.json`
- [ ] T006 [P] Crear `.env.example` con `VITE_CONVEX_URL`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`
- [ ] T007 Actualizar scripts raíz en `package.json` (`dev`, `build`, `lint` por workspace)
- [ ] T008 Eliminar scaffold obsoleto en raíz (`src/`, `index.html`, `vite.config.ts` tras migración)

**Checkpoint**: `bun install && bun dev` arranca `apps/web` sin errores de paths

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infra Convex + router skeleton + aliases — **bloquea todas las user stories**

⚠️ Ninguna US puede empezar hasta completar esta fase.

- [ ] T009 Definir `convex/schema.ts` tablas `users` + `userPreferences` según `design.md`
- [ ] T010 [P] Crear `convex/auth.config.ts` provider Google (`@convex-dev/auth`)
- [ ] T011 [P] Crear `convex/auth.ts` con action `signInGoogle` (validación ID-token)
- [ ] T012 Implementar `convex/users.ts` — `getOrCreate` por `googleSub`
- [ ] T013 Implementar `convex/seed.ts` — 13 categorías default SPEC §4.4.1 en primer login
- [ ] T014 Añadir script pre-paint FOUC-safe en `apps/web/index.html` (lee `localStorage.theme`, default `dark`)
- [ ] T015 Configurar `apps/web/main.tsx` — `ConvexAuthProvider` + `ConvexReactClient`
- [ ] T016 [P] Configurar alias `@jp-ds/*` en `apps/web/vite.config.ts`
- [ ] T017 [P] Instalar deps: `react-router`, `zustand`, `@convex-dev/auth`, `@auth/core`
- [ ] T018 Crear `apps/web/src/routes/router.tsx` — esqueleto rutas `/login`, `/`, `/settings`, `*`

**Checkpoint**: Convex dev levanta schema; router renderiza rutas vacías; `data-theme` presente pre-paint

---

## Phase 3: User Story 1 — Design System JP-DS (Priority: P1) 🎯

**Goal**: Paquete `@jp-ds` con tokens Bolt Aurora (glass, glow, dark-first) y componentes base tipados.

**Independent Test**: Importar `<Button variant="primary">` desde `apps/web` renderiza con tokens dark; disabled aplica opacidad 0.5.

### Implementation

- [ ] T019 [US1] Crear `packages/jp-ds/tokens/color.css` — tokens light según `desing.md` §4.3
- [ ] T020 [P] [US1] Crear `packages/jp-ds/tokens/dark.css` — overrides `[data-theme="dark"]` (default)
- [ ] T021 [P] [US1] Crear `packages/jp-ds/tokens/typography.css` — Inter, escala mobile-first
- [ ] T022 [P] [US1] Crear `packages/jp-ds/tokens/spacing.css` — escala 4/8/12/16/24/32
- [ ] T023 [P] [US1] Crear `packages/jp-ds/tokens/motion.css` + tokens glass (`--color-surface-glass`, `--color-accent-glow`)
- [ ] T024 [US1] Crear `packages/jp-ds/src/motion/tokens.ts` — `duration`, `ease`, `spring`, `distance`, `stagger`, `shake`
- [ ] T025 [P] [US1] Crear `packages/jp-ds/components/Button.tsx` — primary/secondary/danger + gradient+glow Bolt Aurora
- [ ] T026 [P] [US1] Crear `packages/jp-ds/components/Input.tsx` — glass variant, focus ring accent
- [ ] T027 [P] [US1] Crear `packages/jp-ds/components/IconButton.tsx` — ghost + glow hover
- [ ] T028 [P] [US1] Crear `packages/jp-ds/components/Avatar.tsx` — anillo accent
- [ ] T029 [P] [US1] Crear `packages/jp-ds/components/Spinner.tsx` — stroke accent animado
- [ ] T030 [US1] Crear `packages/jp-ds/src/index.ts` — barrel `components` + `motion` + import CSS tokens

**Checkpoint**: Storybook manual o página dev importa todos los componentes; contraste texto/fondo ≥ 4.5:1 en dark

---

## Phase 4: User Story 2 — Theme Toggle (Priority: P1)

**Goal**: Ciclo light → dark → system, persistencia pre/post-auth, FOUC-safe, listener `prefers-color-scheme`.

**Independent Test**: Toggle 3 veces cicla estados; reload mantiene tema; `system` reacciona a cambio SO sin recarga.

### Implementation

- [ ] T031 [US2] Crear `apps/web/src/stores/theme.ts` — Zustand `ThemeState` (`mode`, `resolved`, `cycle`, `set`)
- [ ] T032 [US2] Crear `apps/web/src/lib/theme/applyTheme.ts` — aplica `data-theme` al `<html>`
- [ ] T033 [US2] Crear `apps/web/src/lib/theme/systemListener.ts` — `matchMedia('prefers-color-scheme')` con debounce
- [ ] T034 [US2] Crear `apps/web/src/components/theme/ThemeToggle.tsx` según `designs/theme-toggle.pen` (anillo glow en focus)
- [ ] T035 [US2] Sincronizar pre-paint `apps/web/index.html` con default `dark` y claves `localStorage.theme`
- [ ] T036 [US2] Crear `convex/userPreferences.ts` mutation `updateTheme` (fire-and-forget post-auth)
- [ ] T037 [US2] Reconciliar tema en root loader — `userPreferences.theme` override `localStorage` si autenticado

**Checkpoint**: Toggle en login (sin sesión) persiste; tras login sync a Convex; sin flash en reload dark

---

## Phase 5: User Story 3 — Auth Google OAuth (Priority: P1)

**Goal**: Login Google end-to-end, validación server-side, provisioning + seed categorías, logout.

**Independent Test**: Click «Continuar con Google» → OAuth → aterriza en `/`; segundo login no duplica categorías.

### Implementation

- [ ] T038 [US3] Crear `apps/web/src/lib/auth/useAuth.ts` — wrapper thin sobre `@convex-dev/auth`
- [ ] T039 [US3] Crear `apps/web/src/components/auth/LoginScreen.tsx` — Bolt Aurora según `designs/auth-google-oauth.pen`
- [ ] T040 [US3] Integrar Google Identity Services popup en `LoginScreen.tsx` (no redirect pestaña principal)
- [ ] T041 [US3] Completar `convex/auth.ts` — validar ID-token contra Google, emitir sesión JWT
- [ ] T042 [US3] Conectar primer login en `convex/users.ts` — crear user + invocar `seed.defaultCategories`
- [ ] T043 [US3] Crear `apps/web/src/routes/login.tsx` — ruta pública `/login`
- [ ] T044 [US3] Implementar redirect `?next=` post-login en root loader
- [ ] T045 [US3] Crear `apps/web/src/components/auth/UserMenu.tsx` — avatar, nombre, cerrar sesión
- [ ] T046 [US3] Implementar `signOut` — limpiar sesión + redirect `/login`

**Checkpoint**: Criterios de éxito spec §OAuth cumplidos; popup cancelado no muestra error bloqueante

---

## Phase 6: User Story 4 — App Shell (Priority: P1)

**Goal**: Chrome autenticado con header, skip-to-content, nav responsiva, rutas protegidas, 404 Aurora.

**Independent Test**: Usuario autenticado ve shell en `/` y `/settings`; sin sesión redirige `/login?next=`; 404 en ruta inventada.

### Implementation

- [ ] T047 [US4] Crear `apps/web/src/routes/root.tsx` — loader auth guard + layout `<Shell><Outlet/></Shell>`
- [ ] T048 [P] [US4] Crear `apps/web/src/components/shell/SkipToContent.tsx` — primer foco Tab
- [ ] T049 [P] [US4] Crear `apps/web/src/components/shell/Header.tsx` — brand pill glass + ThemeToggle + UserMenu
- [ ] T050 [P] [US4] Crear `apps/web/src/components/shell/NavMobile.tsx` — bottom nav <768px según `designs/app-shell.pen`
- [ ] T051 [P] [US4] Crear `apps/web/src/components/shell/NavDesktop.tsx` — sidebar glass ≥1024px
- [ ] T052 [US4] Crear `apps/web/src/components/shell/Shell.tsx` — compone header + main + nav responsiva
- [ ] T053 [US4] Crear `apps/web/src/routes/home.tsx` — placeholder dashboard con stat cards Aurora
- [ ] T054 [US4] Crear `apps/web/src/routes/settings.tsx` — filas glass (tema, agrupación, idioma, notificaciones)
- [ ] T055 [US4] Crear `apps/web/src/routes/notFound.tsx` — 404 glow según `designs/app-shell.pen`
- [ ] T056 [US4] Crear `apps/web/src/styles/aurora.css` — utilidades fondo gradiente, orbes, glass (`backdrop-filter`)
- [ ] T057 [US4] Wire rutas en `apps/web/src/routes/router.tsx` — guards, 404 catch-all

**Checkpoint**: Shell mobile-first 375px; desktop 1280px con sidebar; skip-link funcional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: A11y, motion, docs, limpieza

- [ ] T058 [P] Actualizar `changes/web-foundation/designs/design-brief.md` — Bolt Aurora como diseño canónico en `designs/`
- [ ] T059 [P] Auditoría contraste WCAG AA tokens light+dark (`desing.md` §4, §11)
- [ ] T060 Respetar `prefers-reduced-motion` en shell, login y theme toggle (`desing.md` §10.8)
- [ ] T061 Validar artboards 375/1280 contra `.pen` guardados (mobile-first checklist §7.9)
- [ ] T062 Verificar seed 13 categorías SPEC §4.4.1 en `convex/seed.ts` — test manual Convex dashboard
- [ ] T063 Limpiar `changes/web-foundation/designs/propose-0/` referencia en docs si aplica (archivado)
- [ ] T064 Actualizar `AGENTS.md` si cambian paths de monorepo post-migración

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational) → US1 ∥ US2 (parcial) → US3 → US4 → Polish
```

- **US1 (JP-DS)** y **US2 (Theme)** pueden avanzar en paralelo tras Phase 2 (archivos distintos)
- **US3 (Auth)** depende de Phase 2; consume US1 componentes en LoginScreen
- **US4 (Shell)** depende de US1 + US2 + US3 (auth guard, theme toggle, componentes)

### User Story Dependencies

| Story | Depende de | Entrega independiente |
|-------|------------|----------------------|
| US1 design-system | Phase 2 | ✅ paquete aislado |
| US2 theme-toggle | Phase 2 | ✅ store + toggle sin shell |
| US3 auth | Phase 2, US1 (UI login) | ✅ flujo login completo |
| US4 app-shell | US1, US2, US3 | ✅ shell con placeholder home |

### Parallel Opportunities

```bash
# Tras Phase 2 — tokens en paralelo:
T020, T021, T022, T023  # CSS tokens JP-DS

# Tras Phase 2 — componentes en paralelo:
T025, T026, T027, T028, T029  # JP-DS components

# US4 shell pieces en paralelo:
T048, T049, T050, T051  # SkipToContent, Header, NavMobile, NavDesktop
```

---

## Implementation Strategy

### MVP (mínimo entregable)

1. Phase 1 + 2 (monorepo + Convex + router)
2. US1 JP-DS (tokens + Button mínimo)
3. US3 Auth (login funcional)
4. US4 Shell básico (header + outlet + guard)
5. **STOP** — demo: login → home placeholder

### Entrega completa Change 1

1. Setup + Foundational
2. US1 + US2 en paralelo
3. US3 Auth
4. US4 Shell completo (settings, 404, nav responsiva, Aurora)
5. Polish (WCAG, reduced-motion, validación .pen)

---

## Notes

- Diseño visual: **Bolt Aurora** aprobado — glass, glow, gradientes; no la propuesta plana de `propose-0/`
- Referencia HTML interactiva legacy: `designs/propose-alternative-1/preview/index.html` (opcional)
- Convex schema mínimo: solo `users` + `userPreferences` (categorías en seed para primer login)
- Commits sugeridos: una fase o US por commit (`work-unit-commits`)
