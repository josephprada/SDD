# Propuesta: Change 4 — Web Budgets & Reports (Presupuestos + Reportes + Panel de Resultados)

**Versión**: 1.0.0
**Estado**: Planificado
**Change**: web-budgets-reports
**Creado**: 2026-07-04
**Rama**: `feat/web-budgets-reports` (desde `testing`)

---

## Intención

Cerrar dos capacidades pendientes del roadmap (`SPEC.md` §4.5 y §4.6) en un solo change:

1. **Presupuestos y alertas** — el usuario define límites mensuales por categoría de gasto, visualiza el progreso con barras y recibe alertas visuales al alcanzar umbrales (50 %, 80 %, 100 %).
2. **Panel de Resultados (Reportes)** — el usuario analiza sus finanzas mediante gráficos (barras, tortas, líneas/tendencias) con filtros por período, categoría y cuenta, y exporta el resultado a **PDF y CSV**.

Ambos dominios comparten la misma fuente de verdad (`transactions`, `categories`, `accounts`) y el mismo motor de rangos temporales (`lib/period/`) ya construido en `web-settings`, por lo que se implementan juntos para reutilizar agregaciones y evitar duplicar lógica de cálculo.

Este change activa además el toggle `notificationsEnabled` de `web-settings`, que hasta ahora solo persistía sin efecto: las alertas de presupuesto son su primer consumidor real (alertas **in-app**, sin Web Push).

## Alcance

### Dentro del Scope

**Presupuestos**

- **Crear/editar/eliminar presupuesto** mensual por categoría de gasto (`categoryId` + `amount` límite en COP).
- **Un presupuesto activo por categoría y mes** (unicidad `userId + categoryId + period`).
- **Progreso visual**: barra con gastado vs. límite, monto restante y porcentaje.
- **Umbrales de alerta**: estados visuales al 50 %, 80 % y 100 %+ (colores semánticos JP-DS: ok / warning / danger). Alerta en tiempo real al registrar transacción que cruza un umbral, respetando `notificationsEnabled`.
- **Vista de presupuestos** (`/budgets`): lista de presupuestos del período con progreso, y resumen de "presupuestado vs. gastado" del mes.
- **Cálculo del gasto** por categoría reutilizando `transactions` filtradas por rango de período (mismo `periodRange` del dashboard).

**Reportes / Panel de Resultados**

- **Vista de reportes** (`/reports`) con panel de resultados y gráficos.
- **Gráficos**:
  - Ingresos vs. gastos por período (barras comparativas).
  - Desglose de gastos por categoría (torta/dona).
  - Tendencia temporal (línea/área) sobre el rango seleccionado.
- **Filtros**: rango de período (semana/mes/trimestre/semestre reutilizando grouping), categoría y cuenta.
- **Exportación**:
  - **CSV**: datos tabulares del reporte activo (transacciones agregadas / desglose por categoría).
  - **PDF**: snapshot del panel de resultados (resumen + gráficos) generado en cliente.
- **Reutilización** del motor de agregación del dashboard (`dashboard.overview`) extendido o un nuevo módulo `reports.*` en Convex para series por categoría/tiempo.

**Transversal**

- **Schema Convex**: nueva tabla `budgets` (ver Modelo de datos).
- **Navegación**: entradas a Presupuestos y Reportes en `NavMobile` (menú "Más") y `NavDesktop`.
- **JP-DS**: componentes de gráfico (barras/torta/línea) alineados a tokens (`var(--color-*)`), sin hex hardcodeados; barras de progreso de presupuesto.
- **UI responsive**: mobile-first 375 px → desktop; gráficos legibles y con interacción táctil.
- **Accesibilidad**: gráficos con alternativa textual (tabla o resumen) y respeto a `prefers-reduced-motion`.

### Fuera del Scope

- **Presupuestos por cuenta o por rango arbitrario** — solo por categoría de gasto y período (mensual como base).
- **Presupuestos de ingreso** — solo gasto.
- **Roll-over de presupuesto** (arrastrar saldo no gastado al mes siguiente) — diferido.
- **Web Push / notificaciones fuera de la app** — alertas solo in-app (`SPEC.md` §2, diferido v2).
- **Exportación a JSON** — solo PDF y CSV en este change (JSON queda para export global / change dedicado).
- **Reportes programados / envío por email** — fuera de scope.
- **Comparación multi-usuario o benchmarks** — fuera de scope.
- **Créditos, DIAN, gastos compartidos** — Changes 5, 6 y futuros.

## Capabilities

### Capabilities Nuevas

| Capability | Tipo | Descripción |
|------------|------|-------------|
| `budgets` | NUEVA | CRUD de presupuestos mensuales por categoría; unicidad por categoría/período |
| `budget-progress` | NUEVA | Cálculo de gastado vs. límite y estado de umbral (50/80/100 %) por período |
| `budget-alerts` | NUEVA | Alertas in-app al cruzar umbrales; respeta `notificationsEnabled` |
| `reports-panel` | NUEVA | Pantalla `/reports` con gráficos y filtros |
| `report-aggregation` | NUEVA | Series agregadas (ingresos/gastos, por categoría, por tiempo) desde `transactions` |
| `report-export` | NUEVA | Exportación del reporte activo a CSV y PDF |

### Capabilities Modificadas

| Capability | Tipo | Descripción |
|------------|------|-------------|
| `app-shell` | MODIFICADA | Navegación con entradas a Presupuestos y Reportes |
| `dashboard` | MODIFICADA | Reutiliza/expone agregaciones compartidas con reportes; posible acceso directo al panel |
| `notifications` | MODIFICADA | `notificationsEnabled` obtiene su primer consumidor real (alertas de presupuesto) |
| `period-grouping` | MODIFICADA | Reusado por presupuestos y filtros de reportes |

## Enfoque

### Modelo de datos

Nueva tabla `budgets` (Convex). El período se modela con un ancla mensual normalizada (`periodKey` `"YYYY-MM"`) para garantizar unicidad y consultas por índice.

```typescript
budgets: {
  userId: Id<"users">,
  categoryId: Id<"categories">,   // categoría de tipo "expense"
  amount: number,                 // límite en COP (> 0)
  periodKey: string,              // "YYYY-MM" (mes del presupuesto)
  notes?: string,
  createdAt: number,
  updatedAt: number,
}
// índices:
//  by_user
//  by_user_period        ["userId", "periodKey"]
//  by_user_category      ["userId", "categoryId"]
//  by_user_cat_period     ["userId", "categoryId", "periodKey"]  (unicidad)
```

> Nota: `SPEC.md` §5.2 ya lista `budgets` entre las tablas previstas. Este change materializa su definición.

**Reportes** no requieren tabla nueva: son agregaciones de solo lectura sobre `transactions`, `categories` y `accounts`, servidas por queries `reports.*` (o extensión de `dashboard`).

### Cálculo de progreso y umbrales

- Gastado por categoría/período = suma de `transactions` con `type === "expense"`, `categoryId` coincidente y `date ∈ periodRange(periodKey)`.
- Estado de umbral: `pct = spent / amount` → `ok` (<0.5), `info` (≥0.5), `warning` (≥0.8), `danger` (≥1.0).
- Alertas: al crear/editar una transacción de gasto, si cruza un umbral hacia arriba y `notificationsEnabled`, se muestra alerta in-app (toast/badge). Sin persistencia de historial de alertas en este change.

### Agregación de reportes

- **Ingresos vs. gastos por período**: totales sobre el rango filtrado, segmentables por sub-período (p. ej. barras por mes dentro de un trimestre).
- **Por categoría**: agrupar gastos por `categoryId`, ordenados desc.; usar `category.color` para el gráfico.
- **Tendencia**: serie temporal (buckets por día/semana/mes según grouping).
- Filtros aplicados server-side donde sea posible (índices `by_user_date`, `by_user_category`).

### Exportación

- **CSV**: generación cliente a partir del dataset agregado (encabezados en ES, montos COP sin formato de miles para reimport).
- **PDF**: render cliente del panel (resumen + gráficos) a PDF. Evaluar librería ligera; decisión final en `design.md`.

### Gráficos

- Librería de charts a decidir en `design.md` (criterios: peso, accesibilidad, theming por CSS vars, soporte responsive). Todos los colores derivan de tokens JP-DS; sin hex fijos.

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| Cálculo de gasto por categoría inconsistente con dashboard | Media | Reusar `periodRange` y una única función de agregación compartida |
| Unicidad de presupuesto (categoría+mes) violada por carrera | Baja | Índice `by_user_cat_period` + verificación en mutación |
| Peso del bundle por librería de charts | Media | Elegir librería ligera / import diferido en ruta `/reports` |
| PDF client-side con calidad/fidelidad pobre | Media | Alcance: snapshot del panel; validar en QA; fallback a CSV siempre disponible |
| Accesibilidad de gráficos (solo color) | Media | Alternativa textual + patrones/labels; contraste AA |
| Alertas de umbral ruidosas o repetidas | Baja | Disparar solo al cruzar umbral hacia arriba; respetar `notificationsEnabled` |
| Scope creep a JSON/roll-over/push | Media | Fuera de scope explícito |
| Presupuestos sobre categorías archivadas | Baja | Filtrar a categorías `expense` no archivadas; conservar históricos legibles |

## Dependencias

- `web-foundation` — auth, shell, `userPreferences`.
- `web-core` — `transactions`, `categories`, `accounts`, `dashboard.overview`, producción en `wallet.lavalex.co`.
- `web-settings` — `defaultGrouping`, `notificationsEnabled`, `lib/period/`.
- `SPEC.md` §4.5, §4.6, §5.2.
- `desing.md` — tokens, glass, mobile-first §7, motion §10, accesibilidad §11.

## Criterios de éxito (propuesta)

1. El usuario crea un presupuesto mensual para una categoría de gasto y ve el límite reflejado de inmediato en `/budgets`.
2. La barra de progreso muestra correctamente gastado vs. límite y porcentaje para el período en curso.
3. Al superar 80 % y 100 %, el presupuesto cambia a estado visual `warning` y `danger` respectivamente.
4. Con `notificationsEnabled` activo, registrar un gasto que cruza un umbral dispara una alerta in-app; con el toggle apagado, no.
5. No se permiten dos presupuestos para la misma categoría en el mismo mes.
6. `/reports` muestra los tres gráficos (ingresos vs. gastos, por categoría, tendencia) con datos reales del usuario.
7. Los filtros de período, categoría y cuenta actualizan los gráficos en < 1 s.
8. El usuario exporta el reporte activo a CSV y obtiene un archivo con los datos agregados correctos.
9. El usuario exporta el reporte activo a PDF y obtiene un documento legible con resumen y gráficos.
10. La navegación incluye accesos a Presupuestos y Reportes en mobile y desktop.
11. Todo funciona mobile-first (375 px) sin regresiones en 320–1440 px y respeta `prefers-reduced-motion`.

## Próximo paso

`/speckit-clarify` (si quedan dudas de scope) o `/speckit-plan` → `design.md` (decidir librería de charts y de PDF) → `tasks.md`.
