# JP-DS — Design System

**Versión**: 1.1.0  
**Estado**: Activo  
**Paquete**: `packages/jp-ds`  
**Producto**: JP-WALLET  
**Creado**: 2026-06-24

---

## 1. Visión

JP-DS (JP Design System) es el contrato visual y de interacción de JP-WALLET. Define tokens, patrones de superficie, motion y reglas de componentes para que toda la interfaz se sienta coherente, premium y reconocible.

**Tema por defecto:** `dark`. La app arranca en modo oscuro; el usuario puede alternar a `light` o delegar en `system` (preferencia del SO).

**Inspiración:** la profundidad operativa y el glassmorphism de [OpenClaw](https://github.com/openclaw/openclaw) — consola oscura, capas translúcidas, acentos bioluminiscentes, persistencia FOUC-safe del tema. **Toque propio:** identidad *Green Bolt* derivada de `public/icon.svg` — verde eléctrico `#07FBA2`, geometría angular agresiva y sensación de energía controlada (finanzas personales con carácter, no plantilla genérica).

---

## 2. Principios

| # | Principio | Descripción |
|---|-----------|-------------|
| 1 | **Dark-first** | El dark es el entorno nativo. Light es variante completa, no un afterthought. |
| 2 | **Bolt como norte** | Color, forma y motion deben poder trazarse al icono de marca. |
| 3 | **Tokens, no hex sueltos** | En código y diseño (Pencil) usar siempre variables semánticas (`--color-accent`). |
| 4 | **Profundidad gelatinosa** | Superficies con transparencia + blur; el fondo respira detrás del cristal. |
| 5 | **Claridad financiera** | Números, estados y acciones críticas priorizan legibilidad sobre decoración. |
| 6 | **Accesible por defecto** | WCAG 2.1 AA mínimo; motion reducible; foco siempre visible. |
| 7 | **Mobile-first** | Diseñar e implementar primero para móvil; escalar progresivamente a tablet y desktop. Ninguna pantalla se entrega solo en un viewport. |

---

## 3. Marca e iconografía

### 3.1 Icono maestro

**Archivo:** `public/icon.svg`

| Elemento | Valor | Uso |
|----------|-------|-----|
| Acento primario | `#07FBA2` | Bolt principal, CTAs, estados activos, glow sutil |
| Acento secundario | `#159563` | Sombras de marca, gradientes, detalles de profundidad |
| Fondo del asset | `#000000` | Referencia de contraste máximo; no usar como `--color-bg` de app |

La forma del bolt es **angular y diagonal** — evitar curvas suaves excesivas en elementos estructurales (máscaras, splits decorativos, clips de avatar). Los controles interactivos (botones primarios) pueden ser **pill** para equilibrar agresividad visual con usabilidad táctil.

### 3.2 Logo en UI

- Header / login: icono 24–32 px + wordmark «JP-WALLET» (o abreviatura «JP» en viewports estrechos).
- Favicon y PWA: derivar siempre de `icon.svg`; no sustituir por variantes circulares genéricas.
- En sidebar expandido (desktop): icono + título, al estilo OpenClaw (marca visible, no solo glyph).

### 3.3 Motivos decorativos

- Gradientes ambientales verdes muy tenues (`color-mix` con `--color-accent` al 3–8 %).
- Líneas diagonales o polígonos de baja opacidad en fondos de auth y empty states.
- Glow de acento en superficies «premium» o focused — nunca competir con el texto.

---

## 4. Sistema de color

### 4.1 Paleta de marca (fija)

| Token | Hex | Rol |
|-------|-----|-----|
| `--color-accent` | `#07FBA2` | Primario — acciones, links, focus ring, indicadores activos |
| `--color-accent-deep` | `#159563` | Hover profundo, bordes de énfasis, gradientes |
| `--color-accent-muted` | `#07FBA2` @ 12 % opacidad | Fondos de chip, selección suave |
| `--color-accent-glow` | `#07FBA2` @ 25 % opacidad | Box-shadow / halo en hover y estados activos |

> **Regla:** no introducir más de **5 colores de marca** sin aprobación explícita. El verde eléctrico es el único acento cromático fuerte.

### 4.2 Tokens semánticos — Dark (default)

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-bg` | `#0F1419` | Fondo de página |
| `--color-surface-1` | `#1A1F26` | Cards, paneles, sidebar |
| `--color-surface-2` | `#232A33` | Elevación secundaria, inputs |
| `--color-surface-glass` | `rgba(26, 31, 38, 0.60)` | Capas glassmorphism |
| `--color-border` | `#2F3742` | Bordes default |
| `--color-border-focus` | `#07FBA2` | Focus / validación activa |
| `--color-text-primary` | `#FAFAFA` | Texto principal |
| `--color-text-secondary` | `#A1A8B3` | Descripciones, metadata |
| `--color-text-muted` | `#6B7280` | Placeholders, hints |
| `--color-danger` | `#EF4444` | Errores, destructivo |
| `--color-warning` | `#F59E0B` | Alertas |
| `--color-success` | `#07FBA2` | Éxito (reutiliza acento) |

### 4.3 Tokens semánticos — Light

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-bg` | `#F4F6F8` | Fondo de página |
| `--color-surface-1` | `#FFFFFF` | Cards, paneles |
| `--color-surface-2` | `#EEF1F4` | Inputs, áreas inset |
| `--color-surface-glass` | `rgba(255, 255, 255, 0.72)` | Glass en light |
| `--color-border` | `#D1D5DB` | Bordes default |
| `--color-border-focus` | `#059669` | Focus (verde más oscuro para contraste AA) |
| `--color-text-primary` | `#0F1419` | Texto principal |
| `--color-text-secondary` | `#525252` | Secundario |
| `--color-text-muted` | `#9CA3AF` | Muted |
| `--color-accent` | `#059669` | Primario en light (ajustado para AA sobre blanco) |
| `--color-accent-bright` | `#07FBA2` | Badges, iconos, detalles decorativos |

### 4.4 Reglas de color

1. **Nunca** `#FFFFFF` puro como texto sobre fondos oscuros; usar `#FAFAFA` o `color-mix`.
2. Al cambiar fondo de un componente, **siempre** ajustar color de texto para mantener ≥ 4.5:1.
3. En dark, reducir intensidad de sombras; preferir glow verde tenue.
4. Estados disabled: opacidad `0.5` + `pointer-events: none` (no solo cambio de color).
5. Usar `color-mix(in srgb, …)` para variantes derivadas; evitar decenas de hex hardcodeados.

---

## 5. Temas (light / dark / system)

### 5.1 Modelo

```ts
type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";
```

| Modo | Comportamiento |
|------|----------------|
| `dark` | `<html data-theme="dark">` — **default de producto** y fallback sin preferencia guardada |
| `light` | `<html data-theme="light">` |
| `system` | Resuelve vía `prefers-color-scheme`; escucha cambios en tiempo real |

### 5.2 Persistencia y FOUC

1. **Pre-auth:** `localStorage.theme`
2. **Post-auth:** `userPreferences.theme` en Convex
3. **Pre-paint:** script inline en `index.html` aplica `data-theme` antes del primer paint (patrón OpenClaw).
4. Validar valores contra whitelist `["light", "dark", "system"]`.

### 5.3 Implementación CSS

```css
/* tokens/color.css — valores base (light) */
/* tokens/dark.css */
[data-theme="dark"] {
  /* overrides semánticos */
}
```

Los componentes **solo** leen `var(--color-*)`; nunca ramifican por tema en TSX salvo ilustraciones específicas.

### 5.4 Toggle en UI

Ciclo: `light → dark → system → light`. Iconografía clara por estado (sol / luna / monitor). Ubicación: header del app shell, accesible desde teclado.

---

## 6. Tipografía

| Rol | Familia | Peso | Tamaño | Line-height |
|-----|---------|------|--------|-------------|
| Display | `"Cal Sans", "Inter Variable", system-ui` | 700 | 40–48 px | 1.1 |
| Heading | `"Inter Variable", system-ui` | 600–700 | 20–28 px | 1.25 |
| Body | `"Inter Variable", system-ui` | 400 | 16 px | 1.5 |
| Label | `"Inter Variable", system-ui` | 500 | 14 px | 1.4 |
| Caption | `"Inter Variable", system-ui` | 400 | 12 px | 1.35 |
| Mono / números | `"JetBrains Mono", ui-monospace` | 500 | inherit | 1.4 |

**Números financieros:** tabular figures (`font-variant-numeric: tabular-nums`) en montos, balances y tablas.

**Carga:** Inter Variable vía Google Fonts o self-host; `font-display: swap`.

---

## 7. Espaciado, layout y responsive (mobile-first)

### 7.1 Filosofía mobile-first

**Regla obligatoria:** todo diseño (Pencil, código, prototipos) **empieza en móvil** y se adapta hacia arriba. Desktop es una **expansión** del layout móvil, no un diseño paralelo recortado.

| Fase | Viewport de referencia | Objetivo |
|------|------------------------|----------|
| 1. Diseño base | 375 × 812 px (iPhone estándar) | Flujo completo, touch, bottom nav, una columna |
| 2. Tablet | 768 × 1024 px | Más aire, grids de 2 columnas donde aplique |
| 3. Desktop | 1280 × 900 px (mín. 1024 px) | Sidebar persistente, contenido con `max-width`, hover states |

**En CSS:** estilos base sin media query = móvil. Breakpoints solo con `min-width` (nunca `max-width` como estrategia principal).

```css
/* ✅ Correcto — mobile-first */
.card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}
@media (min-width: 768px) {
  .card-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 1024px) {
  .card-grid { grid-template-columns: repeat(3, 1fr); }
}

/* ❌ Incorrecto — desktop-first con max-width */
.card-grid { grid-template-columns: repeat(3, 1fr); }
@media (max-width: 767px) { .card-grid { grid-template-columns: 1fr; } }
```

**En Pencil:** artboard **primario** = 375 px ancho (dark). Artboards secundarios obligatorios: tablet (768 px) y desktop (1280 px) del mismo flujo antes de cerrar el diseño.

### 7.2 Breakpoints

| Token | Ancho | Alias | Comportamiento de layout |
|-------|-------|-------|--------------------------|
| — | &lt; 640 px | **mobile** | Una columna; bottom nav; padding `--space-4` |
| `--bp-sm` | ≥ 640 px | **sm** | Contenido más aireado; grids 2 col opcionales |
| `--bp-md` | ≥ 768 px | **md** | Transición nav; formularios más anchos |
| `--bp-lg` | ≥ 1024 px | **lg** | Sidebar desktop; bottom nav oculta |
| `--bp-xl` | ≥ 1280 px | **xl** | Contenedor centrado `max-width: 1200px` |

```css
/* packages/jp-ds/tokens/breakpoints.css */
:root {
  --bp-sm: 640px;
  --bp-md: 768px;
  --bp-lg: 1024px;
  --bp-xl: 1280px;
  --container-max: 1200px;
  --container-padding-mobile: var(--space-4);
  --container-padding-desktop: var(--space-6);
}
```

### 7.3 Layout por viewport (app shell)

| Zona | Mobile (&lt; 1024 px) | Desktop (≥ 1024 px) |
|------|----------------------|---------------------|
| Navegación principal | Bottom nav fija (56–64 px + safe-area) | Sidebar lateral persistente (~240–280 px) |
| Header | Compacto: icono + acciones (theme, user) | Icono + wordmark + acciones |
| Contenido | `100%` ancho; scroll vertical | `flex: 1` junto a sidebar; padding `--space-6` |
| Modales / sheets | Full-width bottom sheet o casi fullscreen | Centrado, `max-width: 480–560px` |
| Tablas / listas densas | Cards apiladas o scroll horizontal con indicador | Tabla completa o grid multi-columna |

**Safe areas:** respetar `env(safe-area-inset-*)` en bottom nav, header fijo y modales (notch, home indicator).

### 7.4 Escala de espaciado

| Token | Valor | Notas responsive |
|-------|-------|------------------|
| `--space-1` | 4 px | Fijo |
| `--space-2` | 8 px | Fijo |
| `--space-3` | 12 px | Fijo |
| `--space-4` | 16 px | Padding horizontal móvil default |
| `--space-5` | 24 px | Gap entre secciones en móvil |
| `--space-6` | 32 px | Padding horizontal desktop |
| `--space-7` | 48 px | Separación entre bloques en desktop |
| `--space-8` | 64 px | Hero / secciones amplias (desktop) |

En móvil, preferir `--space-4` y `--space-5`; en desktop, `--space-6` y `--space-7` para ritmo vertical.

### 7.5 Radios

| Token | Valor | Uso |
|-------|-------|-----|
| `--radius-sm` | 4 px | Chips, badges |
| `--radius-md` | 8 px | Inputs, cards pequeñas |
| `--radius-lg` | 16 px | Modales, paneles |
| `--radius-pill` | 9999 px | Botones primarios, pills de nav |
| `--radius-bolt` | `polygon(...)` | Avatares, máscaras decorativas (clip-path angular) |

### 7.6 Grid, contenedores y densidad

- **Contenedor principal:** `width: 100%`; `max-width: var(--container-max)`; centrado en `xl`.
- **Padding horizontal:** `var(--container-padding-mobile)` → `var(--container-padding-desktop)` desde `--bp-lg`.
- **Tipografía fluida (opcional):** `clamp()` en display/heading para evitar saltos bruscos entre breakpoints.
- **Imágenes y media:** `max-width: 100%`; `height: auto`; proporciones fijas con `aspect-ratio`.
- **Overflow:** prohibido scroll horizontal en `<body>`; tablas anchas usan contenedor `overflow-x: auto` con fade o hint visual.
- **Mínimo táctil:** **44×44 px** en todos los interactivos (WCAG).
- **Skip link** «Saltar al contenido» como primer foco tabulable.

### 7.7 Componentes responsive

| Componente | Móvil | Desktop |
|------------|-------|---------|
| `Button` | Full-width en formularios de acción única; inline en toolbars | `width: auto`; grupos horizontales |
| `Input` | `width: 100%` | `max-width` según contexto (ej. 400 px en settings) |
| Listas / cards | Una columna; swipe actions opcionales (v2) | Grid 2–3 columnas o tabla |
| Modales | Bottom sheet desde borde inferior | Dialog centrado |
| Números / montos | No reducir bajo 16 px body; truncar con ellipsis solo si hay alternativa (tooltip) | Alineación tabular en columnas |

Los componentes JP-DS **no** asumen ancho fijo en px; usan `%`, `min()`, `clamp()` o contenedor padre flex/grid.

### 7.8 Reglas de implementación responsive

1. **Probar en 320 px** (mínimo soportado) antes de dar por cerrado un diseño.
2. **Probar en 1024 px y 1440 px** para validar sidebar, grids y hover.
3. **No ocultar contenido crítico** en móvil; reorganizar o colapsar en acordeones, no eliminar.
4. **CTAs primarios** visibles sin scroll excesivo en móvil (login, guardar, confirmar).
5. **Viewport meta:** `width=device-width, initial-scale=1` en `index.html`.
6. **Touch vs pointer:** hover y glow solo en `@media (hover: hover) and (pointer: fine)`.
7. **Orientación:** layouts deben funcionar en portrait y landscape en móvil (sin rotura de nav).

### 7.9 Checklist responsive (obligatorio)

- [ ] Artboard / implementación base en **375 px**
- [ ] Validado en **320 px** sin overflow horizontal
- [ ] Validado en **768 px** (tablet)
- [ ] Validado en **≥ 1024 px** (sidebar + contenido)
- [ ] Bottom nav ↔ sidebar según breakpoint
- [ ] Safe areas en iOS (notch / home indicator)
- [ ] Touch targets ≥ 44 px en móvil
- [ ] Texto legible sin zoom forzado (≥ 16 px body en inputs)
- [ ] Imágenes y glass no degradan performance en móvil (blur reducido si hace falta)

---

## 8. Superficies y glassmorphism

Inspirado en OpenClaw; adaptado a *Green Bolt*.

| Propiedad | Dark | Light |
|-----------|------|-------|
| `backdrop-filter` | `blur(24px) saturate(1.2)` | `blur(16px) saturate(1.1)` |
| Fill glass | `var(--color-surface-glass)` | `var(--color-surface-glass)` |
| Borde glass | `1px solid color-mix(in srgb, var(--color-border) 80%, transparent)` | igual |
| Sombra | `0 8px 32px rgba(0,0,0,0.35)` | `0 4px 24px rgba(15,20,25,0.08)` |

**Capas:** máximo 2 niveles de glass anidados; más allá, usar superficie sólida `--color-surface-2`.

**Efectos ambientales (dark):** gradiente radial verde al 4–6 % desde esquina superior; opcional campo de puntos muy tenue (como star-field OpenClaw) en auth y dashboard vacío.

---

## 9. Componentes base

Contrato inicial de JP-DS (Change 1). Todos consumen tokens vía `var(--*)`.

### 9.1 Button

| Variante | Estilo |
|----------|--------|
| `primary` | Pill, fill `--color-accent`, texto `#0F1419` (dark) / `#FFFFFF` (light sobre verde oscuro) |
| `secondary` | Glass o outline `--color-border`; hover border accent |
| `ghost` | Sin fondo; hover `--color-accent-muted` |
| `danger` | Fill `--color-danger` |

**Interacción:** hover → glow `--color-accent-glow`; active → `scale(0.97)`; focus → ring 2 px `--color-border-focus`.

### 9.2 Input

- Patrón **label float** (label anima al focus).
- Borde `--color-border`; focus `--color-border-focus` + glow leve.
- Altura mínima 44 px; mensaje de error debajo en `--color-danger`.

### 9.3 IconButton

- Cuadrado o circular 40–44 px; estados igual que Button ghost.
- Iconos stroke 1.5–2 px; tamaño 20–24 px.

### 9.4 Avatar

- **No círculos por defecto:** clip polygonal inspirado en el bolt o hexágono suavizado.
- Borde 2 px `--color-accent` cuando activo/seleccionado.

### 9.5 Spinner

- Arco verde `--color-accent` sobre track `--color-border`.
- Respeta `prefers-reduced-motion` (pulse estático o texto «Cargando…»).

---

## 10. Motion

Fuente única: `packages/jp-ds/src/motion/tokens.ts` (re-export `@jp-ds/motion`).

### 10.1 Duration

| Token | ms | Uso |
|-------|-----|-----|
| `duration.instant` | 0 | Reduced motion, toggles instantáneos |
| `duration.fast` | 120 | Hover, micro-feedback |
| `duration.base` | 200 | Transiciones estándar |
| `duration.slow` | 320 | Paneles, modales |
| `duration.dramatic` | 480 | Entradas de página, hero |
| `duration.shimmer` | 1500 | Skeleton loaders |

### 10.2 Easing

| Token | Valor | Uso |
|-------|-------|-----|
| `ease.in` | `cubic-bezier(0.4, 0, 1, 1)` | Salidas |
| `ease.out` | `cubic-bezier(0, 0, 0.2, 1)` | Entradas |
| `ease.inOut` | `cubic-bezier(0.4, 0, 0.2, 1)` | Reversible |

### 10.3 Spring

| Token | Config | Uso |
|-------|--------|-----|
| `spring.gentle` | stiffness 120, damping 14 | Toggle, cards |
| `spring.bouncy` | stiffness 400, damping 12 | Celebraciones, éxito |
| `spring.snap` | stiffness 500, damping 30 | Drawers, snaps |

### 10.4 Distance

| Token | px |
|-------|-----|
| `distance.tiny` | 4 |
| `distance.short` | 8 |
| `distance.medium` | 16 |
| `distance.long` | 24 |
| `distance.dramatic` | 40 |

### 10.5 Stagger

| Token | ms |
|-------|-----|
| `stagger.item` | 60 |
| `stagger.group` | 120 |

### 10.6 Shake (errores)

| Token | Valor |
|-------|-------|
| `shake.oscillations` | 4 |
| `shake.duration` | 400 ms |

### 10.7 Patrones de uso

| Contexto | Tokens |
|----------|--------|
| Mount de lista | `duration.base` + `ease.out` + `stagger.item` |
| Modal | `duration.slow` + `ease.out`; overlay `duration.base` |
| Error en form | `shake.*` + borde `--color-danger` |
| Theme switch | `duration.fast` — solo color/background, sin layout shift |

### 10.8 Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

En JS: si `matchMedia('(prefers-reduced-motion: reduce)')`, usar `duration.instant` y desactivar shake.

---

## 11. Accesibilidad

| Requisito | Criterio |
|-----------|----------|
| Contraste texto | ≥ 4.5:1 (AA); ≥ 3:1 UI components |
| Focus visible | Ring 2 px `--color-border-focus`; nunca `outline: none` sin reemplazo |
| Touch target | ≥ 44×44 px |
| Teclado | Toda acción de ratón disponible por teclado |
| Semántica | `<main>`, `<nav>`, `<button>`, labels asociados |
| Motion | `prefers-reduced-motion` obligatorio |
| Contraste alto | `@media (prefers-contrast: more)` — bordes más marcados, glass reducido |

### Checklist pre-merge

- [ ] Contraste AA en light y dark (Lighthouse)
- [ ] Focus visible en todos los interactivos
- [ ] Toggle de tema sin FOUC
- [ ] Layout **mobile-first** validado: 320 px, 375 px, 768 px, 1024 px, 1440 px
- [ ] Sin scroll horizontal involuntario en ningún breakpoint
- [ ] Zoom 200 % sin pérdida de contenido
- [ ] Dark mode probado en OLED
- [ ] Checklist responsive §7.9 completado

---

## 12. Diferencias vs OpenClaw (toques JP)

| Aspecto | OpenClaw | JP-DS |
|---------|----------|-------|
| Acento | Teal / crimson según tema | Verde eléctrico `#07FBA2` único |
| Temas | Múltiples familias (claw, knot, dash…) | **Una** identidad; solo light/dark/system |
| Geometría | Glass redondeado uniforme | Diagonales y clips del bolt + pills en CTAs |
| Dominio | Chat / consola agente | Finanzas — tipografía tabular, claridad numérica |
| Avatares | Circulares | Poligonales / clipped |
| Default | Dark operativo | Dark *Green Bolt* |

---

## 13. Estructura de archivos (JP-DS)

```
packages/jp-ds/
├── tokens/
│   ├── color.css          # Semánticos base (light)
│   ├── dark.css           # [data-theme="dark"] overrides
│   ├── typography.css
│   ├── spacing.css
│   ├── breakpoints.css    # --bp-* y --container-max
│   ├── radius.css
│   ├── glass.css          # Utilidades .jp-glass, ambient
│   └── motion.css         # CSS vars espejo de motion tokens
├── components/
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── IconButton.tsx
│   ├── Avatar.tsx
│   └── Spinner.tsx
└── src/
    ├── motion/tokens.ts   # Fuente de verdad motion (TS)
    └── index.ts
```

---

## 14. Uso en Pencil y Canvas

1. Variables Pencil deben mapear 1:1 a tokens de este documento.
2. Reutilizar `public/icon.svg` como logo; no regenerar variantes.
3. **Mobile-first en artboards:**
   - **Primario:** 375 × 812 px, tema **dark**
   - **Obligatorios antes de cerrar:** 768 × 1024 px (tablet) y 1280 × 900 px (desktop)
   - **Opcional:** 375 px tema light para validar contraste
4. Verificar overflow con `snapshot_layout` y screenshot en **cada** artboard.
5. No diseñar solo en desktop y «adaptar» después; el flujo móvil define la jerarquía de información.

---

## 15. Anti-patrones (no hacer)

- ❌ Purple/violet como acento (reservado a errores de marca).
- ❌ Degradados arcoíris o neón fuera de la paleta verde.
- ❌ Botones primarios grises en dark.
- ❌ Más de 2 fuentes display en la misma vista.
- ❌ Animaciones > 500 ms en interacciones frecuentes.
- ❌ Hex hardcodeados en componentes (`#07FBA2` solo en `tokens/color.css`).
- ❌ Glass sin fallback sólido para navegadores sin `backdrop-filter`.
- ❌ Diseñar solo en desktop (≥ 1440 px) y recortar para móvil.
- ❌ `max-width` media queries como estrategia principal de layout.
- ❌ Anchos fijos en px que rompan viewports &lt; 375 px.
- ❌ Ocultar con `display: none` contenido esencial solo en móvil.
- ❌ Hover como única forma de revelar acciones críticas (sin alternativa touch).

---

## 16. Referencias

- Icono: `public/icon.svg`
- Guía para agentes: `AGENTS.md`
- Especificación de producto: `SPEC.md` §8
- Arquitectura técnica (por change): `changes/<change-id>/design.md`
- Inspiración visual: [OpenClaw UI](https://github.com/openclaw/openclaw/tree/main/ui)
- Spec funcional (web-foundation): `changes/web-foundation/spec.md`

---

*JP-DS v1.1.0 — Green Bolt Identity*
