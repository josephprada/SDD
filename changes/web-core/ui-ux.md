# UI/UX Design: Web Core

**Change**: web-core  
**Fuente visual**: `desing.md` v1.1.0  
**Principio rector**: herramienta financiera mobile-first, dark-first, clara y rápida; el estilo *Green Bolt* aparece como acento funcional, no decoración.

---

## Objetivo UX

Convertir el shell autenticado en una herramienta diaria de registro financiero. El usuario debe poder:

1. Entender su estado financiero actual al abrir la app.
2. Registrar un gasto o ingreso en menos de 30 segundos.
3. Revisar y corregir movimientos sin perder confianza en los saldos.
4. Adjuntar evidencia (recibos/facturas) sin interrumpir el flujo principal.

---

## Arquitectura de Información

### Navegación principal

| Ruta | Label | Rol UX |
|------|-------|--------|
| `/` | Inicio | Dashboard financiero y acciones rápidas |
| `/transactions` | Movimientos | Historial, búsqueda, filtros, CRUD |
| `/accounts` | Cuentas | Saldos por cuenta, crear/editar/archivar, transferir |
| `/categories` | Categorías | Gestión ligera de clasificación |
| `/settings` | Ajustes | Permanece como placeholder de configuración completa |

### Mobile nav

Bottom nav con 4 entradas principales: Inicio, Movimientos, Cuentas, Más.

`Más` abre o navega a una pantalla/lista secundaria con Categorías y Ajustes. Esto evita una bottom nav saturada en 375 px.

### Desktop nav

Sidebar persistente con todas las rutas: Inicio, Movimientos, Cuentas, Categorías, Ajustes.

---

## Pantalla: Dashboard (`/`)

### Propósito

Dar una lectura rápida del mes y permitir registrar movimientos inmediatamente.

### Mobile 375

Orden vertical:

1. Header compacto existente.
2. Card principal: balance total.
3. Resumen del mes (`MonthOverview`): título “Este mes” + selector de mes (`MonthSwitcher`) y barras proporcionales de Ingresos vs Gastos con Neto destacado.
4. Cuentas activas (scroll horizontal corto o lista compacta).
5. Movimientos recientes.
6. Empty state si no hay datos.

> En mobile las acciones rápidas (`+ Gasto`, `+ Ingreso`, `Transferir`) se consolidan en un único botón de acción central (FAB `+`) dentro del nav inferior, que abre un action sheet con las tres opciones. Esto libera espacio vertical del dashboard. En desktop se mantienen como botones en la columna secundaria.

### Desktop 1280

Grid:

- Columna principal: balance + resumen mensual + recientes.
- Columna secundaria: cuentas activas + acciones rápidas.
- Header de página: título a la izquierda; a la derecha un grupo de controles alineados (`MonthSwitcher` + `+ Gasto` + `Transferir`). El panel de insight muestra las barras Ingresos vs Gastos del mes seleccionado.
- Sidebar: el bloque de usuario (avatar + nombre + tipo de cuenta) se ubica al inicio del panel; la navegación va debajo.

### Estados

| Estado | UX |
|--------|----|
| Sin cuentas | Empty state primario: “Crea tu primera cuenta para empezar a registrar movimientos.” CTA `Crear cuenta` |
| Con cuentas, sin transacciones | Mostrar balance y CTA `Registrar primer gasto` / `Registrar ingreso` |
| Loading | Skeletons de cards/listas, no spinner central |
| Error | Mensaje compacto con acción `Reintentar` |

### Copy

- Balance: “Balance total”
- Resumen: “Este mes”
- Selector de mes: etiqueta `MMMM YYYY` (p. ej. “Junio 2026”); ‹ mes anterior, › mes siguiente
- Neto del mes: “Neto del mes”
- Neto positivo: “Te queda a favor”
- Neto negativo: “Has gastado más de lo ingresado”

---

## Pantalla: Movimientos (`/transactions`)

### Propósito

Buscar, filtrar, crear y corregir transacciones.

### Mobile 375

1. Título “Movimientos”.
2. CTA primario sticky local: `+ Movimiento`.
3. Search input.
4. Chips/filtros resumidos: Fecha, Cuenta, Categoría, Monto.
5. Lista de movimientos como rows/cards compactas.
6. FAB opcional solo si el CTA superior queda fuera de vista.

### Desktop 1280

Toolbar horizontal:

- Search
- filtros como controles inline
- CTA `Nuevo movimiento`

Lista tipo tabla:

- Fecha
- Tipo
- Categoría
- Cuenta
- Nota corta
- Monto
- Acciones

### Row de movimiento

Jerarquía:

- Línea 1: categoría + monto
- Línea 2: cuenta + fecha + nota truncada
- Icono o pill por tipo: ingreso, gasto, transferencia

### Formulario de transacción

Campos:

1. Tipo: Gasto / Ingreso / Transferencia
2. Monto
3. Fecha
4. Cuenta origen
5. Cuenta destino (solo transferencia)
6. Categoría (filtrada por tipo)
7. Nota
8. Adjuntos (opcional, hasta 5)

Validaciones visibles:

- Monto mayor que 0
- Cuenta requerida
- Categoría requerida
- Transferencia: origen y destino distintos
- Máximo 5 adjuntos, 10 MB por archivo, JPEG/PNG/PDF

---

## Pantalla: Cuentas (`/accounts`)

### Propósito

Administrar los contenedores de dinero y sus saldos.

### Mobile 375

1. Título “Cuentas”.
2. CTA `Crear cuenta`.
3. Total agregado pequeño.
4. Lista de cuentas como cards compactas.
5. Acción secundaria `Transferir`.

### Desktop 1280

Grid de cuentas + panel lateral de acciones:

- Cards de cuenta con balance prominente.
- Botones: editar, archivar, transferir desde esta cuenta.

### Card de cuenta

Contenido:

- Nombre
- Tipo (Efectivo, Banco, Crédito)
- Balance
- Estado visual si balance negativo

Balance negativo:

- No bloquea.
- Usa texto/ícono de atención, no rojo agresivo salvo que el contexto lo requiera.
- Copy: “Saldo negativo” o “Pendiente por conciliar”.

### Formulario de cuenta

Campos:

- Nombre
- Tipo
- Saldo inicial (default `$ 0`)

---

## Pantalla: Categorías (`/categories`)

### Propósito

Permitir ajustes rápidos de clasificación sin convertir settings en una feature pesada.

### Layout

Tabs o segmented control:

- Gastos
- Ingresos
- Transferencias

Lista por tipo con:

- Icono
- Nombre
- Color
- Estado (sistema / archivada si se incluye)

### Reglas UX

- Categoría sistema “Transferencia” muestra lock/label “Sistema”.
- Acciones editar/archivar deshabilitadas para sistema.
- Archivar categoría muestra confirmación: “Las transacciones existentes conservarán esta categoría.”

---

## Adjuntos

### Ubicación

Los adjuntos viven dentro del formulario/detalle de transacción, no como pantalla separada.

### Patrón

- Uploader con drop/click en desktop.
- Botón táctil claro en mobile: `Añadir archivo`.
- Lista de adjuntos debajo del formulario.

### Estados

| Estado | UX |
|--------|----|
| Imagen | Miniatura + nombre + tamaño + eliminar |
| PDF | Ícono documento + nombre + tamaño + descargar/eliminar |
| Error tipo | “Solo se permiten JPG, PNG o PDF.” |
| Error tamaño | “El archivo supera 10 MB.” |
| Límite 5 | “Máximo 5 adjuntos por movimiento.” |

---

## Componentes Necesarios

### En app (`apps/web/src/components/*`)

- `DashboardBalanceCard`
- `MonthSwitcher` (selector de mes con navegación rápida ‹ ›; estado de mes seleccionado compartido por el dashboard)
- `MonthOverview` (resumen del mes: barras proporcionales Ingresos/Gastos + Neto)
- `MonthlySummaryCard`
- `RecentTransactionsList`
- `QuickActions` (desktop: botones en columna secundaria; mobile: colapsado en el FAB `+` del nav inferior que abre un action sheet)
- `AccountCard`
- `AccountForm`
- `TransferForm`
- `TransactionList`
- `TransactionFilters`
- `TransactionForm`
- `CategoryList`
- `CategoryForm`
- `AttachmentUploader`
- `AttachmentList`

### Candidatos a JP-DS

Extraer a `packages/jp-ds` sólo si se usan en 2+ dominios:

- `Card`
- `Select`
- `Dialog` o `Sheet`
- `SegmentedControl`
- `Badge`

---

## Motion e Interacción

Motion funcional, no decorativa:

- Formularios/drawers: 180–220 ms ease-out.
- Inserción de row: fade + translate corto.
- Cambios de saldo: micro-highlight 600 ms en el número actualizado.
- Reduced motion: sin translate; usar cambio instantáneo o crossfade mínimo.

No usar secuencias de entrada de página completas. El usuario entra a trabajar.

---

## Accesibilidad

- Touch targets mínimos 44×44 px.
- Inputs con labels visibles, no sólo placeholders.
- Errores asociados con `aria-describedby`.
- Montos con `font-variant-numeric: tabular-nums`.
- Confirmaciones destructivas con foco inicial y escape/cancelar.
- Estados de saldo negativo no dependen sólo de color.
- Listas vacías con acción clara.

---

## Responsive Checklist

- [ ] 320 px sin overflow horizontal.
- [ ] 375 px como artboard base.
- [ ] 768 px tablet con grids 2 columnas donde aplique.
- [ ] 1024+ con sidebar y contenido `max-width`.
- [ ] Bottom nav no tapa CTAs ni último item de lista.
- [ ] Forms usables con teclado móvil abierto.
- [ ] Tablas desktop degradan a cards mobile.

---

## Diseño Visual

### Dirección

Mantener el look `shell-bg` sobrio de `web-foundation`: oscuro, glass controlado y acento verde para acciones/selección. Las pantallas core no deben heredar la galaxia del login.

### Densidad

Producto financiero: densidad media. Priorizar legibilidad de montos y acción rápida, no ornamentación.

### Color

- Ingresos: `--color-success` / acento verde con moderación.
- Gastos: `--color-danger` sólo para semántica negativa, no para toda card.
- Transferencias: neutral + icono de intercambio.
- Saldos negativos: warning/attention, con label textual.

---

## Próximo Paso Visual

Crear artboards mobile-first para:

1. Dashboard 375 + desktop 1280.
2. Movimientos lista + formulario.
3. Cuentas lista + transferencia.
4. Categorías.
5. Adjuntos dentro de detalle/formulario de movimiento.

Si se usa Pencil, el brief inicial debe vivir en `changes/web-core/designs/design-brief.md` y los `.pen` en `changes/web-core/designs/`.
