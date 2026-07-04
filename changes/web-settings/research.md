# Research: Web Settings

## Decision: perfil en `userProfiles`, no en `users` auth

**Rationale**: Separar overrides editables (`displayName`, `avatarStorageId`) de la identidad OAuth. `currentUser` fusiona ambas fuentes. Email permanece read-only. Avatar en Convex file storage (JPEG/PNG, 2 MB), mismo patrón que adjuntos.

**Alternatives considered**:
- Parchear tabla `users` de `@convex-dev/auth`: frágil ante upgrades del paquete auth.
- Avatar como URL externa: menos control; no cumple patrón storage existente.
- Solo usar `users.name` / `users.image` del auth: re-login podría sobrescribir edits del usuario.

## Decision: presets curados vs color picker libre

**Rationale**: La spec exige accesibilidad WCAG AA y coherencia JP-DS. Un picker libre rompe derivados (`accent-deep`, `glow`, `success`) y facilita combinaciones ilegibles. Presets validados en light/dark reducen riesgo y mantienen la regla "tokens, no hex sueltos" en componentes.

**Alternatives considered**:
- Color picker HSL con generación automática de derivados: más flexible, más QA y edge cases de contraste.
- Solo modo claro/oscuro sin acento variable: no cumple el objetivo de personalización del usuario.

## Decision: atributos `data-*` en `<html>` para apariencia

**Rationale**: El patrón ya existe con `data-theme` y `data-themeMode` (FOUC-safe en `index.html`). Extender con `data-accent`, `data-danger` y `data-font` permite CSS puro en JP-DS sin ramificar TSX por preset.

**Alternatives considered**:
- Variables CSS inyectadas por JS desde TS (`style.setProperty`): funciona pero duplica fuente de verdad respecto a CSS.
- Clases `.accent-cyan-neon` en `body`: menos consistente con el modelo de tema actual.

## Decision: catálogo en JP-DS (`packages/jp-ds/src/appearance/presets.ts`)

**Rationale**: Los presets son contrato de diseño compartido. Centralizar IDs, labels ES y mapas de tokens evita drift entre Ajustes, pre-paint y Convex validators.

**Alternatives considered**:
- Catálogo solo en `apps/web`: acopla personalización a la app; JP-DS deja de ser portable.
- Solo CSS sin TS: validators Convex no pueden whitelistear IDs sin duplicar strings.

## Decision: store Zustand unificado `usePreferencesStore`

**Rationale**: Ya existe `useThemeStore`. Extender con apariencia (accent, danger, font) + preferencias de producto (grouping, language, notifications) en un store o módulo `appearance` que reconcilia Convex al autenticarse. Evita tres stores compitiendo por `document.documentElement`.

**Alternatives considered**:
- Solo hooks Convex sin store local: flash al cargar y peor UX offline de preferencias.
- Mantener theme store separado: duplica reconciliación localStorage ↔ servidor.

## Decision: Google Fonts — un `<link>` con todas las familias del catálogo

**Rationale**: `index.html` ya carga Inter + JetBrains Mono vía Google Fonts. Añadir DM Sans, Source Sans 3 e IBM Plex Mono en el mismo bundle; `font-display: swap`. Self-host diferido (no bloquea MVP).

**Alternatives considered**:
- Carga dinámica al seleccionar preset: menos bytes iniciales, FOUT al cambiar tipografía.
- Self-host en `/public/fonts`: mejor privacidad; más tareas de build y mantenimiento.

## Decision: agrupación temporal — extender `date.ts` + renombrar switcher

**Rationale**: `monthRange` / `MonthSwitcher` ya existen en web-core. Generalizar a `periodRange(grouping, anchorDate)`, `addPeriod`, `formatPeriodLabel` y componente `PeriodSwitcher` minimiza regresiones. Query `dashboard.overview` recibe `periodStart` / `periodEnd` (renombre semántico; mismos args numéricos).

**Alternatives considered**:
- Mantener solo mes en dashboard y solo guardar preferencia sin efecto: incumple spec.
- Cuatro queries Convex separadas por período: over-engineering.

## Decision: idioma — solo `es` activo; fila con badge "Próximamente" para `en`

**Rationale**: Cumple persistencia futura sin medio implementar i18n. Evita guardar `language: "en"` con UI aún en español (estado incoherente).

**Alternatives considered**:
- Ocultar inglés por completo: menos transparente para el usuario.
- i18n completo en este change: scope creep.

## Decision: reset de apariencia — mutation `resetAppearance` + confirmación en UI

**Rationale**: Operación atómica en servidor (modo + tres presets) y espejo en localStorage. El botón se deshabilita cuando `isDefaultAppearance(prefs)` es true.

**Alternatives considered**:
- Cuatro mutaciones separadas desde el cliente: ventana de inconsistencia intermedia.
- Reset sin confirmación: riesgo de tap accidental en móvil.

## Decision: migración legacy — defaults opcionales en lectura + mutation `backfillUserPreferences`

**Rationale**: Usuarios existentes solo tienen `theme` en `userPreferences`. Queries devuelven defaults para campos ausentes; mutation dev opcional rellena filas legacy en prod una vez.

**Alternatives considered**:
- Schema migration obligatoria en deploy: Convex no tiene migraciones automáticas; backfill manual es el patrón del repo (`migrations.backfillCategories`).
