# Change 3 — Web Settings (Configuración completa)

**Versión**: 1.3.0
**Estado**: Completado ✅ (2026-07-04)
**Change**: web-settings
**Creado**: 2026-07-04
**Rama**: `feat/web-settings` (desde `testing`)

---

## Propuesta

Ver [proposal.md](./proposal.md) para intención, alcance, capabilities y riesgos.

### Resumen de alcance

**Dentro:** perfil editable (nombre + avatar), apariencia (modo, presets acento/errores/tipografía, reset), agrupación temporal, categorías, idioma, notificaciones, extensión de schema, dashboard por período.

**Fuera:** cambiar email, color picker libre, exportar/eliminar cuenta, Web Push, i18n EN completo, presupuestos/reportes, recolorear logo.

---

## Especificación

### Dominio: settings-panel

#### Requisito: Pantalla de Ajustes funcional
El sistema DEBE mostrar en `/settings` las secciones de configuración con el valor actual de cada preferencia y controles interactivos.

**Escenario: Vista inicial**
- GIVEN un usuario autenticado con preferencias guardadas
- WHEN abre `/settings`
- THEN DEBE ver sección **Perfil** con nombre editable, email (solo lectura) y avatar con acción para cambiar foto
- AND DEBE ver sección **Apariencia** con controles para Modo, Color de acento, Color de errores y Tipografía
- AND DEBE ver filas para Agrupación, Categorías, Idioma y Notificaciones con el valor actual de cada una

**Escenario: Placeholder eliminado**
- GIVEN la pantalla de Ajustes
- WHEN el usuario observa las filas de preferencias
- THEN ninguna fila DEBE mostrar únicamente texto estático hardcodeado sin reflejar el estado real del usuario

**Escenario: Mobile y desktop**
- GIVEN viewports 375 px y 1280 px
- WHEN el usuario navega Ajustes
- THEN el layout DEBE ser usable (touch targets ≥ 44 px, sin overflow horizontal)

#### Requisito: Acceso a Categorías
El sistema DEBE ofrecer desde Ajustes un acceso directo a la gestión de categorías existente.

**Escenario: Navegación a categorías**
- GIVEN el usuario en `/settings`
- WHEN pulsa la fila "Categorías"
- THEN DEBE navegar a `/categories` con la experiencia CRUD ya entregada en `web-core`

---

### Dominio: user-profile

#### Requisito: Editar nombre visible
El sistema DEBE permitir al usuario cambiar el nombre que se muestra en la app (distinto del email de Google).

**Escenario: Guardar nombre válido**
- GIVEN el usuario en `/settings` con nombre "Ana García"
- WHEN edita el nombre a "Ana G." y guarda
- THEN `userProfiles.displayName` DEBE ser "Ana G."
- AND sidebar, dashboard ("Hola, …") y Ajustes DEBEN mostrar "Ana G." sin recargar

**Escenario: Nombre vacío**
- GIVEN el formulario de perfil
- WHEN intenta guardar con nombre vacío o solo espacios
- THEN el sistema DEBE bloquear el guardado y mostrar error de validación

**Escenario: Default sin override**
- GIVEN usuario nuevo sin `displayName` guardado
- WHEN abre la app
- THEN el nombre visible DEBE ser el de Google OAuth (`users.name` / identity)

**Escenario: Email no editable**
- GIVEN el usuario en perfil
- WHEN intenta editar el email
- THEN el campo DEBE ser solo lectura (proviene de Google)

#### Requisito: Cambiar foto de perfil
El sistema DEBE permitir subir una imagen de perfil propia (JPEG o PNG).

**Escenario: Subir avatar**
- GIVEN usuario con foto de Google
- WHEN selecciona una imagen JPEG ≤ 2 MB y confirma
- THEN el archivo DEBE almacenarse en Convex file storage
- AND `userProfiles.avatarStorageId` DEBE apuntar al archivo
- AND avatar en shell, dashboard y Ajustes DEBE mostrar la nueva imagen

**Escenario: Tipo no permitido**
- GIVEN selector de archivo
- WHEN el usuario intenta subir PDF o GIF
- THEN el sistema DEBE rechazar con mensaje claro (solo JPG/PNG)

**Escenario: Tamaño excedido**
- GIVEN imagen > 2 MB
- WHEN intenta subir
- THEN DEBE bloquear con error de límite

**Escenario: Quitar foto custom**
- GIVEN usuario con avatar subido
- WHEN pulsa "Usar foto de Google" o equivalente
- THEN DEBE eliminar referencia y archivo storage
- AND DEBE volver a mostrar `pictureUrl` de Google

**Escenario: Propagación en UI**
- GIVEN nombre o avatar actualizados
- WHEN el usuario navega a `/`, sidebar o menú usuario
- THEN DEBE ver los mismos valores (fuente única: `users.currentUser`)

**Escenario: Reset de apariencia no afecta perfil**
- GIVEN perfil personalizado
- WHEN restaura apariencia por defecto
- THEN nombre y avatar DEBEN permanecer sin cambios

---

### Dominio: appearance-presets (acento, errores, tipografía)

#### Requisito: Presets de color de acento
El sistema DEBE ofrecer un catálogo fijo de presets de acento; el usuario NO DEBE poder ingresar colores arbitrarios.

**Escenario: Selección de preset**
- GIVEN acento actual "Green Bolt"
- WHEN el usuario elige el preset "Cian neón" en Ajustes
- THEN `userPreferences.accentPreset` DEBE ser `cyan-neon`
- AND los tokens semánticos de acento (`--color-accent`, `--color-accent-deep`, `--color-accent-muted`, `--color-accent-glow`, `--color-border-focus`, `--color-success`) DEBEN actualizarse en toda la app sin recargar

**Escenario: Vista previa antes de aplicar**
- GIVEN el selector de acento abierto
- WHEN el usuario pasa el dedo o el cursor sobre un preset
- THEN DEBE ver un swatch y el nombre del preset
- AND al confirmar la selección la UI completa DEBE reflejar el cambio

**Escenario: Default de marca**
- GIVEN un usuario nuevo
- WHEN consulta preferencias
- THEN `accentPreset` DEBE ser `green-bolt` (verde eléctrico `#07FBA2`)

**Escenario: Contraste accesible**
- GIVEN cualquier preset de acento en modo claro u oscuro
- WHEN se renderiza un botón primario con texto sobre el acento
- THEN el contraste DEBE cumplir WCAG 2.1 AA (≥ 4.5:1) — presets que no cumplan NO DEBEN incluirse en el catálogo

**Escenario: Logo de marca invariante**
- GIVEN un acento distinto a Green Bolt
- WHEN el usuario ve el icono de marca (`icon.svg`) en header o login
- THEN el asset DEBE conservar los colores originales de marca (personalización solo en tokens de UI)

#### Requisito: Presets de color de errores
El sistema DEBE ofrecer un catálogo fijo de presets para estados de error y acciones destructivas.

**Escenario: Cambio de preset de errores**
- GIVEN preset de errores "Rojo clásico"
- WHEN el usuario selecciona "Naranja alerta"
- THEN `userPreferences.dangerPreset` DEBE ser `orange-alert`
- AND `--color-danger` y mensajes de validación en formularios DEBEN usar el nuevo tono

**Escenario: Independencia de acento**
- GIVEN acento "Violeta pulso" y errores "Rosa suave"
- WHEN ocurre un error de validación en un formulario
- THEN el color de error DEBE ser el del preset de errores, no el del acento

**Escenario: Default**
- GIVEN usuario nuevo
- WHEN consulta preferencias
- THEN `dangerPreset` DEBE ser `red-classic`

#### Requisito: Presets de tipografía
El sistema DEBE ofrecer un catálogo fijo de combinaciones tipográficas (body + mono para números).

**Escenario: Cambio de tipografía**
- GIVEN tipografía "Inter (default)"
- WHEN el usuario selecciona "DM Sans"
- THEN `userPreferences.typographyPreset` DEBE ser `dm-sans`
- AND `--font-body` DEBE aplicarse al texto de la app de forma global

**Escenario: Números financieros**
- GIVEN cualquier preset de tipografía activo
- WHEN se muestran montos, balances o tablas numéricas
- THEN DEBEN usar `--font-mono` del preset con `font-variant-numeric: tabular-nums`

**Escenario: Vista previa tipográfica**
- GIVEN el selector de tipografía en Ajustes
- WHEN el usuario explora las opciones
- THEN DEBE ver una muestra con título, párrafo y monto de ejemplo (`$ 1.234.567`)

**Escenario: Persistencia**
- GIVEN tipografía guardada "Source Sans"
- WHEN el usuario recarga la app
- THEN la tipografía DEBE mantenerse sin FOUT perceptible (> flash de un frame)

#### Requisito: Persistencia de apariencia
Las preferencias de acento, errores y tipografía DEBEN persistirse en Convex y, pre-auth, en `localStorage` para evitar flash al cargar.

**Escenario: Sincronización multi-dispositivo**
- GIVEN usuario autenticado que cambia acento y tipografía
- WHEN inicia sesión en otro dispositivo
- THEN las preferencias de apariencia DEBEN reconciliarse desde `userPreferences`

#### Requisito: Restaurar apariencia por defecto
El sistema DEBE ofrecer un botón **Restaurar apariencia por defecto** en la sección Apariencia que revierta solo las preferencias visuales a los valores de producto.

**Escenario: Restaurar tras personalización**
- GIVEN modo "Claro", acento "Coral intenso", errores "Naranja alerta" y tipografía "DM Sans"
- WHEN el usuario pulsa "Restaurar apariencia por defecto" y confirma
- THEN las preferencias DEBEN quedar: modo `dark`, `accentPreset: "green-bolt"`, `dangerPreset: "red-classic"`, `typographyPreset: "inter-default"`
- AND la UI DEBE reflejar el cambio al instante
- AND los valores DEBEN persistir en Convex y `localStorage`

**Escenario: Alcance del reset**
- GIVEN el usuario tiene agrupación "Semana", idioma distinto o notificaciones desactivadas
- WHEN restaura apariencia por defecto
- THEN solo DEBEN resetearse modo, acento, errores y tipografía
- AND agrupación, idioma y notificaciones DEBEN permanecer sin cambios

**Escenario: Ya en valores por defecto**
- GIVEN apariencia ya en defaults de producto
- WHEN el usuario pulsa "Restaurar apariencia por defecto"
- THEN el botón DEBE estar deshabilitado O mostrar feedback de que no hay cambios que restaurar (sin mutación innecesaria)

**Escenario: Confirmación**
- GIVEN apariencia personalizada
- WHEN el usuario pulsa restaurar
- THEN DEBE pedir confirmación explícita antes de aplicar (evitar reset accidental)

---

### Dominio: theme-toggle (modo claro / oscuro / sistema)

#### Requisito: Cambiar modo de tema
El sistema DEBE permitir seleccionar modo oscuro, claro o sistema desde la sección Apariencia en Ajustes.

**Escenario: Cambio inmediato**
- GIVEN tema actual "oscuro"
- WHEN el usuario selecciona "Claro"
- THEN la UI DEBE aplicar el tema claro sin recargar la página
- AND la fila Modo DEBE mostrar "Claro"

**Escenario: Persistencia local y servidor**
- GIVEN un usuario autenticado que cambia el tema
- WHEN recarga la aplicación
- THEN el tema elegido DEBE mantenerse
- AND tras iniciar sesión en otro dispositivo DEBE reconciliarse con `userPreferences.theme`

**Escenario: Modo sistema**
- GIVEN tema "Sistema" y el SO en modo oscuro
- WHEN el usuario abre la app
- THEN la UI resuelta DEBE ser oscura
- AND si el SO cambia a claro, la app DEBE actualizarse (salvo `prefers-reduced-motion` / listener existente)

**Escenario: Sin sesión (fuera de scope de mutación)**
- GIVEN usuario no autenticado en `/login`
- WHEN cambia tema (si expuesto en login en el futuro)
- THEN solo `localStorage` aplica — comportamiento heredado de `web-foundation`, sin cambios requeridos en este change

---

### Dominio: user-preferences

#### Requisito: Agrupación temporal por defecto
El sistema DEBE persistir y aplicar el período de agrupación elegido: semana, mes, trimestre o semestre.

**Escenario: Selección de trimestre**
- GIVEN agrupación actual "Mes"
- WHEN el usuario selecciona "Trimestre"
- THEN `userPreferences.defaultGrouping` DEBE ser `quarter`
- AND la fila Agrupación DEBE mostrar "Trimestre"

**Escenario: Valor por defecto nuevo usuario**
- GIVEN un usuario recién provisionado sin preferencias explícitas
- WHEN consulta sus preferencias
- THEN `defaultGrouping` DEBE ser `month`

**Escenario: Persistencia**
- GIVEN agrupación guardada "Semana"
- WHEN el usuario cierra sesión y vuelve a entrar
- THEN la agrupación DEBE seguir siendo "Semana"

#### Requisito: Idioma
El sistema DEBE persistir la preferencia de idioma del usuario.

**Escenario: Español por defecto**
- GIVEN usuario nuevo
- WHEN abre Ajustes
- THEN Idioma DEBE mostrar "Español" y `language` DEBE ser `es`

**Escenario: Inglés no disponible aún**
- GIVEN la opción de idioma en Ajustes
- WHEN el usuario intenta seleccionar "English"
- THEN el sistema DEBE mostrar que no está disponible aún O mantener `es` como único idioma activo (decisión en `design.md`; la spec exige no romper la UI ni guardar un estado incoherente)

#### Requisito: Notificaciones
El sistema DEBE permitir activar o desactivar la preferencia de notificaciones.

**Escenario: Desactivar**
- GIVEN notificaciones activadas
- WHEN el usuario desactiva el toggle
- THEN `notificationsEnabled` DEBE ser `false`
- AND al volver a Ajustes el toggle DEBE estar desactivado

**Escenario: Sin entrega push**
- GIVEN notificaciones activadas
- WHEN no existe integración Web Push
- THEN el sistema NO DEBE solicitar permiso del navegador ni simular alertas push en este change

---

### Dominio: period-grouping (dashboard)

#### Requisito: Dashboard respeta agrupación
El resumen de ingresos/gastos del inicio DEBE usar el período definido por `defaultGrouping`.

**Escenario: Mes (baseline)**
- GIVEN `defaultGrouping: "month"`
- WHEN el usuario abre el dashboard
- THEN el resumen DEBE corresponder al mes calendario en curso (comportamiento actual)

**Escenario: Semana**
- GIVEN `defaultGrouping: "week"`
- WHEN el usuario abre el dashboard
- THEN el resumen DEBE corresponder a la semana calendario actual (lunes–domingo, locale `es-CO`)

**Escenario: Trimestre**
- GIVEN `defaultGrouping: "quarter"` y fecha en abril
- WHEN el usuario abre el dashboard
- THEN el resumen DEBE corresponder al trimestre abr–jun del año en curso

**Escenario: Semestre**
- GIVEN `defaultGrouping: "semester"` y fecha en agosto
- WHEN el usuario abre el dashboard
- THEN el resumen DEBE corresponder al semestre jul–dic del año en curso

**Escenario: Navegación de período**
- GIVEN agrupación "Mes" en el dashboard
- WHEN el usuario avanza al período anterior
- THEN los agregados DEBEN recalcularse para el mes previo
- AND con agrupación "Semana" el paso DEBE ser una semana, no un mes

**Escenario: Etiqueta de período**
- GIVEN cualquier agrupación activa
- WHEN el usuario ve el selector de período en el dashboard
- THEN la etiqueta DEBE describir el rango de forma comprensible (ej. "Abr–Jun 2026" para trimestre)

---

### Dominio: app-shell (ajustes menores)

#### Requisito: Cerrar sesión
El comportamiento existente de cierre de sesión en Ajustes (mobile) y sidebar (desktop) DEBE mantenerse sin regresión.

**Escenario: Sign out mobile**
- GIVEN sesión activa en viewport móvil
- WHEN pulsa "Cerrar sesión" en Ajustes
- THEN DEBE cerrar sesión y redirigir a `/login`

---

## Requisitos funcionales (resumen)

| ID | Requisito |
|----|-----------|
| FR-01 | Sección Perfil: editar nombre, cambiar/quitar avatar; email solo lectura |
| FR-02 | `/settings` muestra secciones Perfil, Apariencia y Preferencias con valores reales |
| FR-03 | Catálogo de presets de acento; aplica tokens derivados; sin hex libre |
| FR-04 | Catálogo de presets de errores; independiente del acento |
| FR-05 | Catálogo de presets de tipografía; body + mono; preview en Ajustes |
| FR-06 | Selector de agrupación con cuatro opciones; persiste en Convex |
| FR-07 | Enlace funcional a `/categories` |
| FR-08 | Preferencia de idioma persistida; UI operativa en español |
| FR-09 | Toggle de notificaciones persistido |
| FR-10 | Dashboard usa `defaultGrouping` para rangos y navegación |
| FR-11 | Mutaciones de preferencias requieren usuario autenticado |
| FR-12 | Valores por defecto al crear usuario incluyen `green-bolt`, `red-classic`, `inter-default` |
| FR-13 | Pre-paint / localStorage para apariencia pre-auth; reconciliación Convex post-auth |
| FR-14 | Botón "Restaurar apariencia por defecto" con confirmación; no afecta perfil |
| FR-15 | Avatar: JPEG/PNG, máx. 2 MB; storage Convex; borrar restaura foto Google |
| FR-16 | `currentUser` resuelve `displayName` y URL de avatar custom sobre identidad OAuth |

---

## Casos borde

- Usuario sin fila `userPreferences` (legacy): crear con defaults en primera lectura o mutación.
- Cambio de agrupación con dashboard abierto: el resumen DEBE actualizarse sin recargar (reactividad Convex).
- Modo "sistema" con `prefers-color-scheme` no soportado: fallback a oscuro (`desing.md` default).
- Preset de acento en light: variantes `--color-accent` ajustadas para AA (como hoy `#059669` en light vs `#07FBA2` en dark).
- Cambio simultáneo de modo + acento: ambos tokens DEBEN aplicarse sin estado intermedio incoherente.
- Tipografía con red lenta: fallback a system-ui hasta carga de fuente; sin bloqueo de UI.
- Trimestre/semestre en enero: Q1 / primer semestre correctos.
- Avatar anterior en storage: eliminar al subir uno nuevo (no orphan files).
- Nombre muy largo: truncar validación (máx. 80 caracteres) con error amigable.
- Preferencias concurrentes en dos pestañas: última escritura gana; sin corrupción de datos.

---

## Criterios de éxito

- [x] Ajustes muestra valores reales; cero filas placeholder estáticas
- [x] Cambio de modo visible en < 1 s y persiste tras reload
- [x] Preset de acento aplica a CTAs, focus, glow y success en light y dark
- [x] Preset de errores aplica a validaciones y acciones destructivas
- [x] Preset de tipografía aplica globalmente; montos con tabular-nums
- [x] Cambio de agrupación reflejado en dashboard en la misma sesión
- [x] Navegación semana/trimestre/semestre con etiquetas correctas en fechas límite (ene, abr, jul, oct)
- [x] Toggle notificaciones persiste; sin prompt de permisos del navegador
- [x] `/categories` accesible desde Ajustes; CRUD sin regresión
- [x] Responsive 375–1440 px; reduced motion respetado
- [x] Logo de marca no cambia con presets de acento
- [x] Restaurar apariencia revierte a defaults de producto sin tocar agrupación/idioma/notificaciones/perfil
- [x] Editar nombre y avatar persiste; visible en shell y dashboard
- [x] Quitar avatar custom restaura foto de Google

---

## Riesgos

Ver [proposal.md](./proposal.md).

---

## Dependencias

- `web-foundation`, `web-core`, `web-deploy` (prod estable)
- `SPEC.md` §4.11, §5.7
- `desing.md` v1.1.0

---

## Supuestos

- **Perfil**: overrides en `userProfiles`; email siempre de Google OAuth.
- **Avatar**: un solo archivo activo por usuario; JPEG/PNG ≤ 2 MB.
- **Presets, no picker libre**: catálogo curado; hex solo en tokens JP-DS.
- **Logo**: `icon.svg` permanece Green Bolt; la personalización es de UI, no de identidad de marca en el asset.
- **Derivados de acento**: cada preset recalcula `deep`, `muted`, `glow`, `border-focus`, `success` vía `color-mix`.
- **Light vs dark**: presets pueden tener variantes por modo resuelto (patrón actual de `#059669` en light).
- **Semana**: ISO-like con inicio lunes (`es-CO`); documentar en `design.md`.
- **Trimestre**: calendario gregoriano estándar (no fiscal DIAN).
- **Semestre**: ene–jun / jul–dic (no académico variable).
- **Idioma**: strings de producto siguen en español; `en` es preferencia almacenada para el futuro.
- **Notificaciones**: booleano sin efecto en UI de alertas hasta Change 4 (presupuestos).
- **Categorías**: no se duplica CRUD; Ajustes es hub de navegación.
- **Theme en header**: no obligatorio; prioridad panel Ajustes (resuelve D-07 en contexto settings).

---

## Estructura de archivos (orientativa)

```
apps/web/src/
├── routes/settings.tsx              # Panel interactivo + sección Apariencia
├── components/settings/             # ProfileEditor, ThemeModePicker, AccentPresetPicker, …
├── lib/appearance/                  # applyAppearancePresets, preset catalogs (re-export JP-DS)
├── lib/period/                      # periodRange, periodLabel
├── stores/                          # appearance + theme stores
└── routes/home.tsx                  # Consumir defaultGrouping

packages/jp-ds/
├── tokens/accent-presets.css        # data-accent variants
├── tokens/danger-presets.css        # data-danger variants
├── tokens/typography-presets.css    # data-font variants
└── src/appearance/presets.ts        # IDs, labels, token maps (fuente de verdad)

convex/
├── schema.ts                        # userProfiles + userPreferences extendidos
├── users.ts                         # currentUser, updateProfile, avatar upload
└── userPreferences.ts
```

---

## Registro de decisiones

| ID | Tema | Decisión |
|----|------|----------|
| D-01 | UI modo | Segmented control en Apariencia |
| D-02 | Inglés | Visible deshabilitado + "Próximamente" |
| D-03 | Store | `usePreferencesStore` Zustand unificado |
| D-04 | Atributos HTML | `data-accent`, `data-danger`, `data-font` |
| D-05 | Catálogo presets | Ver `design.md` §Catálogo |
| D-06 | Fuentes | Google Fonts link único ampliado |
| D-07 | Reset | Mutation `resetAppearance` + confirm dialog |
| D-08 | Perfil | Overrides en `userProfiles`; avatar en Convex storage |
