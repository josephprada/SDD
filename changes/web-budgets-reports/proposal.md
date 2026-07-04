# Propuesta: Change 4 — Web Budgets & Reports (Presupuestos + Gastos Fijos + Reportes + Notificaciones)

**Versión**: 2.0.0
**Estado**: Planificado (alcance ampliado)
**Change**: web-budgets-reports
**Creado**: 2026-07-04
**Rama**: `feat/web-budgets-reports` (desde `testing`)

---

## Intención

Cerrar las capacidades pendientes del roadmap (`SPEC.md` §4.5 y §4.6) y añadir **gastos fijos con recordatorios** y **entrega multicanal de notificaciones** (email + Web Push), en un change ampliado:

1. **Presupuestos y alertas** — límites mensuales por categoría de gasto, progreso visual y alertas al 50 %, 80 % y 100 %.
2. **Gastos fijos** — compromisos recurrentes del mes (cuota, mercado, gym, etc.) con fecha de vencimiento y recordatorios configurables.
3. **Panel de Resultados (Reportes)** — gráficos con filtros y exportación manual CSV/PDF.
4. **Reportes automáticos por email** — al cerrar cada período (según `defaultGrouping`: semana/mes/trimestre/semestre), envío del reporte al correo de Google del usuario.
5. **Notificaciones multicanal** — recordatorios de gastos fijos y alertas de presupuesto vía **email** y **Web Push** (bandeja del móvil), gobernadas por `notificationsEnabled` y preferencias por gasto fijo.

### Presupuestos ≠ Gastos fijos

| Concepto | Qué es | Ejemplo |
|----------|--------|---------|
| **Presupuesto** | Límite máximo de gasto en una categoría durante un período | "Máximo $500.000 en Comida este mes" |
| **Gasto fijo** | Compromiso recurrente con monto y fecha de pago | "Cuota $200.000 cada día 10" |

Se complementan: un gasto fijo puede asociarse a una categoría que también tenga presupuesto, pero **no son lo mismo**. El presupuesto controla el techo; el gasto fijo recuerda cuándo pagar.

## Alcance

### Dentro del Scope

**Presupuestos**

- CRUD de presupuesto mensual por categoría de gasto (`categoryId` + `amount` límite en COP).
- Un presupuesto activo por categoría y mes (`periodKey` `"YYYY-MM"`).
- Progreso visual: gastado, restante, porcentaje, barras con estados 50/80/100 %.
- Alertas de umbral: in-app + email + push (si canales activos y `notificationsEnabled`).

**Gastos fijos**

- CRUD de gastos fijos: nombre, monto, categoría, día del mes (1–31), frecuencia mensual (v1).
- Recordatorios configurables por gasto fijo:
  - Días de antelación (p. ej. `[2, 0]` → 2 días antes y el mismo día).
  - Cantidad y offsets editables por el usuario.
- Opción de marcar como pagado / registrar transacción rápida desde el recordatorio (enlace a flujo de transacción).
- Vista `/fixed-expenses` (o sección en `/budgets`) con calendario/lista del mes.

**Reportes / Panel de Resultados**

- Vista `/reports` con gráficos: ingresos vs. gastos, por categoría, tendencia.
- Filtros: período, categoría, cuenta.
- Exportación manual CSV y PDF (cliente).

**Reportes automáticos por email**

- Al **cierre de cada período** según `defaultGrouping` del usuario, envío automático de reporte (resumen + PDF adjunto) al **email de Google** de la cuenta.
- Toggle en Ajustes: activar/desactivar reportes por email.
- Cron Convex diario que detecta períodos cerrados y evita reenvíos duplicados.

**Notificaciones multicanal**

- **Email**: recordatorios de gastos fijos y alertas de presupuesto; reportes de período. Servicio transaccional (p. ej. Resend) vía Convex action.
- **Web Push**: notificaciones en la bandeja del sistema (Android/iOS/desktop) cuando la app tiene permiso y suscripción activa.
- Service Worker + suscripciones push persistidas en Convex (`pushSubscriptions`).
- Flujo de onboarding: solicitar permiso push tras activar notificaciones; en Android se recomienda **instalar como PWA** ("Añadir a pantalla de inicio").
- `notificationsEnabled` (global) + preferencias por gasto fijo (`emailReminders`, `pushReminders`).

**Transversal**

- Tablas Convex: `budgets`, `fixedExpenses`, `pushSubscriptions`, `notificationLog` (idempotencia).
- Extensión `userPreferences`: `reportEmailEnabled`, canales preferidos.
- Navegación: Presupuestos, Gastos fijos, Reportes.
- JP-DS, mobile-first, accesibilidad.

### Fuera del Scope

- Presupuestos de ingreso, por cuenta o rango arbitrario.
- Roll-over de presupuesto al mes siguiente.
- Transacciones recurrentes con `autoCreate` automático (SPEC §5.3) — solo recordatorios + registro manual en v1; auto-create diferido.
- Frecuencias distintas a mensual en gastos fijos (semanal, anual) — diferido.
- Exportación JSON; benchmarks entre usuarios.
- SMS, WhatsApp, notificaciones nativas Android/iOS (app store).
- Créditos, DIAN — Changes 5–6.

## Capabilities

### Capabilities Nuevas

| Capability | Tipo | Descripción |
|------------|------|-------------|
| `budgets` | NUEVA | CRUD presupuestos mensuales por categoría |
| `budget-progress` | NUEVA | Gastado vs. límite y umbrales |
| `budget-alerts` | NUEVA | Alertas multicanal al cruzar umbrales |
| `fixed-expenses` | NUEVA | CRUD gastos fijos mensuales con fecha de pago |
| `expense-reminders` | NUEVA | Recordatorios configurables (offsets, canales) |
| `reports-panel` | NUEVA | Panel con gráficos y filtros |
| `report-aggregation` | NUEVA | Agregaciones para gráficos y emails |
| `report-export` | NUEVA | Exportación manual CSV/PDF |
| `report-email-delivery` | NUEVA | Envío automático de reporte al cierre de período |
| `email-notifications` | NUEVA | Envío transaccional vía proveedor email |
| `web-push` | NUEVA | Service worker, suscripciones, envío push |

### Capabilities Modificadas

| Capability | Tipo | Descripción |
|------------|------|-------------|
| `app-shell` | MODIFICADA | Navegación ampliada |
| `dashboard` | MODIFICADA | Agregaciones compartidas |
| `notifications` | MODIFICADA | De toggle pasivo a sistema multicanal real |
| `user-preferences` | MODIFICADA | `reportEmailEnabled`, preferencias de canal |
| `period-grouping` | MODIFICADA | Dispara cierre de período para emails |

## Enfoque

### Modelo de datos (resumen)

```typescript
budgets: {
  userId, categoryId, amount, periodKey, notes?, createdAt, updatedAt
}

fixedExpenses: {
  userId,
  name: string,
  amount: number,
  categoryId: Id<"categories">,
  dayOfMonth: number,           // 1-31
  reminderOffsets: number[],    // ej. [2, 0] = 2 días antes + mismo día
  emailReminders: boolean,
  pushReminders: boolean,
  active: boolean,
  notes?: string,
  createdAt, updatedAt
}

pushSubscriptions: {
  userId, endpoint, p256dh, auth, userAgent?, createdAt
}

notificationLog: {
  userId, type, referenceId, channel, sentAt
  // idempotencia: no reenviar mismo recordatorio/reporte
}

// userPreferences (extensión)
reportEmailEnabled: boolean   // default true
```

### Cómo funcionan las notificaciones en Android (decisión de producto)

JP-WALLET es una **app web** (no app de Play Store). El login con Google solo identifica al usuario; **no activa notificaciones por sí solo**.

| Canal | ¿Llega al móvil? | Requisitos |
|-------|------------------|------------|
| **Email** | Sí, en Gmail/app de correo | Email de Google en la cuenta; toggle activo |
| **Web Push** | Sí, en bandeja del sistema | Permiso del navegador + idealmente PWA instalada en Android; notificaciones de Chrome activas en el sistema |
| **In-app** | Solo con la app abierta | Siempre disponible |

**No** depende de "notificaciones de Google" genéricas: Web Push usa el **navegador** (Chrome). En Android conviene instalar JP-WALLET como PWA para recibir push de forma fiable.

### Jobs programados (Convex crons)

1. **Diario (recordatorios)**: para cada gasto fijo activo, si hoy coincide con `dueDate - offset`, enviar email y/o push (según prefs, sin duplicar vía `notificationLog`).
2. **Diario (cierre de período)**: si ayer terminó un período según `defaultGrouping` del usuario y `reportEmailEnabled`, generar y enviar reporte PDF por email.

### Infraestructura nueva

- Proveedor de email (Resend u otro) + API key en Convex env.
- Claves VAPID para Web Push.
- Service Worker en `apps/web`.
- Generación PDF server-side para emails (o snapshot reutilizable del cliente).

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| Scope muy amplio para un solo change | Alta | Fases internas en `tasks.md`; MVP por capability |
| Web Push no llega si no es PWA en Android | Media | Onboarding claro; email como canal fiable |
| Emails marcados como spam | Media | Dominio verificado, Resend, plantillas sobrias |
| Cron duplica reportes/recordatorios | Media | `notificationLog` con clave única |
| Día 31 en meses cortos | Baja | Regla: último día del mes si no existe |
| Complejidad PDF server-side | Media | Librería compartida cliente/servidor o HTML→PDF |

## Dependencias

- `web-foundation`, `web-core`, `web-settings`, `web-deploy` (prod).
- `SPEC.md` §4.5, §4.6, §5.3 (recurring, parcial).
- Servicio de email externo (nuevo).
- Web Push (VAPID, service worker).

## Criterios de éxito (propuesta)

1. Presupuesto por categoría con progreso y alertas multicanal al cruzar umbrales.
2. Gasto fijo "Cuota día 10" con recordatorios a 2 días y el mismo día, configurables.
3. Recordatorio llega por email al correo de Google del usuario.
4. Con PWA instalada y permiso concedido, recordatorio llega como push en Android.
5. Al cerrar el mes (o grouping configurado), reporte automático por email con PDF.
6. Panel `/reports` con gráficos, filtros y export manual CSV/PDF.
7. `notificationsEnabled` desactivado suprime email y push (in-app opcional o también suprimido — decidir en spec).
8. Mobile-first sin regresiones 320–1440 px.

## Próximo paso

Actualizar `spec.md` (v2) → `/speckit-plan` → `design.md` (email provider, VAPID, crons, PWA) → `tasks.md`.
