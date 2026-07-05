# Guía para agentes (LLM)

Índice de documentación del monorepo **JP-WALLET / SDD**. Consultar estos archivos antes de implementar o diseñar.

---

## Documentos por propósito

| Documento | Ruta | Cuándo usarlo |
|-----------|------|----------------|
| **Design System (JP-DS)** | [`desing.md`](desing.md) | UI, tokens, temas, **mobile-first / responsive**, componentes, motion, accesibilidad |
| **Especificación del producto** | [`SPEC.md`](SPEC.md) | Dominio, stack, capabilities globales, roadmap de changes |
| **Icono de marca** | [`public/icon.svg`](public/icon.svg) | Color y forma de referencia para marca y UI |
| **Arquitectura de un change** | `changes/<change-id>/design.md` | Decisiones técnicas, flujos de datos, estructura de archivos de ese change |
| **Spec funcional de un change** | `changes/<change-id>/spec.md` | Requisitos, escenarios GIVEN/WHEN/THEN, criterios de éxito |
| **Propuesta de un change** | `changes/<change-id>/proposal.md` | Alcance, riesgos, dependencias del change |

---

## Regla de oro: `desing.md` vs `design.md`

| Archivo | Ámbito |
|---------|--------|
| **`/desing.md`** (raíz) | Design system **visual** transversal — aplica a **todos** los changes y a `packages/jp-ds` |
| **`changes/*/design.md`** | Diseño **técnico/arquitectura** de un change concreto (auth, Convex, routing, etc.) |

No confundir ambos. Para colores, tipografía, glassmorphism, motion o componentes → **`desing.md`**. Para loaders, schema Convex o workspaces → **`changes/<id>/design.md`**.

---

## JP-DS en código

```
apps/web/           # App Vite + React (alias @app/*)
packages/jp-ds/     # Design system JP-DS (alias @jp-ds/*)
convex/             # Backend Convex (alias @convex/* desde apps/web)
├── tokens/         # CSS custom properties (color, typography, spacing, dark.css)
├── components/     # Button, Input, IconButton, Avatar, Spinner
└── src/motion/     # Motion tokens (fuente de verdad TS)
```

La app en `apps/web/` consume JP-DS vía alias `@jp-ds/*` y Convex vía `@convex/_generated/api`.

**Scripts raíz:** `bun dev` · `bun build` · `bun lint`

---

## Secciones clave de `desing.md`

| Tema | Sección |
|------|---------|
| Principios (incl. mobile-first) | §2 |
| Colores y tokens | §4 |
| Temas (dark default, light, system) | §5 |
| Tipografía | §6 |
| **Layout responsive / mobile-first** | §7 |
| Glassmorphism | §8 |
| Componentes base | §9 |
| Motion tokens | §10 |
| Accesibilidad / reduced motion | §11, §10.8 |

---

## Último change cerrado: web-budgets-reports ✅ (2026-07-05)

Producción: `https://wallet.lavalex.co` · Convex prod · CI en `main`.

| Artefacto | Ruta |
|-----------|------|
| Spec | `changes/web-budgets-reports/spec.md` |
| Propuesta | `changes/web-budgets-reports/proposal.md` |
| Diseño técnico | `changes/web-budgets-reports/design.md` |
| Quickstart QA | `changes/web-budgets-reports/quickstart.md` |

**Siguiente change planificado:** **Change 5 — `web-credits`** (Créditos y Préstamos).  
**Change 6 — `web-tax-dian`** (Declaración de Renta DIAN) queda al final: debe integrar créditos, cuentas y transacciones.

---

## Convenciones para agentes

1. **Idioma:** español en comunicación con el usuario; nombres de código en inglés.
2. **Tokens:** nunca hardcodear hex en componentes; usar `var(--color-*)` de JP-DS.
3. **Tema default:** `dark` (ver `desing.md` §5).
4. **Mobile-first:** diseñar e implementar desde 375 px; escalar a tablet/desktop (`desing.md` §7). Probar 320–1440 px.
5. **Marca:** acento `#07FBA2`, inspiración OpenClaw con identidad *Green Bolt*.
6. **Commits:** solo cuando el usuario lo pida explícitamente.
