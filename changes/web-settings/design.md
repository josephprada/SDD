# Design: Web Settings

**Change**: web-settings  
**Spec**: `changes/web-settings/spec.md`  
**Rama**: `feat/web-settings`

---

## Enfoque Técnico

`web-settings` completa el panel `/settings` y extiende `userProfiles` (nombre visible, avatar) además de `userPreferences` (apariencia, agrupación, idioma, notificaciones). La personalización visual se implementa en **JP-DS** mediante presets CSS activados por `data-accent`, `data-danger` y `data-font` en `<html>`, con espejo en `localStorage` y pre-paint en `index.html` (mismo patrón FOUC-safe que `data-theme`).

El avatar custom usa **Convex file storage** (patrón de adjuntos, solo JPEG/PNG, 2 MB). `users.currentUser` resuelve overrides sobre la identidad Google en toda la app.

---

## Decisiones de Arquitectura

| # | Pregunta | Decisión | Tradeoff |
|---|----------|----------|----------|
| D-01 | UI modo de tema | Segmented control (Oscuro / Claro / Sistema) en sección Apariencia | Más claro que ciclo icon-only; no re-exponer toggle en header |
| D-02 | Idioma inglés | Fila visible, opción `en` deshabilitada + badge "Próximamente" | Transparente; solo `es` seleccionable |
| D-03 | Estado cliente | `usePreferencesStore` (Zustand) unifica tema + apariencia + prefs producto | Un solo reconciliador Convex ↔ localStorage |
| D-04 | Aplicación de presets | `data-accent`, `data-danger`, `data-font` en `<html>` | CSS puro; alineado a `data-theme` |
| D-05 | Catálogo presets | `packages/jp-ds/src/appearance/presets.ts` + CSS en `tokens/*-presets.css` | Fuente de verdad única para UI y validators |
| D-06 | Fuentes | Google Fonts — link único ampliado en `index.html` | FOUT mínimo; self-host diferido |
| D-07 | Reset apariencia | Mutation `resetAppearance` + `ConfirmDialog` JP-DS | Atómico; no toca grouping/language/notifications |
| D-08 | Legacy users | Defaults en read + `migrations.backfillUserPreferences` opcional | Sin breaking change en prod |
| D-09 | Perfil | `displayName` + `avatarStorageId` en `userProfiles` | No parchear tabla auth `users`; email OAuth read-only |
| D-10 | Avatar upload | Convex storage; JPEG/PNG; 2 MB; reemplazo borra anterior | Reutiliza patrón `attachments.generateUploadUrl` |
| D-11 | Dashboard API | Renombrar args a `periodStart`/`periodEnd` | Breaking interno acotado |
| D-12 | Logo marca | `BrandLogoMark` / `icon.svg` sin recolor dinámico | Marca fija; UI personalizable |

---

## Catálogo de presets (valores finales)

### Acento — dark (`[data-theme="dark"]`)

| ID | Label ES | `--color-accent` | `--color-accent-deep` | Texto btn primario |
|----|----------|------------------|------------------------|-------------------|
| `green-bolt` | Green Bolt | `#07FBA2` | `#159563` | `#0F1419` |
| `cyan-neon` | Cian neón | `#22D3EE` | `#0891B2` | `#0F1419` |
| `amber-gold` | Ámbar dorado | `#FBBF24` | `#D97706` | `#0F1419` |
| `violet-pulse` | Violeta pulso | `#A78BFA` | `#7C3AED` | `#0F1419` |
| `coral-heat` | Coral intenso | `#FB7185` | `#E11D48` | `#0F1419` |

Derivados comunes (por preset, dark):

```css
--color-accent-muted: color-mix(in srgb, var(--color-accent) 12%, transparent);
--color-accent-glow: color-mix(in srgb, var(--color-accent) 25%, transparent);
--color-border-focus: var(--color-accent);
--color-success: var(--color-accent);
--color-glass-border: color-mix(in srgb, var(--color-accent) 20%, transparent);
```

### Acento — light (`[data-theme="light"]`)

Cada preset define `--color-accent` más oscuro para AA sobre blanco:

| ID | `--color-accent` | `--color-accent-bright` |
|----|------------------|-------------------------|
| `green-bolt` | `#059669` | `#07FBA2` |
| `cyan-neon` | `#0E7490` | `#22D3EE` |
| `amber-gold` | `#B45309` | `#FBBF24` |
| `violet-pulse` | `#6D28D9` | `#A78BFA` |
| `coral-heat` | `#BE123C` | `#FB7185` |

### Errores (`data-danger`)

| ID | Label ES | `--color-danger` |
|----|----------|------------------|
| `red-classic` | Rojo clásico | `#EF4444` |
| `rose-soft` | Rosa suave | `#F43F5E` |
| `orange-alert` | Naranja alerta | `#F97316` |
| `crimson-deep` | Carmesí profundo | `#DC2626` |

Independiente del acento; aplica en inputs, alerts y acciones destructivas.

### Tipografía (`data-font`)

| ID | Label ES | `--font-body` | `--font-mono` |
|----|----------|---------------|---------------|
| `inter-default` | Inter | `"Inter", system-ui, sans-serif` | `"JetBrains Mono", ui-monospace, monospace` |
| `dm-sans` | DM Sans | `"DM Sans", system-ui, sans-serif` | `"JetBrains Mono", ui-monospace, monospace` |
| `source-sans` | Source Sans | `"Source Sans 3", system-ui, sans-serif` | `"IBM Plex Mono", ui-monospace, monospace` |
| `system-native` | Sistema | `system-ui, sans-serif` | `ui-monospace, monospace` |

Montos y tablas: `font-family: var(--font-mono); font-variant-numeric: tabular-nums`.

---

## Flujo de datos

```
index.html (pre-paint)
  ├─ localStorage.theme → data-theme, data-themeMode
  └─ localStorage jp-wallet.*Preset → data-accent, data-danger, data-font

main.tsx → PreferencesSyncBridge
  ├─ useQuery userPreferences.get
  │    └─ reconcile → usePreferencesStore (sin sobrescribir si igual)
  └─ mutations → patch Convex + localStorage + dataset

/settings (Apariencia)
  ├─ ThemeModePicker → set theme
  ├─ AccentPresetGrid → set accentPreset
  ├─ DangerPresetGrid → set dangerPreset
  ├─ TypographyPresetList → set typographyPreset
  └─ ResetAppearanceButton → confirm → resetAppearance mutation

/ (dashboard)
  ├─ defaultGrouping from preferences
  ├─ periodRange(grouping, anchorDate)
  └─ dashboard.overview({ periodStart, periodEnd })
```

---

## Perfil de usuario

### Schema — extender `userProfiles`

```ts
userProfiles: defineTable({
  userId: v.id("users"),
  googleSub: v.string(),
  displayName: v.optional(v.string()),      // override editable
  avatarStorageId: v.optional(v.id("_storage")),
  profileUpdatedAt: v.optional(v.number()),
  createdAt: v.number(),
})
```

### Resolución en `users.currentUser`

```ts
name: profile?.displayName?.trim() || user.name || identity?.name || "Usuario",
picture: profile?.avatarStorageId
  ? await ctx.storage.getUrl(profile.avatarStorageId)
  : (user.image ?? identity?.pictureUrl ?? undefined),
email: user.email ?? identity?.email ?? "",  // read-only en UI
```

### API — `convex/users.ts`

| Export | Descripción |
|--------|-------------|
| `updateDisplayName` | `{ displayName: string }` — valida non-empty, max 80 chars |
| `generateAvatarUploadUrl` | URL de subida (auth required) |
| `setAvatar` | `{ storageId }` — valida mime/size en metadata; borra avatar anterior |
| `removeAvatar` | Limpia `avatarStorageId` y delete storage |

Constantes en `convex/lib/validators.ts`:

- `MAX_AVATAR_SIZE = 2 * 1024 * 1024`
- Solo `image/jpeg`, `image/png`

### UI — `ProfileEditor`

- Avatar grande clickeable → input file oculto + acciones "Cambiar foto" / "Usar foto de Google"
- Campo nombre + botón Guardar (o debounce on blur)
- Email disabled con hint "Vinculado a Google"
- Preview instantáneo del avatar antes de confirmar subida (object URL local)

---

## Convex (preferencias)

| Export | Tipo | Descripción |
|--------|------|-------------|
| `get` | query | Objeto completo con defaults para legacy |
| `update` | mutation | Patch parcial validado (cualquier campo) |
| `resetAppearance` | mutation | Setea theme + accent + danger + typography a defaults producto |
| `getTheme` | query | Mantener compat; delega a `get` o deprecar gradualmente |
| `updateTheme` | mutation | Mantener compat; delega a `update` |

### `convex/migrations.ts` (añadir)

| Export | Descripción |
|--------|-------------|
| `backfillUserPreferences` | Rellena campos ausentes en filas existentes con defaults |

### Provisioning (`users.ts`)

Insert inicial incluye todos los campos default (no solo `theme`).

---

## Frontend

### Store — `apps/web/src/stores/preferences.ts`

```ts
interface PreferencesState {
  theme, accentPreset, dangerPreset, typographyPreset,
  defaultGrouping, language, notificationsEnabled,
  initialized: boolean,
  init(), applyLocal(), reconcileFromServer(),
  setTheme(), setAccentPreset(), …,
  resetAppearanceLocal(),
  isDefaultAppearance(): boolean,
}
```

`applyLocal()` actualiza `dataset` + localStorage. Mutations Convex fire-and-forget vía bridge (patrón `ThemeSyncBridge`).

### Componentes — `apps/web/src/components/settings/`

| Componente | Rol |
|------------|-----|
| `ProfileEditor` | Nombre editable, upload avatar, email readonly |
| `ProfileCard` | (deprecated → ProfileEditor) |
| `AppearanceSection` | Contenedor glass + reset |
| `ThemeModePicker` | Segmented 3 opciones |
| `PresetSwatchGrid` | Grid reutilizable acento/errores |
| `TypographyPresetPicker` | Lista con preview Aa + monto |
| `PreferenceRow` | Fila navegable (agrupación, idioma, categorías) |
| `GroupingPicker` | Sheet/modal 4 opciones |
| `LanguagePicker` | Solo ES activo |
| `NotificationsToggle` | Switch + subtítulo "próximamente" |
| `ResetAppearanceDialog` | Confirmación destructiva-style neutral |

### Period — `apps/web/src/lib/period/`

- `periodRange.ts`, `periodLabel.ts`, `addPeriod.ts`
- `PeriodSwitcher.tsx` reemplaza uso directo de `MonthSwitcher` en home (MonthSwitcher puede wrappear o deprecarse)

### Estilos

- `apps/web/src/styles/settings.css` — layout Ajustes, swatches, previews
- JP-DS importa `accent-presets.css`, `danger-presets.css`, `typography-presets.css`

---

## Estructura de archivos

| Path | Acción |
|------|--------|
| `packages/jp-ds/src/appearance/presets.ts` | Crear — IDs, labels, defaults |
| `packages/jp-ds/tokens/accent-presets.css` | Crear |
| `packages/jp-ds/tokens/danger-presets.css` | Crear |
| `packages/jp-ds/tokens/typography-presets.css` | Crear |
| `packages/jp-ds/index.ts` | Exportar tipos preset |
| `convex/schema.ts` | Extender `userProfiles` + `userPreferences` |
| `convex/userPreferences.ts` | Refactor get/update/reset |
| `convex/users.ts` | Perfil (nombre/avatar) + defaults al provisionar |
| `convex/migrations.ts` | `backfillUserPreferences` |
| `convex/dashboard.ts` | Renombrar args período |
| `apps/web/index.html` | Pre-paint apariencia + fuentes |
| `apps/web/src/stores/preferences.ts` | Crear |
| `apps/web/src/lib/appearance/applyAppearance.ts` | Crear |
| `apps/web/src/lib/period/*` | Crear |
| `apps/web/src/components/settings/*` | Crear |
| `apps/web/src/routes/settings.tsx` | Reescribir interactivo |
| `apps/web/src/routes/home.tsx` | Period grouping |
| `apps/web/src/routes/transactions.tsx` | Opcional: alinear filtro mes (fuera scope estricto; mantener mes) |
| `apps/web/src/components/PreferencesSyncBridge.tsx` | Crear |
| `apps/web/src/routes/router.tsx` | Montar bridge |

---

## UI / UX (Ajustes)

**Mobile (375 px)**

1. Header compacto + **ProfileEditor** (avatar, nombre, email)
2. Sección **Apariencia** (glass card)
   - Modo (segmented full-width)
   - Acento (grid 5 swatches)
   - Errores (grid 4 swatches)
   - Tipografía (lista expandible)
   - Botón secundario "Restaurar apariencia por defecto"
3. Filas: Agrupación, Categorías →, Idioma, Notificaciones
4. Cerrar sesión (mobile)

**Desktop**

- Misma información; grids en 2 columnas donde aplique; sheet en lugar de full-screen para pickers largos.

**Accesibilidad**

- Swatches: `role="radio"`, `aria-checked`, nombre visible
- Reset: focus trap en dialog; `prefers-reduced-motion` sin animaciones de swatch

---

## Riesgos técnicos

| Riesgo | Mitigación |
|--------|------------|
| FOUC acento | Pre-paint + mismas keys localStorage |
| AA roto en light | Variantes light por preset en CSS |
| Categorías con colores fijos vs acento UI | OK — colores de categoría son datos usuario, no tokens globales |
| Breaking rename dashboard args | Actualizar todos los call sites en mismo PR |

---

## Dependencias

- `web-foundation`, `web-core`, `web-deploy`
- `desing.md` v1.1.0 — tokens, glass, mobile-first
- Sin nuevas dependencias npm

---

## Verificación

Ver `quickstart.md` — QA manual de apariencia, reset, agrupación y persistencia multi-reload.
