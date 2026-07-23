# Research: Web Tax DIAN

## Decision: Organizador, no motor fiscal

**Rationale**: Calcular UVT, tarifas marginales y beneficios DIAN es un producto contable completo, fuera del alcance de JP-WALLET v1 y del SPEC acordado (export para revisión/presentación humana). Totales = suma de rubros; renta gravable e impuesto estimado son **campos manuales opcionales**.

**Alternatives considered**:
- Motor UVT embebido: alto riesgo legal/mantenimiento; fuera de scope.
- Solo checklist sin montos: no cumple FR de totales ni export útil.

## Decision: Un TaxDocument por usuario y año

**Rationale**: FR-001 y edge case de unicidad. Índice `by_user_year` único lógicamente (enforce en mutation `create`).

**Alternatives considered**:
- Varias versiones por año (borrador A/B): complejidad sin demanda v1.
- Documento continuo multi-año: contradice perfiles anuales del SPEC §4.9.

## Decision: Cinco secciones fijas + catálogo de categorías

**Rationale**: SPEC §4.9 fija Patrimonio, Deudas, Ingresos, Deducciones, Rentas exentas. Categorías v1 como constantes TS (`taxCategories.ts`) — no tabla editable — para KISS y consistencia en export.

**Alternatives considered**:
- Categorías CRUD por usuario: sobreingeniería; diluye semántica DIAN.
- Códigos oficiales formulario 210: acopla a versión DIAN; diferido.

## Decision: Extender `attachments` para `taxItem`

**Rationale**: Ya existe upload URL, validación MIME (JPEG/PNG/PDF), límites y storage. Ampliar `entityType` a `"transaction" | "taxItem"` y tipar `entityId` de forma compatible (string Id o unión) evita duplicar el pipeline.

**Migración**: filas actuales `entityType: "transaction"` intactas; nuevas filas `taxItem`. Ownership: el adjunto pertenece al dueño del `taxItem` → `taxDocument`.

**Alternatives considered**:
- Tabla `taxAttachments`: duplica código y límites.
- Guardar solo `storageId` en el item: pierde metadatos filename/mime/size y listado uniforme.

## Decision: Sugerencias efímeras (no tabla persistente)

**Rationale**: `taxSuggestions.generate` (query o action ligera) calcula propuestas en caliente desde cuentas, créditos y transacciones del año. El usuario acepta → `taxItems.create` con `sourceType`/`sourceId` opcionales para idempotencia. Descartar no requiere DELETE.

**Alternatives considered**:
- Persistir sugerencias: estado stale + cleanup; poco valor.
- Auto-insertar sin confirmación: viola “asistido” del SPEC.

## Decision: Mapeo de auto-poblado v1 (heurístico conservador)

| Fuente | Sección | Categoría sugerida | Monto |
|--------|---------|-------------------|-------|
| Cuentas activas (no `type: credit`) | Patrimonio | `cuentas_bancarias` (o equivalente catálogo) | Saldo actual (snapshot al sugerir) |
| Créditos `status: active` | Deudas | `creditos_prestamos` | `outstandingBalance` |
| Tx `income` con `date` en año gravable | Ingresos | Map por nombre de categoría app → DIAN; fallback `otros` | Suma por categoría en el año |
| Tx `expense` en categorías con keywords deducción (salud, educación, vivienda, interés) | Deducciones | Categoría DIAN matched | Suma por categoría en el año |
| Cuotas/intereses de crédito `housing_improvement` pagadas en el año | Deducciones | `intereses_vivienda` (si detectable) | Suma intereses pagados en el año |
| Metas de ahorro | — | **Fuera v1** (no mapear a patrimonio por defecto) | — |

**Idempotencia**: no sugerir de nuevo si ya existe `taxItem` con mismo `sourceType` + `sourceId` en el documento.

**Alternatives considered**:
- Solo cuentas y créditos: pierde valor de ingresos/deducciones del ledger.
- OCR de certificados: fuera de scope.

## Decision: Estados y reapertura

**Rationale**: `draft` → `review` (editable) → `filed` (solo lectura + `filedAt`). Reabrir con confirmación → `review`. Alineado a FR-009.

**Alternatives considered**:
- Soft-lock sin estado: confuso en listado.
- `filed` inmutable absoluto: frustra correcciones reales.

## Decision: Export reutilizando stack de reportes

**Rationale**: Ya existen `csvExport` / `pdfExport` para reportes. Añadir `taxExport.ts` con el mismo estilo COP y tipografías; JSON = dump estructurado del documento + items.

**Alternatives considered**:
- XML Muisca / formulario 210: fuera de scope (Out of Scope spec).
- Solo CSV: SPEC exige PDF y JSON también.

## Decision: Navegación `/tax`

**Rationale**: Dominio nuevo paralelo a `/credits` y `/savings`. Entrada en nav desktop + “Más” mobile con label **Renta** (claro para usuario CO).

**Alternatives considered**:
- Subruta de `/reports`: mezcla analítica con obligación anual.
- Solo desde Settings: oculta una capability P1.

## Fases deployables

| Fase | Entrega | Deployable |
|------|---------|------------|
| A | Schema + CRUD documentos/rubros + totales | Sí (API + UI mínima) |
| B | Adjuntos por rubro | Sí |
| C | Catálogos UI + detalle por secciones | Sí |
| D | Sugerencias + aceptar/descartar | Sí |
| E | Estados filed/reopen + export | Sí |
| F | Nav, polish mobile, quickstart QA | Sí |
