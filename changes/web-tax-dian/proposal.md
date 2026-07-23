# Propuesta: Change 6 — Web Tax DIAN (Declaración de Renta)

**Versión**: 1.0.0  
**Estado**: Planificado  
**Change**: web-tax-dian  
**Creado**: 2026-07-22  
**Rama**: `feat/web-tax-dian` (desde `testing`)

---

## Intención

Cerrar el roadmap actual de JP-WALLET con un **organizador de declaración de renta (DIAN Colombia)**: el usuario reúne por año gravable patrimonio, deudas, ingresos, deducciones y rentas exentas, adjunta soportes, acepta sugerencias desde sus finanzas en la app y exporta un paquete legible para él o su contador.

No sustituye un contador ni presenta ante DIAN.

## Alcance

### Dentro

- Documento anual único por usuario/año (`draft` / `review` / `filed`)
- Cinco secciones DIAN + catálogo de categorías v1
- CRUD de rubros (monto COP, descripción, notas)
- Adjuntos imagen/PDF por rubro
- Sugerencias asistidas desde cuentas, créditos y movimientos del año
- Export PDF / CSV / JSON
- Campos manuales opcionales: renta gravable estimada, impuesto estimado
- Navegación **Renta** (`/tax`)

### Fuera

- Cálculo UVT / tarifas / formulario 210 / XML Muisca / API DIAN
- OCR de certificados
- Multi-usuario / contador colaborativo
- IVA, retención como módulo, personas jurídicas
- Auto-mapeo de metas de ahorro a patrimonio
- Notificaciones de plazos oficiales DIAN

## Dependencias

- Changes 1–5 en `testing` (auth, core, settings, budgets/reports, credits/savings)
- Convex file storage + módulo attachments
- Stack de export de reportes

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Expectativa de liquidación oficial | Copy + Out of Scope explícito en UI |
| Sugerencias engañosas | Conservadoras, opt-in, editables |
| Alcance creep fiscal | Fases A–F; sin motor UVT |

## Éxito

Ver `spec.md` Success Criteria (SC-001…SC-007) y `quickstart.md`.
