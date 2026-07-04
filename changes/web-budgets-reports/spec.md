# Feature Specification: Web Budgets & Reports (Presupuestos + Reportes + Panel de Resultados)

**Feature Branch**: `feat/web-budgets-reports`

**Created**: 2026-07-04

**Status**: Draft

**Change**: web-budgets-reports (Change 4)

**Input**: Roadmap `SPEC.md` §4.5 (Presupuestos y Alertas) y §4.6 (Panel de Resultados y Gráficos).

---

## Resumen

JP-WALLET permite hoy registrar transacciones y ver un dashboard del período actual, pero el usuario no puede fijar límites de gasto ni analizar sus finanzas con gráficos. Este change añade dos capacidades complementarias:

- **Presupuestos**: límites mensuales por categoría de gasto, con progreso visual y alertas al acercarse o superar el límite.
- **Reportes / Panel de Resultados**: gráficos de ingresos vs. gastos, desglose por categoría y tendencias, con filtros y exportación a CSV y PDF.

**Dentro:** presupuestos mensuales por categoría de gasto, progreso, alertas in-app por umbral (50/80/100 %), panel de reportes con 3 gráficos, filtros por período/categoría/cuenta, exportación CSV y PDF, navegación.

**Fuera:** presupuestos de ingreso, por cuenta o por rango arbitrario; roll-over; Web Push; exportación JSON; reportes programados/email; benchmarks entre usuarios.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Crear y monitorear un presupuesto por categoría (Priority: P1)

Como usuario, quiero fijar un límite mensual de gasto para una categoría (p. ej. "Comida") y ver cuánto he gastado contra ese límite, para controlar mis finanzas.

**Why this priority**: Es el corazón de la capacidad de presupuestos y aporta valor inmediato de forma autónoma, aun sin reportes ni alertas.

**Independent Test**: Crear un presupuesto para una categoría con transacciones existentes en el mes y verificar que la barra de progreso muestra gastado, restante y porcentaje correctos.

**Acceptance Scenarios**:

1. **Given** categoría de gasto "Comida" y transacciones del mes por $300.000, **When** creo un presupuesto de $500.000 para "Comida" del mes en curso, **Then** `/budgets` muestra "Comida" con gastado $300.000, restante $200.000 y 60 %.
2. **Given** un presupuesto existente para "Comida" este mes, **When** intento crear otro para "Comida" el mismo mes, **Then** el sistema lo impide e indica que ya existe.
3. **Given** un presupuesto creado, **When** edito su monto o lo elimino, **Then** el cambio se refleja inmediatamente en la lista y el progreso.

---

### User Story 2 - Analizar finanzas en el Panel de Resultados (Priority: P1)

Como usuario, quiero ver gráficos de mis ingresos vs. gastos, el desglose por categoría y la tendencia en el tiempo, para entender mis hábitos financieros.

**Why this priority**: Segunda mitad del valor del change; independiente de presupuestos, entrega análisis por sí solo.

**Independent Test**: Con transacciones del período, abrir `/reports` y verificar que los tres gráficos reflejan los totales reales y responden a los filtros.

**Acceptance Scenarios**:

1. **Given** transacciones del mes, **When** abro `/reports`, **Then** veo un gráfico de ingresos vs. gastos, uno de gastos por categoría y uno de tendencia, con datos reales.
2. **Given** el panel abierto, **When** cambio el filtro de período a "Trimestre", **Then** los tres gráficos se recalculan para el trimestre en curso en < 1 s.
3. **Given** el panel abierto, **When** filtro por una cuenta o categoría específica, **Then** los gráficos muestran solo los datos de ese filtro.

---

### User Story 3 - Recibir alertas al acercarse al límite (Priority: P2)

Como usuario con presupuestos activos, quiero recibir una alerta cuando un gasto me acerca o supera el límite, para reaccionar a tiempo.

**Why this priority**: Aumenta el valor de los presupuestos pero depende de la US1; degradable sin bloquear el MVP.

**Independent Test**: Con un presupuesto al 70 %, registrar un gasto que lo lleve sobre 80 % y verificar la alerta in-app; repetir con `notificationsEnabled` apagado y verificar que no aparece.

**Acceptance Scenarios**:

1. **Given** presupuesto "Comida" al 70 % y `notificationsEnabled` activo, **When** registro un gasto que lo lleva a 85 %, **Then** aparece una alerta in-app indicando que superé el 80 %.
2. **Given** el mismo presupuesto, **When** el gasto lo lleva a 100 %+, **Then** el estado visual pasa a `danger` y se muestra alerta de límite superado.
3. **Given** `notificationsEnabled` apagado, **When** cruzo un umbral, **Then** no se muestra alerta (el estado visual del presupuesto sí se actualiza).

---

### User Story 4 - Exportar el reporte a CSV y PDF (Priority: P2)

Como usuario, quiero exportar el panel de resultados a CSV y PDF, para guardar o compartir mi análisis.

**Why this priority**: Complementa los reportes; valioso pero no bloquea la visualización.

**Independent Test**: Con un reporte visible, exportar a CSV y verificar los datos agregados; exportar a PDF y verificar que incluye resumen y gráficos legibles.

**Acceptance Scenarios**:

1. **Given** un reporte con filtros aplicados, **When** exporto a CSV, **Then** obtengo un archivo con las filas agregadas (categoría/período, montos) coherentes con lo visible.
2. **Given** el mismo reporte, **When** exporto a PDF, **Then** obtengo un documento legible con el resumen y los gráficos del panel.
3. **Given** un período sin datos, **When** exporto, **Then** obtengo un archivo válido con encabezados y sin filas (o aviso de "sin datos"), sin error.

---

### User Story 5 - Navegar a Presupuestos y Reportes (Priority: P3)

Como usuario, quiero acceder fácilmente a Presupuestos y Reportes desde la navegación, en móvil y escritorio.

**Why this priority**: Habilita el descubrimiento; pequeño pero necesario para exponer las nuevas vistas.

**Independent Test**: Verificar que existen accesos a `/budgets` y `/reports` en `NavMobile` y `NavDesktop` y que navegan correctamente.

**Acceptance Scenarios**:

1. **Given** la app en móvil, **When** abro el menú "Más", **Then** veo accesos a Presupuestos y Reportes.
2. **Given** la app en escritorio, **When** miro la navegación lateral, **Then** veo Presupuestos y Reportes y puedo navegar a ellos.

---

### Edge Cases

- **Categoría archivada con presupuesto**: el presupuesto histórico permanece legible; no se pueden crear nuevos presupuestos para categorías archivadas.
- **Presupuesto sin transacciones**: progreso 0 %, estado `ok`, restante = límite.
- **Gasto que excede el límite**: porcentaje > 100 %; barra "llena" con estado `danger`; restante negativo mostrado como sobregiro.
- **Monto de presupuesto ≤ 0**: rechazado con validación.
- **Período sin datos en reportes**: gráficos muestran estado vacío claro (no error).
- **Muchas categorías en el desglose**: agrupar el excedente en "Otros" para legibilidad.
- **Transacción de transferencia**: excluida de gasto/ingreso en presupuestos y reportes.
- **Transacción editada de mes**: recalcular el progreso del mes origen y destino.
- **Cambio de zona horaria / borde de mes**: usar la misma convención de `periodRange` para consistencia con el dashboard.

## Requirements *(mandatory)*

### Functional Requirements

**Presupuestos**

- **FR-001**: El sistema MUST permitir crear un presupuesto con categoría de gasto, monto límite (COP > 0) y mes (`periodKey`).
- **FR-002**: El sistema MUST impedir más de un presupuesto para la misma categoría en el mismo mes.
- **FR-003**: El usuario MUST poder editar el monto y eliminar un presupuesto existente.
- **FR-004**: El sistema MUST calcular el gasto de una categoría/mes sumando las transacciones de tipo gasto dentro del rango del período, coherente con el dashboard.
- **FR-005**: El sistema MUST mostrar por presupuesto: gastado, restante y porcentaje, con estado de umbral `ok`/`info`/`warning`/`danger` (50/80/100 %).
- **FR-006**: El sistema MUST listar los presupuestos del período en `/budgets` con un resumen presupuestado vs. gastado.
- **FR-007**: El sistema MUST restringir la selección de categoría a categorías de gasto no archivadas al crear un presupuesto.

**Alertas**

- **FR-008**: El sistema MUST mostrar una alerta in-app cuando una transacción de gasto haga que un presupuesto cruce hacia arriba un umbral (80 % o 100 %), solo si `notificationsEnabled` está activo.
- **FR-009**: El sistema MUST actualizar el estado visual del presupuesto al cruzar umbrales independientemente de `notificationsEnabled`.
- **FR-010**: El sistema MUST NOT enviar notificaciones fuera de la app (sin Web Push) en este change.

**Reportes**

- **FR-011**: El sistema MUST mostrar en `/reports` un gráfico de ingresos vs. gastos, uno de gastos por categoría y uno de tendencia temporal, con datos reales del usuario.
- **FR-012**: El usuario MUST poder filtrar los reportes por período (semana/mes/trimestre/semestre), por categoría y por cuenta.
- **FR-013**: El sistema MUST recalcular los gráficos al cambiar cualquier filtro.
- **FR-014**: El sistema MUST excluir transferencias del cómputo de ingresos y gastos.
- **FR-015**: El sistema MUST agrupar categorías excedentes en "Otros" cuando el desglose sea muy largo, para mantener legibilidad.

**Exportación**

- **FR-016**: El usuario MUST poder exportar el reporte activo a CSV con los datos agregados visibles.
- **FR-017**: El usuario MUST poder exportar el reporte activo a PDF con resumen y gráficos legibles.
- **FR-018**: El sistema MUST manejar la exportación de un reporte sin datos sin producir errores.

**Transversal**

- **FR-019**: El sistema MUST exponer accesos a Presupuestos y Reportes en la navegación móvil y de escritorio.
- **FR-020**: El sistema MUST usar tokens de color JP-DS en todos los gráficos y barras (sin hex hardcodeados) y respetar tema claro/oscuro.
- **FR-021**: El sistema MUST proveer una alternativa textual/accesible a los gráficos y respetar `prefers-reduced-motion`.
- **FR-022**: El sistema MUST ser mobile-first (usable desde 375 px) sin regresiones entre 320 y 1440 px.
- **FR-023**: El sistema MUST restringir todas las operaciones a los datos del usuario autenticado.

### Key Entities *(include if feature involves data)*

- **Budget (Presupuesto)**: límite de gasto de un usuario para una categoría en un mes. Atributos: usuario, categoría (gasto), monto límite, período (mes), notas opcionales, timestamps. Único por usuario+categoría+mes. Relación: pertenece a un usuario y referencia una categoría.
- **Budget Progress (derivado)**: cálculo no persistido de gastado, restante, porcentaje y estado de umbral, obtenido de `transactions` del período.
- **Report Dataset (derivado)**: agregaciones de solo lectura sobre `transactions`/`categories`/`accounts` (ingresos vs. gastos, por categoría, serie temporal); no es una tabla.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El usuario crea un presupuesto y ve su progreso correcto en menos de 30 segundos, sin ayuda.
- **SC-002**: El progreso mostrado (gastado/restante/%) coincide exactamente con la suma de transacciones del período en el 100 % de los casos.
- **SC-003**: Nunca existen dos presupuestos para la misma categoría y mes (0 duplicados).
- **SC-004**: Al cruzar un umbral con notificaciones activas, la alerta aparece en menos de 1 segundo tras guardar la transacción.
- **SC-005**: Los tres gráficos del panel se cargan con datos reales en menos de 2 segundos para un historial típico.
- **SC-006**: Cambiar un filtro actualiza los gráficos en menos de 1 segundo.
- **SC-007**: El CSV exportado reimporta/abre correctamente y sus totales coinciden con el panel.
- **SC-008**: El PDF exportado es legible e incluye resumen y los gráficos del panel.
- **SC-009**: Todas las vistas son operables desde 375 px sin scroll horizontal ni solapamientos, verificadas en 320–1440 px.
- **SC-010**: Los gráficos cumplen contraste AA y ofrecen alternativa textual.

## Assumptions

- El período base de un presupuesto es **mensual**; el usuario opera sobre el mes en curso por defecto (con posibilidad de navegar meses en iteración de diseño).
- Se reutiliza `lib/period/` y la convención de rangos del dashboard para toda agregación temporal.
- Las alertas son **in-app** (toast/badge); `notificationsEnabled` (ya persistido en `web-settings`) las gobierna.
- La exportación PDF es un **snapshot del panel** generado en cliente; CSV siempre disponible como respaldo.
- La elección de librería de gráficos y de generación PDF se decide en `design.md`, priorizando peso, accesibilidad y theming por CSS vars.
- El backend es Convex; las agregaciones se sirven vía queries de solo lectura reutilizando índices existentes (`by_user_date`, `by_user_category`).
- Solo categorías de tipo **gasto** admiten presupuesto; las transferencias se excluyen de todos los cálculos.
