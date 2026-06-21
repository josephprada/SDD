# Pencil Design Brief — Change 1: Web Foundation

**Change**: web-foundation
**Versión**: 1.0.0
**Estado**: Borrador
**Creado**: 2026-06-21

---

## Propósito

Este brief documenta **qué frames deben existir** en los archivos `.pen` para el change `web-foundation`, con sus contenidos, estados, variables JP-DS y anotaciones de motion (según `design.md §11`). El diseñador (humano) crea los `.pen` siguiendo esta guía.

**Convención del proyecto**: archivos `.pen` viven en `changes/<change-id>/designs/`. Cada frame se anota con duración esperada, easing/spring, y trigger (per `design.md §11.1`). Cada componente se entrega en los 8 estados de `§11.2`.

---

## Convenciones Pencil (recordatorio)

Per `design.md §11.1` y skill `pencil-design`:

- **Variables primero**: usar siempre variables JP-DS (`primary`, `surface-1`, `space-md`, `radius-md`, `duration-base`, etc.) — NUNCA hardcodear valores.
- **Componentes reusables**: si un componente ya existe en el archivo `.pen`, insertar como `ref`. Solo crear desde cero si no existe match.
- **No overflow**: usar `fill_container` en textos dentro de auto-layout; chequear con `pencil_snapshot_layout(problemsOnly: true)`.
- **Verificar visualmente**: screenshot por sección con `pencil_get_screenshot`.
- **Anotaciones por frame** (esquina del frame):
  ```
  duration: duration.base
  easing:   spring.gentle
  trigger:  hover | press | mount | route-change | theme-change
  ```

---

## JP-DS Variables requeridas

Estas variables deben existir en el `.pen` antes de diseñar cualquier frame. Sincronizar con `packages/jp-ds/src/tokens/` cuando se implemente.

### Color (light + dark)

| Variable | Light value | Dark value | Uso |
|----------|-------------|------------|-----|
| `bg` | `#FAFAFA` | `#0F1419` | Background principal |
| `surface-1` | `#FFFFFF` | `#1A1F26` | Cards, modales |
| `surface-2` | `#F4F4F5` | `#242A33` | Skeleton, hovers sutiles |
| `surface-3` | `#E4E4E7` | `#2F3742` | Borders, dividers |
| `text-primary` | `#0F1419` | `#FAFAFA` | Texto principal |
| `text-secondary` | `#525866` | `#A1A8B3` | Texto secundario, captions |
| `text-tertiary` | `#8B92A1` | `#6B7280` | Disabled, hints |
| `border` | `#E4E4E7` | `#2F3742` | Borders standard |
| `border-strong` | `#A1A8B3` | `#525866` | Borders en focus |
| `accent` | `#3B82F6` | `#60A5FA` | CTAs, links, focus ring |
| `accent-hover` | `#2563EB` | `#3B82F6` | Hover sobre accent |
| `success` | `#10B981` | `#34D399` | Success state |
| `danger` | `#EF4444` | `#F87171` | Error state |
| `warning` | `#F59E0B` | `#FBBF24` | Warning state |

### Typography

| Variable | Value | Uso |
|----------|-------|-----|
| `font-family-sans` | `"Inter Variable", system-ui, sans-serif` | UI principal |
| `font-family-display` | `"Cal Sans", "Inter Variable", sans-serif` | Headers (opcional, revisar con frontend-design) |
| `font-family-mono` | `"JetBrains Mono", ui-monospace, monospace` | Numbers, code |
| `text-xs` | `12px / 16px` | Captions |
| `text-sm` | `14px / 20px` | Body small |
| `text-base` | `16px / 24px` | Body |
| `text-lg` | `18px / 28px` | Body emphasis |
| `text-xl` | `20px / 28px` | H3 |
| `text-2xl` | `24px / 32px` | H2 |
| `text-3xl` | `30px / 36px` | H1 |
| `text-display` | `48px / 56px` | Hero (cambio 1 de theme) |
| `font-weight-regular` | `400` | Body |
| `font-weight-medium` | `500` | Emphasis |
| `font-weight-bold` | `700` | Headers |

### Spacing

| Variable | Value | Uso |
|----------|-------|-----|
| `space-1` | `4px` | Tight gaps |
| `space-2` | `8px` | Small gaps |
| `space-3` | `12px` | Form fields internal |
| `space-4` | `16px` | Standard gaps |
| `space-5` | `24px` | Section gaps |
| `space-6` | `32px` | Large gaps |
| `space-8` | `48px` | Page padding |
| `space-10` | `64px` | Hero spacing |

### Radius

| Variable | Value | Uso |
|----------|-------|-----|
| `radius-sm` | `4px` | Inputs, tags |
| `radius-md` | `8px` | Buttons, cards |
| `radius-lg` | `12px` | Modales |
| `radius-xl` | `16px` | Hero cards |
| `radius-full` | `9999px` | Avatars, pills |

### Motion

| Variable | Value | Uso |
|----------|-------|-----|
| `duration-instant` | `100ms` | Color, opacity |
| `duration-fast` | `200ms` | Hover, focus |
| `duration-base` | `300ms` | Mount, page transition |
| `duration-slow` | `500ms` | Modales, drawers |
| `duration-dramatic` | `800ms` | Hero |
| `ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entradas |
| `ease-in` | `cubic-bezier(0.7, 0, 0.84, 0)` | Salidas |
| `ease-inOut` | `cubic-bezier(0.65, 0, 0.35, 1)` | Cambios de estado |
| `spring-gentle` | `stiffness: 120, damping: 20` | UI estándar |
| `spring-bouncy` | `stiffness: 300, damping: 15` | Success, celebrations |

---

## Frames por Capability

### Capability: `app-shell`

**Archivo sugerido**: `changes/web-foundation/designs/app-shell.pen`

#### Frame 1: Header — Default (Light)

- **Dimensiones**: 1440 × 64 (desktop)
- **Contenido**:
  - Brand mark/logo (izquierda) — link a `/`
  - Nav items center (placeholders: Dashboard, Transacciones, Cuentas, Reportes, Configuración)
  - Theme toggle button (icon-only, IconButton)
  - User menu (avatar + dropdown trigger) — Avatar con iniciales como fallback
- **Background**: `surface-1`
- **Border bottom**: 1px `border`
- **Anotaciones**:
  ```
  mount:    duration-base + ease-out + distance.medium
  hover:    duration-fast + ease-out + distance.tiny
  press:    duration-fast + spring-gentle + scale(0.97)
  ```

#### Frame 2: Header — Dark

- Misma estructura, `bg=surface-1 (dark)`, `text=text-primary (dark)`
- Verificar contraste WCAG AA en nav items (≥ 4.5:1)

#### Frame 3: Bottom Nav — Mobile (Light)

- **Dimensiones**: 375 × 64
- **Contenido**: 5 iconos (Home, Add [+], Transacciones, Reportes, Más) con label debajo
- Indicador activo: pill con `accent` background + icono white
- Mount: stagger `stagger.item` entre items

#### Frame 4: Sidebar — Desktop (Light)

- **Dimensiones**: 240 × full-height
- Items stacked verticalmente, ícono + label
- Hover: lift + `border highlight accent`

#### Frame 5: Skip-to-content Link

- Hidden por default (offscreen)
- Visible on focus: aparece top-left, `accent` background, `text-primary` inverse
- Animation: fade-in 100ms + slide desde top

#### Frame 6: 404 Page

- Headline "404 — No encontrado" (text-display)
- Body text secundario
- Button "Volver al inicio" → `/`
- Background: `bg`, ilustración opcional placeholder

---

### Capability: `auth-google-oauth`

**Archivo sugerido**: `changes/web-foundation/designs/auth-google-oauth.pen`

#### Frame 1: /login — Default

- **Dimensiones**: 1440 × 900 (desktop), también 375 × 812 (mobile)
- **Contenido**:
  - Centrado vertical y horizontal
  - Brand mark arriba
  - Headline "Bienvenido a JP-WALLET" (text-2xl)
  - Subtitle "Tus finanzas, simples" (text-base, `text-secondary`)
  - Button primario "Continuar con Google" con icono Google (left)
  - Caption pequeño "Al continuar aceptás nuestros términos" (text-xs, `text-tertiary`)
- **Background**: `bg`, gradient sutil (opcional) de `bg` a `surface-1` en hero
- **Anotaciones**:
  ```
  button-hover:  duration-fast + ease-out + distance.tiny (lift -4px)
  button-press:  duration-fast + spring-gentle + scale(0.97)
  mount:         duration-slow + ease-out + distance.medium (logo fade-in)
  ```

#### Frame 2: /login — Loading (post-click)

- Mismo layout
- Button reemplazado por spinner + "Conectando con Google..." text
- Spinner: 3 dots secuenciales (no genérico)
- Background del button: `accent` 100% con opacidad 0.85

#### Frame 3: /login — Error

- Mismo layout
- Button vuelve a estado default
- Banner error arriba: `danger` background light, icono alert + "No pudimos validar la sesión. Probá de nuevo."
- Border-bottom rojo sutil en el banner

#### Frame 4: /login — Mobile (375 × 812)

- Stack vertical ajustado
- Button full-width
- Padding lateral `space-5`

---

### Capability: `design-system`

**Archivo sugerido**: `changes/web-foundation/designs/design-system.pen`

> **Cada componente debe entregarse en los 8 estados de `design.md §11.2`**: Default, Hover, Press, Focus, Disabled, Loading, Error (si aplica), Success (si aplica).

#### Componente: Button

- **Variantes**: primary (accent fill), secondary (surface-1 fill + border), ghost (no fill, transparent)
- **Tamaños**: sm (32px height), md (40px), lg (48px)
- **Estados a diseñar**:
  1. Default (variant: primary, size: md, label: "Continuar")
  2. Hover (lift -4px, border highlight subtle)
  3. Press (scale 0.97, slight bg darken)
  4. Focus (2px outline accent con offset 2px)
  5. Disabled (opacity 0.5, no pointer)
  6. Loading (spinner interno reemplaza label, no size change)
  7. Error (variant: danger fill, shake ready — see §5.2)
  8. Success (checkmark icon entra con `spring-bouncy`)
- **Token references**: `duration-fast`, `ease-out`, `spring-gentle`, `distance.tiny`, `radius-md`

#### Componente: Input

- **Variantes**: text, email, password (con toggle visibility)
- **Estados**:
  1. Default (border `border`, placeholder `text-tertiary`)
  2. Hover (border `border-strong`)
  3. Focus (border `accent`, 2px outline accent offset 2px)
  4. Filled (label flotante arriba, value `text-primary`)
  5. Disabled (opacity 0.5)
  6. Loading (spinner derecho)
  7. Error (border `danger`, mensaje error debajo, shake ready)
  8. Success (icon check derecho, border `success`)
- **Label float**: label sube con `ease-out` cuando hay valor o focus

#### Componente: IconButton

- **Estados** (subset): Default, Hover, Focus, Press, Disabled
- **Uso típico**: theme toggle, user menu, nav indicators
- Background hover: `surface-2`
- Icon size: 20px

#### Componente: Avatar

- **Variantes**: with image (circular), initials (color generado por hash), placeholder icon
- **Sizes**: xs (24px), sm (32px), md (40px), lg (56px), xl (80px)
- Border: 1px `border`

#### Componente: Spinner

- **Variantes**: 3 dots secuenciales (default), spinner circular (loading pages)
- Color: `accent`
- Animation: dots con opacity stagger, infinite

---

### Capability: `theme-toggle`

**Archivo sugerido**: `changes/web-foundation/designs/theme-toggle.pen`

#### Frame 1: Header en Light Mode

- Reutilizar Frame 1 de app-shell
- Theme toggle IconButton muestra icono "sun"

#### Frame 2: Header en Dark Mode

- Reutilizar Frame 2 de app-shell
- Theme toggle IconButton muestra icono "moon"

#### Frame 3: Header en System Mode

- Modo hibrido visual
- Theme toggle IconButton muestra icono "monitor" + dot indicator que sigue el system

#### Frame 4: Theme Transition (animación conceptual)

- Storyboard de 3 frames: light → mid-transition (cross-fade visible) → dark
- Anotaciones:
  ```
  transition:  duration-base + ease-inOut
  trigger:     theme-change (manual user click o system preference update)
  ```

#### Frame 5: Theme Toggle Popover

- Click en IconButton abre popover con 3 opciones: Light / Dark / System
- Highlight en opción activa
- Hover en no-activa: `surface-2` background

---

## Anotaciones Template (referencia rápida)

Per `design.md §11.1`, cada frame debe anotar:

```
[FRAME NAME]

  duration: <token reference>   # ej. duration.base
  easing:   <token reference>   # ej. spring.gentle | ease.out
  trigger:  <event>              # ej. hover | press | mount | route-change | theme-change
  notes:    <optional context>   # ej. "stagger 60ms entre items"
```

Ejemplo concreto:
```
Header — Default (Light)

  duration: duration.base      # mount fade
  easing:   ease-out
  trigger:  mount
  notes:    user-menu dropdown spring-gentle al abrir
```

---

## Tamaños de artboard (breakpoints del proyecto)

| Breakpoint | Width | Height típico | Uso |
|------------|-------|---------------|-----|
| Mobile | 375 | 812 | Bottom nav, single-column |
| Tablet | 768 | 1024 | Adaptable |
| Desktop | 1440 | 900 | Sidebar + main |

Diseñar al menos **mobile + desktop** para cada capability. Tablet puede ser derivado.

---

## Hand-off

1. Diseñador crea los `.pen` siguiendo esta guía.
2. Cada `.pen` se commitea con tipo `design(change)`: `git commit -m "design(change): add Pencil files for web-foundation [change:web-foundation]"`.
3. Una vez commiteados los `.pen`, sdd-tasks puede referenciar frames concretos por nombre.
4. sdd-apply (implementación) consulta el `.pen` para tokens, estados y motion exactos.

---

## Preguntas Abiertas

- ¿`font-family-display` se usa o queda solo `font-family-sans`? Decisión del frontend-design skill cuando se implemente JP-DS.
- ¿Login page lleva ilustración/empty state visual o solo texto? Defecto actual: solo texto. Cambiar si hay diseño específico.
- ¿El theme toggle popover es dropdown estándar o bottom sheet en mobile? Default: dropdown desktop, bottom sheet mobile.

---

*Este brief se itera cuando se agreguen frames o se clarifiquen tokens. Mantener sincronizado con `packages/jp-ds/src/tokens/` cuando se implemente.*