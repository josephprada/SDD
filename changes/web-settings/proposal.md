# Propuesta: Change 3 — Web Settings (Configuración completa)

**Versión**: 1.3.0
**Estado**: Planificado
**Change**: web-settings
**Creado**: 2026-07-04
**Rama**: `feat/web-settings` (desde `testing`)

---

## Intención

Completar el **panel de configuración** de JP-WALLET: convertir `/settings` de placeholder a una experiencia funcional donde el usuario edita **perfil** (nombre visible y foto), personaliza **apariencia** (modo claro/oscuro/sistema, color de acento, color de errores, tipografía), período de agrupación temporal, acceso a categorías, idioma y preferencias de notificaciones. Perfil y preferencias se persisten en Convex (`userProfiles`, `userPreferences`) y se reflejan en toda la app (shell, dashboard, tokens CSS).

Este change cierra el gap dejado por `web-foundation` (solo `theme` en schema; toggle UI oculto por D-07) y `web-core` (dashboard fijo al mes en curso; filas de ajustes estáticas).

## Alcance

### Dentro del Scope

- **Modo de tema**: selector en Ajustes (oscuro / claro / sistema), reutilizando la lógica existente (`stores/theme.ts`, `userPreferences.updateTheme`). Sincronización local + servidor.
- **Color de acento (preset)**: catálogo curado de paletas que reemplazan `--color-accent` y derivados (`--color-accent-deep`, `--color-accent-muted`, `--color-accent-glow`, `--color-border-focus`, `--color-success`). Default: **Green Bolt** (`#07FBA2`). Sin selector libre de hex — solo presets validados para contraste AA.
- **Color de errores (preset)**: catálogo curado para `--color-danger` (y variantes derivadas si aplica). Default: rojo actual (`#EF4444`).
- **Tipografía (preset)**: catálogo de combinaciones body + mono (p. ej. Inter, DM Sans, Source Sans, system-ui) aplicadas vía `--font-body` / `--font-mono`. Vista previa en Ajustes antes de confirmar.
- **Sección Apariencia** en `/settings`: agrupa modo, acento, errores y tipografía con previews visuales (swatches + muestra de texto).
- **Restaurar apariencia por defecto**: botón en la sección Apariencia que revierte modo, acento, errores y tipografía a los valores de producto (`dark`, Green Bolt, Rojo clásico, Inter) con confirmación breve.
- **Agrupación temporal**: preferencia `defaultGrouping` (`week` | `month` | `quarter` | `semester`) persistida; el dashboard y resúmenes usan el período elegido como vista por defecto.
- **Categorías**: entrada clara desde Ajustes hacia la gestión existente (`/categories`); copy y jerarquía alineados al panel centralizado.
- **Idioma**: preferencia `language` persistida (`es` por defecto); UI en español en este change; infraestructura mínima para cambio futuro sin reescribir pantallas.
- **Notificaciones**: toggle `notificationsEnabled` persistido; sin entrega Web Push (diferido v2) — la preferencia queda lista para alertas de Change 4+.
- **Schema Convex**: extender `userPreferences` con `defaultGrouping`, `language`, `notificationsEnabled`, `accentPreset`, `dangerPreset`, `typographyPreset`.
- **JP-DS**: catálogo de presets en tokens (TS/CSS); aplicación runtime con `data-accent`, `data-danger`, `data-font` en `<html>` + pre-paint mínimo para evitar flash de acento por defecto.
- **Perfil editable**: cambiar **nombre visible** (`displayName`) y **foto de perfil** (subida JPEG/PNG vía Convex file storage, máx. 2 MB); email de Google **solo lectura**; opción quitar foto custom y volver a la de Google.
- **UI responsive**: mobile-first 375 px → desktop, alineado a JP-DS y `desing.md`.

### Fuera del Scope

- **Exportar datos** (PDF, CSV, JSON) — Change 4 o change dedicado
- **Eliminar cuenta** y borrado masivo de datos — change posterior (riesgo alto, requiere flujo de confirmación)
- **Web Push / recordatorios reales** — v2 (`SPEC.md` §2)
- **Traducción completa al inglés** — solo persistir preferencia; strings en `en` diferidos
- **Presupuestos, reportes, gráficos** — Change 4
- **Theme toggle en header global** — opcional; prioridad en panel Ajustes (D-07 se resuelve en settings, no obligatoriamente en shell)
- **Color picker libre / hex arbitrario** — solo presets curados (accesibilidad y coherencia JP-DS)
- **Recolorear `icon.svg` / logo de marca** — el asset de marca permanece Green Bolt; la personalización afecta la UI de la app
- **Cambiar email de cuenta** — ligado a Google OAuth; no editable en este change
- **Reubicar CRUD de categorías** dentro de `/settings` como sub-rutas — se mantiene `/categories` con deep link

## Capabilities

### Capabilities Nuevas

| Capability | Tipo | Descripción |
|------------|------|-------------|
| `user-preferences` | NUEVA | CRUD de preferencias: tema, acento, errores, tipografía, agrupación, idioma, notificaciones; lectura al login |
| `settings-panel` | NUEVA | Pantalla `/settings` interactiva con secciones, valores actuales y acciones |
| `appearance-presets` | NUEVA | Catálogo de presets de acento, danger y tipografía; aplicación a tokens CSS |
| `period-grouping` | NUEVA | Cálculo de rangos semana/mes/trimestre/semestre para dashboard y agregados |
| `user-profile` | NUEVA | Edición de nombre visible y avatar; resolución sobre datos Google |

### Capabilities Modificadas

| Capability | Tipo | Descripción |
|------------|------|-------------|
| `theme-toggle` | MODIFICADA | Exposición UI en Ajustes + integración con presets de acento/errores/tipografía |
| `design-system` | MODIFICADA | JP-DS soporta presets runtime sobre tokens semánticos existentes |
| `dashboard` | MODIFICADA | Resumen y navegación de período respetan `defaultGrouping` del usuario |
| `app-shell` | MODIFICADA | Shell y dashboard muestran nombre/avatar editados; Ajustes con filas funcionales |
| `auth-google-oauth` | MODIFICADA | `currentUser` prioriza overrides de perfil sobre identidad Google |

## Enfoque

### Modelo de datos

Extender `userPreferences` según `SPEC.md` §5.7:

```typescript
{
  userId,
  theme: "light" | "dark" | "system",
  accentPreset: "green-bolt" | "cyan-neon" | "amber-gold" | "violet-pulse" | "coral-heat",
  dangerPreset: "red-classic" | "rose-soft" | "orange-alert" | "crimson-deep",
  typographyPreset: "inter-default" | "dm-sans" | "source-sans" | "system-native",
  defaultGrouping: "week" | "month" | "quarter" | "semester",
  language: "es" | "en",
  notificationsEnabled: boolean,
  updatedAt
}
```

Valores por defecto al crear usuario: `theme: "dark"`, `accentPreset: "green-bolt"`, `dangerPreset: "red-classic"`, `typographyPreset: "inter-default"`, `defaultGrouping: "month"`, `language: "es"`, `notificationsEnabled: true`.

### Catálogo de presets (orientativo — valores finales en `design.md`)

**Acento** (swatch + nombre en UI):

| ID | Nombre UI | Nota |
|----|-----------|------|
| `green-bolt` | Green Bolt | Default de marca `#07FBA2` |
| `cyan-neon` | Cian neón | Frío, alta energía |
| `amber-gold` | Ámbar dorado | Cálido, legible en dark |
| `violet-pulse` | Violeta pulso | Contraste con verde de categorías |
| `coral-heat` | Coral intenso | Alternativa cálida |

**Errores**:

| ID | Nombre UI |
|----|-----------|
| `red-classic` | Rojo clásico (default) |
| `rose-soft` | Rosa suave |
| `orange-alert` | Naranja alerta |
| `crimson-deep` | Carmesí profundo |

**Tipografía**:

| ID | Nombre UI | Body / Mono (orientativo) |
|----|-----------|---------------------------|
| `inter-default` | Inter (default) | Inter + JetBrains Mono |
| `dm-sans` | DM Sans | DM Sans + JetBrains Mono |
| `source-sans` | Source Sans | Source Sans 3 + IBM Plex Mono |
| `system-native` | Sistema | system-ui + ui-monospace |

Cada preset de acento DEBE recalcular derivados (`deep`, `muted`, `glow`, `border-focus`, `success`) con `color-mix` para light y dark.

### Agrupación temporal

- **Semana**: lunes–domingo de la semana que contiene la fecha de referencia (locale `es-CO`).
- **Mes**: mes calendario (comportamiento actual del dashboard).
- **Trimestre**: Q1 ene–mar, Q2 abr–jun, Q3 jul–sep, Q4 oct–dic.
- **Semestre**: ene–jun y jul–dic.

El dashboard conserva navegación anterior/siguiente pero el paso y las etiquetas dependen del grouping activo.

### Notificaciones

Solo persistencia del toggle. Sin permisos de navegador ni suscripción push. Copy honesto: "Alertas en la app (próximamente)" o equivalente si `notificationsEnabled` no tiene efecto visible aún.

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|--------|--------------|------------|
| Regresión de tema (FOUC / desincronización local vs servidor) | Media | Reutilizar `applyTheme` y reconciliación existente; pre-paint para acento/tipografía |
| Contraste AA roto con preset de acento en light | Media | Validar cada preset en ambos modos; bloquear presets que fallen WCAG en CTAs |
| Flash de acento default al cargar | Media | `localStorage` pre-auth + script inline; reconciliar con Convex post-auth |
| FOUT al cambiar tipografía | Baja | `font-display: swap`; precargar fuentes del catálogo |
| Rangos de trimestre/semestre ambiguos en bordes | Baja | Tests unitarios de `periodRange()`; documentar en design.md |
| Scope creep a export/delete account | Media | Fuera de scope explícito |
| i18n parcial confunde al usuario | Baja | Solo `es` activo; `en` deshabilitado o con aviso "Próximamente" |

## Dependencias

- `web-foundation` — auth, shell, `userPreferences` (theme), theme store
- `web-core` — dashboard, `/categories` CRUD, producción en `wallet.lavalex.co`
- `SPEC.md` §4.11, §5.7
- `desing.md` — tokens, glass rows, mobile-first §7

## Criterios de éxito (propuesta)

1. Usuario autenticado cambia modo de tema en Ajustes y ve el cambio al instante; persiste tras recargar y en otro dispositivo.
2. Usuario elige preset de acento "Cian neón"; botones primarios, focus rings y glow reflejan el nuevo color en < 1 s.
3. Usuario elige preset de errores "Naranja alerta"; mensajes de validación y estados destructivos usan el nuevo tono.
4. Usuario elige tipografía "DM Sans"; toda la UI de body adopta la fuente; montos mantienen tabular-nums.
5. Usuario cambia agrupación a trimestre; el dashboard muestra ingresos/gastos del trimestre en curso por defecto.
6. Todas las filas de Ajustes muestran el valor actual (no texto estático placeholder).
7. Toggle de notificaciones persiste; estado visible al volver a Ajustes.
8. Enlace a Categorías lleva a la gestión existente sin regresiones.
9. Botón "Restaurar apariencia por defecto" revierte modo, acento, errores y tipografía; persiste en Convex.
10. Usuario cambia nombre y sube avatar; shell, dashboard y Ajustes reflejan los cambios; quitar avatar restaura foto de Google.

## Próximo paso

`/speckit-implement` — ejecutar `tasks.md` (42 tareas, 7 fases).
