# Data Model: Web Settings

## UserProfile (extendida)

**Table**: `userProfiles` (existente)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `userId` | `Id<"users">` | Yes | Owner |
| `googleSub` | `string` | Yes | OAuth subject |
| `displayName` | `string` | No | Override editable; max 80 chars trimmed |
| `avatarStorageId` | `Id<"_storage">` | No | Custom avatar; one active per user |
| `profileUpdatedAt` | `number` | No | Last profile edit |
| `createdAt` | `number` | Yes | Provisioning |

**Resolution (read)**

| Campo UI | Prioridad |
|----------|-----------|
| Nombre | `displayName` → `users.name` → identity.name → `"Usuario"` |
| Avatar URL | `getUrl(avatarStorageId)` → `users.image` → identity.pictureUrl |
| Email | `users.email` → identity.email (read-only) |

**Avatar constraints**

- MIME: `image/jpeg`, `image/png`
- Max size: 2 MB
- On replace/remove: delete previous `_storage` blob

---

## UserPreferences (extendida)

**Table**: `userPreferences` (existente desde `web-foundation`)

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `userId` | `Id<"users">` | Yes | — | Owner, unique per user |
| `theme` | `"light" \| "dark" \| "system"` | Yes | `"dark"` | Modo de color |
| `accentPreset` | `AccentPresetId` | Yes | `"green-bolt"` | Ver catálogo en `design.md` |
| `dangerPreset` | `DangerPresetId` | Yes | `"red-classic"` | Independiente del acento |
| `typographyPreset` | `TypographyPresetId` | Yes | `"inter-default"` | Body + mono |
| `defaultGrouping` | `"week" \| "month" \| "quarter" \| "semester"` | Yes | `"month"` | Período del dashboard |
| `language` | `"es" \| "en"` | Yes | `"es"` | Solo `es` activo en UI |
| `notificationsEnabled` | `boolean` | Yes | `true` | Sin push en este change |
| `updatedAt` | `number` | Yes | `Date.now()` | Timestamp |

**Indexes**

- `by_user`: `["userId"]` (existente)

**Validators (Convex)**

```ts
accentPreset: v.union(
  v.literal("green-bolt"),
  v.literal("cyan-neon"),
  v.literal("amber-gold"),
  v.literal("violet-pulse"),
  v.literal("coral-heat"),
);

dangerPreset: v.union(
  v.literal("red-classic"),
  v.literal("rose-soft"),
  v.literal("orange-alert"),
  v.literal("crimson-deep"),
);

typographyPreset: v.union(
  v.literal("inter-default"),
  v.literal("dm-sans"),
  v.literal("source-sans"),
  v.literal("system-native"),
);

defaultGrouping: v.union(
  v.literal("week"),
  v.literal("month"),
  v.literal("quarter"),
  v.literal("semester"),
);

language: v.union(v.literal("es"), v.literal("en"));
```

**Defaults de producto (apariencia reset)**

| Field | Value |
|-------|-------|
| `theme` | `"dark"` |
| `accentPreset` | `"green-bolt"` |
| `dangerPreset` | `"red-classic"` |
| `typographyPreset` | `"inter-default"` |

**Lectura con legacy**

Si un campo nuevo falta en filas antiguas, la query `get` aplica defaults de la tabla anterior sin escribir automáticamente (escritura lazy en primera mutación o backfill).

## Client-side mirror (pre-auth / FOUC)

**localStorage**

| Key | Format | Notes |
|-----|--------|-------|
| `theme` | `"light" \| "dark" \| "system"` | Existente |
| `jp-wallet.accentPreset` | preset id | Nuevo |
| `jp-wallet.dangerPreset` | preset id | Nuevo |
| `jp-wallet.typographyPreset` | preset id | Nuevo |

Pre-paint en `index.html` lee `theme` + tres keys de apariencia y setea `dataset` en `<html>`.

## Period (dominio cliente, no tabla)

**Type**: `PeriodGrouping = "week" | "month" | "quarter" | "semester"`

**Functions** (`apps/web/src/lib/period/`)

| Function | Input | Output |
|----------|-------|--------|
| `periodRange` | `(grouping, anchor: Date)` | `{ start: number, end: number }` timestamps |
| `addPeriod` | `(grouping, anchor, delta: ±1)` | `Date` anchor del período adyacente |
| `formatPeriodLabel` | `(grouping, anchor)` | string ES (`Junio 2026`, `10–16 Jun 2026`, `Abr–Jun 2026`, …) |
| `isDefaultAppearance` | prefs object | `boolean` |

**Reglas de calendario**

- Semana: lunes 00:00 – domingo 23:59:59 (`es-CO`, `weekStartsOn: 1`)
- Mes: calendario gregoriano
- Trimestre: Q1 ene–mar, Q2 abr–jun, Q3 jul–sep, Q4 oct–dic
- Semestre: ene–jun, jul–dic

## Dashboard query (cambio de contrato)

**`dashboard.overview`**

| Arg | Type | Notes |
|-----|------|-------|
| `periodStart` | `number` | Inicio inclusive (reemplaza nombre `monthStart`) |
| `periodEnd` | `number` | Fin inclusive (reemplaza `monthEnd`) |
| `recentLimit` | `number?` | Sin cambio |

Respuesta mantiene `monthlyIncome` / `monthlyExpense` como nombres internos (significan ingresos/gastos del período filtrado).
