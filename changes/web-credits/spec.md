# Feature Specification: Web Credits & Savings

**Feature Branch**: `feat/web-credits`

**Created**: 2026-07-05

**Status**: In progress (v1.6 — perfiles adaptativos y creación flexible)

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

## Iteración planificada (2026-07-11)

Perfiles adaptativos de crédito: wizard de 2 pasos, creación mínima y edición flexible.

| Área | v1.5 | v1.6 (planificado) |
|------|------|---------------------|
| Creación | Formulario único; campos financieros obligatorios | **Wizard 2 pasos** (perfil → formulario); solo **nombre** obligatorio |
| Tipo de crédito | Implícito (`hasDisbursement`, flags UI) | **`creditProfile`** persistido y editable |
| Completitud | Crédito activo con cuotas al crear | **`setupStatus`**: `draft` → `ready` → `active` |
| Desembolso | Condicionado a toggle en create | **Opcional en cualquier perfil** (incl. P2P) |
| Edición | Financieros solo lectura en Ajustes | **Todo editable**; cambio de perfil con confirmación |
| Producto financiado | Toggle «sin desembolso» genérico | Perfil **`tangible_product`** (vehículo, electro, bien tangible) |

---

## Clarifications

### Session 2026-07-11

- Q: ¿Qué mínimo exige la app para guardar un crédito? → A: **Solo nombre**; el resto opcional y completable después.
- Q: ¿Cuenta de desembolso en préstamos P2P? → A: **Permitida si el usuario la desea**; nunca obligatoria.
- Q: ¿Vehículo vs electro vs leasing? → A: **Un solo perfil** `tangible_product` (producto/bien tangible financiado).
- Q: ¿Pasos del wizard? → A: **2 pasos**: selección de perfil → formulario adaptado.
- Q: ¿Perfil editable después? → A: **Sí, todo editable**; al cambiar perfil, **confirmación** para conservar o eliminar datos que dejan de aplicar; si conserva, reaparecen cuando el perfil vuelva a ser compatible.

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

**Dentro:** perfiles adaptativos (`creditProfile`), wizard 2 pasos, creación mínima (solo nombre), modos de amortización, abonos, simulador, rubros, **cuenta escrow opcional**, crédito manual VIS, metas, `/credits`, `/savings`.

**Fuera:** UVR indexada, revolving, sync bancario, refinanciación como nueva operación, leasing como producto separado, DIAN.

---

## Conceptos clave

### Cuota vs. abono vs. destino del desembolso

- **Cuota ordinaria**: lo que **pagas al banco** cada mes (devolución de deuda + intereses).
- **Abono a capital**: pago **extra** al banco; efecto `shorten_term` (acortar plazo) o `lower_installment` (bajar cuota).
- **Destino / rubro**: en qué **gastaste o planeas gastar** el dinero que te prestaron — no es un pago al banco, es trazabilidad del uso del desembolso de $40M.

Ejemplo: de $40.000.000 desembolsados, $1.500.000 fueron a **construcción de escaleras**; quedan $38.500.000 por asignar o ejecutar en otros rubros.

### Perfil adaptativo (`creditProfile`) vs. modo de tabla (`scheduleMode`)

Dos ejes **independientes**:

| Eje | Campo | Qué define |
|-----|-------|------------|
| **Propósito / UX** | `creditProfile` | Formulario, defaults sugeridos, campos visibles, pestañas |
| **Amortización** | `scheduleMode` | Cómo se calculan o registran las cuotas |

**Perfiles v1.6** (7 valores):

| Grupo UX | `creditProfile` | Ejemplos |
|----------|-----------------|----------|
| Dinero en cuenta | `free_purpose` | Libre destino, consumo |
| Dinero en cuenta | `housing_improvement` | VIS, mejora locativa, obra |
| Dinero en cuenta | `debt_consolidation` | Recaudo / compra de cartera |
| Compra financiada | `tangible_product` | Vehículo, electrodoméstico, bien tangible |
| Compra financiada | `intangible_service` | Curso, software, servicio |
| Acuerdo personal | `p2p_agreement` | Préstamo familiar, informal |

Los perfiles **sugieren** defaults (desembolso, rubros, `scheduleMode`) pero **no obligan** al usuario.

**Estado de configuración** (`setupStatus`):

| Valor | Significado |
|-------|-------------|
| `draft` | Solo nombre (y opcionalmente perfil); sin cuotas |
| `ready` | Datos suficientes para generar tabla; cuotas aún no generadas |
| `active` | Tabla generada o crédito operativo |

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

### User Story 1 - Registrar crédito según su perfil (Priority: P1)

Como usuario, quiero elegir el tipo de crédito (libre destino, vivienda, producto financiado, etc.) y ver un formulario adaptado a mi caso, pudiendo guardar con solo un nombre y completar después.

**Independent Test A**: Wizard paso 1 → `housing_improvement`; paso 2 → solo nombre → crédito `draft` en lista con badge «Incompleto».

**Independent Test B**: Perfil `tangible_product`, moto financiada sin desembolso en cuenta → crédito activo con cuotas; sin pestaña Fondo.

**Independent Test C**: Modo `manual`, extracto Banco Agrario → primera cuota total $625.958, saldo $40M.

**Acceptance Scenarios**:

1. **Given** wizard paso 1, **When** selecciono un perfil, **Then** paso 2 muestra campos sugeridos para ese perfil (no obligatorios salvo nombre).
2. **Given** solo nombre ingresado, **When** guardo, **Then** crédito persiste con `setupStatus: draft` sin generar cuotas.
3. **Given** crédito `draft`, **When** completo monto + tasa + plazo + día pago + `scheduleMode` y activo tabla, **Then** `setupStatus: active` y cuotas generadas.
4. **Given** perfil `tangible_product`, **When** creo crédito, **Then** desembolso desactivado por defecto pero editable; campos opcionales de producto/comercio visibles.
5. **Given** perfil `p2p_agreement`, **When** activo cuenta desembolso, **Then** puedo vincular escrow igual que en libre destino.
6. **Given** modo `cuota_fija` con datos completos, **When** genero tabla, **Then** cuota fija con desglose capital/interés.
7. **Given** modo `manual`, **When** ingreso filas del extracto, **Then** tabla refleja valores del banco sin recalcular filas `paid`.
8. **Given** crédito ya en marcha, **When** registro con cuotas pagadas opcionales, **Then** solo cuotas restantes según flags existentes.

### User Story 1b - Editar perfil y configuración (Priority: P1)

Como usuario, quiero cambiar el tipo de crédito y todos sus campos después de crearlo, con control sobre qué pasa con datos que ya no aplican.

**Acceptance Scenarios**:

1. **Given** crédito existente, **When** cambio `creditProfile` en Ajustes, **Then** UI muestra confirmación: conservar o eliminar datos incompatibles.
2. **Given** confirmación «conservar», **When** el nuevo perfil vuelve a ser compatible, **Then** datos ocultos reaparecen.
3. **Given** confirmación «eliminar», **When** guardo, **Then** se limpian campos incompatibles; cuotas pagadas, abonos y transacciones históricas **no** se borran.
4. **Given** crédito `draft`, **When** edito monto/tasa/plazo en Ajustes, **Then** cambios persisten sin regenerar cuotas hasta acción explícita.

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
- Crédito `draft` sin cuotas: listado muestra badge; detalle no auto-genera tabla.
- Cambio de perfil con rubros existentes: conservar destinos aunque perfil no muestre pestaña Destinos.
- Cambio de perfil con cuotas pagadas: nunca cancelar cuotas `paid`.
- Perfil `tangible_product` con desembolso activado manualmente: comportamiento igual a `free_purpose` con escrow.

---

## Requirements *(mandatory)*

### Perfiles adaptativos y wizard

- **FR-042**: MUST persistir `creditProfile` en `credits` con valores: `free_purpose`, `housing_improvement`, `debt_consolidation`, `tangible_product`, `intangible_service`, `p2p_agreement`.
- **FR-043**: Wizard de creación MUST tener **2 pasos**: selector de perfil → formulario adaptado.
- **FR-044**: `credits.create` MUST aceptar payload con **solo `name`** obligatorio; resto opcional.
- **FR-045**: Crédito creado sin datos financieros completos MUST quedar `setupStatus: draft` **sin** generar `creditPayments`.
- **FR-046**: Generación de cuotas MUST ser acción explícita (`ensurePaymentSchedule` / «Generar tabla») cuando `setupStatus !== active`.
- **FR-047**: Perfil MUST ser editable post-create vía `credits.update` o `credits.updateSetupProfile`.
- **FR-048**: Cambio de `creditProfile` MUST mostrar confirmación: conservar datos incompatibles vs eliminarlos.
- **FR-049**: `disbursementAccountId` MAY configurarse en **cualquier** perfil; nunca obligatorio por perfil.
- **FR-050**: Perfiles MUST sugerir defaults (copy, campos visibles, `scheduleMode` default) sin bloquear al usuario.
- **FR-051**: `credits.get` SHOULD devolver `missingFields[]` para guiar completitud en UI.

### Créditos — configuración

- **FR-001**: CRUD con `scheduleMode` (`cuota_fija` \| `capital_constant` \| `manual`), `rateType`, tasa, plazo, día de pago — todos **opcionales en create**; requeridos solo para generar cuotas.
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

- **FR-019**: MAY vincular `disbursementAccountId` (cuenta meta) al crédito; opcional en todos los perfiles.
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

- **Credit** (+ `creditProfile`, `setupStatus`, `linkedAsset?`, `informalAgreement?`, `profileMetadata?`)
- **CreditPayment**, **CreditCapitalAbono**, **CreditDestination**, **SavingsGoal**, **SavingsContribution**.

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
- **SC-010**: Crear crédito con solo nombre → aparece en lista como incompleto; no hay cuotas hasta completar.
- **SC-011**: Wizard 2 pasos: perfil `housing_improvement` muestra sugerencias de rubros/seguros sin obligarlos.
- **SC-012**: Cambio de perfil con «conservar» → datos reaparecen al volver a perfil compatible.
- **SC-013**: Perfil `tangible_product` (moto/electro) operativo sin desembolso ni pestaña Fondo.

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
- Perfil adaptativo ≠ modo de amortización; un VIS puede ser `manual`, un libre destino `cuota_fija`.
- Créditos existentes pre-v1.6: backfill `creditProfile` por heurística (`disbursementAccountId` → perfil con fondo; resto → `free_purpose`); `setupStatus: active`.
- Datos mínimos para generar cuotas: `principal`, `rateType`, `interestRate`, `termMonths`, `paymentDay`, `scheduleMode`.

---

## Dependencies

- Changes 1–4; Change 6 (DIAN) consumirá saldos y abonos.
