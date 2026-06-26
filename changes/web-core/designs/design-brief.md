# Design Brief: Web Core UI/UX

**Change**: web-core  
**Fuente**: `changes/web-core/ui-ux.md`, `desing.md` v1.1.0  
**Objetivo**: producir artboards listos para implementación de las pantallas core.

---

## Dirección Visual

JP-WALLET core debe sentirse como una herramienta financiera premium y operativa:

- Dark-first, fondo `shell-bg` sobrio.
- Glass controlado sólo para superficies principales.
- Verde `--color-accent` para CTA, foco, selección y estados positivos.
- Montos con figuras tabulares y alta legibilidad.
- Nada de galaxia en pantallas autenticadas; la galaxia queda reservada para login.

---

## Artboards Obligatorios

### 1. Dashboard

| Viewport | Tamaño | Contenido |
|----------|--------|-----------|
| Mobile | 375 × 812 | balance total, acciones rápidas, resumen mensual, cuentas, recientes |
| Desktop | 1280 × 900 | sidebar, grid dashboard, panel secundario de cuentas/acciones |

Estados:

- Sin cuentas
- Con cuentas sin transacciones
- Con actividad mensual

### 2. Movimientos

| Viewport | Tamaño | Contenido |
|----------|--------|-----------|
| Mobile | 375 × 812 | search, filtros chips, lista cards, CTA |
| Desktop | 1280 × 900 | toolbar, filtros inline, tabla |

Estados:

- Lista con datos
- Sin resultados por filtro
- Formulario de nuevo movimiento
- Formulario con validación de error

### 3. Cuentas

| Viewport | Tamaño | Contenido |
|----------|--------|-----------|
| Mobile | 375 × 812 | lista cards, total, crear, transferir |
| Desktop | 1280 × 900 | grid de cuentas + panel acciones |

Estados:

- Cuenta con saldo positivo
- Cuenta con saldo negativo
- Formulario crear/editar cuenta
- Transferencia origen/destino

### 4. Categorías

| Viewport | Tamaño | Contenido |
|----------|--------|-----------|
| Mobile | 375 × 812 | segmented control gastos/ingresos/transferencias, lista |
| Desktop | 1280 × 900 | lista por tipo con panel/form |

Estados:

- Categoría editable
- Categoría sistema bloqueada
- Confirmación de archivar

### 5. Adjuntos en Movimiento

| Viewport | Tamaño | Contenido |
|----------|--------|-----------|
| Mobile | 375 × 812 | formulario movimiento + adjuntos compactos |
| Desktop | 1280 × 900 | detalle/formulario con uploader y lista |

Estados:

- Imagen con preview
- PDF con icono/descarga
- Error tipo no permitido
- Límite máximo 5 adjuntos

---

## Componentes de Diseño

Diseñar variantes visuales para:

- Card financiera
- Row/card de movimiento
- Account card
- Amount text positive/negative/neutral
- Filter chip
- Segmented control
- Empty state
- Attachment item
- Dialog/sheet de confirmación
- Form field error state

---

## Reglas de Responsive

- Base 375 px; desktop es expansión, no rediseño paralelo.
- Sin overflow horizontal en 320 px.
- Bottom nav no debe tapar CTAs ni último item.
- Formularios mobile pueden ocupar pantalla completa o sheet casi fullscreen.
- Desktop puede usar tabla para movimientos; mobile siempre cards.

---

## Copy Base

- Dashboard empty: “Crea tu primera cuenta para empezar a registrar movimientos.”
- Transactions empty filter: “No encontramos movimientos con estos filtros.”
- Negative balance: “Saldo negativo” / “Pendiente por conciliar.”
- Attachment type error: “Solo se permiten JPG, PNG o PDF.”
- Attachment limit: “Máximo 5 adjuntos por movimiento.”
- Archive category: “Las transacciones existentes conservarán esta categoría.”

---

## Handoff Esperado

Cada artboard debe incluir:

- Estados principales y vacío.
- Tokens usados (`--color-*`, `--space-*`, `--radius-*`).
- Notas responsive.
- Componentes candidatos a JP-DS.
- Estados de foco/error/deshabilitado para formularios críticos.

---

## Estado de Artboards (`webcore.pen`)

| Pantalla | Mobile 375 | Desktop 1280 | Notas |
|----------|-----------|--------------|-------|
| Dashboard | ✅ | ✅ | Incluye `MonthSwitcher`, barras Ingresos/Gastos, FAB de acciones (mobile) y panel Acciones rápidas (desktop) |
| Movimientos | ✅ | ✅ | Mobile: search + chips + lista agrupada por día. Desktop: toolbar + tabla |
| Cuentas | ✅ | ✅ | Grid de cuentas con estado de saldo negativo (Nu) y tile "Nueva cuenta" |
| Categorías | ✅ | ✅ | Segmented Gastos/Ingresos/Transferencias; desktop con panel de edición (form) |
| Adjuntos / Movimiento | ✅ | ✅ | Formulario + uploader, ítems imagen/PDF, estado de error de tipo y límite 5 |
| Estados secundarios | ✅ | ✅ | Empty dashboard, sin resultados por filtro, confirmación de archivar y validación de formularios |

**Estado de diseño visual**: artboards base y estados secundarios críticos completados. Pendientes opcionales: variantes de loading/skeleton y estado de permisos/restricción si aparecen durante implementación.

### Componentes reutilizables en el `.pen`

Base JP-DS candidatos generados como componentes Pencil:

- `Button / Primary`, `Button / Secondary`
- `Card / Metric`, `Card / Account Compact`
- `Row / Transaction`, `Row / Category`
- `Month Switcher`
- `Filter Chip`
- `Attachment Item`
- `Category Choice`

Marca: el logotipo reutiliza `public/icon.svg` (bolt "Green Bolt") reproducido como nodos `path` en headers mobile y desktop.
