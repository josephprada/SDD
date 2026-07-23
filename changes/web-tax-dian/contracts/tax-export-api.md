# API Contract: Tax Export

**Change**: web-tax-dian  
**Modules**: `convex/taxDocuments.ts` (payload) · `apps/web/src/lib/export/taxExport.ts` (client)

---

## Query

### `taxDocuments.getExportPayload`

**Auth**: required  
**Args**: `{ documentId: Id<"taxDocuments"> }`  

**Returns**:

```ts
{
  taxYear: number;
  status: TaxStatus;
  filedAt?: number;
  estimatedTaxableIncome?: number;
  estimatedTaxDue?: number;
  notes?: string;
  totals: SectionTotals;
  sections: Array<{
    section: TaxSection;
    sectionLabel: string;
    items: Array<{
      category: string;
      categoryLabel: string;
      description: string;
      amount: number;
      notes?: string;
      attachmentCount: number;
    }>;
    total: number;
  }>;
  exportedAt: number;
  disclaimer: string; // "Documento de apoyo; no constituye liquidación oficial DIAN."
}
```

---

## Client export

| Formato | Función | Notas |
|---------|---------|-------|
| JSON | `downloadTaxJson(payload)` | Pretty-print UTF-8 |
| CSV | `downloadTaxCsv(payload)` | Filas por rubro + bloque resumen; COP sin decimales |
| PDF | `downloadTaxPdf(payload)` | Portada año/estado, por sección, totales, disclaimer |

Nombres de archivo: `renta-{taxYear}-{YYYYMMDD}.{ext}`

**Auth**: el archivo se genera en cliente a partir del payload autenticado; no hay URL pública sin sesión.
