# Feature Specification: Web Budgets & Reports (v2 — alcance ampliado)

**Feature Branch**: `feat/web-budgets-reports`

**Created**: 2026-07-04

**Status**: Draft (v2 — gastos fijos + email + Web Push)

**Change**: web-budgets-reports (Change 4)

**Input**: Roadmap `SPEC.md` §4.5–4.6 + gastos fijos, reportes por email al cierre de período, recordatorios configurables, notificaciones email + Web Push.

---

## Resumen

Este change entrega control financiero proactivo en cuatro pilares:

| Pilar | Descripción |
|-------|-------------|
| **Presupuestos** | Límite mensual por categoría; progreso y alertas al 50/80/100 % |
| **Gastos fijos** | Compromisos recurrentes (cuota, gym, mercado) con fecha y recordatorios configurables |
| **Reportes** | Panel con gráficos, filtros, export manual y **envío automático por email** al cierre de período |
| **Notificaciones** | Email + Web Push (+ in-app); no dependen del login con Google para entregarse |

**Dentro:** presupuestos, gastos fijos mensuales, recordatorios con offsets configurables, reportes automáticos por email, Web Push, export CSV/PDF manual, navegación.

**Fuera:** auto-creación de transacciones recurrentes, frecuencias no mensuales, SMS/WhatsApp, app nativa Play Store, roll-over de presupuesto.

---

## Conceptos clave

### Presupuesto vs. gasto fijo

- **Presupuesto**: "No quiero gastar más de X en esta categoría este mes." Mide gasto acumulado vs. techo.
- **Gasto fijo**: "Cada día 10 pago X por la cuota." Tiene fecha de vencimiento y recordatorios.

Un gasto fijo puede usar la misma categoría que un presupuesto; son entidades distintas.

### Notificaciones en Android (login con Google)

- **Login con Google** = identidad (email, nombre). No habilita notificaciones automáticamente.
- **Email**: llega a Gmail/correo del móvil sin abrir la app. Requiere `reportEmailEnabled` / recordatorios activos.
- **Web Push**: notificación en la bandeja del sistema. Requiere:
  1. Permiso de notificaciones del **navegador** (Chrome en Android).
  2. Notificaciones de Chrome **activas** en Ajustes del teléfono.
  3. Recomendado: **instalar JP-WALLET como PWA** ("Añadir a pantalla de inicio") para entrega fiable en Android.
- **In-app**: solo con la pestaña/app abierta.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Presupuesto por categoría (Priority: P1)

Como usuario, quiero fijar un límite mensual por categoría y ver mi progreso, para no pasarme del techo.

**Acceptance Scenarios**:

1. **Given** gastos de $300.000 en "Comida", **When** creo presupuesto $500.000, **Then** veo 60 %, restante $200.000.
2. **Given** presupuesto existente para "Comida" este mes, **When** intento duplicar, **Then** se rechaza.
3. **Given** presupuesto al 85 % y notificaciones activas, **When** registro un gasto que cruza 80 %, **Then** alerta in-app y (si canales activos) email y/o push.

---

### User Story 2 - Gestionar gastos fijos del mes (Priority: P1)

Como usuario, quiero registrar mis pagos recurrentes (cuota día 10, gym día 1, mercado semanal simplificado a mensual), para no olvidarlos.

**Why this priority**: Necesidad explícita del usuario; independiente de presupuestos.

**Independent Test**: Crear gasto fijo "Cuota" $200.000 día 10; verificar que aparece en la lista del mes con fecha y monto.

**Acceptance Scenarios**:

1. **Given** ningún gasto fijo, **When** creo "Cuota préstamo" $200.000 categoría "Deudas" día 10, **Then** aparece en la vista de gastos fijos con próxima fecha.
2. **Given** un gasto fijo, **When** lo edito o desactivo, **Then** los cambios persisten y los recordatorios futuros respetan el estado.
3. **Given** gasto fijo activo, **When** lo marco como pagado, **Then** puedo registrar la transacción asociada rápidamente (o queda marcado para el mes).

---

### User Story 3 - Recordatorios configurables (Priority: P1)

Como usuario, quiero que me avisen 2 días antes y el mismo día del pago, y poder configurar cuántos avisos y con qué antelación.

**Acceptance Scenarios**:

1. **Given** gasto fijo día 10 con offsets `[2, 0]`, **When** llega el día 8, **Then** recibo recordatorio (email y/o push según prefs).
2. **Given** el mismo gasto, **When** llega el día 10, **Then** recibo segundo recordatorio.
3. **Given** offsets `[7, 2, 0]`, **When** configuro el gasto fijo, **Then** se envían hasta 3 recordatorios en esas fechas (sin duplicar el mismo offset/día).
4. **Given** `notificationsEnabled` desactivado globalmente, **When** llega fecha de recordatorio, **Then** no se envían email ni push (in-app puede mostrar badge al abrir la app).

---

### User Story 4 - Panel de Resultados y export manual (Priority: P1)

Como usuario, quiero gráficos y exportar CSV/PDF bajo demanda.

**Acceptance Scenarios**:

1. **Given** transacciones del mes, **When** abro `/reports`, **Then** veo ingresos vs. gastos, por categoría y tendencia.
2. **Given** filtros aplicados, **When** exporto CSV o PDF, **Then** los datos coinciden con el panel.

---

### User Story 5 - Reporte automático por email al cierre de período (Priority: P2)

Como usuario, quiero recibir mi reporte por correo cuando termine cada mes (o semana/trimestre/semestre según mi agrupación), sin tener que entrar a la app.

**Acceptance Scenarios**:

1. **Given** `defaultGrouping: "month"` y `reportEmailEnabled: true`, **When** termina el mes, **Then** recibo email al correo de Google con resumen y PDF adjunto.
2. **Given** `reportEmailEnabled: false`, **When** termina el período, **Then** no se envía email.
3. **Given** un período ya reportado, **When** el cron corre de nuevo, **Then** no se reenvía (idempotencia).

---

### User Story 6 - Web Push en el móvil (Priority: P2)

Como usuario en Android, quiero ver recordatorios y alertas en la bandeja de notificaciones aunque no tenga la app abierta.

**Acceptance Scenarios**:

1. **Given** notificaciones activas, **When** concedo permiso push y (recomendado) instalo PWA, **Then** la suscripción se guarda en el servidor.
2. **Given** suscripción activa, **When** llega recordatorio de gasto fijo, **Then** aparece notificación en la bandeja del sistema.
3. **Given** permiso denegado, **When** llega recordatorio, **Then** email sigue funcionando si está activo; la UI explica cómo activar push.

---

### User Story 7 - Navegación (Priority: P3)

Accesos a Presupuestos, Gastos fijos y Reportes en móvil y escritorio.

---

### Edge Cases

- Día 31 en febrero/abril: usar **último día del mes**.
- Gasto fijo desactivado: no enviar recordatorios.
- Usuario sin email en perfil: no enviar email; log de error silencioso.
- Push sin suscripción: solo email.
- Presupuesto y gasto fijo en misma categoría: ambos funcionan independientemente.
- Zona horaria: crons y fechas en timezone del usuario (`es-CO` por defecto).
- Período sin transacciones: email con reporte vacío legible, no error.

## Requirements *(mandatory)*

### Presupuestos

- **FR-001** a **FR-007**: (sin cambio respecto v1) CRUD, unicidad, progreso, umbrales.
- **FR-008**: Alertas de presupuesto MUST enviarse por email y/o push además de in-app, según `notificationsEnabled` y canales del usuario.

### Gastos fijos

- **FR-009**: CRUD de gasto fijo: nombre, monto (>0), categoría gasto, día del mes (1–31), activo/inactivo.
- **FR-010**: Recordatorios MUST configurarse con lista de offsets en días (`reminderOffsets`, ej. `[2, 0]`).
- **FR-011**: Por gasto fijo, toggles `emailReminders` y `pushReminders`.
- **FR-012**: Vista de gastos fijos con próxima fecha de pago y estado del mes.

### Notificaciones

- **FR-013**: `notificationsEnabled` global MUST suprimir email y push; in-app puede mostrarse al abrir la app.
- **FR-014**: Sistema MUST persistir suscripciones Web Push por dispositivo.
- **FR-015**: Sistema MUST solicitar permiso push solo tras acción explícita del usuario (no al login).
- **FR-016**: Sistema MUST usar `notificationLog` para no duplicar envíos.
- **FR-017**: UI MUST explicar requisitos PWA/permisos en Android.

### Reportes

- **FR-018** a **FR-022**: Panel, filtros, gráficos, export manual (como v1).
- **FR-023**: Al cierre de período según `defaultGrouping`, MUST enviar reporte por email si `reportEmailEnabled`.
- **FR-024**: Email MUST ir al correo de la cuenta Google autenticada.
- **FR-025**: Toggle `reportEmailEnabled` en Ajustes.

### Transversal

- **FR-026**: Mobile-first 375 px; tokens JP-DS; a11y en gráficos.
- **FR-027**: Datos aislados por usuario autenticado.

### Key Entities

- **Budget**: límite por categoría/mes (tabla `budgets`).
- **FixedExpense**: compromiso recurrente mensual con offsets y canales (tabla `fixedExpenses`).
- **PushSubscription**: endpoint y claves por dispositivo.
- **NotificationLog**: registro de envíos para idempotencia.
- **Report Dataset**: agregación derivada (sin tabla).

## Success Criteria *(mandatory)*

- **SC-001**: Presupuesto creado y progreso correcto en < 30 s.
- **SC-002**: Gasto fijo con recordatorio `[2, 0]` dispara email el día correcto (±0 días).
- **SC-003**: Push llega a Android con PWA + permiso en < 1 min del cron.
- **SC-004**: Reporte de mes enviado una sola vez al cierre.
- **SC-005**: Gráficos cargan en < 2 s; filtros en < 1 s.
- **SC-006**: 0 duplicados de presupuesto categoría+mes.
- **SC-007**: Usuario sin permiso push sigue recibiendo email.

## Assumptions

- Frecuencia de gastos fijos: **mensual** en v1 (`SPEC.md` §5.3 ampliable después).
- Email vía proveedor transaccional (Resend o similar); dominio `lavalex.co` verificado.
- Web Push con VAPID; Chrome Android + PWA como target principal móvil.
- Crons Convex en UTC con conversión a timezone usuario.
- PDF de email generado server-side o HTML estático; export manual sigue en cliente.
- El email de envío es el de Google OAuth (read-only en perfil).
