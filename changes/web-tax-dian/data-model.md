# Data Model: Web Tax DIAN

## TaxDocument

**Table**: `taxDocuments` (nueva)

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `userId` | `Id<"users">` | Yes | — | Owner |
| `taxYear` | `number` | Yes | — | Año gravable (ej. 2025); entero |
| `status` | `"draft" \| "review" \| "filed"` | Yes | `draft` | Lifecycle |
| `estimatedTaxableIncome` | `number` | No | — | COP entero; manual |
| `estimatedTaxDue` | `number` | No | — | COP entero; manual |
| `notes` | `string` | No | — | Max 1000 |
| `filedAt` | `number` | No | — | Timestamp al pasar a `filed` |
| `createdAt` | `number` | Yes | — | |
| `updatedAt` | `number` | Yes | — | |

**Totales**: no se persisten como fuente de verdad; se calculan en read desde `taxItems`. Opcionalmente se pueden cachear campos denormalizados en una iteración posterior si el volumen lo exige (v1: compute on read).

**State transitions**

| From | To | Trigger |
|------|-----|---------|
| — | `draft` | `create` |
| `draft` | `review` | `setStatus` |
| `review` | `draft` | `setStatus` (opcional) |
| `draft` / `review` | `filed` | `setStatus` + set `filedAt` |
| `filed` | `review` | `reopen` (confirmación UI) |

**Indexes**

- `by_user`: `["userId"]`
- `by_user_year`: `["userId", "taxYear"]` — unicidad lógica en mutation

**Validation**

- `taxYear` entre 2000 y (año Bogotá + 1)
- Un solo documento por `(userId, taxYear)`

---

## TaxItem

**Table**: `taxItems` (nueva)

| Field | Type | Required | Default | Notes |
|-------|------|----------|---------|-------|
| `userId` | `Id<"users">` | Yes | — | Denormalizado para queries/auth |
| `documentId` | `Id<"taxDocuments">` | Yes | — | Padre |
| `section` | `TaxSection` | Yes | — | Ver abajo |
| `category` | `string` | Yes | — | Key del catálogo de la sección |
| `description` | `string` | Yes | — | Max 200 |
| `amount` | `number` | Yes | — | COP entero > 0 |
| `notes` | `string` | No | — | Max 500 |
| `sourceType` | `TaxSourceType` | No | — | Origen de sugerencia |
| `sourceId` | `string` | No | — | Id de cuenta/crédito/categoría agregada |
| `createdAt` | `number` | Yes | — | |
| `updatedAt` | `number` | Yes | — | |

```typescript
type TaxSection =
  | "assets"        // Patrimonio
  | "liabilities"   // Deudas
  | "income"        // Ingresos
  | "deductions"    // Deducciones
  | "exempt";       // Rentas exentas

type TaxSourceType =
  | "account"
  | "credit"
  | "income_category"
  | "expense_category"
  | "credit_interest";
```

**Indexes**

- `by_document`: `["documentId"]`
- `by_document_section`: `["documentId", "section"]`
- `by_user`: `["userId"]`
- `by_document_source`: `["documentId", "sourceType", "sourceId"]` (idempotencia; `sourceId` opcional — indexar solo cuando ambos presentes, o filtrar en memoria si Convex no indexa optional limpio)

**Validation**

- `category` ∈ catálogo de `section`
- `amount` entero ≥ 1
- Mutaciones bloqueadas si `document.status === "filed"` (salvo `reopen` previo)

**Delete**: hard delete; cascade eliminar `attachments` con `entityType: "taxItem"` y borrar archivos de storage.

---

## Attachments (extensión)

**Table**: `attachments` (existente)

| Field | Cambio |
|-------|--------|
| `entityType` | De `v.literal("transaction")` → `v.union(v.literal("transaction"), v.literal("taxItem"))` |
| `entityId` | De `v.id("transactions")` → almacenar Id compatible: preferir `v.string()` **o** mantener `v.id("transactions")` solo para txs y añadir `taxItemId: v.optional(v.id("taxItems"))`. **Decisión de implementación (D-05):** `entityId: v.string()` + cast en handlers; migrar implícito (Ids ya son strings). |

Índice `by_entity`: `["entityType", "entityId"]` se mantiene.

Límites: mismos `MAX_ATTACHMENT_SIZE`, MIME JPEG/PNG/PDF, máx. por entidad alineado a transacciones.

---

## Catálogo de categorías v1 (constantes)

### Patrimonio (`assets`)
`inmuebles` · `vehiculos` · `inversiones` · `cuentas_bancarias` · `otros_activos`

### Deudas (`liabilities`)
`creditos_prestamos` · `tarjetas_credito` · `otras_deudas`

### Ingresos (`income`)
`salarios` · `cesantias` · `intereses` · `dividendos` · `honorarios` · `otros`

### Deducciones (`deductions`)
`salud` · `educacion` · `vivienda` · `dependientes` · `intereses_vivienda` · `otras_deducciones`

### Rentas exentas (`exempt`)
`indemnizaciones` · `otros_exentos`

Labels UI en español (Colombia) en `apps/web/src/lib/tax/categories.ts`.

---

## Relaciones

```text
users 1──* taxDocuments 1──* taxItems 1──* attachments (entityType=taxItem)
accounts / credits / transactions ──(suggest only)──▸ taxItems.source*
```
