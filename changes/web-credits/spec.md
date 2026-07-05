# Feature Specification: Web Credits & Savings

**Feature Branch**: `feat/web-credits`

**Created**: 2026-07-05

**Status**: Draft

**Change**: web-credits (Change 5)

**Input**: Roadmap `SPEC.md` §4.10–4.11 — créditos y préstamos con amortización, alertas de vencimiento, metas de ahorro con aportes y progreso visual.

---

## Resumen

Este change entrega gestión de **pasivos** (créditos) y **objetivos de acumulación** (metas de ahorro) como prerequisito de la Declaración de Renta (Change 6).

| Pilar | Descripción |
|-------|-------------|
| **Créditos** | Deudas con tabla de amortización, cuotas y saldo pendiente |
| **Pagos de cuota** | Marcar pagado, estados pendiente/vencido, link a transacción |
| **Alertas** | Recordatorios de vencimiento in-app + push |
| **Metas de ahorro** | Objetivo, aportes, progreso y fecha límite opcional |

**Dentro:** CRUD créditos (francés), calendario de cuotas, CRUD metas, aportes, navegación `/credits` y `/savings`, integración básica con transacciones.

**Fuera:** amortización alemana/revolving, prepagos, auto-débito, metas compartidas, email de recordatorios, DIAN.

---

## Conceptos clave

### Crédito vs. meta de ahorro vs. presupuesto

- **Crédito**: deuda con interés y cuotas periódicas; el saldo **disminuye** al pagar.
- **Meta de ahorro**: objetivo de reunir un monto; el progreso **aumenta** con aportes.
- **Presupuesto** (Change 4): límite de gasto en categoría; no es deuda ni ahorro acumulado.

### Fuente de verdad del progreso de ahorro

- El monto acumulado de una meta = **suma de aportes registrados** (`savingsContributions`).
- Una cuenta vinculada es **referencia visual** del saldo en banco/efectivo; no sustituye los aportes.

### Amortización v1

- Solo **cuota fija mensual (sistema francés)**.
- Al crear el crédito se generan todas las cuotas (`creditPayments`) con capital, interés y fecha de vencimiento.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Registrar un crédito (Priority: P1)

Como usuario, quiero registrar mi crédito hipotecario con tasa y plazo, para ver el calendario de pagos y cuánto debo.

**Independent Test**: Crear crédito $100.000.000, 12 % EA, 240 meses; verificar 240 cuotas con monto fijo y saldo inicial correcto.

**Acceptance Scenarios**:

1. **Given** ningún crédito, **When** creo "Hipoteca" con monto, tasa, plazo y día de pago, **Then** aparece en `/credits` con saldo pendiente = monto original.
2. **Given** crédito creado, **When** abro el detalle, **Then** veo tabla de amortización con número de cuota, fecha, capital, interés y total.
3. **Given** datos inválidos (monto ≤ 0, plazo 0), **When** intento guardar, **Then** se rechaza con mensaje claro.

---

### User Story 2 - Pagar una cuota (Priority: P1)

Como usuario, quiero marcar una cuota como pagada y opcionalmente vincularla a un gasto, para llevar control real de mis pagos.

**Acceptance Scenarios**:

1. **Given** cuota pendiente, **When** la marco como pagada con fecha, **Then** estado `paid`, saldo pendiente del crédito disminuye.
2. **Given** cuota pagada, **When** elijo vincular transacción, **Then** `transactionId` queda asociado y puedo abrir el movimiento.
3. **Given** todas las cuotas pagadas, **When** consulto el crédito, **Then** estado `paid_off` y saldo pendiente 0.

---

### User Story 3 - Alertas de vencimiento de cuota (Priority: P2)

Como usuario, quiero recibir aviso antes del día de pago de mi cuota, para no incurrir en mora.

**Acceptance Scenarios**:

1. **Given** crédito activo con offsets `[3, 0]` y notificaciones activas, **When** faltan 3 días para la cuota, **Then** alerta in-app y/o push (sin duplicar vía `notificationLog`).
2. **Given** `notificationsEnabled` desactivado, **When** llega fecha de recordatorio, **Then** no se envía push.
3. **Given** cuota ya pagada, **When** llega fecha de recordatorio, **Then** no se envía alerta.

---

### User Story 4 - Crear meta de ahorro (Priority: P1)

Como usuario, quiero definir una meta ("Vacaciones $5M para dic 2026"), para visualizar mi avance.

**Independent Test**: Crear meta $5.000.000; registrar aporte $1.000.000; ver 20 % de progreso.

**Acceptance Scenarios**:

1. **Given** ninguna meta, **When** creo meta con nombre y monto objetivo, **Then** aparece en `/savings` con 0 % de progreso.
2. **Given** meta con fecha límite, **When** la visualizo, **Then** veo días restantes o indicador de vencida si pasó la fecha sin completar.
3. **Given** meta con cuenta vinculada, **When** abro detalle, **Then** veo progreso por aportes y saldo de cuenta como referencia.

---

### User Story 5 - Registrar aportes (Priority: P1)

Como usuario, quiero registrar cada vez que ahorro hacia mi meta, para ver el progreso actualizado.

**Acceptance Scenarios**:

1. **Given** meta activa $10.000.000, **When** registro aporte $2.500.000, **Then** progreso 25 % y restante $7.500.000.
2. **Given** aportes que suman ≥ objetivo, **When** guardo el último aporte, **Then** meta pasa a `completed`.
3. **Given** historial de aportes, **When** abro detalle, **Then** veo lista ordenada por fecha con montos.

---

### User Story 6 - Navegación (Priority: P2)

Como usuario, quiero acceder a Créditos y Ahorros desde el menú principal en móvil y escritorio.

**Acceptance Scenarios**:

1. **Given** sesión autenticada en móvil, **When** abro menú «Más», **Then** veo entradas Créditos y Ahorros.
2. **Given** sesión en desktop, **When** miro sidebar, **Then** veo ítems Créditos y Ahorros con rutas `/credits` y `/savings`.

---

### Edge Cases

- Día de pago 31 en febrero: usar **último día del mes**.
- Cuota vencida sin pago: estado `overdue` al día siguiente de `dueDate`.
- Crédito con tasa 0 %: cuotas iguales a principal/plazo.
- Meta pausada: no muestra alertas; no acepta aportes hasta reactivar (o acepta con confirmación — **asumido: no acepta aportes en pausa**).
- Eliminar meta con aportes: soft-delete o archivar ( **asumido: archivar, no borrar historial** ).
- Aporte mayor al restante: permitir sobrepasar con aviso; meta completa al ≥ 100 %.
- Múltiples créditos con mismo día de pago: recordatorios independientes por crédito/cuota.

---

## Requirements *(mandatory)*

### Créditos

- **FR-001**: Sistema MUST permitir CRUD de crédito con nombre, prestamista, principal (>0), tasa anual (≥0), plazo en meses (>0), fecha inicio, día de pago (1–31).
- **FR-002**: Al crear crédito, sistema MUST generar `creditPayments` para todo el plazo (amortización francesa).
- **FR-003**: Sistema MUST calcular y mostrar `outstandingBalance` coherente con cuotas pendientes.
- **FR-004**: Usuario MUST poder marcar cuota como `paid` con `paidDate`.
- **FR-005**: Cuota pagada MAY vincularse a `transactionId` existente o flujo rápido de gasto.
- **FR-006**: Crédito MUST soportar estados `active`, `paid_off`, `defaulted`.
- **FR-007**: Vista `/credits` MUST listar créditos activos con saldo y próxima cuota.

### Alertas de crédito

- **FR-008**: Recordatorios MUST usar offsets configurables por crédito (default `[3, 0]`).
- **FR-009**: Alertas MUST respetar `notificationsEnabled` y reutilizar `notificationLog`.
- **FR-010**: No MUST enviarse alerta para cuotas ya pagadas.

### Metas de ahorro

- **FR-011**: Sistema MUST permitir CRUD de meta con nombre, `targetAmount` (>0), `deadline` opcional, icono/color opcionales.
- **FR-012**: Meta MAY vincular `accountId` opcional solo como referencia de saldo.
- **FR-013**: Usuario MUST registrar aportes (`amount` > 0, fecha) asociados a una meta.
- **FR-014**: Progreso MUST calcularse como `currentAmount / targetAmount` desde suma de aportes.
- **FR-015**: Meta MUST soportar estados `active`, `completed`, `paused`.
- **FR-016**: Al alcanzar ≥ 100 % del objetivo, meta MUST pasar a `completed`.
- **FR-017**: Vista `/savings` MUST listar metas con barra de progreso y monto restante.

### Transversal

- **FR-018**: Mobile-first desde 375 px; tokens JP-DS; COP con formato `$ 1.234.567`.
- **FR-019**: Datos MUST estar aislados por usuario autenticado.
- **FR-020**: Navegación MUST incluir `/credits` y `/savings` en shell autenticado.

### Key Entities

- **Credit**: deuda con parámetros de amortización (`credits`).
- **CreditPayment**: cuota individual con fechas y montos (`creditPayments`).
- **SavingsGoal**: meta de acumulación (`savingsGoals`).
- **SavingsContribution**: aporte puntual hacia una meta (`savingsContributions`).

---

## Success Criteria *(mandatory)*

- **SC-001**: Crédito con amortización francesa generado en < 5 s para plazo ≤ 360 meses.
- **SC-002**: Marcar cuota pagada actualiza saldo en < 2 s percibidos.
- **SC-003**: Meta con 3 aportes muestra progreso exacto al peso.
- **SC-004**: Recordatorio de cuota sin duplicados en mismo día/cuota/canal.
- **SC-005**: Usuario completa crear meta + primer aporte en < 60 s.
- **SC-006**: 0 fugas de datos entre usuarios en queries de créditos y metas.

---

## Assumptions

- Moneda COP; tasas expresadas en **nominal anual** (convención colombiana habitual en UI).
- Amortización francesa única en v1; redondeo a peso entero en cuotas (última cuota absorbe diferencia).
- Recordatorios: push + in-app; email diferido a change posterior.
- Zona horaria `America/Bogota` para fechas de vencimiento y crons.
- `defaulted` es cambio manual del usuario en v1 (sin integración buró).
- Dashboard widgets de resumen son P2; no bloquean MVP.

---

## Dependencies

- Changes 1–4 completados (auth, transacciones, settings, notificaciones).
- Change 6 (DIAN) consumirá saldos de créditos y metas completadas.
