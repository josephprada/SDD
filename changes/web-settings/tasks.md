# Tasks: Web Settings (Change 3)

**Input**: `changes/web-settings/spec.md`, `design.md`, `research.md`, `data-model.md`, `contracts/user-preferences-api.md`, `contracts/user-profile-api.md`, `quickstart.md`

**Prerequisites**: `web-core` + `web-deploy` en base ✅ · spec/design ✅

**Rama**: `feat/web-settings`

**Tests**: Sin TDD explícito. Validación vía `quickstart.md`, `bun run build`, `bun run lint`.

**Visual source of truth**: [`desing.md`](../../desing.md) + `design.md` §UI/UX

---

## Phase 1: Setup (JP-DS + estructura)

**Purpose**: Catálogo de presets y carpetas cliente.

- [x] T001 [P] Crear `packages/jp-ds/src/appearance/presets.ts` — IDs, labels ES, `DEFAULT_APPEARANCE`, helpers `isDefaultAppearance`
- [x] T002 [P] Crear `packages/jp-ds/tokens/accent-presets.css` — `[data-accent="…"]` dark + light con derivados `color-mix`
- [x] T003 [P] Crear `packages/jp-ds/tokens/danger-presets.css` — `[data-danger="…"]`
- [x] T004 [P] Crear `packages/jp-ds/tokens/typography-presets.css` — `[data-font="…"]`
- [x] T005 Importar nuevos tokens en `packages/jp-ds` entry CSS / `index.ts`
- [x] T006 [P] Crear `apps/web/src/lib/appearance/applyAppearance.ts` — read/write localStorage + `dataset`
- [x] T007 [P] Crear carpetas `apps/web/src/components/settings/`, `apps/web/src/lib/period/`
- [x] T008 [P] Crear `apps/web/src/styles/settings.css` — layout Ajustes, swatches, previews

**Checkpoint**: Build compila; presets CSS cargados globalmente.

---

## Phase 2: Foundational (Convex + pre-paint + store)

**Purpose**: Bloquea todas las user stories. ⚠️ Ninguna US hasta completar.

- [x] T009 Extender `convex/schema.ts` — `userProfiles` (displayName, avatarStorageId) + `userPreferences` campos nuevos
- [x] T010 Implementar en `convex/users.ts` — `updateDisplayName`, `generateAvatarUploadUrl`, `setAvatar`, `removeAvatar`; extender `currentUser`
- [x] T011 Añadir `MAX_AVATAR_SIZE` y validación avatar en `convex/lib/validators.ts`
- [x] T012 Refactor `convex/userPreferences.ts` — `get`, `update`, `resetAppearance`; compat theme
- [x] T012b Actualizar inserts en `convex/users.ts` — defaults completos `userPreferences` al provisionar
- [x] T013 Añadir `migrations.backfillUserPreferences` en `convex/migrations.ts`
- [x] T014 Renombrar args `dashboard.overview` → `periodStart`/`periodEnd`; actualizar call sites
- [x] T015 Extender `apps/web/index.html` — pre-paint apariencia + Google Fonts
- [x] T016 Crear `apps/web/src/stores/preferences.ts`
- [x] T017 Crear `PreferencesSyncBridge` y montar en router
- [x] T018 [P] Crear `apps/web/src/lib/period/*` + tests unitarios mínimos

**Checkpoint**: `bunx convex dev` sin errores; query `userPreferences.get` devuelve defaults.

---

## Phase 3: User Story 1 — Perfil (Priority: P1) 🎯

**Goal**: Editar nombre visible y avatar; email read-only.

**Independent Test**: Cambiar nombre; subir JPG; quitar avatar → foto Google; visible en sidebar.

### Implementation

- [x] T019 [P] [US1] Crear `ProfileEditor.tsx` — avatar upload, nombre, email disabled
- [x] T020 [US1] Wire upload flow: `generateAvatarUploadUrl` → storage → `setAvatar`
- [x] T021 [US1] Acción "Usar foto de Google" → `removeAvatar`
- [x] T022 [US1] Guardar nombre → `updateDisplayName` con validación inline

**Checkpoint**: quickstart §Perfil pasos 2–5.

---

## Phase 4: User Story 2 — Apariencia (Priority: P1)

**Goal**: Modo, presets acento/errores/tipografía y reset funcionales con persistencia.

**Independent Test**: Cambiar acento a Cian neón, errores a Naranja alerta, tipografía DM Sans; reset restaura defaults; reload persiste.

### Implementation

- [x] T023 [P] [US2] Crear `PresetSwatchGrid.tsx`
- [x] T024 [P] [US2] Crear `ThemeModePicker.tsx`
- [x] T025 [P] [US2] Crear `TypographyPresetPicker.tsx`
- [x] T026 [US2] Crear `AppearanceSection.tsx` + `ResetAppearanceDialog`
- [x] T027 [US2] Reset deshabilitado en defaults; no afecta perfil
- [x] T028 [US2] Integrar pickers con `usePreferencesStore`

**Checkpoint**: quickstart §Apariencia.

---

## Phase 5: User Story 3 — Panel Ajustes (Priority: P1)

**Goal**: `/settings` completo integrando Perfil + Apariencia + filas preferencias.

**Independent Test**: Cero placeholders; layout responsive.

### Implementation

- [x] T029 [US3] Reescribir `apps/web/src/routes/settings.tsx` — Perfil, Apariencia, Preferencias
- [x] T030 [P] [US3] Crear `PreferenceRow.tsx`
- [x] T031 [US3] Link `/categories` + sign-out mobile sin regresión
- [x] T032 [US3] Responsive 375–1440 px

---

## Phase 6: User Story 4 — Preferencias producto (Priority: P2)

**Goal**: Agrupación, idioma (ES only), notificaciones persistidas.

**Independent Test**: Agrupación Semana persiste; notificaciones toggle; English no seleccionable.

### Implementation

- [x] T033 [P] [US4] Crear `GroupingPicker.tsx`
- [x] T034 [P] [US4] Crear `LanguagePicker.tsx`
- [x] T035 [P] [US4] Crear `NotificationsToggle.tsx`
- [x] T036 [US4] Wire a `userPreferences.update`

---

## Phase 7: User Story 5 — Dashboard por período (Priority: P2)

**Goal**: Dashboard respeta `defaultGrouping` y navegación de período.

**Independent Test**: Agrupación Trimestre → resumen trimestre; ‹ › avanza trimestre.

### Implementation

- [x] T037 [P] [US5] Crear `PeriodSwitcher.tsx`
- [x] T038 [US5] Actualizar `home.tsx` con `defaultGrouping`
- [x] T039 [US5] Actualizar copy dashboard dinámico por grouping
- [x] T040 [US5] Reacción en vivo al cambiar agrupación

---

## Phase 8: Polish & verificación

- [x] T041 [P] Consolidar `theme.ts` → `preferences.ts` si aplica
- [x] T042 `bun run lint` + `bun run build`
- [x] T043 QA manual `quickstart.md`
- [x] T044 Actualizar criterios de éxito en `spec.md`

---

## Estado

**Change 3 cerrado** ✅ (2026-07-04) — merge a `testing` y `main` para despliegue.

## Dependencias entre fases

```text
Phase 1 ──► Phase 2 ──► Phase 3 (US1 Perfil)
                    ├──► Phase 4 (US2 Apariencia)
                    ├──► Phase 5 (US3 Panel) — tras T019–T028
                    ├──► Phase 6 (US4 Prefs)
                    └──► Phase 7 (US5 Dashboard)
Phase 8 — tras US1–US5
```

## Parallelizable

- T001–T004, T006–T008 en Phase 1
- T019–T021 en Phase 3
- T026–T027, T031–T033 en Phase 5

---

## Siguiente paso

Change 4 según `SPEC.md` roadmap.
