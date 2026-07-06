# Feature Specification: Web Credits & Savings

**Feature Branch**: `feat/web-credits`

**Created**: 2026-07-05

**Status**: In progress (v1.5 — iteración UX post-planificación)

**Change**: web-credits (Change 5)

**Input**: Créditos colombianos versátiles, abonos a capital extraordinarios, metas de ahorro. Caso real: Banco Agrario VIS $40M a 10 años; ahorro **$500.000/mes** → abono anual **$6.000.000** → meta pagar en ~5 años.

---

## Iteración implementada (2026-07-05)

Ajustes acordados en sesión que **refinan** el plan v1.4 sin cambiar el alcance del change:

| Área | Plan original | Implementado |
|------|---------------|--------------|
| Gasto desde fondo | Wizard meta→ahorros→gasto→devolución (`spendFromFund`) | **Un solo gasto** desde modal Movimientos (`creditFundSpend`); cuenta default = desembolso; visible en Fondo y `/transactions` con filtro |
| Pestaña Fondo | Formulario / wizard en detalle | **Solo listado** de gastos; nuevo gasto vía botón Movimientos; clic en gasto → editar transacción |
| Categorías fondo | No especificado | Picker multi-categoría en crear/ajustes; `linkedCreditPurpose`; al eliminar crédito: categorías **nuevas** se borran, **enlazadas** se desvinculan |
| Pago cuota | Marcar pagada en tabla | También desde **modal Movimientos** (`creditPaymentContext`) con cuenta de pago del crédito |
| Rubros | Lista + gráfico asignado | + **`spentTotal`** por rubro, barra de progreso, edición por clic |
| Ajustes crédito | Hints en párrafo | **`FieldHelp`** (icono help) como en modal crear crédito; toast al guardar |
| Dashboard créditos | `CreditFundCard` P2 | Card `glass` contenedora + cards internas; total alineado a la derecha con Disponible, en gris |
| Edición rubros | Botón editar | **Clic en tarjeta** para editar (sin botón lápiz) |

---

## Resumen

| Pilar | Descripción |
|-------|-------------|
| **Créditos flexibles** | Cuota fija, capital constante o tabla manual (extracto bancario) |
| **Abonos a capital** | Pagos extra que recalculan el futuro (acortar plazo o bajar cuota) |
| **Simulación** | Proyectar abonos anuales hacia fecha meta de pago |
| **Fondo aislado** | Cuenta meta vinculada; no mezcla nómina ni dashboard personal |
| **Destinos / rubros** | En qué se invierte el capital desembolsado ($40M → escaleras $1,5M) |
| **Cuotas y alertas** | Seguimiento, seguros opcionales, recordatorios |
| **Metas de ahorro** | Objetivos, aportes, progreso |

**Dentro:** modos de amortización, abonos, simulador, rubros, **cuenta escrow + asistente de gasto**, crédito manual VIS, metas, `/credits`, `/savings`.

**Fuera:** UVR indexada, revolving, sync bancario, refinanciación como nueva operación, DIAN.

---

## Conceptos clave

### Cuota vs. abono vs. destino del desembolso

- **Cuota ordinaria**: lo que **pagas al banco** cada mes (devolución de deuda + intereses).
- **Abono a capital**: pago **extra** al banco; efecto `shorten_term` (acortar plazo) o `lower_installment` (bajar cuota).
- **Destino / rubro**: en qué **gastaste o planeas gastar** el dinero que te prestaron — no es un pago al banco, es trazabilidad del uso del desembolso de $40M.

Ejemplo: de $40.000.000 desembolsados, $1.500.000 fueron a **construcción de escaleras**; quedan $38.500.000 por asignar o ejecutar en otros rubros.

### Modos de tabla (`scheduleMode`)

| Modo | Comportamiento | Ejemplo |
|------|----------------|---------|
| `cuota_fija` | VR cuota (capital+interés) constante; interés sobre saldo | Libre inversión |
| `capital_constant` | Abono a capital mensual fijo; VR cuota decrece | Algunos créditos vivienda |
| `manual` | Filas según extracto bancario; editable | Banco Agrario VIS (cuota total variable por seguros/tabla) |

### Caso real — extracto Banco Agrario (referencia QA)

Crédito **Remodelación Vivienda VIS**, $40.000.000, cuota 1 (17/07/2026):

- Capital: $163.938 · Interés: $433.237 · Seguros: ~$6.407 · **Total: $625.958**
- Saldo posterior: $39.836.062
- Plazo contratado: **120 meses (10 años)** · Meta usuario: **~60 meses (5 años)**
- Plan de pago anticipado: ahorro **$500.000/mes** → abono anual **$6.000.000** a capital (`shorten_term`)

La cuota total **no es idéntica** cada mes → modo `manual` o `capital_constant` + seguros opcionales.

### Plan ahorro → abono (caso usuario)

| Mes | Acción |
|-----|--------|
| Cada mes | Aporte $500.000 a meta «Abono crédito VIS» (o registro manual) |
| Cada 12 meses | Abono a capital $6.000.000 sobre el crédito; recálculo de plazo |
| Objetivo | Fecha de pago libre ~5 años en lugar de 10 |

### Rubros de inversión (caso usuario)

| Rubro | Monto | Notas |
|-------|-------|-------|
| Construcción escaleras | $1.500.000 | Primer destino registrado |
| Sin asignar | $38.500.000 | Resto del desembolso $40M |

### Fondo aislado — espejo BBVA (caso usuario)

| Cuenta | Rol en app |
|--------|------------|
| BBVA Ahorros / Nómina | `operatingAccountId` — operación diaria; **sí** en balance personal |
| BBVA Meta Crédito VIS | `disbursementAccountId` — escrow $40M; **no** en balance personal por defecto |

Flujo al gastar de obra: Meta → Ahorros → Gasto (rubro) → (opcional) Ahorros → Meta.  
Meta de ahorro $500k/mes para abono anual: sale de **nómina**, no del escrow de $40M.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar crédito según su tipo (Priority: P1)

Como usuario, quiero registrar mi crédito como lo muestra mi banco (VIS, libre inversión, etc.), no forzado a una sola fórmula.

**Independent Test A**: Modo `cuota_fija`, $20M, 18% NAMV, 36 meses → cuota constante generada.

**Independent Test B**: Modo `manual`, cargar filas del extracto Banco Agrario → primera cuota total $625.958, saldo $40M.

**Acceptance Scenarios**:

1. **Given** modo `cuota_fija`, **When** ingreso monto + tasa + plazo, **Then** tabla con cuota fija y desglose capital/interés.
2. **Given** modo `manual`, **When** ingreso filas del extracto (o importo CSV), **Then** tabla refleja valores del banco sin recalcular filas pasadas.
3. **Given** modo `capital_constant`, **When** genero tabla, **Then** capital mensual es uniforme y VR cuota decrece mes a mes.
4. **Given** `insuranceMonthly` o seguro por fila, **When** veo detalle, **Then** VR cuota = capital + interés + seguros (+ otros).
5. **Given** crédito VIS $40M / 120 meses, **When** guardo `targetPayoffDate` a ~5 años, **Then** la UI muestra la meta de pago anticipado.

---

### User Story 2 - Abono a capital extraordinario (Priority: P1)

Como usuario con préstamo a 10 años, quiero ahorrar $500.000 cada mes y cada año abonar $6.000.000 a capital para pagar en ~5 años.

**Independent Test**: Crédito $40M / 120 meses; simular abono $6.000.000/año × 5 años con `shorten_term` → `paid_off` proyectado ≤ 72 meses desde inicio.

**Acceptance Scenarios**:

1. **Given** crédito activo saldo $38M, **When** registro abono $6.000.000 con efecto `shorten_term`, **Then** saldo baja $6M y cuotas futuras recalculadas.
2. **Given** meta «Abono crédito» $500.000/mes, **When** tras 12 aportes ($6M acumulados), **Then** UI sugiere o facilita registrar abono anual al crédito vinculado.
3. **Given** cuotas ya pagadas, **When** aplico abono, **Then** filas `paid` no cambian.
4. **Given** abono con `lower_installment`, **When** recalcula, **Then** mismo número de cuotas restantes pero VR cuota menor.
5. **Given** pestaña Abonos, **When** abro historial, **Then** veo abonos anuales de $6M con fecha y efecto.

---

### User Story 3 - Destinos del desembolso / rubros (Priority: P1)

Como usuario, quiero registrar en qué se va cada peso del crédito desembolsado, para llevar control real de la inversión (no solo cuánto debo al banco).

**Independent Test**: Crédito $40M; rubro «Escaleras» $1,5M → asignado $1,5M, sin asignar $38,5M, 3,75% del capital en gráfico.

**Acceptance Scenarios**:

1. **Given** crédito $40M sin rubros, **When** creo destino «Construcción escaleras» $1.500.000, **Then** resumen muestra asignado $1,5M y sin asignar $38,5M.
2. **Given** rubro existente, **When** registro gasto vinculado (transacción), **Then** el rubro refleja **`spentTotal`** acumulado y barra de progreso vs. monto planificado.
3. **Given** suma de rubros > principal, **When** intento guardar, **Then** advertencia o rechazo según regla (warn en v1, no bloquear si usuario confirma overflow menor).
4. **Given** pestaña Destinos, **When** abro detalle del crédito, **Then** veo lista, montos, estados y gráfico de distribución.
5. **Given** rubro con factura, **When** adjunto imagen/PDF, **Then** queda asociado al destino (reutilizar attachments).

---

### User Story 4 - Fondo aislado y gasto desde el crédito (Priority: P1)

Como usuario, quiero que los $40M desembolsados vivan en una cuenta meta aparte y no se mezclen con mi nómina, pero poder registrar el flujo meta→ahorros→gasto→meta cuando necesite pagar obra.

**Independent Test**: Crédito vinculado a cuenta meta $40M; dashboard personal excluye meta; asistente registra retiro $1,5M → gasto Escaleras → devolución sobrante; movimientos solo visibles en pestaña «Movimientos del fondo».

**Acceptance Scenarios**:

1. **Given** crédito $40M, **When** vinculo `disbursementAccountId` a «BBVA Meta VIS», **Then** tarjeta «Fondo crédito» muestra saldo meta y no suma al balance personal del home.
2. **Given** `operatingAccountId` = «BBVA Ahorros», **When** registro gasto $1.500.000 rubro Escaleras desde **modal Movimientos** (cuenta desembolso por defecto), **Then** se crea **un gasto** con `creditId` + `creditDestinationId` y aparece en pestaña Fondo del crédito.
3. **Given** lista `/transactions` por defecto, **When** no activo filtro crédito, **Then** no veo movimientos del fondo escrow.
4. **Given** detalle del crédito pestaña Movimientos del fondo, **When** abro, **Then** veo transferencias y gastos del crédito ordenados.
5. **Given** desembolso inicial, **When** configuro crédito, **Then** no se registra como ingreso de nómina — solo saldo en cuenta escrow vinculada.

---

### User Story 5 - Simular plan de pago anticipado (Priority: P1)

Como usuario, quiero simular «si abono $X cada diciembre, ¿cuándo termino?» sin registrar el abono aún.

**Acceptance Scenarios**:

1. **Given** crédito $40M a 120 meses, **When** simulo abono anual $6.000.000 con `shorten_term`, **Then** veo fecha estimada de pago ≤ 6 años desde desembolso.
2. **Given** `targetPayoffDate` en 5 años, **When** abro simulador, **Then** veo que ~$6.000.000/año es coherente con la meta (±10%).
3. **Given** simulación, **When** confirmo aplicar, **Then** puedo convertir en abono real (opcional).

---

### User Story 6 - Pagar cuota ordinaria (Priority: P1)

**Acceptance Scenarios**:

1. **Given** cuota pendiente, **When** marco pagada, **Then** estado `paid` y saldo coherente.
2. **Given** cuota con seguros, **When** registro pago, **Then** puedo vincular transacción por `totalDue`.
3. **Given** todas las cuotas pagadas, **When** consulto crédito, **Then** `paid_off`.

---

### User Story 7 - Alertas de vencimiento (Priority: P2)

Sin cambio v1.1 — offsets, `notificationsEnabled`, `notificationLog`.

---

### User Story 8 - Metas de ahorro (Priority: P1)

Sin cambio v1.1 — CRUD, aportes, `/savings`.

---

### User Story 9 - Navegación (Priority: P2)

`/credits`, `/savings` en shell móvil y desktop.

---

### Edge Cases

- Abono mayor al saldo: rechazar o permitir solo hasta saldo pendiente.
- Abono en mes con cuota ya pagada: abono reduce saldo independiente de cuota del mes.
- Modo `manual`: recálculo tras abono propone filas nuevas; usuario puede ajustar antes de confirmar.
- Seguros variables mes a mes (VIS): editar `insuranceAmount` por fila en modo manual.
- Múltiples abonos en el mismo año: cada uno recalcula secuencialmente.
- Día 31 / febrero: último día del mes.
- Rubros duplicados: permitir mismo nombre con advertencia; montos se suman en asignado.
- Rubro sin transacción: válido (pago en efectivo fuera de app); monto manual basta.
- Eliminar rubro: soft-delete o archivar; no altera cuotas ni abonos.
- Desembolso mal registrado como ingreso en nómina: wizard de setup debe evitarlo; documentar corrección manual.
- Cuenta meta sin vincular: crédito funciona; fondo aislado es opcional pero recomendado.

---

## Requirements *(mandatory)*

### Créditos — configuración

- **FR-001**: CRUD con `scheduleMode` (`cuota_fija` \| `capital_constant` \| `manual`), `rateType`, tasa, plazo, día de pago.
- **FR-002**: `creditPayments` MUST incluir `principal`, `interest`, `insuranceAmount?`, `otherFees?`, `totalDue`.
- **FR-003**: Modo `cuota_fija` MUST generar interés sobre saldo insoluto; conversión EA/NAMV/MV según proposal.
- **FR-004**: Modo `manual` MUST permitir crear/editar filas sin sobrescribir cuotas `paid`.
- **FR-005**: `targetPayoffDate` opcional; `disbursementAccountId` y `operatingAccountId` opcionales.
- **FR-005b**: Cuenta escrow MUST marcarse `isCreditEscrow` o inferirse por `disbursementAccountId`.
- **FR-005c**: Dashboard balance personal MUST excluir cuentas escrow por defecto.

### Abonos a capital

- **FR-006**: MUST registrar `creditCapitalAbonos` (monto, fecha, `recalcEffect`, nota, transacción opcional).
- **FR-007**: Tras abono, MUST recalcular solo cuotas `pending`; cuotas `paid` inmutables.
- **FR-008**: `shorten_term` MUST reducir plazo proyectado o número de cuotas futuras.
- **FR-009**: `lower_installment` MUST reducir VR de cuotas futuras manteniendo plazo restante.
- **FR-010**: Vista detalle MUST tener sección/pestaña **Abonos** con historial.

### Destinos del crédito (rubros)

- **FR-013**: MUST registrar `creditDestinations` con nombre, monto (>0), fecha opcional, estado, notas.
- **FR-014**: MUST mostrar `totalAllocated`, `unallocated` (= principal − asignado) en detalle del crédito.
- **FR-015**: Pestaña/sección **Destinos** junto a Cuotas y Abonos.
- **FR-016**: Rubro MAY vincular una o más transacciones de gasto (`transactionIds`).
- **FR-017**: MUST advertir si suma de rubros > principal desembolsado.
- **FR-018**: Visualización de distribución (barra o torta) del capital por rubro.

### Fondo aislado e integración transacciones

- **FR-019**: MUST vincular `disbursementAccountId` (cuenta meta) al crédito.
- **FR-020**: MAY vincular `operatingAccountId` (nómina/ahorros pasarela).
- **FR-021**: Transacciones del fondo MUST soportar `creditId`, `creditDestinationId?`, `isCreditFundMovement`.
- **FR-022**: Gasto desde fondo MUST registrarse vía modal Movimientos con `creditFundContext`; **un solo movimiento** tipo `expense` con `creditDestinationId`. Mutation `spendFromFund` (wizard multi-tx) queda como **legacy opcional** no expuesta en UI v1.5.
- **FR-022b**: MUST permitir categorías de gasto del fondo (`fundExpenseCategoryIds`) en crear/ajustes crédito.
- **FR-022c**: Pago de cuota MAY registrarse desde modal Movimientos vía `creditPaymentContext`.
- **FR-022d**: `creditDestinations.list` MUST incluir `spentTotal` por rubro.
- **FR-023**: Pestaña **Movimientos del fondo** en detalle del crédito.
- **FR-024**: `/transactions` MUST ocultar movimientos con `creditId` por defecto; toggle para mostrarlos.
- **FR-025**: Desembolso MUST NOT registrarse como `income` en cuenta nómina al configurar crédito vinculado.

### Simulación

- **FR-026**: MUST simular abonos periódicos y mostrar fecha estimada de `paid_off`.
- **FR-027**: Caso referencia **$6M/año** para $40M / meta 5 años.
- **FR-028**: Meta MAY vincular `linkedCreditId`; ahorro $500k/mes desde nómina, no desde escrow.

### Operación y alertas

- **FR-029** a **FR-033**: Pago cuota, estados, listado, recordatorios.

### Metas de ahorro

- **FR-034** a **FR-040**: Sin cambio v1.1.

### Transversal

- **FR-041**: Mobile-first, JP-DS, aislamiento, nav `/credits` + `/savings`.

### Key Entities

- **Credit**, **CreditPayment**, **CreditCapitalAbono**, **CreditDestination**, **SavingsGoal**, **SavingsContribution**.

---

## Success Criteria *(mandatory)*

- **SC-001**: Crédito VIS $40M — primera cuota coherente con extracto (total ~$625.958 ±$500).
- **SC-002**: Simulación abono **$6.000.000/año** proyecta `paid_off` en **≤ 72 meses** (vs 120 originales).
- **SC-003**: Meta ahorro $500.000/mes × 12 = $6.000.000 acumulados; UI coherente con abono anual.
- **SC-004**: Rubros «Escaleras» $1,5M → sin asignar $38,5M correcto en resumen.
- **SC-005**: Dashboard personal excluye escrow; tarjeta «Fondo crédito VIS» muestra saldo meta.
- **SC-006**: Gasto fondo $1,5M Escaleras desde Movimientos aparece en pestaña Fondo; no en `/transactions` por defecto.
- **SC-007**: Cuotas pagadas intactas tras 3 abonos consecutivos.
- **SC-008**: Meta de ahorro + navegación sin regresión.
- **SC-009**: 0 fugas de datos entre usuarios.

---

## Assumptions

- Abono default: **`shorten_term`**; plan referencia: **$500.000/mes** de ahorro → **$6.000.000/año** de abono.
- Meta de ahorro (`linkedCreditId`) financia **abonos al banco** desde nómina; escrow financia **obra/rubros**.
- Cuenta escrow excluida del balance personal evita que $40M parezcan «ahorro extra».
- Destinos trackean **uso del desembolso**, no pagos al banco (distinto de cuotas y abonos).
- Rubros pueden existir sin transacción en app (gasto manual registrado solo en rubro).
- Simulador v1: abonos **anuales** o **puntuales**; frecuencias quincenales diferidas.
- Seguros: monto fijo mensual (`insuranceMonthly`) o por fila; no modelamos pólizas detalladas.
- Recálculo usa tasa y modo vigentes del crédito; no replica al 100% algoritmos propietarios del banco — modo `manual` para ajuste fino.
- Zona horaria `America/Bogota`.

---

## Dependencies

- Changes 1–4; Change 6 (DIAN) consumirá saldos y abonos.
