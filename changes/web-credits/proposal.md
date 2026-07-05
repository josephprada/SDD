# Propuesta: Change 5 — Web Credits & Savings (Créditos, Préstamos y Ahorros/Metas)

**Versión**: 1.0.0
**Estado**: Planificado
**Change**: web-credits
**Creado**: 2026-07-05
**Rama**: `feat/web-credits` (desde `testing`)

---

## Intención

Cerrar las capacidades de **pasivos y activos planificados** del roadmap (`SPEC.md` §4.10 y §4.11) antes de la Declaración de Renta (Change 6), que debe consolidar todo el dominio financiero — incluidos créditos y metas de ahorro.

1. **Créditos y préstamos** — registrar deudas, tabla de amortización, seguimiento de cuotas y saldo pendiente.
2. **Ahorros y metas** — objetivos de acumulación con progreso visual, aportes y (opcional) cuenta vinculada.
3. **Alertas de vencimiento** — recordatorios de cuotas de crédito reutilizando el sistema de notificaciones del Change 4 (in-app + push).
4. **Integración con transacciones** — al marcar una cuota como pagada, enlace rápido para registrar el gasto asociado.

### Crédito ≠ Meta de ahorro

| Concepto | Qué es | Ejemplo |
|----------|--------|---------|
| **Crédito / préstamo** | Deuda con cuotas, interés y saldo pendiente | "Hipoteca Bancolombia — $180M a 20 años" |
| **Meta de ahorro** | Objetivo de acumular un monto hacia un fin | "Fondo emergencia — meta $10.000.000" |
| **Presupuesto** (Change 4) | Techo máximo de gasto en categoría | "Máximo $500.000 en Comida este mes" |

Se complementan: un pago de cuota puede ser gasto en transacciones; un aporte a meta puede ser transferencia a cuenta de ahorros.

## Alcance

### Dentro del Scope

**Créditos y préstamos**

- CRUD de crédito: nombre, entidad prestamista, monto original, tasa anual, plazo en meses, fecha inicio, día de pago (1–31).
- Generación automática de **tabla de amortización** (cuota fija mensual — sistema francés) al crear el crédito.
- Vista detalle con calendario/tabla de cuotas: pendiente, pagada, vencida.
- Marcar cuota como pagada con fecha; enlace opcional a transacción de gasto existente o flujo rápido de registro.
- Saldo pendiente calculado en tiempo real; estados `active`, `paid_off`, `defaulted` (manual en v1).
- Múltiples créditos simultáneos por usuario.
- Alertas de vencimiento configurables (offsets en días, reutilizando patrón de gastos fijos + `notificationLog`).

**Ahorros y metas**

- CRUD de meta: nombre, monto objetivo, monto actual (aportes acumulados), fecha límite opcional, icono/color, notas.
- Cuenta vinculada opcional (`accountId`) para mostrar saldo de referencia (sin reemplazar el tracking de aportes).
- Registro de **aportes** manuales (monto + fecha + nota opcional); historial por meta.
- Progreso visual: porcentaje, restante, barra de avance; estado `active`, `completed`, `paused`.
- Al alcanzar el 100 %, marcar meta como completada (automático o confirmación del usuario).
- Vista `/savings` con lista de metas activas y completadas.

**Transversal**

- Tablas Convex: `credits`, `creditPayments`, `savingsGoals`, `savingsContributions`.
- Navegación: Créditos (`/credits`), Ahorros (`/savings`) en sidebar desktop y menú «Más» móvil.
- Resumen en dashboard: widget compacto de próximas cuotas y metas destacadas (opcional P2).
- JP-DS, mobile-first, COP, accesibilidad.

### Fuera del Scope

- Tipos de amortización distintos al francés (alemán, interés simple, revolving/tarjeta) — diferido.
- Recálculo automático por prepagos o refinanciación — diferido.
- Auto-débito / sincronización bancaria.
- Inversión, CDT, renta fija como productos separados.
- Metas compartidas entre usuarios / grupos.
- Integración DIAN (Change 6).
- SMS, WhatsApp.
- Email de recordatorios de crédito (solo push + in-app en v1; email diferido).

## Capabilities

### Capabilities Nuevas

| Capability | Tipo | Descripción |
|------------|------|-------------|
| `credits` | NUEVA | CRUD créditos con amortización |
| `credit-amortization` | NUEVA | Generación y consulta de cuotas |
| `credit-payments` | NUEVA | Marcar pagado, link a transacción |
| `credit-reminders` | NUEVA | Alertas de vencimiento de cuota |
| `savings-goals` | NUEVA | CRUD metas de ahorro |
| `savings-contributions` | NUEVA | Aportes y progreso |
| `savings-progress` | NUEVA | Barras, % y estados completado |

### Capabilities Modificadas

| Capability | Tipo | Descripción |
|------------|------|-------------|
| `app-shell` | MODIFICADA | Nav Créditos + Ahorros |
| `dashboard` | MODIFICADA | Widgets próximas cuotas / metas (P2) |
| `notifications` | MODIFICADA | Tipo `credit_due` en cron diario |
| `transactions` | MODIFICADA | Origen opcional desde pago de cuota |

## Enfoque

### Modelo de datos (resumen)

```typescript
credits: {
  userId, name, lender, principal, interestRate, termMonths,
  startDate, paymentDay, outstandingBalance, status, notes?, createdAt, updatedAt
}

creditPayments: {
  creditId, installmentNumber, dueDate, paidDate?, amount,
  principal, interest, status: "pending" | "paid" | "overdue",
  transactionId?, createdAt, updatedAt
}

savingsGoals: {
  userId, name, targetAmount, currentAmount, deadline?, accountId?,
  icon?, color?, status: "active" | "completed" | "paused",
  notes?, createdAt, updatedAt
}

savingsContributions: {
  goalId, amount, contributedAt, notes?, transactionId?, createdAt
}
```

### Amortización (v1)

- **Sistema francés**: cuota fija mensual; interés sobre saldo; generación al crear crédito.
- Día de pago 31 en meses cortos: último día del mes (misma regla que gastos fijos).
- Cuotas vencidas sin pago: estado `overdue` tras la fecha de vencimiento (cron o evaluación en query).

### Aportes vs. cuenta vinculada

- `currentAmount` = suma de `savingsContributions` (fuente de verdad del progreso).
- Si hay `accountId`, la UI puede mostrar el saldo de la cuenta como referencia, pero el progreso de la meta sigue los aportes registrados (evita desincronización si el usuario gasta de esa cuenta).

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| Cálculo de amortización incorrecto | Media | Tests unitarios en lib pura; casos borde documentados |
| Scope dual (créditos + metas) | Media | Fases en `tasks.md`: créditos P1 → metas P1 → polish |
| Desincronización meta vs. cuenta | Baja | Aportes como fuente de verdad; cuenta solo referencia |
| Prepago no modelado | Media | Fuera de scope v1; notas en crédito |

## Dependencias

- `web-foundation`, `web-core`, `web-settings`, `web-budgets-reports`, `web-deploy`.
- `SPEC.md` §4.10, §4.11, §5.5 (créditos) + nuevo §5.6 (metas).
- Sistema de notificaciones push/in-app (Change 4).

## Criterios de éxito (propuesta)

1. Crédito creado genera tabla de amortización correcta en < 5 s.
2. Cuota marcada como pagada actualiza saldo y permite vincular transacción.
3. Recordatorio push/in-app llega según offsets configurados.
4. Meta de ahorro con aportes muestra progreso correcto al 1 %.
5. Meta al 100 % pasa a `completed`.
6. Navegación móvil y desktop sin regresiones 320–1440 px.
7. Datos aislados por usuario autenticado.

## Próximo paso

`/speckit-plan` → `design.md` + `tasks.md`.
