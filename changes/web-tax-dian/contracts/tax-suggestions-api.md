# API Contract: Tax Suggestions (Convex)

**Change**: web-tax-dian  
**Module**: `convex/taxSuggestions.ts` (+ `convex/lib/taxSuggest.ts`)

---

## Types

```typescript
type TaxSuggestion = {
  key: string; // estable en la pasada: `${sourceType}:${sourceId}`
  section: TaxSection;
  category: string;
  description: string;
  amount: number;
  sourceType: TaxSourceType;
  sourceId: string;
  rationale: string; // texto corto para UI, ej. "Saldo cuenta Ahorros"
};
```

---

## Query

### `taxSuggestions.generate`

**Auth**: required  

**Args**: `{ documentId: Id<"taxDocuments"> }`  

**Returns**:

```ts
{
  suggestions: TaxSuggestion[];
  skippedAlreadyAccepted: number;
  generatedAt: number;
}
```

**Comportamiento**:
1. Carga documento (ownership).
2. Carga items existentes con `sourceType`/`sourceId` → set de exclusiones.
3. Escanea cuentas, créditos activos, transacciones del `taxYear` (rango Bogotá).
4. Aplica reglas de `research.md` (mapeo conservador).
5. No persiste nada.

**Errors**: documento inexistente → `null` o `{ suggestions: [] }` soft (preferir soft para no tumbar UI).

---

## Mutation de aceptación (reutiliza taxItems)

No hay `acceptSuggestion` dedicado v1: el cliente llama `taxItems.create` con los campos de la sugerencia (`sourceType`, `sourceId`, etc.).

Batch opcional v1.1: `taxItems.createMany` — **fuera de v1** salvo que tasks lo justifiquen por UX.
