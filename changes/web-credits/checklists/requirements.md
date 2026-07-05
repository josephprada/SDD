# Specification Quality Checklist: Web Credits & Savings

**Purpose**: Validar completitud y calidad de la especificación antes de planificar
**Created**: 2026-07-05
**Updated**: 2026-07-05 (v1.4 — fondo aislado / escrow)
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] Sin detalles de implementación en requisitos y criterios de éxito
- [x] Enfocado en valor de usuario
- [x] Secciones obligatorias completas
- [x] Distinción deuda / escrow / nómina / rubro / meta documentada
- [x] Caso rubro «Escaleras» $1,5M de $40M como referencia QA
- [x] Caso real Banco Agrario VIS + flujo BBVA meta→ahorros como referencia QA

## Requirement Completeness

- [x] Sin marcadores [NEEDS CLARIFICATION] pendientes
- [x] Tres modos amortización + abonos + destinos + escrow + simulador
- [x] Casos borde (abono > saldo, recálculo, manual, desembolso ≠ ingreso)
- [x] Alcance acotado (UVR/revolving/sync fuera)

## Feature Readiness

- [x] User stories cubren flexibilidad, abonos, destinos, escrow, simulación, metas
- [x] Efectos `shorten_term` / `lower_installment` definidos
- [x] Entidades y campos: `disbursementAccountId`, `CreditDestination`, `creditId` en transacciones
- [x] Dashboard y `/transactions` con exclusión por defecto de movimientos del crédito

## Notes

- **v1.4 (2026-07-05)**: Fondo aislado — cuenta meta BBVA vinculada; asistente gasto; filtros dashboard.
- **v1.3**: Destinos/rubros del desembolso.
- Tests obligatorios en design: escrow excluido del home, wizard $1,5M Escaleras, abono $6M/año.
