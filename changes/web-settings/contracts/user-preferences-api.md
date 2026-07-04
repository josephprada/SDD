# API Contract: User Preferences (Convex)

**Change**: web-settings  
**Module**: `convex/userPreferences.ts`

---

## Queries

### `userPreferences.get`

**Auth**: required

**Returns**

```ts
{
  theme: "light" | "dark" | "system";
  accentPreset: AccentPresetId;
  dangerPreset: DangerPresetId;
  typographyPreset: TypographyPresetId;
  defaultGrouping: "week" | "month" | "quarter" | "semester";
  language: "es" | "en";
  notificationsEnabled: boolean;
  updatedAt: number;
}
```

**Legacy**: campos ausentes se resuelven con defaults de producto en el handler (no escribe DB).

---

### `userPreferences.getTheme` (compat)

**Auth**: optional (null si no autenticado)

**Returns**: `Theme | null`

Delega a `get().theme`.

---

## Mutations

### `userPreferences.update`

**Auth**: required

**Args** (todos opcionales; al menos uno)

```ts
{
  theme?: "light" | "dark" | "system";
  accentPreset?: AccentPresetId;
  dangerPreset?: DangerPresetId;
  typographyPreset?: TypographyPresetId;
  defaultGrouping?: "week" | "month" | "quarter" | "semester";
  language?: "es" | "en";  // solo "es" aceptado en MVP; "en" → error VALIDATION
  notificationsEnabled?: boolean;
}
```

**Errors**

- `Not authenticated`
- `VALIDATION`: idioma `en` no disponible
- `VALIDATION`: enum inválido

**Side effects**: upsert `userPreferences` si no existe; `updatedAt = now`.

---

### `userPreferences.resetAppearance`

**Auth**: required

**Args**: `{}`

**Effect**: setea

```ts
theme: "dark",
accentPreset: "green-bolt",
dangerPreset: "red-classic",
typographyPreset: "inter-default",
```

No modifica `defaultGrouping`, `language`, `notificationsEnabled`.

---

### `userPreferences.updateTheme` (compat)

**Args**: `{ theme }`

Delega a `update({ theme })`.

---

## Dashboard (cambio de contrato)

### `dashboard.overview`

**Args**

```ts
{
  periodStart: number;  // antes monthStart
  periodEnd: number;    // antes monthEnd
  recentLimit?: number;
}
```

**Returns**: sin cambio de forma (`monthlyIncome` / `monthlyExpense` = agregados del rango).

---

## Migrations (dev / one-shot prod)

### `migrations.backfillUserPreferences`

**Auth**: internal / dashboard Convex

Rellena campos default en filas `userPreferences` que solo tienen `theme`.

---

## Client bridge

`PreferencesSyncBridge` registra en `window.__syncPreferences` callbacks que invocan `update` con debounce opcional (theme puede seguir fire-and-forget como hoy).

**localStorage keys**

| Key | Value |
|-----|-------|
| `theme` | theme mode |
| `jp-wallet.accentPreset` | id |
| `jp-wallet.dangerPreset` | id |
| `jp-wallet.typographyPreset` | id |
