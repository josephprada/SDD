# Design: Web Foundation

**Change**: web-foundation

---

## Enfoque Técnico

Monorepo Bun: `apps/web` (Vite + React 19 + React Router v7) + `packages/jp-ds` (tokens + componentes) + `convex/`. Auth vía `@convex-dev/auth` con Google. Router root loader bloquea rutas protegidas y aplica el tema persistido. Pre-paint inline en `index.html` setea `data-theme` desde `localStorage` (FOUC-safe). JP-DS expone CSS custom properties + componentes tipados vía alias `@jp-ds/*`. Motion tokens centralizados en `packages/jp-ds/src/motion/tokens.ts`.

---

## Decisiones de Arquitectura

| # | Pregunta | Decisión | Tradeoff |
|---|----------|----------|----------|
| 1 | Auth library | `@convex-dev/auth` (oficial) | Lock-in aislado por wrapper `useAuth()` thin; multi-provider nativo (GitHub/Apple). Hand-rolled añade 2-3 días solo en session/JWT. |
| 2 | Workspace layout | Bun workspaces (`apps/web` + `packages/jp-ds` + `convex/`) | SPEC §3.3/§8 lo exigen ("Portátil a futuros proyectos"). Single-package mata la portabilidad. |
| 3 | Auth guard | React Router v7 root loader | Sin flash de login, no race conditions. Wrapper de componente muestra shell antes de redirigir (FOUC). |
| 4 | Theme pre-paint | Inline `<script>` en `index.html` (síncrono) | Lee `localStorage.theme` pre-paint; root loader reconcilia post-auth con `userPreferences.theme`. Doble fuente inevitable. |
| 5 | Motion tokens | Single source en `packages/jp-ds`, alias `@jp-ds/motion` | El proposal tenía dirección invertida. Corregido: tokens en JP-DS, app consume. |
| 6 | Convex schema | Solo `users` + `userPreferences` | YAGNI. Accounts/transactions/categories nacen en su change. |

---

## Flujo de Datos

```
Browser → <script> pre-paint: localStorage.theme → <html data-theme>
       → main.tsx → router → root loader
         ├─ ConvexAuthProvider.getUser() (valida JWT cookie)
         │    ├─ sin sesión → redirect /login?next=<ruta>
         │    └─ con sesión → userPreferences.theme → reconcilia
         └─ <Shell><Outlet/></Shell>

Login: click Google → GIS popup → ID token
     → Convex action signIn("google",{idToken})
        ├─ valida token contra Google
        ├─ ¿nuevo? → users.create + seed 13 cats (SPEC §4.4.1)
        └─ sesión → navigate(/?next=...)
```

Theme toggle: `cycle()` → `localStorage.theme = X` → si autenticado, `userPreferences.update({theme:X})` fire-and-forget. `matchMedia` aplica solo en `system`.

---

## Estructura de Archivos

| Path | Acción |
|------|--------|
| `package.json` raíz | Modificar: `workspaces`, scripts por workspace |
| `tsconfig.json` raíz | Crear: project references + `paths` `@jp-ds/*`, `@app/*` |
| `bunfig.toml` | Crear: workspaces = true |
| `apps/web/vite.config.ts` | Modificar: alias `jp-ds` |
| `apps/web/index.html` | Modificar: `<script>` pre-paint; `lang="es"` |
| `apps/web/main.tsx` | Modificar: `ConvexAuthProvider` + router |
| `apps/web/src/routes/{login,root,settings,notFound}.tsx` | Crear |
| `apps/web/src/components/shell/{Header,NavMobile,NavDesktop,SkipToContent}.tsx` | Crear |
| `apps/web/src/components/auth/{LoginScreen,UserMenu}.tsx` | Crear |
| `apps/web/src/stores/{auth,theme}.ts` | Crear (Zustand) |
| `apps/web/src/lib/motion/tokens.ts` | Crear: re-export desde `@jp-ds/motion` |
| `packages/jp-ds/tokens/{color,typography,spacing,motion}.css` | Crear: CSS custom properties |
| `packages/jp-ds/tokens/dark.css` | Crear: overrides `[data-theme="dark"]` |
| `packages/jp-ds/components/{Button,Input,IconButton,Avatar,Spinner}.tsx` | Crear: consumen `var(--*)` |
| `packages/jp-ds/src/motion/tokens.ts` | Crear: `duration,ease,spring,distance,stagger,shake` (design §3) |
| `packages/jp-ds/src/index.ts` | Crear: barrel exports |
| `convex/schema.ts` | Modificar: `users` + `userPreferences` |
| `convex/auth.config.ts` + `auth.ts` | Crear: provider Google + `signInGoogle` |
| `convex/users.ts`, `convex/seed.ts` | Crear: provisioning + 13 cats default |
| `src/App.tsx`, `src/App.css`, `src/assets/*` | Eliminar: scaffold Vite default |
| `.env.example` | Crear: `VITE_CONVEX_URL`, `AUTH_GOOGLE_ID/SECRET` |

---

## Interfaces / Contratos

```ts
// useAuth() (ConvexAuthProvider)
type Session = { userId: Id<"users">; email: string; name: string; picture?: string };
function useAuth(): { session: Session | null; signInWithGoogle: () => Promise<void>;
                      signOut: () => Promise<void>; isLoading: boolean };

// useThemeStore (Zustand)
type Theme = "light" | "dark" | "system";
interface ThemeState { mode: Theme; resolved: "light" | "dark"; cycle: () => void; set: (t: Theme) => void }
const { mode, resolved, cycle } = useThemeStore(s => s);

// convex/schema.ts
users: defineTable({ googleSub: v.string(), email: v.string(), name: v.string(),
                     picture: v.optional(v.string()), createdAt: v.number() })
       .index("by_googleSub", ["googleSub"]);
userPreferences: defineTable({ userId: v.id("users"),
                               theme: v.union(v.literal("light"), v.literal("dark"), v.literal("system")),
                               updatedAt: v.number() })
                .index("by_user", ["userId"]);

// packages/jp-ds barrel
export { Button, Input, IconButton, Avatar, Spinner };
export { duration, ease, spring, distance, stagger, shake } from "./motion/tokens";
```

---

## Estrategia de Testing

| Capa | Qué | Cómo |
|------|-----|------|
| Unit | `useThemeStore.cycle()`, JP-DS con tokens | Vitest + RTL; mock `matchMedia` |
| Unit | `users.getOrCreate` + seed 13 cats | `convex-test`; assert rows + no duplicados en 2do login |
| Integration | OAuth flow con Convex local | `convex-test` + `signInGoogle`; mock Google verifier |
| E2E | Login→Dashboard, FOUC, toggle, 404 | Playwright; assert `data-theme` antes de `domcontentloaded` |
| Visual | WCAG AA light + dark | Lighthouse CI; ratio ≥ 4.5 |
| Motion | `prefers-reduced-motion` shell+auth | Playwright `emulateMedia({reducedMotion: 'reduce'})` |

---

## Plan de Migración / Rollout

Sin rollback parcial. `git revert` devuelve al scaffold Vite intacto. Limpiar filas seeded vía dashboard Convex (`truncate categories where userId.createdAt < today`).

**Dev-env:** `bun init` workspaces → `bunx convex dev` → Google Cloud OAuth Web client → `bunx convex env set AUTH_GOOGLE_ID/SECRET` → `bun dev`.

---

## Preguntas Abiertas

None.
