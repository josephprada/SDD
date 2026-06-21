# JP-WALLET — Estándar de Diseño

**Versión**: 1.1.0
**Estado**: Estándar activo
**Última actualización**: 2026-06-21

Este documento es el **contrato de diseño** entre el equipo de diseño (Pencil) y desarrollo. Define cómo se sienten las animaciones, qué técnicas se priorizan, y cuál es la barra de calidad para efectos "wow".

> **Si venís del diseño (Pencil)**: andá directo a §11.
> **Si vas a implementar motion**: §3 (tokens) + §5 (patrones).
> **Si vas a hacer QA**: §8 (performance) + §9 (accesibilidad) + §13 (checklist).

---

## 0. Quick Reference

### 0.1 Reglas de oro

1. Animar solo `transform`, `opacity`, `filter`. Nunca `width`, `height`, `top`, `left`.
2. Usar tokens. Nunca magic numbers.
3. Respetar `prefers-reduced-motion` (§9.1) y considerar trastornos vestibulares (§9.4).
4. Salida = inversa de la entrada.
5. Direccionalidad: usar `inline-end` / `inline-start`, nunca `right` / `left` hardcodeados (§5.8).

### 0.2 Decisiones por defecto

| Componente | Duración | Easing/Spring | Distancia |
|------------|----------|---------------|-----------|
| Hover (button, card) | `duration.fast` | `ease.out` | `distance.tiny` (4px) / `distance.short` (8px) |
| Press (button) | `duration.fast` | `ease.out` | scale 0.97 |
| Mount (card, item) | `duration.base` | `ease.out` + `stagger.item` | `distance.medium` |
| Modal open/close | `duration.slow` | `ease.out` / `ease.in` | scale 0.95→1 |
| Page transition | `duration.base` | `ease.inOut` | — |

### 0.3 Stack por orden de prioridad

1. CSS transitions (estados simples) — 40%
2. CSS @keyframes (loading, shimmer) — 15%
3. View Transitions API (rutas, morphs) — 25%
4. Motion/Framer (gestos, layout) — 15%
5. Web Animations API (imperativo) — 5%

---

## 1. Filosofía

JP-WALLET se siente **orgánico, premium y vivo**. Cada interacción tiene peso, intención y respuesta. La app no "funciona" — **respira**.

### Principios rectores

1. **Orgánico sobre mecánico** — Las animaciones imitan física del mundo real (resortes, inercia, gravedad). Nada se mueve "en línea recta" sin razón.
2. **Sincronizado sobre caótico** — Cuando varios elementos animan juntos, lo hacen en coreografía (stagger, cascada, contrapunto).
3. **Continuidad sobre discontinuidad** — Los elementos que cambian de pantalla se transforman, no desaparecen y aparecen.
4. **Performance es estética** — 60fps no es opcional. Una animación entrecortada rompe la magia.
5. **Wow medido** — Los efectos especiales ganan atención. Usarlos con intención, no en cada rincón.

---

## 2. Principios de Motion

### 2.1 Física sobre tiempo
Las animaciones se definen por **curvas y resortes**, no por duraciones fijas. Un botón no tarda 200ms en presionar — se mueve 4px con un resorte que termina cuando la energía se disipa.

### 2.2 Causa y efecto visible
Cada acción tiene una respuesta visual inmediata. Click → ripple + escala. Hover → lift + brillo. Submit → progreso + confirmación.

### 2.3 Coreografía
Cuando una pantalla monta, los elementos entran en **stagger** (50-80ms entre cada uno) desde una dirección coherente. Las salidas son el inverso especular.

### 2.4 Anticipación y seguimiento
Un elemento que va a aparecer grande primero se muestra pequeño (anticipación). Un elemento que sale primero se aleja antes de desvanecer (follow-through).

---

## 3. Tokens de Motion

### 3.1 Duración

| Token | Valor | Uso |
|-------|-------|-----|
| `duration.instant` | 100ms | Cambios de estado inmediatos (color, opacidad) |
| `duration.fast` | 200ms | Hovers, focus, micro-interacciones |
| `duration.base` | 300ms | Entrada de componentes, transiciones de página |
| `duration.slow` | 500ms | Modales, drawers, onboarding |
| `duration.dramatic` | 800ms | Hero animations, splash, éxito |
| `duration.shimmer` | 1500ms | Loading skeletons, progress shine |

### 3.2 Easings

| Token | Curva | Uso |
|-------|-------|-----|
| `ease.out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entradas (desacelerar al llegar) |
| `ease.in` | `cubic-bezier(0.7, 0, 0.84, 0)` | Salidas (acelerar al irse) |
| `ease.inOut` | `cubic-bezier(0.65, 0, 0.35, 1)` | Cambios de estado, swaps |
| `spring.gentle` | stiffness: 120, damping: 20 | Elementos UI estándar |
| `spring.bouncy` | stiffness: 300, damping: 15 | Celebraciones, éxito |
| `spring.snap` | stiffness: 500, damping: 30 | Snap-to-grid, switches |

### 3.3 Distancias

| Token | Valor | Uso |
|-------|-------|-----|
| `distance.tiny` | 4px | Press states |
| `distance.short` | 8px | Hovers |
| `distance.medium` | 16px | Entrada de componentes |
| `distance.long` | 32px | Entrada de pantalla, drawers |
| `distance.dramatic` | 64px | Hero, splash |

### 3.4 Stagger y secuencias

| Token | Valor | Uso |
|-------|-------|-----|
| `stagger.item` | 60ms | Entre items de una lista o grid |
| `stagger.group` | 100ms | Entre grupos visuales (cards de secciones distintas) |
| `shake.oscillations` | 3 | Input error shake |
| `shake.duration` | 400ms (= `duration.slow`) | Duración total del shake |

### 3.5 Motion y tema (dark / light mode)

Los tokens de motion son agnósticos al tema, pero algunos efectos visuales **sí cambian** según el modo:

| Efecto | Light mode | Dark mode |
|--------|-----------|-----------|
| Shimmer gradient | `surface-1` → `surface-2` (más claro) | `surface-2` → `surface-3` (más oscuro) |
| Border highlight | `accent` 100% | `accent` 80% (menos agresivo) |
| Glow / shadow | Drop shadow estándar | Drop shadow más sutil + glow accent |

Referencia: las superficies (`surface-1`, `surface-2`) están definidas en `packages/jp-ds/tokens/color.css` y `dark.css`.

---

## 4. View Transitions API

### 4.1 ¿Qué es?
API nativa del navegador que permite animar transiciones entre estados del DOM (incluyendo cambios de ruta SPA) sin librería adicional. Es la **base** de nuestras transiciones de página.

### 4.2 Soporte de navegadores

| Navegador | Soporte |
|-----------|---------|
| Chrome / Edge | ✅ Estable |
| Firefox | ✅ 116+ |
| Safari | ✅ 18+ |
| Fallback | Cross-fade con CSS |

### 4.3 Uso base

```js
// Transición de página estándar
document.startViewTransition(() => {
  router.navigate('/new-route');
});
```

### 4.4 Transición con nombre (elemento compartido)

```js
// Página origen: asignar nombre al elemento
document.querySelector('.transaction-card').style.viewTransitionName = 'tx-detail';

// Página destino: mismo viewTransitionName en el detalle
// El navegador interpola automáticamente entre posiciones/tamaños
```

### 4.5 Tipos de transición por ruta

| Tipo | Animación | Uso |
|------|-----------|-----|
| `slide` | Forward: slide from `inline-end` + fade. Backward: slide to `inline-end` + fade. RTL-aware (§5.8). | Navegación jerárquica |
| `fade` | Cross-fade simple | Rutas del mismo nivel (tabs) |
| `morph` | View Transition con `view-transition-name` compartido | Drill-down a detalle |
| `modal` | Scale-up (0.95→1) + backdrop blur | Modales, sheets |
| `hero` | Named transition con parallax | Login → Home (primera vez) |

### 4.6 Reglas críticas

- **Solo `transform` y `opacity`** en `::view-transition-group()` — cualquier otra propiedad causa jank.
- **No animar `background-color`** directamente en el snapshot — usar overlay.
- **Respetar `prefers-reduced-motion`** — desactivar dramáticas, mantener cross-fade. Ver implementación en §9.1 y trastornos vestibulares en §9.4.

### 4.7 Cancelación e interrupción

Las transiciones pueden ser interrumpidas por navegación rápida, errores o cambio de tema. Reglas:

- **Navegación doble**: si llega una nueva transición mientras hay una en curso, **cancelar la anterior**. `document.startViewTransition()` retorna una promesa; usar `.skipTransition()` o un guard en el router.
- **Cambio de tema**: las transiciones activas deben completarse antes de aplicar el nuevo tema para evitar jank.
- **Error en render**: envolver el callback en try/catch y restaurar estado anterior; nunca dejar la UI en estado intermedio.
- **Pestaña oculta (`document.hidden`)**: no iniciar transiciones; diferir la navegación hasta que la pestaña vuelva a estar visible.

#### Helper recomendado

```js
function navigateWithTransition(path) {
  if (!document.startViewTransition) {
    router.navigate(path);
    return;
  }
  const transition = document.startViewTransition(() => router.navigate(path));
  return transition;
}
```

---

## 5. Patrones de Componente

### 5.1 Botones
- **Hover (mouse)**: lift (-4px Y = `distance.tiny`) + brillo sutil en border
- **Touch feedback (mobile)**: scale (0.97) inmediato en `:active` + ripple; sin hover state
- **Press**: scale (0.97) con `duration.fast`
- **Loading**: spinner interno reemplaza el texto (no cambia de tamaño)
- **Success**: check icon entra con `spring.bouncy`
- **Disabled**: opacidad 0.5, sin pointer events

### 5.2 Inputs
- **Focus**: border color → accent con transition 200ms
- **Label float**: label sube cuando hay valor con `ease.out`
- **Error**: shake (`shake.oscillations` oscilaciones con `shake.duration`) + border rojo

### 5.3 Cards
- **Mount**: stagger fade-in (translateY `distance.medium` → 0 + opacity 0 → 1)
- **Hover**: lift (-8px Y = `distance.short`) + border highlight accent
- **Press**: scale (0.99) con `duration.fast`

### 5.4 Listas
- **Mount**: stagger en cascada (`stagger.item` entre items)
- **Item add**: slide from top + fade
- **Item remove**: collapse height + fade out (200ms)
- **Item reorder**: **FLIP animation** (First, Last, Invert, Play)

### 5.5 Modales
- **Open**: scale-up (0.95 → 1) + opacity 0→1 + backdrop blur in
- **Close**: scale-down (1 → 0.95) + opacity 1→0
- **Backdrop**: fade in/out con `backdrop-filter: blur(8px)`

### 5.6 Toasts / Notificaciones
- **Mount**: slide from top-`inline-end` con `spring.gentle` (RTL-aware, ver §5.8)
- **Auto-dismiss**: progress bar horizontal + fade out al final
- **Action**: hover pausa el dismiss

### 5.7 Navegación
- **Tab change**: indicador (underline) se desliza entre items con `spring.gentle`
- **Drawer open**: slide from edge con rubber band al final
- **Bottom nav**: indicador activo se anima entre items (layout animation)

### 5.8 Direccionalidad (LTR / RTL)

Las animaciones direccionales deben respetar la dirección de lectura del idioma:

- En LTR (español, inglés): `inline-end = right`, `inline-start = left`.
- En RTL (árabe, hebreo): `inline-end = left`, `inline-start = right`.

**Regla**: usar propiedades lógicas de CSS (`margin-inline-start`, `padding-inline-end`) o el equivalente direccional de Motion. Nunca hardcodear `right`/`left` en tokens de animación.

Tokens que respetan RTL:
- `slide.forward` → translate desde `inline-end`
- `slide.backward` → translate hacia `inline-end`
- `slide.drawer` → slide desde el edge correspondiente al contexto

Actualmente el proyecto solo soporta LTR (SPEC §5.7), pero la abstracción debe estar lista para evitar refactor futuro.

---

## 6. Estados de Carga

### 6.1 Skeleton con shimmer

```css
background: linear-gradient(90deg,
  var(--surface-1) 0%,
  var(--surface-2) 50%,
  var(--surface-1) 100%);
background-size: 200% 100%;
animation: shimmer var(--duration-shimmer) infinite;
```

### 6.2 Spinner con personalidad
Tres puntos que aparecen en secuencia (no un círculo genérico). Color accent con transición de opacidad. Respetar el contexto — nunca abstracto.

### 6.3 Progress con delight
- Barras con shine effect al moverse
- Numbers rolling up/down al cambiar (digit-by-digit)
- Circular progress con check al completar

---

## 7. Micro-interacciones

| Elemento | Animación |
|----------|-----------|
| Toggle switch | Slide de thumb con `spring.bouncy` + cambio de color |
| Checkbox | Check se dibuja con `stroke-dashoffset` animation |
| Radio | Scale (0.8 → 1) del inner circle con `spring.gentle` |
| Counter | Number rolling con digit-by-digit (transform translateY) |
| Pull-to-refresh | Spinner aparece con threshold + bounce |
| Skeleton → content | Cross-fade con scale (1.02 → 1) |

---

## 8. Performance Budget

### 8.1 Reglas duras
- **60fps mínimo** (16.67ms por frame)
- Solo animar `transform`, `opacity`, `filter`
- **Nunca** animar `width`, `height`, `top`, `left`, `margin`, `padding`
- `will-change` solo en animaciones activas — remover después

### 8.2 Estrategia GPU
- Promover a compositor cuando hay jank con `transform: translateZ(0)`
- Usar `contain: layout style paint` en secciones independientes
- Layer promotion para elementos que se mueven frecuentemente

### 8.3 Medición
- Chrome DevTools → Performance tab (verificar frames > 16ms)
- Lighthouse → "Avoid non-composited animations"
- Real User Monitoring (futuro)

---

## 9. Accesibilidad

### 9.1 prefers-reduced-motion

```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

Mantener cross-fades (no eliminar todo). Cambiar springs por transiciones lineales cortas.

### 9.2 Foco visible
- Outline de 2px accent con offset 2px
- Aparece con fade-in 100ms
- Pulse sutil para guiar la vista la primera vez

### 9.3 Navegación por teclado
- Skip-to-content link con animación de aparición
- Focus trap en modales con animación visual
- Tab order respetado en animaciones de entrada

### 9.4 Trastornos vestibulares

`prefers-reduced-motion` no cubre todos los casos. Ciertos efectos siguen siendo problemáticos para usuarios con sensibilidad vestibular, incluso con motion reducido:

- Rotación continua (spinners 3D, parallax rotacional)
- Parallax (movimiento de capas a velocidades distintas)
- Scale agresivo (> 1.05)
- Zoom in/out súbito

**Regla**: envolver estos efectos en `@media (prefers-reduced-motion: no-preference)` para que solo se apliquen cuando el usuario optó explícitamente por motion completo.

```css
@media (prefers-reduced-motion: no-preference) {
  .hero-parallax { transform: translateY(...); }
}
```

Referencia: WCAG 2.3.3 (Animation from Interactions, AAA).

---

## 10. Stack de Implementación

### 10.1 Tecnologías (en orden de prioridad)

| Tecnología | Uso | % del código |
|------------|-----|--------------|
| CSS transitions | Estados simples (hover, focus, color) | ~40% |
| CSS @keyframes | Loading, shimmer, repeat loops | ~15% |
| View Transitions API | Cambios de ruta, morphs entre páginas | ~25% |
| Motion (ex Framer Motion) | Gestos, layout animations, drag | ~15% |
| Web Animations API | Control imperativo, secuencias | ~5% |

### 10.2 Estructura de archivos

```
src/
├── lib/motion/
│   ├── tokens.ts        # Tokens exportados (duration, ease, distance)
│   ├── transitions.ts   # Helpers de View Transitions
│   ├── easings.ts       # Curvas y springs
│   └── presets.ts       # Animaciones predefinidas (fadeIn, slideUp, etc.)
├── components/
│   ├── animated/        # Wrappers con animación (MotionDiv, AnimatedRoute)
│   └── ui/              # Componentes base con motion integrado
```

### 10.3 Convenciones
- `useAnimated*` para hooks de animación
- `<MotionDiv>`, `<MotionButton>` para wrappers
- `motion/` sufijo para archivos con lógica de animación
- Cada animación significativa documenta su intención en JSDoc

---

## 11. Design Tooling (Pencil)

### 11.1 Convenciones de frames
Cada frame en Pencil incluye anotación de:
- **Duración esperada** (referencia a token: `duration.base`)
- **Easing o spring** (referencia a token: `spring.gentle`)
- **Trigger** (hover, press, mount, route-change)

### 11.2 Estados a diseñar
Para cada componente entregar:
- Default
- Hover
- Press / Active
- Focus (con focus ring)
- Disabled
- Loading
- Error (si aplica)
- Success (si aplica)

### 11.3 Handoff a código
- Designer exporta animaciones como referencia (Lottie opcional)
- Developer implementa usando los **mismos tokens** de `lib/motion/tokens.ts`
- QA valida que el feel coincide con el diseño (no pixel-perfect, feel)

### 11.4 Metodología de testing

QA valida feel (no pixel-perfect). Herramientas:

- **Visual regression**: Chromatic o Percy sobre frames clave (default, hover, loading, error).
- **Performance**: Playwright + Lighthouse en CI para `Avoid non-composited animations` (§8.3).
- **Reduced motion**: Playwright con `await page.emulateMedia({ reducedMotion: 'reduce' })` corriendo el suite de e2e.
- **Cross-browser**: matriz Chrome, Firefox 116+, Safari 18+ con fallback cross-fade (§4.2).

```js
// Playwright: test respeta reduced motion
test('modal respects reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/settings');
  await page.click('[data-testid="open-modal"]');
  const duration = await page.evaluate(() =>
    getComputedStyle(document.querySelector('[role="dialog"]'))
      .transitionDuration
  );
  expect(parseFloat(duration)).toBeLessThan(0.05);
});
```

---

## 12. Anti-patrones

❌ Animar más de 3 propiedades simultáneamente
❌ Usar `ease-linear` en UI (solo en progress bars)
❌ Animaciones > 1s en interacciones comunes
❌ Cambios de layout animados (causan reflow)
❌ Animaciones que bloquean interacción
❌ Bounce excesivo (más de 2 oscilaciones)
❌ Movimientos sin propósito narrativo
❌ Modales con animación de entrada > 500ms

---

## 13. Checklist de Calidad

Antes de mergear cualquier feature con motion, validar según audiencia:

### 13.1 Diseñador

- [ ] Componente diseñado en Pencil con los 8 estados (§11.2)
- [ ] Cada animación referencia un token (no magic numbers en anotaciones)
- [ ] Reduced motion explícito: ¿se mantiene legibilidad sin la animación?

### 13.2 Developer

- [ ] Solo anima `transform`/`opacity`/`filter` (§8.1)
- [ ] Tokens de motion usados (no magic numbers) (§3)
- [ ] Respeta `prefers-reduced-motion` (§9.1) y vestibular (§9.4)
- [ ] Salida es inversa de la entrada (§2.3)
- [ ] Sin layout shift durante la animación
- [ ] `will-change` removido tras la animación (§8.1)
- [ ] Stagger coordinado con `stagger.item` (§3.4)
- [ ] Direccionalidad respetada (RTL-ready) (§5.8)

### 13.3 QA

- [ ] 60fps verificado en DevTools Performance (§8.3)
- [ ] Lighthouse sin warnings de animaciones no compuestas (§8.3)
- [ ] Visual regression pasa en frames clave (§11.4)
- [ ] Reduced motion verificado con Playwright (§11.4)
- [ ] Cross-browser verificado en matriz §11.4
- [ ] Focus visible animado correctamente (§9.2)
- [ ] Tab order respetado en entradas (§9.3)

---

## 14. Historial de versiones

### v1.1.0 — 2026-06-21

- Nueva §0 Quick Reference al inicio del documento
- Nuevos tokens en §3.4 (stagger.item, stagger.group, shake.oscillations, shake.duration)
- Nueva §3.5 Motion y tema (dark / light mode)
- Nueva §4.7 Cancelación e interrupción de transiciones
- Nueva §5.8 Direccionalidad (LTR / RTL)
- Nueva §9.4 Trastornos vestibulares
- Nueva §11.4 Metodología de testing
- §13 Checklist dividido por audiencia (diseñador / developer / QA)
- §14 Historial de versiones
- §5.1 Lift de button alineado a `distance.tiny` (4px, antes era 2px)
- §5.3 Lift de card alineado a `distance.short` (8px, antes era 4px)
- §5.1 Touch feedback agregado para mobile
- §5.2 Shake referencia tokens `shake.oscillations` y `shake.duration`
- §5.4 Stagger referencia token `stagger.item`
- §6.1 Shimmer referencia `duration.shimmer`
- §4.5 Slide direccional usa `inline-end` (RTL-ready)
- §4.6 Cross-reference a §9.1 para `prefers-reduced-motion`

### v1.0.0 — 2026-06-21

- Versión inicial del estándar de motion design.

---

*Este estándar se itera. Nuevas técnicas se adoptan cuando se justifican con evidencia de UX. Performance y accesibilidad nunca son negociables.*
