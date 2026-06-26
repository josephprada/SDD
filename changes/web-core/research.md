# Research: Web Core

## Decision: saldos denormalizados en `accounts.balance`

**Rationale**: El dashboard necesita balance total y cuentas en tiempo real. Recalcular desde todas las transacciones en cada render complica queries y escala peor. Mantener `balance` actualizado por deltas hace las lecturas simples y rápidas.

**Alternatives considered**:
- Saldo derivado siempre desde transacciones: más seguro conceptualmente, pero costoso para dashboard/listas.
- Agregados mensuales persistidos: útil para reportes futuros, excesivo para Change 2.

## Decision: transferencias como una sola transacción

**Rationale**: Una fila `type: "transfer"` con `accountId` origen y `toAccountId` destino evita doble conteo en resúmenes de ingresos/gastos. La UI presenta la transferencia como una operación atómica.

**Alternatives considered**:
- Dos transacciones enlazadas (expense + income): complica filtros, resúmenes y eliminación.
- Tabla separada `transfers`: fragmenta el historial financiero.

## Decision: soft delete para cuentas y categorías con historial

**Rationale**: Finanzas personales requieren trazabilidad. Si una cuenta o categoría ya fue usada, archivar conserva histórico sin aparecer en formularios nuevos.

**Alternatives considered**:
- Borrado duro con cascade: riesgoso para auditoría e integridad.
- Bloquear cualquier eliminación: frustra gestión diaria.

## Decision: Convex file storage para adjuntos

**Rationale**: Ya se usa Convex como backend. File storage evita introducir otro proveedor, mantiene ownership cerca de metadata y reduce complejidad operativa.

**Alternatives considered**:
- S3/R2 externo: más flexible, pero no necesario para MVP.
- Base64 en DB: malo para rendimiento y coste.

## Decision: dashboard mensual sin agrupación configurable

**Rationale**: Change 2 busca dashboard real mínimo. La agrupación semana/trimestre/semestre pertenece a configuración completa (Change 3).

**Alternatives considered**:
- Implementar todos los periodos ahora: aumenta scope y superficie de UI.
- Sin resumen mensual: reduce valor del dashboard.
