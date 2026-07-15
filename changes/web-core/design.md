# Design: Web Core

**Change**: web-core  
**Spec**: `changes/web-core/spec.md`  
**Rama**: `feat/web-core`

---

## Enfoque Técnico

`web-core` extiende la base de `web-foundation` sin cambiar el modelo de auth, tema ni shell. El backend vive en Convex y expone queries/mutations por dominio (`accounts`, `transactions`, `categories`, `attachments`, `dashboard`). La UI añade rutas protegidas para cuentas, transacciones y categorías; `/` deja de ser placeholder y pasa a dashboard real.

La decisión central es mantener `accounts.balance` **denormalizado** y actualizarlo con deltas dentro de las mutations de transacciones. Esto evita recalcular saldos completos en cada render, mantiene el dashboard reactivo y limita el coste de query. La consistencia se protege concentrando todos los cambios de saldo en un único módulo de dominio: `convex/transactions.ts`.

---

## Decisiones de Arquitectura

| # | Pregunta | Decisión | Tradeoff |
|---|----------|----------|----------|
| 1 | Saldo de cuenta | Campo denormalizado `accounts.balance` actualizado por deltas | Lecturas rápidas y dashboard simple; exige mutations cuidadosas al editar/eliminar |
| 2 | Transferencias | Una sola transacción `type: "transfer"` con `accountId` origen y `toAccountId` destino | Evita doble conteo; requiere validación de origen ≠ destino y delta doble |
| 3 | Borrado de cuentas/categorías | Soft delete con `archived: true` si hay historial | Conserva auditoría financiera; UI debe ocultar archivados en nuevos formularios |
| 4 | Categoría sistema | `categories.isSystem` para proteger "Transferencia" | Permite categorías editables sin romper transferencias |
| 5 | Adjuntos | Convex file storage + tabla `attachments` con metadata | Storage queda desacoplado de transacciones; delete debe borrar metadata y archivo; **reads soft** si la tx ya no existe |
| 6 | Filtros de transacciones | Query por `userId` + rango `date`, filtros secundarios en servidor | Mantiene índices simples; para volúmenes grandes se puede añadir índices específicos |
| 7 | Dashboard | Queries acotadas: cuentas activas, transacciones del mes, últimas N | Sin agregados persistidos en este change; suficiente para MVP personal |
| 8 | UI core | Formularios en componentes por dominio, no lógica en rutas | Rutas orquestan datos; componentes quedan reutilizables para drawers/dialogs futuros |
| 9 | JP-DS | Añadir componentes mínimos solo si hacen falta (`Card`, `Select`, `Dialog`) | Evita sobre diseñar el DS; extraer desde uso real |

---

## Modelo de Datos

### `accounts`

```ts
accounts: defineTable({
  userId: v.id("users"),
  name: v.string(),
  type: v.union(v.literal("cash"), v.literal("bank"), v.literal("credit")),
  initialBalance: v.number(),
  balance: v.number(),
  archived: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
  archivedAt: v.optional(v.number()),
})
  .index("by_user", ["userId"])
  .index("by_user_archived", ["userId", "archived"]);
```

**Invariantes**

- `name.trim().length > 0`
- `initialBalance` y `balance` se almacenan como enteros COP (sin decimales)
- `archived` excluye la cuenta de selectores de nuevas transacciones
- Una cuenta con transacciones no se borra físicamente

### `categories` (extensión de tabla existente)

La tabla ya existe desde `web-foundation`; se amplía sin cambiar los datos seeded.

```ts
categories: defineTable({
  userId: v.id("users"),
  name: v.string(),
  icon: v.string(),
  color: v.string(),
  type: v.union(v.literal("expense"), v.literal("income"), v.literal("transfer")),
  archived: v.boolean(),
  isSystem: v.boolean(),
  createdAt: v.number(),
  updatedAt: v.number(),
  archivedAt: v.optional(v.number()),
})
  .index("by_user", ["userId"])
  .index("by_user_type", ["userId", "type"])
  .index("by_user_type_archived", ["userId", "type", "archived"]);
```

**Migración de datos existentes**

- Categorías seeded actuales reciben `archived: false`, `updatedAt: createdAt`
- Categoría `"Transferencia"` recibe `isSystem: true`
- El resto recibe `isSystem: false`

**Invariantes**

- No duplicar `name` por `userId + type` entre categorías no archivadas
- `isSystem: true` bloquea editar/archivar
- Categorías archivadas se conservan para histórico, pero no aparecen en selectores nuevos

### `transactions`

```ts
transactions: defineTable({
  userId: v.id("users"),
  type: v.union(v.literal("income"), v.literal("expense"), v.literal("transfer")),
  amount: v.number(),
  date: v.number(),
  accountId: v.id("accounts"),
  toAccountId: v.optional(v.id("accounts")),
  categoryId: v.id("categories"),
  notes: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_user_date", ["userId", "date"])
  .index("by_user_account", ["userId", "accountId"])
  .index("by_user_category", ["userId", "categoryId"]);
```

**Invariantes**

- `amount > 0`, entero COP
- `income`: suma a `accountId`, category `type === "income"`, `toAccountId` ausente
- `expense`: resta de `accountId`, category `type === "expense"`, `toAccountId` ausente
- `transfer`: resta de `accountId`, suma a `toAccountId`, category `type === "transfer"`
- `transfer.accountId !== transfer.toAccountId`
- Todas las entidades referenciadas deben pertenecer al usuario autenticado

### `attachments`

```ts
attachments: defineTable({
  userId: v.id("users"),
  entityType: v.literal("transaction"),
  entityId: v.id("transactions"),
  storageId: v.id("_storage"),
  filename: v.string(),
  mimeType: v.union(
    v.literal("image/jpeg"),
    v.literal("image/png"),
    v.literal("application/pdf"),
  ),
  size: v.number(),
  uploadedAt: v.number(),
})
  .index("by_user", ["userId"])
  .index("by_entity", ["entityType", "entityId"]);
```

**Invariantes**

- `size <= 10 * 1024 * 1024`
- Solo JPEG, PNG y PDF
- `entityId` debe pertenecer al mismo `userId`
- Al eliminar, se borra metadata y archivo del storage

---

## Flujos de Datos

### Crear Transacción

```text
UI TransactionForm
  → convex.transactions.create(args)
    → getAuthUserId()
    → validar cuenta/categoría/amount/date
    → calcular deltas por tipo
    → patch accounts.balance
    → insert transactions
    → return transactionId
  → queries reactivas refrescan Dashboard/Listas
```

### Editar Transacción

```text
UI TransactionForm(existing)
  → convex.transactions.update(id, patch)
    → cargar transacción anterior
    → validar ownership y referencias nuevas
    → revertir delta anterior
    → aplicar delta nuevo
    → patch transaction + accounts.balance
```

### Eliminar Transacción

```text
UI delete
  → convex.transactions.remove(id)
    → cargar transacción
    → borrar attachments asociados (metadata + storage)
    → revertir delta de saldo
    → delete transaction
```

### Subir Adjunto

```text
UI AttachmentUploader
  → convex.attachments.generateUploadUrl()
  → fetch(uploadUrl, file)
  → convex.attachments.create({ transactionId, storageId, filename, mimeType, size })
  → validar ownership/tipo/tamaño
  → insert attachments
```

### Dashboard

```text
HomeRoute
  ├─ accounts.listActive()
  ├─ dashboard.monthlySummary({ monthStart, monthEnd })
  └─ transactions.recent({ limit: 5 })
```

---

## Contratos Convex

### `convex/accounts.ts`

```ts
export const list = query({ args: { includeArchived: v.optional(v.boolean()) } });
export const create = mutation({
  args: { name: v.string(), type: accountType, initialBalance: v.number() },
});
export const update = mutation({
  args: { accountId: v.id("accounts"), name: v.string(), type: accountType },
});
export const archive = mutation({ args: { accountId: v.id("accounts") } });
```

### `convex/categories.ts`

```ts
export const list = query({
  args: {
    type: v.optional(categoryType),
    includeArchived: v.optional(v.boolean()),
  },
});
export const create = mutation({
  args: { name: v.string(), icon: v.string(), color: v.string(), type: categoryType },
});
export const update = mutation({
  args: { categoryId: v.id("categories"), name: v.string(), icon: v.string(), color: v.string() },
});
export const archive = mutation({ args: { categoryId: v.id("categories") } });
```

### `convex/transactions.ts`

```ts
export const list = query({
  args: {
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
    accountId: v.optional(v.id("accounts")),
    categoryId: v.optional(v.id("categories")),
    amountMin: v.optional(v.number()),
    amountMax: v.optional(v.number()),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
});
export const recent = query({ args: { limit: v.optional(v.number()) } });
export const create = mutation({ args: transactionInput });
export const update = mutation({ args: { transactionId: v.id("transactions"), ...transactionInputFields } });
export const remove = mutation({ args: { transactionId: v.id("transactions") } });
```

### `convex/attachments.ts`

```ts
export const generateUploadUrl = mutation();
export const listByTransaction = query({ args: { transactionId: v.id("transactions") } });
export const create = mutation({ args: attachmentInput });
export const remove = mutation({ args: { attachmentId: v.id("attachments") } });
export const getUrl = query({ args: { storageId: v.id("_storage") } });
```

### `convex/dashboard.ts`

```ts
export const overview = query({
  args: { monthStart: v.number(), monthEnd: v.number(), recentLimit: v.optional(v.number()) },
});
```

`overview` puede componer cuentas activas, resumen mensual y recientes en una sola query para reducir hooks en `HomeRoute`.

---

## Estructura de Archivos

| Path | Acción |
|------|--------|
| `convex/schema.ts` | Modificar: `accounts`, `transactions`, `attachments`; extender `categories` |
| `convex/accounts.ts` | Crear: CRUD + archive |
| `convex/categories.ts` | Crear: CRUD + archive + protección `isSystem` |
| `convex/transactions.ts` | Crear: CRUD + deltas de saldo + filtros |
| `convex/attachments.ts` | Crear: upload URL, metadata, URLs, delete storage |
| `convex/dashboard.ts` | Crear: overview mensual |
| `convex/seed.ts` | Modificar: categorías seeded con `archived`, `isSystem`, `updatedAt` |
| `apps/web/src/routes/home.tsx` | Modificar: dashboard real |
| `apps/web/src/routes/accounts.tsx` | Crear |
| `apps/web/src/routes/transactions.tsx` | Crear |
| `apps/web/src/routes/categories.tsx` | Crear |
| `apps/web/src/routes/router.tsx` | Modificar: rutas core |
| `apps/web/src/components/shell/NavMobile.tsx` | Modificar: navegación core |
| `apps/web/src/components/shell/NavDesktop.tsx` | Modificar: navegación core |
| `apps/web/src/components/dashboard/*` | Crear |
| `apps/web/src/components/accounts/*` | Crear |
| `apps/web/src/components/transactions/*` | Crear |
| `apps/web/src/components/categories/*` | Crear |
| `apps/web/src/components/attachments/*` | Crear |
| `apps/web/src/lib/format/currency.ts` | Crear: COP |
| `apps/web/src/lib/format/date.ts` | Crear |
| `packages/jp-ds/components/{Card,Select,Dialog}.tsx` | Crear solo si la implementación lo necesita |

---

## Estrategia UI

La UI técnica se implementa mobile-first siguiendo `desing.md` §7:

- Móvil: listas con cards compactas, acciones principales fijas o visibles arriba, formularios full-screen/dialog simple.
- Desktop: sidebar existente + grid de dashboard, listas con columnas, formularios en panel lateral o dialog.
- Todos los montos usan jerarquía fuerte y formato COP.
- Estados vacíos deben ofrecer acción primaria: crear cuenta, registrar transacción, crear categoría.
- Acciones destructivas usan confirmación clara y copy específico: archivar cuenta/categoría, eliminar transacción, eliminar adjunto.

El diseño visual detallado (layout exacto, componentes, estados y artboards) queda para el siguiente paso UI/UX.

---

## Estrategia de Testing

| Capa | Qué | Cómo |
|------|-----|------|
| Unit | `formatCOP`, validadores de monto/tipo/mime | Vitest |
| Unit | cálculo de deltas por tipo de transacción | Vitest o tests puros si se extrae helper |
| Integration | mutations `transactions.create/update/remove` actualizan saldos | Convex test |
| Integration | `attachments.create/remove` valida ownership y storage | Convex test |
| E2E manual | crear cuenta → gasto → dashboard saldo | Browser local |
| E2E manual | transferencia origen/destino | Browser local |
| Accessibility | foco, labels, estados vacíos, reduced motion | Lighthouse/axe manual |

---

## Plan de Migración

1. Extender `categories` con campos nuevos y tolerar filas existentes en código durante desarrollo.
2. Actualizar `DEFAULT_CATEGORIES` para nuevos usuarios.
3. Añadir mutation de backfill opcional de dev para categorías existentes:
   - `archived = false`
   - `updatedAt = createdAt`
   - `isSystem = name === "Transferencia" && type === "transfer"`
4. Crear tablas nuevas sin datos iniciales.
5. UI muestra dashboard vacío si no hay cuentas/transacciones.

---

## Decisiones Cerradas

| ID | Decisión | Motivo | Impacto |
|----|----------|--------|---------|
| D-01 | Permitir saldos negativos en `cash`, `bank` y `credit` durante el MVP | Evita bloquear registros reales por falta de conciliación inicial o ajustes pendientes | La UI señala saldos negativos con estado visual de atención, pero no bloquea operaciones |
| D-02 | Máximo 5 adjuntos por transacción | Mantiene el detalle ligero y evita uso excesivo de storage en Change 2 | `attachments.create` valida conteo antes de aceptar un nuevo archivo |
| D-03 | Búsqueda textual en `notes`, nombre de cuenta y nombre de categoría; no busca monto formateado | El monto ya tiene filtros dedicados (`amountMin`, `amountMax`) y buscar por formato COP sería frágil | `transactions.list.search` normaliza texto y aplica matching sobre campos textuales enriquecidos |
