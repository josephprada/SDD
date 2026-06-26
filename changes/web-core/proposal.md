# Propuesta: Change 2 — Web Core

**Versión**: 1.0.0
**Estado**: Borrador
**Change**: web-core
**Creado**: 2026-06-25

---

## Intención

Entregar el núcleo funcional de JP-WALLET sobre la base ya establecida en `web-foundation`: gestión de **cuentas**, **categorías** y **transacciones** (CRUD completo), **adjuntos** (imágenes y PDFs) por transacción, y un **dashboard real** con balance total, resumen mensual y transacciones recientes. Este change convierte la app de un cascarón autenticado a una herramienta de finanzas personales usable de extremo a extremo.

## Alcance

### Dentro del Scope

- **Gestión de Cuentas**: CRUD de cuentas (efectivo, banco, tarjeta de crédito), saldo inicial al crear, saldo en tiempo real por cuenta, archivado seguro.
- **Transferencias entre cuentas**: movimiento de fondos modelado como transacción de tipo `transfer` (cuenta origen → cuenta destino).
- **Motor de Transacciones**: CRUD de ingresos, gastos y transferencias (monto, fecha, categoría, cuenta, notas); lista paginada; búsqueda y filtros por fecha, categoría, cuenta y rango de monto.
- **Gestión de Categorías**: CRUD más allá del seed (crear, editar, archivar) con nombre, icono y color; respeta tipos ingreso/gasto/transferencia.
- **Adjuntos**: subir, listar, previsualizar, descargar y eliminar imágenes (JPEG/PNG) y PDFs asociados a una transacción, vía Convex file storage.
- **Dashboard**: balance total agregado, resumen mensual (ingresos vs gastos del mes en curso), lista de transacciones recientes y acciones rápidas (+ ingreso / + gasto).
- **Schema Convex**: tablas `accounts`, `transactions`, `categories`, `attachments` (extiende `users` + `userPreferences` ya existentes).
- **Formato de moneda COP**: `$ 1.234.567` (punto como separador de miles) en toda la UI de montos.

### Fuera del Scope

- **Presupuestos y alertas** (Change 4)
- **Reportes y Panel de Resultados con gráficos** avanzados / exports PDF-CSV (Change 4)
- **Configuración completa**: gestión de categorías como panel dedicado de settings, agrupación temporal configurable (semana/trimestre/semestre), idioma, notificaciones (Change 3)
- **Declaración de Renta** (Change 5) y **Créditos y Préstamos** (Change 6)
- **Transacciones recurrentes** (scheduled functions) — diferidas a un change posterior
- **Gastos compartidos / grupos** (futuro)
- **Re-exposición del theme toggle en UI** (sigue oculto por decisión D-07 de `web-foundation`; lógica disponible)

## Capabilities

### Capabilities Nuevas

| Capability | Tipo | Descripción |
|------------|------|-------------|
| `accounts` | NUEVA | CRUD de cuentas, saldo inicial, saldo en tiempo real, transferencias entre cuentas, archivado |
| `transactions` | NUEVA | CRUD de ingresos/gastos/transferencias, lista, búsqueda y filtros |
| `categories` | NUEVA | CRUD de categorías (crear/editar/archivar) con icono y color, por tipo |
| `attachments` | NUEVA | Subida/listado/preview/descarga/eliminación de imágenes y PDFs por transacción |
| `dashboard` | NUEVA | Balance total, resumen mensual, transacciones recientes, acciones rápidas |

### Capabilities Modificadas

| Capability | Tipo | Descripción |
|------------|------|-------------|
| `app-shell` | MODIFICADA | Nuevas rutas protegidas (`/accounts`, `/transactions`, `/categories`) y navegación a las pantallas core; `/` pasa de placeholder a dashboard real |

## Enfoque

### Modelo de Datos (extensión del schema)

Se añaden al schema Convex las tablas definidas en `SPEC.md` §5.2:

- `accounts` — `userId`, `name`, `type` (`cash` | `bank` | `credit`), `initialBalance`, `balance`, `archived`, timestamps
- `categories` — `userId`, `name`, `icon`, `color`, `kind` (`income` | `expense` | `transfer`), `archived`, timestamps
- `transactions` — `userId`, `type` (`income` | `expense` | `transfer`), `amount`, `date`, `accountId`, `toAccountId?` (solo transfer), `categoryId`, `notes?`, timestamps
- `attachments` — `userId`, `entityType` (`transaction` en este change), `entityId`, `storageId`, `filename`, `mimeType`, `size`, `uploadedAt`

### Saldo de Cuentas

El saldo se mantiene consistente tras cada mutación de transacción (crear/editar/eliminar/transferir). La estrategia concreta (denormalizado vs. derivado) se decide en `design.md`; la spec sólo exige corrección y consistencia en tiempo real.

### Transferencias

Una transferencia es **una** transacción `type: "transfer"` con `accountId` (origen) y `toAccountId` (destino). Resta del origen y suma al destino. No genera categoría de gasto/ingreso (usa la categoría sistema "Transferencia").

### Adjuntos

Subida vía Convex file storage; se valida `mimeType` (`image/jpeg`, `image/png`, `application/pdf`) y tamaño máximo (10 MB por archivo, configurable). Preview inline para imágenes, visor/descarga para PDFs.

### Dashboard

Lee agregados desde Convex en tiempo real: balance total (suma de saldos de cuentas activas), resumen del mes en curso (ingresos vs gastos), y últimas N transacciones. Acciones rápidas abren el formulario de transacción precargado por tipo.

## Áreas Afectadas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `convex/schema.ts` | Modificado | Añade `accounts`, `transactions`, `categories`, `attachments` |
| `convex/accounts.ts`, `convex/transactions.ts`, `convex/categories.ts`, `convex/attachments.ts` | Nuevo | Queries y mutations de dominio + storage |
| `apps/web/src/routes/` | Modificado/Nuevo | `/` (dashboard real), `/accounts`, `/transactions`, `/categories` |
| `apps/web/src/components/` | Nuevo | Pantallas y formularios de cuentas, transacciones, categorías, adjuntos, dashboard |
| `apps/web/src/components/shell/Nav*.tsx` | Modificado | Entradas de navegación a las pantallas core |
| `packages/jp-ds/` | Posible | Componentes adicionales si se requieren (p. ej. Select, Dialog, Card) |
| `apps/web/src/lib/format/` | Nuevo | Formateo de moneda COP y fechas |

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| Inconsistencia de saldo tras editar/eliminar transacciones | Media | Mutaciones transaccionales en Convex; recalcular delta old→new en un solo handler |
| Transferencias mal modeladas (doble conteo) | Media | Modelo único `transfer`; tests manuales origen/destino |
| Adjuntos: archivos grandes o tipos no permitidos | Media | Validación de `mimeType` y tamaño en cliente y servidor |
| Crecimiento de queries del dashboard (N+1) | Baja | Índices Convex por `userId` + `date`; agregados acotados al mes |
| Borrado de cuenta/categoría con históricos | Media | Archivado (soft delete); bloquear borrado duro si hay transacciones |
| Scope creep hacia reportes/presupuestos | Media | Fuera de scope explícito; diferir a Change 4 |

## Plan de Rollback

`git revert` del merge commit. Las tablas nuevas quedan inertes si la UI se revierte; datos de prueba en Convex dev se limpian vía dashboard. Estado pre-change recuperable sin afectar `users`/`userPreferences`.

## Dependencias

- `web-foundation` completado (auth, shell, JP-DS, schema base) — ✅ en `testing`
- Convex file storage habilitado en el proyecto
- `desing.md` v1.1.0 (contrato visual JP-DS, componentes y motion)
- `SPEC.md` §4.2, §4.3, §4.4, §4.6 (dashboard básico), §5 (modelo de datos)

## Criterios de Éxito

Ver `spec.md` §Criterios de Éxito.
