# Quickstart QA: Web Tax DIAN

**Change**: web-tax-dian · **Rama**: `feat/web-tax-dian`

---

## Prerrequisitos

- Changes 1–5 en base (`testing`)
- `bun dev` + `bunx convex dev`
- Usuario autenticado con:
  - ≥1 cuenta bancaria con saldo
  - ≥1 crédito activo con saldo
  - ≥2 movimientos de ingreso en el año gravable de prueba
  - (opcional) gastos en categoría Salud/Educación

---

## 1. Crear declaración

1. Nav **Renta** → `/tax`
2. Crear declaración año `2025` (o año de prueba)
3. Verificar estado `Borrador` y secciones vacías

**Esperado**: no se puede crear un segundo documento del mismo año.

---

## 2. Rubros manuales

1. Abrir declaración → sección **Ingresos** → añadir rubro salarios $10.000.000
2. Sección **Deducciones** → salud $500.000
3. Verificar totales de sección y resumen

**Esperado**: montos COP formateados; total ingresos 10M; deducciones 500k.

---

## 3. Adjuntos

1. En el rubro de salarios, subir un PDF ≤ límite
2. Subir un JPEG
3. Abrir/previsualizar; eliminar el JPEG

**Esperado**: PDF permanece; tipo no permitido se rechaza con mensaje claro.

---

## 4. Sugerencias

1. Acción **Sugerir desde mis datos**
2. Debe aparecer al menos una sugerencia de Patrimonio (cuenta) y/o Deudas (crédito)
3. Aceptar una; verificar que no reaparece al regenerar
4. Descartar otra (no crear item)

**Esperado**: items aceptados editables; montos son copia, no vivos.

---

## 5. Estados y export

1. Pasar a **En revisión**
2. Exportar CSV, PDF y JSON; abrir archivos
3. Marcar como **Presentada** (`filed`)
4. Intentar editar rubro → bloqueado
5. Reabrir con confirmación → editable otra vez

**Esperado**: disclaimer de “no es liquidación oficial” visible en PDF/JSON; exports incluyen secciones y totales.

---

## 6. Mobile 375 px

1. Recorrer listado → detalle → añadir rubro → export menú
2. Sin overflow horizontal; targets usables

---

## Checklist cierre

- [ ] SC-001…SC-007 cubiertos manualmente
- [ ] `bun run lint` + `bun run build` OK
- [ ] Copy no promete presentación DIAN
