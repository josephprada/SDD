# API Contract: Tax Documents & Items (Convex)

**Change**: web-tax-dian  
**Modules**: `convex/taxDocuments.ts`, `convex/taxItems.ts`

---

## Types

```typescript
type TaxStatus = "draft" | "review" | "filed";

type TaxSection =
  | "assets"
  | "liabilities"
  | "income"
  | "deductions"
  | "exempt";

type TaxSourceType =
  | "account"
  | "credit"
  | "income_category"
  | "expense_category"
  | "credit_interest";

type SectionTotals = Record<TaxSection, number> & { grandTotal: number };
```

---

## Queries

### `taxDocuments.list`

**Auth**: required  
**Args**: `{}`  
**Returns**:

```ts
Array<{
  _id: Id<"taxDocuments">;
  taxYear: number;
  status: TaxStatus;
  filedAt?: number;
  updatedAt: number;
  totals: SectionTotals;
  itemCount: number;
}>
```

Orden: `taxYear` descendente.

---

### `taxDocuments.get`

**Args**: `{ documentId: Id<"taxDocuments"> }`  

**Returns**: documento + `totals` + labels de estado; `null` si no existe / no es dueño (soft, no throw).

---

### `taxItems.listByDocument`

**Args**:

```ts
{
  documentId: Id<"taxDocuments">;
  section?: TaxSection;
}
```

**Returns**: array de items ordenados por `createdAt` asc (o descripción).

---

## Mutations

### `taxDocuments.create`

**Args**: `{ taxYear: number; notes?: string }`  

**Returns**: `Id<"taxDocuments">`  

**Errors**:
- `TAX_YEAR_EXISTS` — ya hay documento para ese año
- `TAX_YEAR_INVALID` — fuera de rango permitido

---

### `taxDocuments.updateMeta`

**Args**:

```ts
{
  documentId: Id<"taxDocuments">;
  notes?: string;
  estimatedTaxableIncome?: number | null;
  estimatedTaxDue?: number | null;
}
```

**Errors**: `TAX_FILED_READONLY` si `status === "filed"`.

---

### `taxDocuments.setStatus`

**Args**: `{ documentId; status: "draft" | "review" | "filed" }`  

- A `filed`: set `filedAt = Date.now()`  
- Desde `filed` solo vía `reopen`  

**Errors**: `TAX_FILED_READONLY`, `TAX_INVALID_TRANSITION`

---

### `taxDocuments.reopen`

**Args**: `{ documentId }`  

Pasa `filed` → `review`, limpia `filedAt`.  

**Errors**: `TAX_NOT_FILED`

---

### `taxDocuments.remove`

**Args**: `{ documentId }`  

Cascade: items + attachments + storage.  
Permitido en cualquier estado con confirmación UI (doble check si `filed`).

---

### `taxItems.create`

**Args**:

```ts
{
  documentId: Id<"taxDocuments">;
  section: TaxSection;
  category: string;
  description: string;
  amount: number;
  notes?: string;
  sourceType?: TaxSourceType;
  sourceId?: string;
}
```

**Errors**: `TAX_FILED_READONLY`, `TAX_CATEGORY_INVALID`, `TAX_AMOUNT_INVALID`, `TAX_SOURCE_DUPLICATE` (mismo source en documento)

---

### `taxItems.update`

**Args**: `{ itemId; category?; description?; amount?; notes?; section? }`  

**Errors**: `TAX_FILED_READONLY`, validaciones de create.

---

### `taxItems.remove`

**Args**: `{ itemId }`  

Cascade attachments del item.  
**Errors**: `TAX_FILED_READONLY`

---

## Attachments (extensión)

### `attachments.listByTaxItem`

**Args**: `{ taxItemId: Id<"taxItems"> }` → array (vacío si item inexistente / no dueño)

### `attachments.createForTaxItem`

**Args**: `{ taxItemId; storageId; filename; mimeType; size }`  

Mismos límites MIME/tamaño que transacciones.  
**Errors**: `TAX_FILED_READONLY`, `ATTACHMENT_TOO_LARGE`, `ATTACHMENT_MIME`

### `attachments.remove` (existente)

Validar ownership también para `entityType: "taxItem"`.
