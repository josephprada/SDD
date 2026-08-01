# Contract: Dashboard projection & hierarchy

**Change**: app-polish-fixes  
**Consumers**: Home desktop metrics, MonthOverview móvil, Playwright US1

## Semántica

| Concepto | Definición |
|----------|------------|
| `disponible` | Valor mostrado en MetricCard “Disponible” (`totalBalance`) |
| `pendingTotal` | Suma de fijos pendientes del período de vista (query `listUpcomingForPeriod`) |
| `proyeccion` | `disponible - pendingTotal` si `pendingTotal > 0`; si no, ocultar bloque proyección |

## UI contract

### Cuando `pendingTotal > 0`

1. El valor **primario** del bloque neto/proyección es `proyeccion` con etiqueta “Si pagas fijos pendientes” (o copy equivalente aprobado).
2. El **neto del período** (`income - expense`) es secundario (menor tamaño/contraste o debajo).
3. Desktop y móvil comparten la misma semántica numérica.

### Cuando `pendingTotal === 0`

1. No se muestra la proyección.
2. El neto del período usa estilo primario habitual.

## Anti-contract

- Prohibido calcular proyección como `neto - pendingTotal`.
- Prohibido usar un “disponible” distinto al de la card Disponible en el mismo viewport.
