# Quickstart QA: Web Credits & Savings

**Change**: web-credits · **Rama**: `feat/web-credits`

---

## Prerrequisitos

- Changes 1–4 en base (`web-core`, `web-settings`, `web-budgets-reports`)
- `bun dev` + `bunx convex dev`
- Usuario autenticado con al menos 2 cuentas bancarias creadas manualmente (nombres libres)

---

## Setup cuentas (caso referencia)

| Cuenta (nombre libre) | Rol | `isCreditEscrow` | `excludeFromPersonalFinance` |
|-----------------------|-----|------------------|------------------------------|
| «Ahorros nómina» | Operativa diaria / pago cuotas | false | false |
| «Fondo crédito obra» | Escrow desembolso | true | true (aislada) |
| «Meta abono / ahorro» | Ahorro aparte | false | true (aislada; transferencias hacia ella = gasto del mes) |

**Dashboard:** card **Disponible** = suma de cuentas personales no aisladas y no `type: credit`.  
**Neto:** incluye pagos de cuota y transferencias hacia cuentas aisladas; no incluye solo el saldo negativo de tarjetas (sí incluye las compras con tarjeta).

---

## 1. Crear crédito VIS (modo manual o cuota_fija)

1. `/credits` → Nuevo crédito
2. Prestamista: texto libre (ej. entidad del préstamo)
3. Principal: `40000000` · Plazo: `120` meses
4. Tasa: tipo `MV` · valor `1.08` (ajustar según extracto)
5. Vincular **Fondo crédito obra** como cuenta desembolso
6. Vincular **Ahorros nómina** como cuenta operativa
7. Verificar primera cuota ~$625.958 total (±$500) si modo manual/calculado

**Esperado**: Dashboard personal **no** suma $40M del escrow.

---

## 2. Rubro escaleras

1. Tab **Destinos** → «Construcción escaleras» · $1.500.000
2. Resumen: asignado $1,5M · sin asignar $38,5M
3. Gráfico torta visible

---

## 3. Gastar desde fondo (wizard)

1. Tab **Movimientos** → «Gastar desde fondo»
2. Monto $1.500.000 · rubro Escaleras
3. Confirmar devolución sobrante si aplica

**Esperado**:
- `/transactions` sin movimientos del crédito por defecto
- Tab Movimientos del crédito muestra transferencias + gasto

---

## 4. Abono a capital anual

1. Meta ahorro: $500.000/mes · objetivo $6.000.000 · `linkedCreditId`
2. Tras simular: abono $6.000.000 · efecto `shorten_term`
3. Verificar plazo proyectado ≤ 72 meses

**Esperado**: Cuotas pagadas no cambian; pending recalculadas.

---

## 5. Cuota ordinaria

1. Marcar cuota 1 como pagada
2. Vincular transacción gasto (desde nómina, no escrow)

---

## 6. Metas `/savings`

1. Crear meta independiente
2. Registrar 3 aportes · progreso correcto al peso

---

## 7. Navegación

- Desktop: sidebar Créditos + Ahorros
- Móvil: menú «Más» incluye ambas rutas

---

## Checks

```bash
bun test convex/lib/creditAmortization.test.ts
bun run build
bun run lint
```

---

## Siguiente paso

Ejecutar `tasks.md` fases A→H vía `/speckit-implement`.
