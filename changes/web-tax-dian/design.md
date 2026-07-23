# Design: Web Tax DIAN

**Change**: web-tax-dian  
**Spec**: `changes/web-tax-dian/spec.md`  
**Rama**: `feat/web-tax-dian`

---

## Enfoque Técnico

Change 6 materializa la **declaración de renta anual** como organizador documental sobre el dominio financiero ya entregado (cuentas, movimientos, créditos, adjuntos, export).

**Principio**: el usuario es dueño de cada rubro; la app sugiere y suma, no liquida impuesto ni habla con DIAN.

Backend: 2 tablas nuevas + extensión `attachments`.  
Frontend: `/tax` (listado años) → `/tax/:documentId` (secciones + resumen).

---

## Decisiones de Arquitectura

| # | Pregunta | Decisión | Tradeoff |
|---|----------|----------|----------|
| D-01 | ¿Motor fiscal? | **No** — solo sumas + campos manuales opcionales | Cumple YAGNI; contador sigue siendo externo |
| D-02 | Unicidad | **Un documento / usuario / año** enforce en `create` | Simple; sin versiones paralelas |
| D-03 | Secciones | **Enum fijo** de 5 secciones en schema/validators | Sin CRUD de secciones |
| D-04 | Categorías DIAN | **Catálogo TS** `taxCategories` (constantes) | Sin tabla; export estable |
| D-05 | Adjuntos | **Extender** `attachments` con `entityType: "taxItem"` | Reusa upload/MIME/límites |
| D-06 | Sugerencias | **Query/action efímera** + accept → `taxItems.create` | Sin tabla stale |
| D-07 | Trazabilidad fuente | `sourceType` + `sourceId` opcionales en item | Idempotencia de sugerencias |
| D-08 | Totales | **Derivados en read** (`taxTotals`) + opc. denormalizar en documento al mutar | Fuente de verdad = items |
| D-09 | Estados | `draft` \| `review` \| `filed`; filed = read-only hasta reopen | Claro en UI |
| D-10 | Export | Módulo `taxExport` CSV/PDF/JSON | Paridad con reportes |
| D-11 | Rutas | `/tax`, `/tax/:documentId` | Paralelo a créditos |
| D-12 | Nav label | **Renta** | Familiar en CO |
| D-13 | Timezone año | Año gravable = calendario en `America/Bogota` | Consistente con el resto |
| D-14 | Montos | COP enteros > 0 | Igual que finanzas |
| D-15 | Auth | `requireUserId` + ownership document→item→attachment | Igual que core |
| D-16 | Soft delete items | **Hard delete** de rubro + cascade adjuntos storage | KISS; declaración no es ledger bancario |
| D-17 | Snapshot sugerencia | Monto sugerido es **copia** al aceptar | No se actualiza solo si cambia la cuenta |
| D-18 | Metas ahorro | **No auto-map** a patrimonio en v1 | Evita doble conteo / ambigüedad |

---

## Flujos de datos

### Crear declaración

```
UI /tax → taxDocuments.create({ taxYear })
  → valida unicidad by_user_year
  → insert status=draft, totals=0
```

### CRUD rubro

```
UI sección → taxItems.create|update|remove
  → ownership vía document.userId
  → recalc totals (query-time o patch documento)
```

### Adjunto

```
generateUploadUrl → client upload → attachments.create({ entityType:"taxItem", entityId })
listByTaxItem / remove (borra storage si aplica)
```

### Sugerencias

```
taxSuggestions.generate({ documentId })
  → lee accounts, credits, transactions año
  → filtra ya aceptados (sourceType+sourceId)
  → retorna lista efímera
UI accept → taxItems.create(...source...)
```

### Export

```
taxDocuments.getExportPayload({ documentId })
  → client taxExport.toCsv | toPdf | toJson
```

### Filed / reopen

```
setStatus({ status:"filed" }) → filedAt=now; UI read-only
reopen({ }) → confirm → status=review; filedAt=undefined
```

---

## UI / IA (información)

| Pantalla | Contenido |
|----------|-----------|
| `/tax` | Lista de años + CTA crear; badge de estado |
| `/tax/:id` | Header año/estado; tabs o accordion por sección; panel resumen; acciones export / cambiar estado |
| Modal rubro | Categoría (select catálogo), descripción, monto, notas; zona adjuntos |
| Sheet sugerencias | Lista checkable; aceptar seleccionados / descartar |

Mobile-first: secciones en accordion o tabs scroll; export en menú de acciones.

---

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Usuario confunde totales con liquidación DIAN | Copy explícito: “Estimado manual / no es liquidación oficial” |
| Sugerencias incorrectas | Conservadoras; siempre editables; nunca auto-insert |
| Migración attachments | Solo ampliar union; queries existentes filtran `transaction` |
| Año en curso incompleto | Permitir draft temprano (spec edge case) |

---

## Dependencias

- Changes 1–5 en base (`testing`)
- Adjuntos y export existentes
- JP-DS Modal, Button, Input, Select, Spinner
