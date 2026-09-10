# Feature Specification: Notifications Polish + Fijos omitidos

**Feature Branch**: `feat/notifications-polish`  
**Created**: 2026-09-10  
**Status**: Draft  
**Change**: notifications-polish (Change 9)

**Input**: Pulir notificaciones existentes (copy, deep links, push solo fuera de foreground); mora de gasto fijo a +3 y +6 días; estado “omitir este mes” que excluye el fijo de notificaciones y del dashboard de pendientes.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Push solo con la app cerrada o en background (Priority: P1)

Como usuario con push activo, quiero recibir la notificación del sistema **solo cuando no estoy usando la app**, y un toast in-app cuando sí la estoy usando, para no duplicar ruido.

**Acceptance Scenarios**:

1. **Given** push habilitado y la PWA/web en foreground (ventana visible/focused), **When** llega un evento notificable (p. ej. prueba o reminder), **Then** el usuario ve feedback **in-app** y **no** se añade (o no se muestra) una notificación de bandeja OS por ese evento.
2. **Given** push habilitado y la app en background o cerrada, **When** llega el mismo tipo de evento, **Then** aparece la notificación en la **bandeja del sistema**.
3. **Given** el usuario toca la notificación OS, **When** la app abre/enfoca, **Then** navega a la URL del payload (presupuesto, fijos o crédito según el tipo).

---

### User Story 2 - Copy y deep links claros (Priority: P2)

Como usuario, quiero títulos/cuerpos accionables (nombre, monto, plazo) y que al tocar vaya al lugar correcto.

**Acceptance Scenarios**:

1. **Given** un reminder de gasto fijo, **When** se despacha, **Then** title/body incluyen el nombre del fijo y contexto de vencimiento/mora; `url` apunta a la superficie de fijos/presupuestos.
2. **Given** umbral de presupuesto o crédito por vencer, **When** se despacha, **Then** `url` apunta a presupuestos o al detalle/listado de créditos respectivamente.

---

### User Story 3 - Mora +3 y +6 días sin pagar (Priority: P1)

Como usuario, quiero un aviso si un gasto fijo venció y **sigue sin pagar** a los 3 y a los 6 días, para no dejarlo pasar.

**Acceptance Scenarios**:

1. **Given** un fijo activo, no omitido este mes, con vencimiento hace exactamente 3 días y **sin** pago en el período, **When** corre el cron diario, **Then** se despacha in-app (+ push si corresponde) de mora +3 (una vez / dedupe).
2. **Given** las mismas condiciones con 6 días de mora, **When** corre el cron, **Then** se despacha el aviso de mora +6 (dedupe independiente del +3).
3. **Given** el fijo ya pagado en el período **o** marcado omitido este mes, **When** corre el cron en día +3 o +6, **Then** **no** se envía mora.
4. **Given** el fijo aún no ha vencido, **When** corre el cron, **Then** no se envían avisos de mora (solo reminders por `reminderOffsets` si aplican).

---

### User Story 4 - Omitir este mes (Priority: P1)

Como usuario, quiero marcar un gasto fijo como **“no lo pago este mes”** (p. ej. ahorro), para que deje de molestar en notificaciones y en el dashboard de pendientes, sin desactivar el fijo para siempre.

**Acceptance Scenarios**:

1. **Given** un fijo pendiente del período corriente, **When** el usuario elige “Omitir este mes”, **Then** el fijo deja de contar en `pendingTotal` / proyección “si pagas fijos” y no recibe reminders ni mora ese período.
2. **Given** un fijo omitido este mes, **When** el usuario elige “Reactivar” (quitar omitir), **Then** vuelve a pendientes y a la lógica de notificaciones si sigue impago.
3. **Given** un fijo omitido en período P, **When** inicia el período P+1, **Then** el omitir de P **no** aplica a P+1 (debe volver a ser elegible salvo nuevo omitir).
4. **Given** `active: false`, **When** el usuario mira omitir, **Then** el fijo inactivo sigue fuera de pendientes (omitir no sustituye desactivar).

---

## Edge Cases

- Varios fijos en mora el mismo día: un dispatch por fijo (dedupe por id + offset overdue).  
- Cambio de zona horaria: usar la misma base de fechas que reminders actuales (UTC/cron existente).  
- Foreground detection fallida en algún WebView: preferir no spamear OS si hay client focused; documentar límite.  

---

## Success Criteria

- SC-001: Push OS ausente en foreground; presente en background (escenario reproducible).  
- SC-002: Mora +3/+6 solo con impago y sin omitir.  
- SC-003: Omitir este mes excluye pendientes + notificaciones del período.  
- SC-004: Deep link funcional al tocar push.  
- SC-005: Triggers previos (presupuesto, offsets fijos, créditos) siguen operativos.  
