# Feature Specification: MCP Access (Acceso para agentes LLM)

**Feature Branch**: `feat/mcp-access`

**Created**: 2026-07-27

**Status**: Draft

**Change**: mcp-access (Change 7)

**Input**: User description: "MCP de JP-WALLET conectable a cualquier LLM/agente (Claude, Gemini, OpenAI, etc.) con lenguaje natural para consultar finanzas, crear planes de ahorro/presupuestos y CRUD completo; conexión fácil; seguridad robusta con tokens generados en Ajustes; arquitectura Opción D (monorepo + tokens en backend + servidor MCP en VPS)."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Generar y gestionar tokens de acceso (Priority: P1)

Como usuario, quiero crear tokens de acceso desde Ajustes, asignarles un nombre y permisos, verlos listados y revocarlos, para controlar qué agentes pueden tocar mis finanzas.

**Why this priority**: Sin un canal de autenticación machine-to-machine no hay MCP usable ni seguro. Es el MVP de seguridad.

**Independent Test**: En Ajustes, crear un token de solo lectura, copiar el secreto mostrado una vez, verlo en la lista (sin el secreto), revocarlo y comprobar que ya no sirve.

**Acceptance Scenarios**:

1. **Given** un usuario autenticado en Ajustes, **When** crea un token con nombre y permisos de solo lectura, **Then** el sistema muestra el secreto completo **una sola vez** y lo lista después solo con prefijo/metadatos (nunca el secreto completo de nuevo).
2. **Given** tokens existentes, **When** el usuario abre la sección de acceso para agentes, **Then** ve nombre, permisos, fecha de creación, última uso (si existe), caducidad y estado (activo/revocado).
3. **Given** un token activo, **When** el usuario lo revoca, **Then** cualquier intento posterior de usarlo falla de inmediato.
4. **Given** el usuario elige una fecha de caducidad, **When** esa fecha pasa, **Then** el token deja de autenticar aunque no se haya revocado manualmente.
5. **Given** viewports 375 px y 1280 px, **When** gestiona tokens, **Then** el flujo es usable (targets táctiles adecuados, sin overflow horizontal).

---

### User Story 2 - Conectar un agente externo con facilidad (Priority: P1)

Como usuario, quiero copiar una configuración lista para pegar en mi cliente de agentes (Claude, Cursor, Gemini, OpenAI, OpenClaw u otro compatible MCP), para conectar JP-WALLET en minutos sin ingeniería inversa.

**Why this priority**: El valor del change es interoperabilidad; si la conexión es difícil, el MCP no se usa.

**Independent Test**: Tras crear un token, copiar el snippet de conexión remota, configurarlo en un cliente MCP compatible y listar las herramientas/recursos disponibles.

**Acceptance Scenarios**:

1. **Given** un token activo, **When** el usuario solicita instrucciones de conexión, **Then** ve al menos un snippet para **MCP remoto** (URL + forma de enviar el token) y uno para **uso local** si aplica.
2. **Given** un cliente MCP configurado con URL y token válidos, **When** el cliente descubre el servidor, **Then** recibe el catálogo de herramientas y recursos publicados.
3. **Given** un token inválido, revocado o caducado, **When** un cliente intenta conectar u operar, **Then** recibe un error de autenticación claro y no accede a datos financieros.
4. **Given** un token de solo lectura, **When** el agente intenta una operación de escritura, **Then** el sistema la rechaza por permisos insuficientes.

---

### User Story 3 - Consultar y analizar finanzas en lenguaje natural (Priority: P1)

Como usuario, quiero preguntarle a mi LLM sobre mis finanzas (balances, gastos, presupuestos, créditos, ahorros, renta) y obtener respuestas basadas en **mis datos reales**, para entender mi situación sin abrir manualmente cada pantalla.

**Why this priority**: Es el primer valor cotidiano del MCP; habilita análisis y planes sin escritura.

**Independent Test**: Con datos existentes en la app y un token de lectura, preguntar al agente “¿cómo voy este mes?” y verificar que la respuesta refleja overview/reportes reales.

**Acceptance Scenarios**:

1. **Given** un agente conectado con permisos de lectura, **When** el usuario pide un resumen de su situación financiera, **Then** el agente puede obtener overview (balances, actividad reciente o equivalentes) del propietario del token.
2. **Given** movimientos y categorías existentes, **When** el usuario pide un análisis de gastos por período o categoría, **Then** el agente puede obtener desgloses coherentes con lo que mostraría la app.
3. **Given** presupuestos, créditos y/o metas de ahorro, **When** el usuario pregunta por ellos, **Then** el agente puede listarlos y resumir estado (límites, saldos, progreso) sin inventar entidades inexistentes.
4. **Given** una declaración de renta del usuario, **When** pregunta por ella, **Then** el agente puede leer el documento y sus rubros respetando las reglas de visibilidad del dueño.
5. **Given** un token de otro usuario (o sin token), **When** se intenta leer datos, **Then** no se expone ninguna información financiera de terceros.

---

### User Story 4 - Crear y ajustar planes (presupuestos y ahorro) vía agente (Priority: P2)

Como usuario, quiero que el agente me ayude a proponer y **materializar** presupuestos y planes/metas de ahorro en JP-WALLET, para pasar del consejo a la acción sin reescribir todo a mano.

**Why this priority**: Diferenciador clave, pero depende de tokens (P1) y lectura (P1). Requiere permisos de escritura explícitos.

**Independent Test**: Con token que incluye escritura de presupuestos/ahorros, pedir “crea un presupuesto de comida de $500.000 este mes” y verlo reflejado en la app.

**Acceptance Scenarios**:

1. **Given** un token con permiso de escritura en presupuestos, **When** el usuario pide crear o ajustar un presupuesto, **Then** el cambio queda persistido y visible en la app web.
2. **Given** un token con permiso de escritura en ahorros, **When** el usuario pide crear una meta o registrar un aporte, **Then** la meta/aporte queda persistido y visible en la app.
3. **Given** un token **sin** esos permisos de escritura, **When** el agente intenta crear presupuesto o meta, **Then** la operación se rechaza y la app no cambia.
4. **Given** una solicitud ambigua (sin monto o categoría), **When** el agente no puede completar datos obligatorios, **Then** no se crea un registro inválido; se solicita aclaración o se falla de forma segura.

---

### User Story 5 - Operar el día a día (CRUD financiero) con control (Priority: P2)

Como usuario, quiero que el agente pueda crear, editar y eliminar movimientos y demás entidades de mi dominio financiero **solo con los permisos que yo concedí**, para gestionar finanzas por chat con seguridad.

**Why this priority**: Cumple la visión de CRUD total, pero debe ir detrás de scopes y salvaguardas; no bloquea el MVP de lectura.

**Independent Test**: Con scopes de escritura en transacciones, crear un gasto vía agente y verlo en la lista web; con scope destructivo ausente, un intento de borrado masivo falla.

**Acceptance Scenarios**:

1. **Given** permisos de escritura en transacciones, **When** el usuario pide registrar un gasto/ingreso válido, **Then** la transacción se crea con los campos obligatorios del dominio y aparece en la app.
2. **Given** una entidad existente del usuario, **When** pide editarla con datos válidos y permiso suficiente, **Then** los cambios se persisten.
3. **Given** permiso destructivo **ausente**, **When** el agente intenta eliminar o archivar de forma irreversible, **Then** la operación se rechaza.
4. **Given** permiso destructivo **presente**, **When** el agente solicita una eliminación, **Then** el sistema exige confirmación explícita (o equivalente de doble paso) antes de borrar.
5. **Given** una declaración de renta en estado presentada (`filed`), **When** el agente intenta editarla, **Then** se rechaza hasta que el usuario la reabra por el flujo normal de la app (mismas reglas que la UI).
6. **Given** cualquier operación vía token, **When** se completa o falla, **Then** queda un registro de auditoría consultable por el dueño (qué se intentó, cuándo, resultado).

---

### Edge Cases

- ¿Qué ocurre si el usuario pierde el secreto del token? → No se puede recuperar; debe revocar y crear uno nuevo.
- ¿Qué ocurre con un token sin caducidad? → Se permite, pero la UI advierte el riesgo y recomienda rotación.
- ¿Qué ocurre si el servidor MCP está caído? → El cliente recibe error de conectividad; los datos en la app web siguen intactos.
- ¿Qué ocurre con montos inválidos (≤ 0, no numéricos)? → Se rechazan con error claro; no se persiste basura.
- ¿Qué ocurre si el agente pide datos de un id que no pertenece al dueño del token? → Respuesta de no encontrado / no autorizado; sin filtración.
- ¿Qué ocurre al revocar mientras un agente tiene sesión abierta? → Las siguientes operaciones fallan; no hay “gracia” post-revocación.
- ¿Límite de tokens activos por usuario? → Hay un máximo razonable (p. ej. 10); al excederlo se pide revocar uno antes de crear otro.
- ¿Rate limiting? → Uso abusivo se limita; el usuario ve fallo temporal, no corrupción de datos.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir al usuario autenticado crear tokens de acceso personal desde Ajustes, con nombre legible y conjunto de permisos (scopes).
- **FR-002**: El secreto del token MUST mostrarse una sola vez al crearlo; el sistema MUST almacenar solo un derivado no reversible (hash) y metadatos.
- **FR-003**: El usuario MUST poder listar tokens (sin secreto), revocarlos y, si aplica, ver última fecha de uso y caducidad.
- **FR-004**: Los scopes MUST distinguir al menos: lectura vs escritura por dominio financiero relevante (transacciones, cuentas, presupuestos, créditos, ahorros, renta) y un permiso aparte para acciones destructivas.
- **FR-005**: El token por defecto al crear MUST ser de **solo lectura** salvo que el usuario amplíe permisos explícitamente.
- **FR-006**: El sistema MUST autenticar requests de agentes mediante el token (p. ej. esquema Bearer) y resolver siempre al usuario propietario.
- **FR-007**: El sistema MUST exponer un servidor MCP compatible con clientes MCP actuales, en modo **remoto** (URL pública del producto) y MUST documentar también un modo **local** equivalente.
- **FR-008**: El MCP MUST publicar tools/resources suficientes para: overview financiero, listados y detalles de dominios existentes, análisis/resúmenes de gastos, y (con scopes) altas/bajas/cambios.
- **FR-009**: Toda operación MUST respetar el mismo modelo de propiedad que la app: un token solo accede a datos de su dueño.
- **FR-010**: Operaciones fuera de scope o sobre recursos ajenos MUST fallar de forma segura sin efectos laterales.
- **FR-011**: Acciones destructivas MUST requerir scope específico y confirmación explícita de doble paso (o equivalente documentado).
- **FR-012**: El sistema MUST registrar auditoría de operaciones vía token (quién/token, acción, resultado, marca temporal).
- **FR-013**: El sistema MUST ofrecer en Ajustes instrucciones/snippets de conexión fáciles de copiar para al menos un cliente MCP remoto de uso común.
- **FR-014**: Declaraciones de renta en estado presentada MUST permanecer no editables vía MCP bajo las mismas reglas que la interfaz web.
- **FR-015**: El sistema MUST permitir caducidad configurable de tokens y rechazo automático tras vencimiento.
- **FR-016**: El despliegue del canal MCP remoto MUST usar HTTPS y permanecer operable de forma independiente de la SPA (si el MCP cae, la web sigue funcionando y viceversa en lo razonable).

### Key Entities *(include if feature involves data)*

- **ApiToken**: Credencial de acceso de un usuario; nombre, prefijo visible, hash del secreto, scopes, fechas (creación, último uso, caducidad, revocación).
- **ApiAuditEvent**: Registro de una operación autenticada por token (acción, parámetros resumidos, éxito/error, timestamp).
- **McpToolSurface**: Catálogo lógico de herramientas/recursos expuestos al agente (no necesariamente tabla; contrato del change).
- **ConnectionProfile**: Instrucciones/snippets mostrados al usuario para conectar clientes MCP (remoto y local).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un usuario puede crear un token de solo lectura y copiar el secreto en menos de 2 minutos desde Ajustes.
- **SC-002**: Con un cliente MCP compatible, la primera conexión exitosa (descubrimiento de tools) ocurre en menos de 5 minutos siguiendo las instrucciones de la app.
- **SC-003**: Con datos reales en la cuenta, un agente con token de lectura responde a “¿cuál es mi balance / cómo voy este mes?” usando datos coherentes con el dashboard/reportes de la app (verificado en prueba manual).
- **SC-004**: Un intento con token revocado o caducado no lee ni escribe ningún dato financiero (100 % de rechazo en pruebas).
- **SC-005**: Un token de solo lectura no puede crear presupuestos, metas ni transacciones (100 % de rechazo en pruebas de escritura).
- **SC-006**: Con scopes de escritura adecuados, crear un presupuesto o un gasto vía agente se refleja en la UI web en la siguiente carga/vista en menos de 30 segundos.
- **SC-007**: Toda operación de escritura o rechazo por permisos deja al menos un evento de auditoría visible para el dueño.
- **SC-008**: En viewport 375 px, crear/listar/revocar token y copiar snippet es usable sin scroll horizontal ni controles inaccesibles.

## Assumptions

- El usuario ya tiene cuenta JP-WALLET vía Google OAuth (Changes 1–6).
- Los clientes MCP de terceros implementan el protocolo MCP actual (descubrimiento de tools + llamadas) y pueden enviar un secreto de acceso.
- “Planes de ahorro/presupuestos” se materializan en las entidades ya existentes (presupuestos, metas/aportes); el LLM redacta y razona, JP-WALLET persiste.
- No se incluye chat nativo dentro de la SPA en este change.
- El máximo de tokens activos por usuario y los límites de rate se fijan en el plan/diseño técnico con defaults conservadores.
- La arquitectura acordada es **Opción D**: tokens y autorización en el backend de producto; adaptador MCP en el monorepo; exposición remota en la infra VPS existente; stdio local opcional.
- Fase de entrega: A+B (tokens + MCP lectura) como primer valor; C+D (escritura + hardening) completan el change antes de darlo por cerrado.

## Out of Scope

- Modelo de lenguaje propio hospedado por JP-WALLET.
- Asistente conversacional embebido en la web.
- OAuth público para aplicaciones de terceros / marketplace.
- Compartir un mismo token entre múltiples personas o roles de contador.
- Integraciones bancarias open-banking o scraping.
- Cambiar las reglas de negocio fiscales (UVT/Muisca) — siguen fuera como en Change 6.
