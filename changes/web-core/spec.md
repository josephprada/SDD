# Change 2 — Web Core

**Versión**: 1.1.0
**Estado**: Completada
**Change**: web-core
**Creado**: 2026-06-25
**Completada**: 2026-07-03
**Rama de entrega**: `testing` (merge desde `feat/web-core`)

---

## Propuesta

### Intención
Entregar el núcleo funcional de JP-WALLET sobre la base de `web-foundation`: gestión de cuentas, categorías y transacciones (CRUD completo), adjuntos (imágenes y PDFs) por transacción, y un dashboard real con balance total, resumen mensual y transacciones recientes.

### Alcance

**Dentro del Scope:**
- CRUD de cuentas (efectivo, banco, tarjeta de crédito) con saldo inicial y saldo en tiempo real
- Transferencias entre cuentas (transacción tipo `transfer`)
- CRUD de transacciones (ingreso, gasto, transferencia) con monto, fecha, categoría, cuenta y notas
- Lista de transacciones con búsqueda y filtros (fecha, categoría, cuenta, rango de monto)
- CRUD de categorías (crear, editar, archivar) con nombre, icono y color, por tipo
- Adjuntos: subir, listar, previsualizar, descargar y eliminar imágenes (JPEG/PNG) y PDFs por transacción
- Dashboard: balance total, resumen mensual (ingresos vs gastos), transacciones recientes, acciones rápidas
- Formato de moneda COP (`$ 1.234.567`) en toda la UI de montos
- Extensión del schema Convex: `accounts`, `transactions`, `categories`, `attachments`

**Fuera del Scope:**
- Presupuestos y alertas (Change 4)
- Reportes / Panel de Resultados con gráficos y exports (Change 4)
- Panel de configuración completo, agrupación temporal configurable, idioma, notificaciones (Change 3)
- Declaración de Renta (Change 5), Créditos y Préstamos (Change 6)
- Transacciones recurrentes (diferidas)
- Gastos compartidos / grupos (futuro)
- Re-exposición del theme toggle en UI (oculto desde `web-foundation`)

### Capabilities

| Capability | Tipo | Descripción |
|------------|------|-------------|
| `accounts` | NUEVA | CRUD de cuentas, saldo inicial, saldo en tiempo real, transferencias, archivado |
| `transactions` | NUEVA | CRUD de ingresos/gastos/transferencias, lista, búsqueda y filtros |
| `categories` | NUEVA | CRUD de categorías (crear/editar/archivar) con icono y color, por tipo |
| `attachments` | NUEVA | Subida/listado/preview/descarga/eliminación de imágenes y PDFs por transacción |
| `dashboard` | NUEVA | Balance total, resumen mensual, transacciones recientes, acciones rápidas |
| `app-shell` | MODIFICADA | Rutas core (`/accounts`, `/transactions`, `/categories`) y `/` como dashboard real |

---

## Especificación

### Dominio: accounts

#### Requisito: Crear Cuenta
El sistema DEBE permitir crear una cuenta con nombre, tipo y saldo inicial.

**Escenario: Creación válida**
- GIVEN un usuario autenticado en la pantalla de cuentas
- WHEN crea una cuenta con nombre "Efectivo", tipo `cash` y saldo inicial `$ 100.000`
- THEN la cuenta DEBE aparecer en la lista con saldo `$ 100.000`

**Escenario: Nombre vacío**
- GIVEN el formulario de nueva cuenta
- WHEN el usuario intenta guardar sin nombre
- THEN el sistema DEBE bloquear el guardado y mostrar un error de validación

**Escenario: Saldo inicial por defecto**
- GIVEN el formulario de nueva cuenta
- WHEN el usuario no especifica saldo inicial
- THEN el sistema DEBE asumir saldo inicial `$ 0`

#### Requisito: Editar Cuenta
El sistema DEBE permitir editar nombre y tipo de una cuenta existente.

**Escenario: Edición de nombre**
- GIVEN una cuenta existente "Banco"
- WHEN el usuario cambia el nombre a "Bancolombia" y guarda
- THEN la lista DEBE reflejar "Bancolombia" sin alterar el saldo

#### Requisito: Archivar Cuenta
El sistema DEBE permitir archivar una cuenta y NO DEBE permitir el borrado duro si tiene transacciones asociadas.

**Escenario: Archivar cuenta con transacciones**
- GIVEN una cuenta con transacciones asociadas
- WHEN el usuario elige eliminar la cuenta
- THEN el sistema DEBE archivarla (soft delete) y conservar sus transacciones históricas

**Escenario: Cuenta archivada fuera de selección**
- GIVEN una cuenta archivada
- WHEN el usuario crea una nueva transacción
- THEN la cuenta archivada NO DEBE aparecer como opción seleccionable

#### Requisito: Orden de Cuentas
El sistema DEBE permitir reordenar cuentas activas y reflejar ese orden en toda la UI.

**Escenario: Reordenar cuentas**
- GIVEN al menos dos cuentas activas en `/accounts`
- WHEN el usuario arrastra una card sobre otra
- THEN el orden DEBE persistirse y reflejarse en la lista de cuentas

**Escenario: Orden en selectores**
- GIVEN cuentas con orden personalizado
- WHEN el usuario abre un selector de cuenta (p. ej. en el formulario de transacción)
- THEN las opciones DEBEN aparecer en el mismo orden que en la pantalla de cuentas

#### Requisito: Saldo en Tiempo Real
El sistema DEBE mostrar el saldo actualizado de cada cuenta tras cada operación.

**Escenario: Saldo tras gasto**
- GIVEN una cuenta "Efectivo" con saldo `$ 100.000`
- WHEN se registra un gasto de `$ 30.000` en esa cuenta
- THEN el saldo de "Efectivo" DEBE mostrar `$ 70.000`

#### Requisito: Transferencia entre Cuentas
El sistema DEBE permitir transferir fondos entre dos cuentas en una sola operación.

**Escenario: Transferencia válida**
- GIVEN cuenta "Efectivo" con `$ 100.000` y cuenta "Banco" con `$ 0`
- WHEN el usuario transfiere `$ 40.000` de "Efectivo" a "Banco"
- THEN "Efectivo" DEBE mostrar `$ 60.000` y "Banco" DEBE mostrar `$ 40.000`

**Escenario: Cuenta origen y destino iguales**
- GIVEN el formulario de transferencia
- WHEN el usuario selecciona la misma cuenta como origen y destino
- THEN el sistema DEBE bloquear la operación con un error de validación

---

### Dominio: categories

#### Requisito: Crear Categoría
El sistema DEBE permitir crear categorías con nombre, icono, color y tipo.

**Escenario: Creación válida**
- GIVEN un usuario autenticado en la gestión de categorías
- WHEN crea una categoría "Mascotas" con icono y color para tipo `expense`
- THEN la categoría DEBE aparecer en la lista de categorías de gasto

**Escenario: Nombre duplicado dentro del mismo tipo**
- GIVEN una categoría de gasto "Comida" existente
- WHEN el usuario intenta crear otra categoría de gasto llamada "Comida"
- THEN el sistema DEBE bloquear la creación con un error de duplicado

#### Requisito: Editar Categoría
El sistema DEBE permitir editar nombre, icono y color de una categoría.

**Escenario: Edición de color**
- GIVEN una categoría "Transporte"
- WHEN el usuario cambia su color y guarda
- THEN la categoría DEBE mostrarse con el nuevo color en listas y transacciones

#### Requisito: Archivar Categoría
El sistema DEBE archivar categorías y conservar las transacciones que la referencian.

**Escenario: Archivar categoría con uso**
- GIVEN una categoría usada por transacciones
- WHEN el usuario la elimina
- THEN el sistema DEBE archivarla y las transacciones históricas DEBEN conservar su categoría

**Escenario: Categoría sistema "Transferencia"**
- GIVEN la categoría de sistema "Transferencia"
- WHEN el usuario intenta editarla o archivarla
- THEN el sistema NO DEBE permitirlo (categoría protegida)

#### Requisito: Iconografía y Colores de Categorías
El sistema DEBE ofrecer una galería amplia de iconos Lucide y paleta de colores para categorías.

**Escenario: Galería de iconos agrupada**
- GIVEN el formulario de nueva/editar categoría
- WHEN el usuario abre el selector de icono
- THEN DEBE ver iconos organizados por grupos temáticos (comida, transporte, finanzas, etc.)
- AND la galería DEBE usar iconos Lucide (no emojis) con fallback legacy para datos antiguos

**Escenario: Paleta ampliada**
- GIVEN el selector de color
- WHEN el usuario crea una categoría
- THEN DEBE poder elegir entre al menos 25 colores predefinidos

---

### Dominio: transactions

#### Requisito: Registrar Transacción
El sistema DEBE permitir registrar ingresos y gastos con monto, fecha, categoría, cuenta y notas.

**Escenario: Registrar gasto**
- GIVEN un usuario con al menos una cuenta y categorías de gasto
- WHEN registra un gasto de `$ 25.000`, categoría "Comida", cuenta "Efectivo", fecha de hoy
- THEN la transacción DEBE aparecer en la lista y el saldo de "Efectivo" DEBE disminuir en `$ 25.000`

**Escenario: Registrar ingreso**
- GIVEN un usuario con una cuenta "Banco"
- WHEN registra un ingreso de `$ 2.000.000`, categoría "Salario", cuenta "Banco"
- THEN la transacción DEBE aparecer en la lista y el saldo de "Banco" DEBE aumentar en `$ 2.000.000`

**Escenario: Monto inválido**
- GIVEN el formulario de transacción
- WHEN el usuario ingresa un monto `0` o negativo
- THEN el sistema DEBE bloquear el guardado con un error de validación

**Escenario: Categoría incompatible con el tipo**
- GIVEN el formulario de un gasto
- WHEN el usuario intenta seleccionar una categoría de tipo `income`
- THEN el sistema NO DEBE ofrecer categorías de ingreso para un gasto

#### Requisito: Editar Transacción
El sistema DEBE permitir editar una transacción y reflejar el ajuste de saldo correspondiente.

**Escenario: Editar monto**
- GIVEN un gasto de `$ 25.000` en "Efectivo" (saldo `$ 75.000`)
- WHEN el usuario edita el monto a `$ 40.000`
- THEN el saldo de "Efectivo" DEBE recalcularse a `$ 60.000`

**Escenario: Cambiar cuenta de la transacción**
- GIVEN un gasto de `$ 25.000` registrado en "Efectivo"
- WHEN el usuario cambia la cuenta a "Banco"
- THEN "Efectivo" DEBE revertir el gasto y "Banco" DEBE aplicarlo

#### Requisito: Eliminar Transacción
El sistema DEBE permitir eliminar una transacción y revertir su efecto en el saldo.

**Escenario: Eliminar gasto**
- GIVEN un gasto de `$ 30.000` en "Efectivo" (saldo `$ 70.000`)
- WHEN el usuario elimina la transacción
- THEN el saldo de "Efectivo" DEBE volver a `$ 100.000` y la transacción DEBE desaparecer de la lista

**Escenario: Eliminar transferencia**
- GIVEN una transferencia de `$ 40.000` de "Efectivo" a "Banco"
- WHEN el usuario la elimina
- THEN ambos saldos DEBEN revertirse a su estado previo a la transferencia

#### Requisito: Lista, Búsqueda y Filtros
El sistema DEBE listar transacciones y permitir filtrarlas por fecha, categoría, cuenta y rango de monto.

**Escenario: Filtro por categoría**
- GIVEN transacciones de varias categorías
- WHEN el usuario filtra por "Comida"
- THEN la lista DEBE mostrar únicamente transacciones de "Comida"

**Escenario: Filtro por rango de fechas**
- GIVEN transacciones de distintos meses
- WHEN el usuario filtra por el mes en curso
- THEN la lista DEBE mostrar solo transacciones cuya fecha cae en ese rango

**Escenario: Búsqueda sin resultados**
- GIVEN un filtro que no coincide con ninguna transacción
- WHEN se aplica el filtro
- THEN la lista DEBE mostrar un estado vacío informativo, sin error

#### Requisito: Lista de Movimientos (UI)
La pantalla de movimientos DEBE alinearse con el diseño Pencil y ofrecer interacciones de lista mejoradas.

**Escenario: Filtro por mes**
- GIVEN el usuario en `/transactions`
- WHEN abre la pantalla
- THEN el mes en curso DEBE estar seleccionado por defecto vía `MonthSwitcher` (reutilizado del dashboard)
- AND el filtro de mes DEBE ser independiente de los demás filtros (búsqueda, tipo, etc.)

**Escenario: Editar por click en fila**
- GIVEN una transacción en la lista (móvil o tabla desktop)
- WHEN el usuario hace click en la fila
- THEN DEBE abrirse el modal de edición
- AND NO DEBE mostrarse un botón separado de editar (solo eliminar en acciones)

**Escenario: Reordenar mismo día**
- GIVEN dos o más movimientos con la misma fecha
- WHEN el usuario arrastra una fila sobre otra del mismo día
- THEN el orden DEBE persistirse vía `sortOrder` y reflejarse en listas y dashboard

**Escenario: Montos con énfasis visual**
- GIVEN una transacción en la lista
- WHEN se muestra el monto
- THEN gastos DEBEN verse en rojo, ingresos en verde y transferencias en blanco

---

### Dominio: attachments

#### Requisito: Subir Adjunto
El sistema DEBE permitir adjuntar imágenes (JPEG/PNG) y PDFs a una transacción.

**Escenario: Adjuntar imagen válida**
- GIVEN una transacción existente
- WHEN el usuario sube una imagen JPEG de 2 MB
- THEN el adjunto DEBE asociarse a la transacción y mostrarse en su detalle

**Escenario: Tipo de archivo no permitido**
- GIVEN el selector de adjuntos
- WHEN el usuario intenta subir un archivo `.docx`
- THEN el sistema DEBE rechazarlo con un mensaje de tipo no permitido

**Escenario: Archivo demasiado grande**
- GIVEN el límite de 10 MB por archivo
- WHEN el usuario intenta subir un PDF de 15 MB
- THEN el sistema DEBE rechazarlo con un mensaje de tamaño excedido

#### Requisito: Visualizar y Descargar Adjuntos
El sistema DEBE permitir previsualizar imágenes y descargar cualquier adjunto.

**Escenario: Preview de imagen**
- GIVEN una transacción con una imagen adjunta
- WHEN el usuario abre el detalle de la transacción
- THEN DEBE ver una miniatura/preview de la imagen

**Escenario: Descarga de PDF**
- GIVEN una transacción con un PDF adjunto
- WHEN el usuario hace click en descargar
- THEN el sistema DEBE entregar el archivo original

#### Requisito: Eliminar Adjunto
El sistema DEBE permitir eliminar un adjunto de una transacción.

**Escenario: Eliminar adjunto**
- GIVEN una transacción con dos adjuntos
- WHEN el usuario elimina uno
- THEN la transacción DEBE conservar solo el adjunto restante y el archivo eliminado DEBE removerse del storage

---

### Dominio: dashboard

#### Requisito: Balance Total
El dashboard DEBE mostrar el balance total agregado de las cuentas activas.

**Escenario: Balance agregado**
- GIVEN cuentas "Efectivo" (`$ 60.000`) y "Banco" (`$ 40.000`) activas
- WHEN el usuario abre el dashboard
- THEN el balance total DEBE mostrar `$ 100.000`

#### Requisito: Resumen Mensual
El dashboard DEBE mostrar el total de ingresos y gastos del mes en curso.

**Escenario: Ingresos vs gastos del mes**
- GIVEN ingresos por `$ 2.000.000` y gastos por `$ 550.000` en el mes actual
- WHEN el usuario abre el dashboard
- THEN DEBE ver ingresos `$ 2.000.000` y gastos `$ 550.000` del periodo

#### Requisito: Transacciones Recientes
El dashboard DEBE listar las transacciones más recientes **del mes seleccionado**.

**Escenario: Últimas transacciones del mes**
- GIVEN al menos una transacción registrada en el mes en curso
- WHEN el usuario abre el dashboard
- THEN DEBE ver una lista de las transacciones más recientes de ese mes, ordenadas por fecha descendente (y `sortOrder` dentro del mismo día)

**Escenario: Navegación a detalle**
- GIVEN una transacción en la lista de recientes
- WHEN el usuario hace click en la fila
- THEN DEBE navegar a `/transactions?id={id}` y abrir el modal de edición con los detalles

**Escenario: Meta de fila en dashboard**
- GIVEN una transacción con nota en el dashboard
- WHEN se muestra en la lista de recientes
- THEN la línea secundaria DEBE mostrar `fecha · cuenta · nota` (descripción del movimiento)

**Escenario: Dashboard sin datos**
- GIVEN un usuario nuevo sin cuentas ni transacciones
- WHEN abre el dashboard
- THEN DEBE ver un estado vacío que invite a crear su primera cuenta y transacción

#### Requisito: Layout del Dashboard (desktop)
El dashboard DEBE distribuir el contenido en dos columnas: **Recientes** (columna principal) y **Cuentas + Este mes** (sidebar).

**Escenario: Distribución en desktop**
- GIVEN viewport ≥ 1024 px
- WHEN el usuario abre el dashboard
- THEN la card **Recientes** DEBE ocupar la columna izquierda (~1.6fr) y **Cuentas** + **Este mes** la columna derecha (~1fr)
- AND la card **Recientes** DEBE tener la misma altura que el bloque **Cuentas + Este mes**, ajustándose al viewport disponible
- AND el grid DEBE tener margen inferior para que las cards no queden pegadas al borde inferior de la pantalla
- AND la cantidad de movimientos mostrados DEBE adaptarse dinámicamente al espacio vertical disponible (entre 5 y 30)

#### Requisito: Acciones Rápidas (FAB global)
El sistema DEBE ofrecer un botón flotante (FAB) para registrar gastos desde las pantallas core.

**Escenario: FAB en pantallas core**
- GIVEN el usuario en `/`, `/transactions` o `/accounts`
- WHEN visualiza la pantalla
- THEN DEBE ver un FAB fijo en la esquina inferior derecha

**Escenario: Registrar gasto directo**
- GIVEN el usuario hace click en el FAB
- WHEN se abre el formulario
- THEN DEBE abrirse directamente el modal global de **registrar gasto** (sin sheet intermedio)
- AND el foco DEBE estar en el input de monto al abrir

**Escenario: Modal global**
- GIVEN el modal de transacción abierto desde cualquier ruta
- WHEN el usuario guarda o cancela
- THEN el modal DEBE cerrarse sin requerir estar en la pestaña de movimientos

---

## Refinamientos de UI implementados (2026-07-02)

Resumen de ajustes aplicados en código alineados con `webcore.pen` y feedback de sesión. **Pendiente**: refinamiento mobile completo.

### Shell y navegación
- Eliminado brand pill del sidebar desktop; avatar con fallback y `referrerPolicy` para imágenes de Google
- FAB global (`TransactionFab` + `TransactionModalHost`) en `/`, `/transactions`, `/accounts`
- FAB abre directamente modal de **registrar gasto**; tamaño compacto (48px)
- Nav móvil sin FAB central (4 ítems equilibrados)

### Dashboard
- `BrandLogoMark` en header desktop; métricas del mes; `MonthSwitcher` sin palabra "de" (`Junio 2026`)
- Recientes filtrados al mes seleccionado; layout 2 columnas (Recientes | Cuentas + Este mes)
- Altura al viewport; límite dinámico de filas; margen inferior en cards
- Click en movimiento → `/transactions?id=` + modal edición; meta con nota del movimiento
- Iconos de categoría vía Lucide (`CategoryIcon`)

### Movimientos
- Header con `BrandLogoMark`; filtro por mes con `MonthSwitcher`
- Montos con color por tipo (`TransactionAmount`); columna alineada a la derecha
- Modal centrado (div + ARIA, no `<dialog>` nativo); scroll con estilos de marca; footer fijo
- Selects y date inputs estilados (flecha, options, icono calendario blanco)
- Click en fila abre edición; solo botón eliminar en acciones
- Reordenamiento drag-and-drop entre movimientos del mismo día (`sortOrder`)

### Cuentas y categorías
- `BrandLogoMark` en headers de cuentas y categorías
- Reordenamiento drag-and-drop de cards de cuenta (`sortOrder`); selects respetan orden
- Galería de iconos Lucide agrupada + 28 colores en picker de categorías

### Backend (Convex)
- `transactions.sortOrder`, `accounts.sortOrder`
- Mutations `transactions.reorderWithinDate`, `accounts.reorder`
- Queries `transactions.get`; dashboard filtra recientes por mes
- Seed y defaults con nombres de icono Lucide (no emojis)

### Componentes clave añadidos
- `apps/web/src/stores/transactionModal.ts` — estado global del modal de transacciones
- `apps/web/src/components/transactions/TransactionModalHost.tsx` — modal global en Shell
- `apps/web/src/lib/core/categoryIcon.tsx` — biblioteca de iconos de categoría
- `apps/web/src/lib/dashboard/useRecentListLimit.ts` — cálculo dinámico de filas recientes
- `apps/web/src/styles/core.css` — estilos de dominio web-core

---

## Criterios de Éxito

- [ ] Crear, editar y archivar cuentas; el saldo refleja saldo inicial + movimientos
- [ ] Transferir fondos entre cuentas ajusta correctamente ambos saldos en una sola operación
- [ ] Crear, editar y eliminar transacciones (ingreso/gasto) recalcula el saldo de la(s) cuenta(s)
- [ ] Lista de transacciones filtrable por fecha, categoría, cuenta y rango de monto
- [ ] Crear, editar y archivar categorías; categoría sistema "Transferencia" protegida
- [ ] Adjuntar imágenes (JPEG/PNG) y PDFs a una transacción con validación de tipo y tamaño
- [ ] Previsualizar, descargar y eliminar adjuntos; eliminar remueve el archivo del storage
- [ ] Dashboard muestra balance total, resumen mensual (ingresos vs gastos) y transacciones recientes
- [x] Transacciones recientes del mes en curso (no globales)
- [x] Layout dashboard desktop: Recientes | Cuentas + Este mes con altura al viewport
- [x] FAB global abre modal de registrar gasto con foco en monto
- [x] Click en fila de movimiento abre edición (sin botón editar separado)
- [x] Reordenamiento de movimientos del mismo día y cuentas por drag-and-drop
- [x] Iconos Lucide en categorías con galería agrupada y paleta ampliada
- [x] Alineación visual con diseño Pencil (headers, montos, modales, month switcher)
- [ ] Refinamiento mobile completo (pendiente próxima sesión)
- [ ] Acciones rápidas del dashboard abren el formulario de transacción precargado
- [ ] Montos formateados como COP (`$ 1.234.567`) en toda la UI
- [ ] Estados vacíos informativos en dashboard y listas sin datos
- [ ] Pantallas core responsivas (mobile-first 375 px → desktop 1280 px) y accesibles

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| Inconsistencia de saldo tras editar/eliminar transacciones | Media | Mutaciones transaccionales; recalcular delta old→new en un handler |
| Transferencias con doble conteo | Media | Modelo único `transfer`; validación origen ≠ destino |
| Adjuntos: tipo/tamaño no validados | Media | Validación cliente + servidor de `mimeType` y tamaño |
| Queries de dashboard costosas (N+1) | Baja | Índices por `userId`/`date`; agregados acotados al mes |
| Borrado de cuenta/categoría con históricos | Media | Archivado (soft delete); bloquear borrado duro con uso |
| Scope creep a reportes/presupuestos | Media | Fuera de scope explícito (Change 4) |

## Dependencias

- `web-foundation` completado (auth, shell, JP-DS, schema base) — en `testing`
- Convex file storage habilitado
- `desing.md` v1.1.0 (componentes JP-DS, motion, mobile-first §7)
- `SPEC.md` §4.2–§4.4, §4.6 (dashboard básico), §5 (modelo de datos)

## Supuestos

- **Transferencia** = una sola transacción `type: "transfer"` con `accountId` (origen) y `toAccountId` (destino); usa la categoría sistema "Transferencia".
- **Saldo de cuenta**: la estrategia (denormalizado vs derivado) se decide en `design.md`; la spec exige corrección y consistencia en tiempo real.
- **Archivado (soft delete)** para cuentas y categorías con históricos; borrado duro solo permitido sin transacciones asociadas.
- **Saldo inicial** configurable al crear cuenta; por defecto `$ 0`.
- **Moneda**: COP, formato `$ 1.234.567` (punto separador de miles), sin decimales por defecto.
- **Agrupación del dashboard**: mensual (mes en curso). La agrupación configurable (semana/trimestre/semestre) llega en Change 3.
- **Adjuntos**: tipos permitidos `image/jpeg`, `image/png`, `application/pdf`; límite 10 MB por archivo.
- **Límite de adjuntos**: máximo 5 archivos por transacción.
- **Saldos negativos**: permitidos en cuentas `cash`, `bank` y `credit` durante el MVP; la UI debe señalarlos visualmente.
- **Búsqueda textual**: cubre notas, nombre de cuenta y nombre de categoría; los montos se filtran con rango de monto, no con búsqueda por texto.
- **Categorías por defecto**: las 13 del seed de `web-foundation` (SPEC §4.4.1) ya existen por usuario.

## Estructura de Archivos

```
jp-wallet/
├── apps/web/src/
│   ├── routes/
│   │   ├── home.tsx                 # Dashboard real (reemplaza placeholder)
│   │   ├── accounts.tsx             # Lista + CRUD cuentas
│   │   ├── transactions.tsx         # Lista + filtros + CRUD
│   │   └── categories.tsx           # Gestión de categorías
│   ├── components/
│   │   ├── dashboard/               # BalanceCard, MonthlySummary, RecentList, QuickActions
│   │   ├── accounts/                # AccountList, AccountForm, TransferForm
│   │   ├── transactions/            # TransactionList, TransactionForm, Filters
│   │   ├── categories/              # CategoryList, CategoryForm
│   │   └── attachments/             # AttachmentUploader, AttachmentPreview
│   └── lib/
│       └── format/                  # currencyCOP, formatDate
└── convex/
    ├── schema.ts                    # + accounts, transactions, categories, attachments
    ├── accounts.ts                  # queries + mutations (CRUD, transfer)
    ├── transactions.ts             # queries + mutations (CRUD, filtros)
    ├── categories.ts                # queries + mutations (CRUD, archive)
    └── attachments.ts               # upload URL, list, delete (file storage)
```
