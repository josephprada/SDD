# Feature Specification: App Polish Fixes (UX + notificaciones + MCP fijos)

**Feature Branch**: `feat/app-polish-fixes`

**Created**: 2026-08-01

**Status**: Draft

**Change**: app-polish-fixes (Change 8)

**Input**: User description: "Serie de ajustes y bugs: (1) ‘Si pagas fijos pendientes’ debe ser disponible − gastos fijos (no neto − fijos) y con **más prioridad/relevancia visual** que el neto del mes en la card; (2) modal de movimiento desde dashboard desktop no debe redirigir a /movimientos ni dejar modal flotante extra; (3) en móvil al eliminar movimiento se rompe el scroll (ligado al #2); (4) al abrir edición no autofocus en monto; (5) notificaciones push/toasts mal: al entrar se cargan todas en toast y en móvil no llegan a la bandeja del sistema; (6) adjuntar archivos también al crear movimiento, no solo al editar; (7) MCP: list_fixed_expenses / pendingTotal; (8) introducir **Playwright** en este change para afinar y automatizar las pruebas de UI de estos escenarios."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Proyección correcta y destacada tras pagar fijos (Priority: P1)

Como usuario, quiero ver en el dashboard cuánto me quedaría **si pago los gastos fijos pendientes**, calculado como **disponible − fijos pendientes**, y que ese dato tenga **más peso visual que el neto del período**, para decidir con la cifra que más me importa primero.

**Why this priority**: Es un dato de decisión financiera visible en Home; un cálculo erróneo o una jerarquía que oculte la proyección bajo el neto induce malas decisiones.

**Independent Test**: Con disponible conocido y fijos pendientes conocidos, verificar que “Si pagas fijos pendientes” = disponible − suma de fijos pendientes (desktop y móvil) y que, a simple vista, la proyección destaca más que el neto del mes.

**Acceptance Scenarios**:

1. **Given** un dashboard con Disponible = D y fijos pendientes con total P > 0, **When** el usuario mira “Si pagas fijos pendientes”, **Then** el valor mostrado es D − P (no el neto del período − P).
2. **Given** P = 0 (sin fijos pendientes en el período), **When** el usuario mira el dashboard, **Then** no se muestra la proyección “Si pagas fijos pendientes” (o equivalente oculto) y el neto del período sigue siendo legible con su jerarquía normal.
3. **Given** viewport móvil (overview del mes) y viewport desktop (tarjetas de métricas), **When** hay fijos pendientes, **Then** ambos usan la misma fórmula Disponible − P.
4. **Given** P > 0 en desktop y en móvil, **When** el usuario mira el bloque de métricas / overview del período, **Then** “Si pagas fijos pendientes” (valor y etiqueta) tiene **mayor prioridad visual** que el neto del mes: tamaño, contraste, posición u orden hacen que la proyección se lea primero; el neto permanece visible pero como dato secundario.

---

### User Story 2 - Editar movimiento desde Home sin salir del dashboard (Priority: P1)

Como usuario en desktop, quiero abrir la edición de un movimiento reciente desde el dashboard y permanecer en Home, para no perder contexto ni ver capas de modal rotas.

**Why this priority**: Bug bloqueante de usabilidad en el flujo más frecuente del dashboard.

**Independent Test**: En desktop, desde Home, abrir un movimiento reciente: URL/módulo sigue siendo Home; aparece solo la modal de edición; al cerrar, Home usable sin capas residuales.

**Acceptance Scenarios**:

1. **Given** el usuario está en el dashboard (Home) en desktop, **When** abre un movimiento de la lista reciente, **Then** se abre la modal de edición **sin** navegar al módulo de movimientos.
2. **Given** la modal de edición abierta desde Home, **When** el usuario la cierra (cancelar, Escape o guardado exitoso), **Then** permanece en Home y no queda ninguna modal/overlay fantasma.
3. **Given** la misma acción en móvil, **When** abre un movimiento desde Home, **Then** el comportamiento es coherente (edición usable) y no deja el scroll de la página bloqueado al cerrar.

---

### User Story 3 - Scroll usable tras eliminar un movimiento (Priority: P1)

Como usuario en móvil, quiero que tras eliminar un movimiento la interfaz siga permitiendo scroll, para no tener que recargar la app.

**Why this priority**: Deja la app inutilizable en móvil hasta refrescar; ligado al ciclo de vida de modales/overlays.

**Independent Test**: En viewport móvil, eliminar un movimiento (desde lista o desde modal abierta en Home/movimientos) y comprobar que el documento/contenedor principal sigue haciendo scroll.

**Acceptance Scenarios**:

1. **Given** un movimiento abierto en modal en móvil, **When** el usuario lo elimina y confirma, **Then** la modal se cierra y el scroll de la página vuelve a funcionar.
2. **Given** varios ciclos de abrir → editar/eliminar → cerrar, **When** el usuario interactúa con listas largas, **Then** el scroll permanece funcional (sin bloqueo acumulado de body/overflow).

---

### User Story 4 - Revisar movimiento sin autofocus en monto (Priority: P2)

Como usuario, quiero abrir un movimiento para revisarlo sin que el teclado o el foco salten al campo de monto, para no editar por accidente ni sufrir molestias en móvil.

**Why this priority**: Mejora de confort frecuente; no bloquea datos correctos pero sí la UX diaria.

**Independent Test**: Abrir edición de un movimiento existente y comprobar que el foco inicial no está en el campo de monto (ni se abre el teclado virtual solo por eso).

**Acceptance Scenarios**:

1. **Given** un movimiento existente, **When** el usuario abre la modal de edición, **Then** el campo de monto **no** recibe el foco automáticamente.
2. **Given** la modal de edición abierta, **When** el usuario toca/hace clic en el monto, **Then** sí puede enfocarlo y editarlo normalmente.
3. **Given** el flujo de **crear** un movimiento nuevo, **When** se abre el formulario, **Then** el comportamiento de foco inicial puede favorecer captura rápida (crear ≠ editar); si hay autofocus, solo aplica a creación, no a edición.

---

### User Story 5 - Notificaciones sin spam de toasts y push a bandeja móvil (Priority: P1)

Como usuario, quiero que al entrar a la web no se me disparen toasts de notificaciones ya conocidas, y que las alertas push lleguen a la bandeja de notificaciones del dispositivo móvil cuando correspondan, para enterarme sin fatiga.

**Why this priority**: Spam al login degrada confianza; push fallido anula el valor de recordatorios de fijos/presupuestos.

**Independent Test**: (a) Entrar a la app con notificaciones recientes ya existentes → no se reproducen en toast. (b) Con permiso de notificaciones concedido y suscripción activa, provocar un recordatorio → aparece en la bandeja del sistema en móvil (app en segundo plano / cerrada según capacidad del entorno).

**Acceptance Scenarios**:

1. **Given** notificaciones in-app ya generadas en visitas anteriores, **When** el usuario inicia sesión o recarga la web, **Then** **no** se muestran toasts masivos de ese historial.
2. **Given** una notificación **nueva** mientras la sesión está activa (app en primer plano), **When** llega, **Then** el usuario puede enterarse de forma no intrusiva (toast o indicador in-app) **sin** repetir el mismo aviso en cada recarga.
3. **Given** permiso de notificaciones del navegador/OS concedido y suscripción push válida, **When** el sistema envía un recordatorio (p. ej. gasto fijo o umbral de presupuesto) y la app no está en primer plano, **Then** la notificación aparece en la **bandeja del sistema** del dispositivo.
4. **Given** permiso denegado o sin suscripción, **When** ocurren eventos notificables, **Then** no falla la app; el usuario sigue pudiendo ver el historial in-app si existe, sin errores bloqueantes.

---

### User Story 6 - Adjuntar archivos al crear un movimiento (Priority: P2)

Como usuario, quiero adjuntar comprobantes (imagen/PDF) desde el momento de **crear** un movimiento, no solo al editarlo después, para no hacer un segundo paso innecesario.

**Why this priority**: Paridad de capacidad create/edit; flujo incompleto hoy.

**Independent Test**: Abrir “nuevo movimiento”, ver control de adjuntos, añadir archivo válido, guardar y verificar el adjunto en el movimiento creado.

**Acceptance Scenarios**:

1. **Given** el formulario de **nuevo** movimiento, **When** el usuario lo abre, **Then** ve la opción de adjuntar archivos (misma capacidad que en edición).
2. **Given** un archivo válido (imagen o PDF según reglas existentes), **When** lo adjunta en creación y guarda el movimiento, **Then** el adjunto queda asociado al movimiento creado.
3. **Given** el formulario de edición, **When** el usuario abre un movimiento existente, **Then** la opción de adjuntos sigue disponible (sin regresión).

---

### User Story 7 - MCP: listar gastos fijos y total pendiente (Priority: P2)

Como usuario de agentes MCP, quiero que el agente pueda listar mis gastos fijos y obtener el total pendiente del período, para responder con precisión preguntas como “¿cuánto me queda si pago los fijos?” (disponible − fijos).

**Why this priority**: Cierra un hueco del Change 7; sin esto el agente inventa o infiere mal.

**Independent Test**: Con token de lectura de presupuestos/fijos, llamar la herramienta de listado y comprobar ítems + `pendingTotal` alineados con lo que muestra la app para el mismo período.

**Acceptance Scenarios**:

1. **Given** un token con permiso de lectura adecuado (mismo dominio que presupuestos/fijos), **When** el agente invoca `list_fixed_expenses` (o nombre equivalente documentado), **Then** recibe la lista de gastos fijos del propietario con montos y estado relevante para el período pedido (o el período por defecto de la app).
2. **Given** fijos pendientes en el período, **When** el agente solicita el total pendiente, **Then** obtiene `pendingTotal` coherente con el total que usa el dashboard para la proyección.
3. **Given** un token sin el scope de lectura requerido, **When** intenta listar fijos, **Then** la operación se rechaza por permisos.
4. **Given** `pendingTotal` y el disponible del overview, **When** el agente calcula disponible − pendingTotal, **Then** puede responder la proyección “si pagas fijos” sin inventar la tabla de fijos.

---

### User Story 8 - Pruebas de UI automatizadas con Playwright (Priority: P2)

Como equipo, quiero un arnés de pruebas de UI con **Playwright** en este change que cubra los escenarios de polish críticos, para afinar regresiones (cálculo/jerarquía de fijos, modal desde Home, scroll tras eliminar, autofocus, adjuntos en creación, anti-spam de toasts) sin depender solo de QA manual.

**Why this priority**: Consolida la calidad del change y deja una base reutilizable; no bloquea el valor de usuario de P1 pero sí la confianza al mergear.

**Independent Test**: Ejecutar la suite Playwright del change en CI o local y obtener verde en los casos acordados para este alcance (al menos los flujos UI de US1–US4 y US6; notificaciones push de sistema y MCP pueden quedar fuera del browser E2E o como smoke acotado).

**Acceptance Scenarios**:

1. **Given** el repositorio del change, **When** un desarrollador o CI ejecuta las pruebas Playwright documentadas, **Then** existen y corren tests de UI que validan al menos: proyección Disponible − P, jerarquía visual proyección > neto (asserción observable: orden/rol/texto destacado), abrir movimiento desde Home sin cambiar de módulo, sin autofocus de monto en edición, y presencia de adjuntos en creación.
2. **Given** un fallo en uno de esos comportamientos, **When** se ejecuta la suite, **Then** el test correspondiente falla de forma clara (nombre/descripción alineada al escenario).
3. **Given** viewport móvil y desktop relevantes para los bugs, **When** la suite corre, **Then** al menos el caso de modal/scroll o jerarquía de fijos se ejercita en un viewport móvil (≤ 430 px) además del desktop.
4. **Given** la documentación del change (quickstart o equivalente), **When** alguien quiere correr las pruebas, **Then** encuentra el comando y los prerrequisitos (entorno, auth de prueba si aplica) sin adivinar.

---

### Edge Cases

- Disponible negativo o proyección negativa tras restar fijos: se muestra con signo claro; no se oculta el valor.
- Fijos “solo este mes” vs recurrentes: el total pendiente debe respetar las mismas reglas de elegibilidad que el dashboard.
- Sin fijos pendientes: el neto recupera protagonismo visual habitual (sin hueco confuso donde estaba la proyección).
- Abrir edición desde Home y desde el módulo Movimientos: ambos flujos deben cerrar overlays/scroll correctamente.
- Eliminar el último movimiento visible / fallo de red al eliminar: no dejar modal ni scroll bloqueados.
- Notificaciones duplicadas con el mismo identificador lógico: no generar toasts repetidos.
- Push en iOS/Android con distintos navegadores: degradación documentada si el entorno no soporta Web Push; sin romper la app.
- Crear movimiento con adjunto grande o tipo no permitido: mismo rechazo/validación que en edición.
- MCP sin fijos en el período: lista vacía y `pendingTotal` = 0.
- Suite Playwright sin credenciales/datos de prueba: falla con mensaje accionable, no con timeouts opacos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El valor de “Si pagas fijos pendientes” MUST calcularse como **Disponible − total de gastos fijos pendientes del período** (misma base que la métrica Disponible del dashboard), en desktop y móvil.
- **FR-001b**: Cuando existan fijos pendientes, la UI del dashboard MUST presentar “Si pagas fijos pendientes” con **mayor relevancia visual que el neto del período** (la proyección se percibe primero; el neto queda secundario pero visible). Desktop y móvil MUST respetar esa jerarquía.
- **FR-002**: Abrir un movimiento desde el dashboard MUST abrir la UI de edición **sin cambiar de módulo** a Movimientos.
- **FR-003**: Cerrar o completar (guardar/eliminar) la edición de un movimiento MUST dejar exactamente cero overlays/modales residuales y el scroll de la página MUST permanecer usable (especialmente en móvil).
- **FR-004**: Al abrir un movimiento en modo **edición**, el sistema MUST NOT enfocar automáticamente el campo de monto.
- **FR-005**: Al cargar o recargar la sesión, el sistema MUST NOT mostrar toasts por el historial de notificaciones in-app ya existentes; solo eventos nuevos (o no vistos según la regla definida en Assumptions) pueden disparar toast.
- **FR-006**: Con permiso y suscripción push válidos, los recordatorios/alertas configurados MUST poder entregarse a la bandeja de notificaciones del sistema en dispositivos móviles cuando la app no está en primer plano.
- **FR-007**: El formulario de **creación** de movimiento MUST exponer la capacidad de adjuntar archivos con las mismas reglas de tipo/tamaño que la edición.
- **FR-008**: El MCP MUST exponer una herramienta de listado de gastos fijos (p. ej. `list_fixed_expenses`) y un total pendiente (`pendingTotal`) usable por agentes con el scope de lectura correspondiente.
- **FR-009**: `pendingTotal` expuesto por MCP MUST ser semánticamente alineado con el total de fijos pendientes que usa el dashboard para FR-001.
- **FR-010**: La revisión del flujo de notificaciones MUST documentar en el plan/diseño del change la causa del spam de toasts y del fallo de push, y la corrección MUST cubir ambos canales (in-app toast y push sistema) sin romper el historial in-app existente.
- **FR-011**: Este change MUST incorporar un arnés de pruebas de UI con **Playwright** que automatice los escenarios UI críticos del change (como mínimo US1 jerarquía/cálculo, US2, US4, US6; US3 scroll móvil donde sea estable en CI).
- **FR-012**: La suite Playwright MUST ser ejecutable mediante un comando documentado en el change y MUST fallar de forma determinista ante regresiones de esos comportamientos.

### Key Entities

- **Disponible**: Saldo/balance total que el dashboard muestra como métrica “Disponible” (base de la proyección tras fijos).
- **Gasto fijo pendiente**: Compromiso periódico aún no pagado en el período de vista; contribuye a `pendingTotal`.
- **Proyección “Si pagas fijos pendientes”**: Disponible − pendingTotal.
- **Movimiento (transacción)**: Registro editable/creable; puede tener adjuntos; se abre en modal desde Home o desde el módulo Movimientos.
- **Notificación in-app**: Evento registrado para el usuario (presupuesto, fijo, reporte, etc.); puede mostrarse en historial y opcionalmente como toast.
- **Suscripción push**: Permiso + endpoint que permite entregar avisos a la bandeja del SO.
- **Herramienta MCP de fijos**: Lectura de lista + pendingTotal acotada al dueño del token y a sus scopes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En pruebas (manuales y automatizadas) con datos conocidos, “Si pagas fijos pendientes” coincide 100% con Disponible − pendingTotal en móvil y desktop.
- **SC-001b**: Con fijos pendientes visibles, un revisor o test de UI identifica la proyección como el dato **más prominente** del bloque neto/proyección (frente al neto) en ≤ 3 segundos de inspección en 375 px y 1280 px.
- **SC-002**: Desde Home desktop, abrir y cerrar un movimiento (incl. eliminar) no navega a Movimientos y deja 0 modales residuales; scroll sigue funcionando en móvil tras eliminar (verificado en al menos un dispositivo/viewport ≤ 430 px).
- **SC-003**: Abrir edición de movimiento no enfoca el monto en ≥ 100% de los intentos de prueba QA (crear puede diferir).
- **SC-004**: Tras recargar la app con ≥ 3 notificaciones históricas, el usuario ve 0 toasts de ese historial al entrar.
- **SC-005**: Con push habilitado, al menos un tipo de recordatorio configurado (gasto fijo o presupuesto) aparece en la bandeja del sistema en un dispositivo móvil de prueba cuando la app no está en primer plano.
- **SC-006**: Un usuario puede adjuntar un archivo válido en el flujo de creación y verlo persistido tras guardar, en el mismo ciclo (sin editar después).
- **SC-007**: Un agente MCP con scope de lectura adecuado obtiene lista de fijos + `pendingTotal` y puede calcular disponible − fijos alineado con el dashboard (± diferencias de redondeo 0).
- **SC-008**: La suite Playwright del change cubre los escenarios UI mínimos de FR-011 y pasa en el entorno documentado (local y, si el plan lo incluye, CI).

## Assumptions

- “Disponible” es la misma métrica ya mostrada en el dashboard (`totalBalance` / card Disponible), no un saldo filtrado distinto.
- La corrección de proyección y la nueva jerarquía visual aplican tanto a la tarjeta/bloque de métricas desktop como al overview móvil (“Si pagas fijos pendientes”).
- “Mayor prioridad que el neto” significa que la proyección deja de ser un subtítulo secundario del neto: pasa a ser el foco principal del bloque; el neto no desaparece.
- El detalle tipográfico/layout exacto se define en el diseño técnico del change, alineado a `desing.md` (tokens, mobile-first).
- El bug de navegación/modal y el de scroll móvil comparten causa probable (gestión de modal/ruta/body lock); se tratan en el mismo change.
- Autofocus indeseado aplica a **edición**; creación puede conservar un foco útil si ya existía (o ninguno): lo crítico es no forzar monto al revisar.
- Notificaciones: no se construye un producto de mensajería nuevo; se **repara y endurece** el sistema actual (in-app + Web Push) de web-budgets-reports.
- Regla por defecto anti-spam: no toast al montar por ítems ya existentes; solo notificaciones nuevas respecto a un cursor/última vista (o llegada en vivo en la sesión).
- Push en primer plano: no es obligatorio duplicar en bandeja del SO si ya hay feedback in-app; el fallo actual a corregir es la entrega a bandeja cuando la app no está enfocada.
- MCP: `list_fixed_expenses` / `pendingTotal` reutilizan el scope de lectura de presupuestos/fijos ya definido en mcp-access (`read:budgets` o el que el diseño confirme como canónico), sin inventar un scope nuevo salvo que el plan demuestre necesidad.
- Adjuntos en creación reutilizan límites y tipos ya aceptados en edición (imágenes y PDFs).
- **Playwright** es la herramienta elegida para E2E/UI de este change (hoy no hay arnés previo en el monorepo); el plan definirá estructura de carpetas, auth de prueba y qué queda fuera de E2E (p. ej. push real a bandeja del SO, tools MCP).
- Fuera de alcance de este change: nuevos tipos de notificación de negocio, rediseño visual completo del centro de notificaciones, CRUD de fijos vía MCP (solo lectura), o cobertura E2E exhaustiva de toda la app (solo escenarios de este polish + base del arnés).
