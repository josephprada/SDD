# Propuesta: Change 5 — Web Credits & Savings (Créditos, Préstamos y Ahorros/Metas)

**Versión**: 1.4.0
**Estado**: Planificado
**Change**: web-credits
**Creado**: 2026-07-05
**Rama**: `feat/web-credits` (desde `testing`)

---

## Intención

Cerrar las capacidades de **pasivos y activos planificados** del roadmap (`SPEC.md` §4.10 y §4.11) antes de la Declaración de Renta (Change 6), que debe consolidar todo el dominio financiero — incluidos créditos y metas de ahorro.

1. **Créditos y préstamos flexibles** — adaptarse a distintos productos colombianos (libre inversión, VIS/vivienda, etc.), no solo una fórmula rígida.
2. **Abonos a capital extraordinarios** — registrar pagos extra, recalcular el futuro y acortar plazo (caso real: préstamo a 10 años, abonos anuales para pagar en ~5).
3. **Ahorros y metas** — objetivos de acumulación con progreso visual, aportes y cuenta vinculada opcional.
4. **Destinos del crédito (rubros)** — registrar en qué se invierte el monto desembolsado ($40M → $1,5M escaleras, etc.) con seguimiento real.
5. **Fondo aislado del desembolso** — cuenta meta vinculada al crédito, sin mezclar con nómina ni dashboard personal.
6. **Alertas e integración** — vencimientos (push + in-app) y link a transacciones.

### Cuatro capas (no mezclar)

| Capa | Qué es | Ejemplo usuario |
|------|--------|-----------------|
| **Deuda** | Préstamo con el banco (cuotas, abonos) | Banco Agrario $40M |
| **Fondo aislado** | Cuenta meta donde vive el desembolso | BBVA Meta Crédito VIS |
| **Operación diaria** | Cuenta nómina/ahorros habitual | BBVA Ahorros (nómina) |
| **Rubro / meta** | Uso del capital o ahorro para abono | Escaleras $1,5M · $500k/mes abono |

---

## Caso real de referencia (usuario — Banco Agrario VIS)

Extracto **Crédito Remodelación Vivienda VIS**, $40.000.000 COP, plazo contratado **10 años** (120 meses), meta personal **pagar en ~5 años**.

**Plan de pago anticipado del usuario:**

| Concepto | Valor |
|----------|-------|
| Ahorro personal mensual | **$500.000** |
| Frecuencia de abono a capital | **Anual** (una vez al año) |
| Monto del abono anual | **$6.000.000** ($500.000 × 12) |
| Efecto deseado | `shorten_term` — acortar plazo manteniendo lógica de cuota |

Flujo esperado en la app:

1. Meta de ahorro «Abono crédito VIS» con aporte mensual $500.000 (opcional pero recomendado).
2. Cada 12 meses: registrar **abono a capital** $6.000.000 vinculado al crédito.
3. Sistema recalcula cuotas futuras y muestra nueva fecha estimada de pago libre.
4. Simulador valida si $6M/año alcanza la meta ~5 años vs plazo original 10.

**Destinos del desembolso (rubros):**

| Rubro | Monto | Estado |
|-------|-------|--------|
| Construcción escaleras | $1.500.000 | Completado |
| *(otros rubros)* | … | … |
| **Sin asignar** | $38.500.000 | Pendiente de ejecutar |

En el extracto Banco Agrario existe pestaña **Rubros** — mismo concepto: trazabilidad del uso del capital prestado, distinto de cuotas y abonos.

**Aislamiento del desembolso (flujo BBVA real):**

El banco desembolsó $40M en la cuenta de ahorros/nómina; el usuario los movió a **cuenta meta BBVA** para no mezclarlos con el dinero corriente. Al gastar de obra:

1. Meta → Ahorros (retiro temporal)
2. Gasto desde Ahorros (ej. constructor)
3. Ahorros → Meta (devolver sobrante)

En JP-WALLET esto se replica sin ensuciar el dashboard personal.

| Cuenta en app | Rol | ¿En balance “personal” del home? |
|---------------|-----|----------------------------------|
| BBVA Ahorros / Nómina | Vida diaria | ✅ Sí |
| BBVA Meta Crédito VIS | Fondo del desembolso (`disbursementAccountId`) | ❌ No (tarjeta aparte) |

| Campo extracto | Valor cuota 1 (17/07/2026) |
|----------------|----------------------------|
| Saldo capital | $40.000.000 |
| Abono a capital | $163.938 |
| Interés | $433.237 (~1,08% MV sobre saldo) |
| Seguros (SEGT + IVA) | ~$6.407 |
| **VR CUOTA total** | **$625.958** |

**Observación clave:** la cuota **no es idéntica** mes a mes ($625.958 → $620.482 → …). Créditos VIS/vivienda y tablas bancarias reales no siempre encajan en una sola fórmula cerrada. Por eso el change soporta **modos de tabla** y **edición/importación**, no solo cálculo automático.

---

## Alcance

### Dentro del Scope

**Créditos — modos de amortización (`scheduleMode`)**

| Modo | Cuándo usarlo |
|------|----------------|
| **`cuota_fija`** | Libre inversión, consumo: cuota constante; interés sobre saldo (EA/NAMV/MV) |
| **`capital_constant`** | Abono a capital similar cada mes; cuota total decreciente |
| **`manual`** | Extracto bancario (VIS, seguros variables, etc.): filas ingresadas o importadas |

**Alta del crédito**

- CRUD: nombre, prestamista, monto, `rateType`, tasa, plazo, fecha inicio, día de pago.
- `scheduleMode` + generación automática **o** tabla manual fila a fila.
- Campos opcionales: `fixedInstallment`, `insuranceMonthly`, `targetPayoffDate` (meta de pago anticipado).
- Columnas por cuota como extracto: **saldo / capital / interés / seguros / VR cuota / estado**.

**Abonos a capital extraordinarios** (`creditCapitalAbonos`)

- Registrar abono: monto, fecha, nota, link a transacción opcional.
- Efecto del abono (`recalcEffect`):
  - **`shorten_term`** (default): mantiene lógica de cuota, **reduce cuotas restantes** — ideal para pagar en 5 años en lugar de 10.
  - **`lower_installment`**: mantiene plazo, baja el valor de cuotas futuras.
- Tras abono: recalcular **solo cuotas pendientes**; historial pagado intacto.
- Vista/pestaña **Abonos** en detalle del crédito (como sistemas bancarios legacy).
- **Simulador (P1)**: «Si abono $X cada año, ¿en qué fecha termino?» vs `targetPayoffDate`.

**Destinos del crédito — rubros de inversión** (`creditDestinations`)

- Pestaña/sección **Destinos** (o **Rubros**) en detalle del crédito — paralelo a cuotas y abonos.
- CRUD rubro: nombre, monto asignado, fecha de ejecución, notas, estado (`planned` \| `in_progress` \| `completed`).
- Resumen en cabecera del crédito:
  - **Desembolsado**: $40.000.000
  - **Asignado a rubros**: suma de destinos
  - **Sin asignar**: principal − asignado
- Visualización: lista + barra o gráfico de torta del uso del capital.
- Vincular **transacciones de gasto** al rubro (ej. pago a constructor → rubro «Escaleras»).
- Adjuntos opcionales por rubro (factura, foto obra) — reutilizar patrón `attachments`.
- Alerta si suma de rubros **supera** el monto desembolsado.

**Fondo aislado del desembolso** (integración cuentas + transacciones)

- Campo `disbursementAccountId` → cuenta meta BBVA (escrow del crédito).
- Campo opcional `operatingAccountId` → cuenta nómina/ahorros usada como pasarela al gastar (meta → ahorros → gasto → meta).
- Al crear crédito: vincular cuenta meta existente o crear cuenta con flag `isCreditEscrow: true`.
- **No registrar el desembolso como ingreso** — es deuda + saldo en cuenta escrow; opción de asiento inicial en meta al vincular.
- Pestaña **Movimientos del fondo** en detalle del crédito: transferencias y gastos con `creditId` (no mezclados con `/transactions` por defecto).
- **Asistente «Gastar desde fondo del crédito»** (P1):
  1. Transferencia Meta → Ahorros ($X)
  2. Gasto desde Ahorros vinculado a rubro (`creditDestinationId`)
  3. (Opcional) Transferencia Ahorros → Meta (sobrante)
  — Los tres movimientos quedan ligados al `creditId`.
- **Dashboard**: balance total personal **excluye** cuentas `isCreditEscrow` / `disbursementAccountId`; tarjeta aparte «Fondo crédito VIS» (saldo meta vs rubros).
- **`/transactions`**: filtro por defecto oculta movimientos con `creditId`; toggle «Ver movimientos del crédito».
- Extensión `transactions`: campos opcionales `creditId`, `creditDestinationId`, `isCreditFundMovement`.
- Meta de ahorro $500k/mes (`linkedCreditId`) sale de **nómina**, no del fondo escrow de $40M.

**Operación diaria**

- Marcar cuota pagada; vincular transacción.
- Editar filas futuras en modo `manual` si el banco ajusta la proyección.
- Alertas de vencimiento (offsets, `notificationLog`).
- Múltiples créditos simultáneos.

**Ahorros y metas** — sin cambio respecto v1.1 (CRUD, aportes, `/savings`).

**Transversal**

- Tablas: `credits`, `creditPayments`, `creditCapitalAbonos`, `creditDestinations`, `savingsGoals`, `savingsContributions`.
- Nav: `/credits`, `/savings`.

### Fuera del Scope

- Créditos **UVR** con indexación inflacionaria automática — diferido.
- Revolving / tarjeta de crédito rotativa.
- Sincronización automática con banco / Open Finance.
- Refinanciación formal con nueva operación (solo abonos sobre crédito existente en v1).
- Email de recordatorios; DIAN (Change 6).

---

## Capabilities

### Nuevas

| Capability | Descripción |
|------------|-------------|
| `credits` | CRUD con modos de tabla flexibles |
| `credit-amortization` | Generación cuota_fija / capital_constant |
| `credit-manual-schedule` | Tabla importada o editada fila a fila |
| `credit-capital-abonos` | Abonos extraordinarios + recálculo |
| `credit-fund-isolation` | Cuenta escrow, filtros dashboard, movimientos del fondo |
| `credit-spend-wizard` | Asistente meta → ahorros → gasto → devolución |
| `credit-destinations` | Rubros / destinos del desembolso + seguimiento |
| `credit-payoff-simulator` | Proyección «abono anual → fecha de pago» |
| `credit-payments` | Cuotas, seguros, estados |
| `credit-reminders` | Alertas vencimiento |
| `savings-goals` / `savings-contributions` | Metas y aportes |

### Modificadas

`app-shell`, `dashboard`, `accounts`, `transactions`, `notifications`.

---

## Modelo de datos (resumen)

```typescript
credits: {
  userId, name, lender, principal,
  rateType: "EA" | "NAMV" | "MV",
  interestRate, termMonths, startDate, paymentDay,
  scheduleMode: "cuota_fija" | "capital_constant" | "manual",
  fixedInstallment?, defaultRecalcOnAbono: "shorten_term" | "lower_installment",
  targetPayoffDate?, insuranceMonthly?,
  disbursementAccountId?, // → Account (cuenta meta / escrow)
  operatingAccountId?,    // → Account (nómina/ahorros pasarela)
  outstandingBalance, status, notes?, createdAt, updatedAt
}

// accounts (extensión)
// isCreditEscrow: boolean — excluir de balance personal por defecto

// transactions (extensión)
// creditId?, creditDestinationId?, isCreditFundMovement?: boolean

creditPayments: {
  creditId, installmentNumber, dueDate, paidDate?,
  principal, interest, insuranceAmount?, otherFees?, totalDue,
  status: "pending" | "paid" | "overdue" | "cancelled",
  transactionId?, isProjected, createdAt, updatedAt
}

creditCapitalAbonos: {
  creditId, amount, paidAt,
  recalcEffect: "shorten_term" | "lower_installment",
  transactionId?, notes?, createdAt
}

creditDestinations: {
  creditId, name, amount, spentAt?,
  status: "planned" | "in_progress" | "completed",
  transactionIds?, notes?, createdAt, updatedAt
}
// Derivados en query: totalAllocated, unallocated = principal - totalAllocated
```

---

## Lógica de amortización

### Cuota fija (`cuota_fija`)

Interés = saldo × tasa mensual; capital = cuota − interés. Tasas: EA → `(1+EA)^(1/12)−1`; NAMV → `/12`; MV → directa.

### Capital constante (`capital_constant`)

Capital mensual = principal / n (fijo); interés = saldo × i; **VR cuota decrece** (común en algunos créditos de vivienda).

### Manual (`manual`)

Usuario ingresa o ajusta filas según extracto. `isProjected: false` en filas editadas. Abonos recalculan proyección futura según `scheduleMode` y tasa vigente.

### Abono a capital

1. Reduce `outstandingBalance` en `amount`.
2. Cuotas `paid` no cambian.
3. Cuotas `pending` → `cancelled`; se generan nuevas según `recalcEffect`.
4. **`shorten_term`**: misma cuota (o misma lógica de modo), menos meses hasta saldo 0.
5. **`lower_installment`**: mismo número de meses restantes, cuota menor.

---

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Complejidad multi-modo | Fases: cuota_fija + abonos → manual + VIS caso real |
| Recálculo tras abono incorrecto | Tests con caso $40M / 10 años / abono anual / meta 5 años |
| Tabla banco ≠ fórmula | Modo `manual` + edición de filas futuras |
| Scope creep | Simulador simple en P1; UVR/revolving fuera |

---

## Criterios de éxito

1. Crédito VIS $40M se puede cargar (manual o calculado) con primera cuota coherente con extracto (~$626k total, ~$434k interés).
2. Simulador con abono **$6.000.000/año** (`shorten_term`) proyecta fecha de pago **≤ 6 años** (vs 10 originales).
3. Abono anual registrado reduce plazo proyectado; cuotas pagadas intactas.
4. Meta de ahorro con aportes **$500.000/mes** llega a $6M en 12 meses (coherente con abono anual).
5. Simulador responde «abono $6M/año → fecha estimada de pago».
6. Rubro «Escaleras» $1,5M registrado; resumen muestra $38,5M sin asignar de $40M.
7. Cuenta meta vinculada; dashboard personal **no** incluye $40M del escrow; tarjeta «Fondo crédito» aparte.
8. Asistente «Gastar desde fondo» registra meta→ahorros→gasto→meta sin aparecer en lista principal por defecto.
9. Metas de ahorro y navegación operativas (sin regresión).

## Próximo paso

`/speckit-implement` — ejecutar `tasks.md` fases A→H.
