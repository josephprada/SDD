# Feature Specification: Web Tax DIAN (Declaración de Renta)

**Feature Branch**: `feat/web-tax-dian`

**Created**: 2026-07-22

**Status**: Draft

**Change**: web-tax-dian (Change 6)

**Input**: User description: "Declaración de Renta (DIAN Colombia): perfiles anuales por año gravable; secciones Patrimonio, Deudas, Ingresos, Deducciones y Rentas exentas; adjuntos (imágenes/PDF) por rubro; auto-poblar desde transacciones, cuentas, créditos y metas; exportación para revisión o presentación."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Crear y gestionar declaración anual (Priority: P1)

Como usuario colombiano, quiero crear una declaración de renta por año gravable y organizar rubros en las secciones DIAN, para reunir en un solo lugar lo que necesito revisar antes de declarar.

**Why this priority**: Sin un documento anual usable no hay producto. Es el MVP mínimo: crear año, listar secciones, CRUD de rubros y totales por sección.

**Independent Test**: Crear declaración 2025, añadir rubros manuales en Ingresos y Deducciones, ver totales por sección y total del documento.

**Acceptance Scenarios**:

1. **Given** un usuario autenticado sin declaración para 2025, **When** crea una declaración para el año gravable 2025, **Then** el sistema crea un documento en estado `draft` con las cinco secciones DIAN vacías (Patrimonio, Deudas, Ingresos, Deducciones, Rentas exentas).
2. **Given** una declaración en `draft`, **When** el usuario añade un rubro (categoría, descripción, monto) en una sección, **Then** el rubro aparece en esa sección y los totales de sección y documento se actualizan.
3. **Given** un rubro existente, **When** el usuario lo edita o elimina, **Then** los cambios se reflejan de inmediato y los totales se recalculan.
4. **Given** el usuario tiene declaraciones de varios años, **When** abre el listado de declaraciones, **Then** ve cada año con su estado (`draft` / `review` / `filed`) y puede abrir cualquiera.
5. **Given** viewports 375 px y 1280 px, **When** navega la declaración, **Then** el flujo es usable (targets táctiles adecuados, sin overflow horizontal).

---

### User Story 2 - Adjuntos por rubro (Priority: P1)

Como usuario, quiero adjuntar certificaciones, facturas y extractos (imagen o PDF) a cada rubro, para conservar la evidencia que respalda cada partida.

**Why this priority**: La declaración sin soporte documental pierde valor práctico; el SPEC exige adjuntos por rubro desde el inicio.

**Independent Test**: En un rubro, subir un PDF y una imagen, verlos listados, abrir vista previa y eliminar uno.

**Acceptance Scenarios**:

1. **Given** un rubro de declaración, **When** el usuario sube un JPEG, PNG o PDF dentro del límite de tamaño permitido, **Then** el archivo queda asociado al rubro y visible en su detalle.
2. **Given** un adjunto existente, **When** el usuario lo abre, **Then** puede ver o descargar el archivo.
3. **Given** un adjunto existente, **When** el usuario lo elimina, **Then** deja de aparecer en el rubro y ya no cuenta en el almacenamiento del documento.
4. **Given** un archivo de tipo no permitido o que excede el tamaño máximo, **When** intenta subirlo, **Then** el sistema lo rechaza con un mensaje claro.

---

### User Story 3 - Auto-poblar desde finanzas existentes (Priority: P2)

Como usuario, quiero que la app sugiera rubros a partir de mis cuentas, créditos, movimientos y metas del año gravable, para no empezar la declaración desde cero.

**Why this priority**: Diferenciador clave del change (consolida Changes 1–5), pero el usuario puede declarar solo con carga manual (P1).

**Independent Test**: Con cuentas, créditos activos y movimientos de ingreso en 2025, ejecutar “Sugerir desde mis datos”, aceptar algunas sugerencias y verlas convertidas en rubros editables.

**Acceptance Scenarios**:

1. **Given** una declaración `draft` del año Y y cuentas activas con saldo, **When** el usuario solicita sugerencias, **Then** el sistema propone rubros de Patrimonio derivados de esas cuentas (sin duplicar los ya aceptados).
2. **Given** créditos/préstamos con saldo pendiente en el año Y, **When** solicita sugerencias, **Then** propone rubros de Deudas a partir de esos créditos.
3. **Given** movimientos de ingreso (y, cuando aplique, gastos deducibles reconocibles) datados en el año Y, **When** solicita sugerencias, **Then** propone rubros en Ingresos y/o Deducciones con monto y descripción sugeridos.
4. **Given** una lista de sugerencias, **When** el usuario acepta, edita o descarta cada una, **Then** solo las aceptadas se convierten en rubros del documento; las descartadas no se vuelven a sugerir en la misma pasada salvo que el usuario regenere.
5. **Given** sugerencias generadas, **When** el usuario no acepta ninguna, **Then** la declaración permanece sin cambios y puede seguir cargando rubros a mano.

---

### User Story 4 - Revisar, cerrar y exportar (Priority: P2)

Como usuario, quiero marcar la declaración como en revisión o presentada y exportarla (PDF, CSV o JSON), para compartirla con un contador o usarla como respaldo de mi declaración oficial.

**Why this priority**: Cierra el ciclo de valor; depende de tener rubros (P1) pero no del auto-poblado.

**Independent Test**: Completar totales, pasar a `review`, exportar CSV y PDF, luego marcar como `filed`.

**Acceptance Scenarios**:

1. **Given** una declaración `draft` con al menos un rubro, **When** el usuario la marca como `review`, **Then** el estado cambia y sigue siendo editable.
2. **Given** una declaración en `review` o `draft`, **When** exporta a CSV, PDF o JSON, **Then** el archivo incluye año, estado, secciones, rubros (categoría, descripción, monto) y totales.
3. **Given** una declaración que el usuario considera presentada ante DIAN, **When** la marca como `filed`, **Then** el estado pasa a `filed`, se registra la fecha de cierre y la edición queda restringida (solo lectura o desbloqueo explícito con confirmación).
4. **Given** una exportación, **When** el usuario la abre fuera de la app, **Then** los montos están en COP y son legibles para un humano o un contador (no se exige formato XML oficial DIAN en v1).

---

### User Story 5 - Resumen y totales de la declaración (Priority: P3)

Como usuario, quiero ver un resumen claro (ingresos, deducciones, patrimonio, deudas, exentas y derivados simples), para saber si mi declaración está completa antes de exportar.

**Why this priority**: Mejora la confianza; los totales parciales ya existen en P1, este story afina el panel de resumen.

**Independent Test**: Con rubros en varias secciones, abrir el resumen y verificar que las sumas coinciden con los rubros visibles.

**Acceptance Scenarios**:

1. **Given** rubros en múltiples secciones, **When** el usuario abre el resumen del documento, **Then** ve totales por sección y totales agregados (ingresos, deducciones, patrimonio, deudas, rentas exentas).
2. **Given** el usuario ingresa opcionalmente una “renta gravable estimada” o “impuesto estimado” de forma manual, **When** guarda esos campos, **Then** aparecen en el resumen y en las exportaciones (la app no calcula tarifas UVT/DIAN en v1).

---

### Edge Cases

- ¿Qué ocurre si el usuario intenta crear una segunda declaración para el mismo año gravable? → Se rechaza; un documento por usuario y año.
- ¿Qué ocurre si no hay datos financieros para auto-poblar? → Se muestra estado vacío con CTA a cargar rubros manualmente.
- ¿Qué ocurre con montos en cero o negativos al crear/editar un rubro? → Se rechazan; el monto debe ser > 0.
- ¿Qué ocurre al eliminar un rubro con adjuntos? → Se eliminan (o desvinculan de forma segura) los adjuntos asociados junto con el rubro.
- ¿Qué ocurre si el año gravable es futuro (p. ej. año actual aún no cerrado)? → Se permite crear el documento en `draft` para ir preparándolo; no se bloquea por calendario.
- ¿Qué ocurre si un crédito o cuenta usados en sugerencias se elimina después? → Los rubros ya aceptados permanecen; son datos propios de la declaración (copia, no vínculo vivo obligatorio).
- ¿Cómo se maneja una declaración `filed` si el usuario cometió un error? → Puede “reabrir” con confirmación explícita, volviendo a `review` o `draft`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir crear una declaración de renta por año gravable (entero, p. ej. 2025), con unicidad por usuario y año.
- **FR-002**: El sistema MUST organizar cada declaración en exactamente estas secciones: Patrimonio, Deudas, Ingresos, Deducciones, Rentas exentas.
- **FR-003**: El usuario MUST poder crear, editar y eliminar rubros dentro de una sección, con al menos: categoría (del catálogo de la sección), descripción, monto en COP y notas opcionales.
- **FR-004**: El sistema MUST mantener catálogos de categorías por sección alineados al dominio DIAN del SPEC (ej. Ingresos: salarios, cesantías, intereses, dividendos, honorarios, otros; Deducciones: salud, educación, vivienda, dependientes, intereses de vivienda; Patrimonio: inmuebles, vehículos, inversiones, cuentas; Deudas: créditos/préstamos y otras; Exentas: según catálogo v1).
- **FR-005**: El sistema MUST calcular y mostrar totales por sección y totales del documento como suma de los montos de rubros (sin aplicar tarifas fiscales oficiales).
- **FR-006**: El usuario MUST poder adjuntar imágenes (JPEG/PNG) y PDF a cada rubro, listarlos, visualizarlos/descargarlos y eliminarlos, reutilizando las reglas de tamaño/tipo ya usadas en adjuntos de movimientos (o equivalentes documentadas en Assumptions).
- **FR-007**: El sistema MUST ofrecer una acción de “sugerir desde mis datos” que proponga rubros a partir de cuentas, créditos/préstamos, movimientos del año gravable y, cuando aporte valor, metas/ahorros relevantes; el usuario acepta, edita o descarta cada sugerencia.
- **FR-008**: Las sugerencias MUST ser idempotentes respecto a rubros ya aceptados (no duplicar la misma fuente ya incorporada en esa declaración).
- **FR-009**: El usuario MUST poder cambiar el estado de la declaración entre `draft`, `review` y `filed`, con confirmación al marcar como presentada y al reabrir una presentada.
- **FR-010**: El sistema MUST permitir exportar la declaración a PDF, CSV y JSON con año, estado, secciones, rubros y totales.
- **FR-011**: El sistema MUST restringir el acceso a declaraciones al propietario autenticado (mismo modelo de privacidad que el resto de finanzas personales).
- **FR-012**: El sistema MUST permitir campos opcionales de resumen manual: renta gravable estimada e impuesto estimado, sin calcular UVT ni tarifas DIAN en v1.
- **FR-013**: La navegación MUST integrar la declaración de renta en el shell existente (entrada clara desde la app), usable en mobile-first y desktop.
- **FR-014**: El sistema MUST conservar la declaración y sus rubros de forma independiente una vez aceptados (no borrar rubros automáticamente si cambia el saldo de una cuenta o crédito fuente).

### Key Entities *(include if feature involves data)*

- **TaxDocument (Declaración)**: Documento anual del usuario; año gravable, estado (`draft` | `review` | `filed`), totales derivados por sección, campos opcionales de renta/impuesto estimado, fechas de creación y de presentación.
- **TaxItem (Rubro)**: Partida dentro de una sección; categoría, descripción, monto, notas; pertenece a un TaxDocument; puede originarse de sugerencia (con referencia opcional a la fuente) o de carga manual.
- **TaxAttachment (Adjunto de rubro)**: Archivo (imagen/PDF) asociado a un TaxItem; nombre, tipo, tamaño, fecha de carga.
- **TaxSuggestion (Sugerencia)**: Propuesta transitoria de rubro generada desde datos financieros existentes; no es persistencia definitiva hasta que el usuario la acepta (puede materializarse solo en sesión o como borrador descartable).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario puede crear una declaración anual y añadir al menos 5 rubros en distintas secciones en menos de 10 minutos sin ayuda externa.
- **SC-002**: Un usuario puede adjuntar un soporte (PDF o imagen) a un rubro y verificarlo en menos de 1 minuto.
- **SC-003**: Con datos previos en la app (cuentas + al menos un crédito + movimientos del año), “sugerir desde mis datos” produce al menos una sugerencia útil en Patrimonio o Deudas en la primera ejecución.
- **SC-004**: El 100 % de los totales mostrados en resumen coinciden con la suma manual de los rubros visibles de cada sección en pruebas de aceptación.
- **SC-005**: El usuario puede exportar CSV y PDF de una declaración con ≥10 rubros y abrirlos correctamente en un visor estándar.
- **SC-006**: En viewport 375 px, el flujo principal (listar → abrir año → ver sección → añadir rubro) se completa sin scroll horizontal ni controles inaccesibles.
- **SC-007**: Tras marcar una declaración como `filed`, un usuario no puede editarla sin pasar por la confirmación de reapertura.

## Assumptions

- El producto v1 es un **organizador y consolidator** de información para la declaración de renta, no un contador automático ni un presentador oficial ante DIAN (sin liquidación UVT, sin formulario 210/XML DIAN, sin envío a la DIAN).
- La moneda es **COP**; formatos de visualización siguen la convención del producto (`$ 1.234.567`).
- Secciones DIAN v1 = las cinco del SPEC §4.9; no se modelan anexos avanzados ni cédulas complejas más allá del catálogo de categorías v1.
- Auto-poblado es **asistido**: sugiere; el usuario es responsable de aceptar y corregir. El mapeo exacto categoría-financiera → categoría DIAN se define en el plan técnico con defaults sensatos.
- Adjuntos: mismos tipos que movimientos (JPEG, PNG, PDF) y límite de tamaño alineado al existente en la app (~2–5 MB según regla vigente de adjuntos); se documentará en design.
- Un solo TaxDocument por usuario y año gravable.
- Auth, shell, JP-DS, cuentas, transacciones, créditos y metas ya existen (Changes 1–5); este change los consume, no los reimplementa.
- Export JSON/CSV/PDF es para humanos/contadores, no para carga directa en Muisca/DIAN.
- Idioma de UI: español (Colombia); no se exige i18n EN en este change.
- Notificaciones push de plazos DIAN quedan fuera de v1 (el usuario gestiona fechas de vencimiento oficial por su cuenta).

## Out of Scope (v1)

- Cálculo automático de impuesto con UVT, tablas marginales o beneficios tributarios oficiales.
- Presentación electrónica o integración API con DIAN / Muisca.
- Multi-usuario / contador colaborando en la misma declaración.
- Declaración de IVA, retención en la fuente como módulo aparte, o renta de personas jurídicas.
- OCR automático de PDFs de certificados para extraer montos.
- Firma electrónica o sellos de tiempo legales.
