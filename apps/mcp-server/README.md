# @jp-wallet/mcp-server

Servidor MCP (Model Context Protocol) de JP-WALLET. Expone los datos y mutaciones
financieras del usuario a agentes LLM (Cursor, Claude Desktop, MCP Inspector, etc.)
a través del gateway autenticado `POST /agent/v1/rpc` de Convex.

Este paquete **no implementa lógica de dominio**: es un adaptador delgado que
traduce llamadas MCP (tools/resources/prompts) en solicitudes HTTP firmadas con
un Personal Access Token (`jpw_…`) contra el backend de Convex. Ver
`changes/mcp-access/design.md` y `changes/mcp-access/contracts/` para el
diseño completo.

---

## Variables de entorno

| Variable | Requerida | Descripción |
|----------|-----------|-------------|
| `CONVEX_SITE_URL` | Sí (ambos modos) | URL del deployment Convex, ej. `https://tu-deployment.convex.site` |
| `JP_WALLET_TOKEN` | Sí, solo en `--stdio` | Token personal `jpw_…` con los scopes deseados |
| `PORT` | No (modo `--http`) | Puerto de escucha HTTP, default `3100` |

En modo `--http` el token **no** se lee de variables de entorno: cada
solicitud a `/mcp` debe incluir `Authorization: Bearer jpw_…`. Esto permite
que un mismo proceso HTTP sirva a múltiples usuarios, cada uno con su propio
token y scopes.

`API_TOKEN_PEPPER` es una variable del **lado de Convex** (no de este
paquete): un pepper opcional que se concatena al token antes de hashear en
`convex/lib/apiTokenAuth.ts`. Si se activa en Convex, no requiere ningún
cambio aquí — el pepper nunca sale del backend.

---

## Instalación local

Desde la raíz del monorepo (bun workspaces):

```bash
bun install
```

O directamente en el paquete:

```bash
cd apps/mcp-server
bun install
```

---

## Ejecutar en local

### Modo HTTP (por defecto)

```bash
CONVEX_SITE_URL=https://tu-deployment.convex.site bun run dev
# equivalente a: bun run src/index.ts --http --port 3100
```

Endpoints:

- `GET /healthz` → `{ "ok": true }` (sin auth)
- `POST /mcp` → protocolo MCP Streamable HTTP (requiere `Authorization: Bearer jpw_…`)

Probar rápido:

```bash
curl http://localhost:3100/healthz

curl http://localhost:3100/mcp \
  -X POST \
  -H "Authorization: Bearer jpw_xxx" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### Modo stdio

Pensado para clientes locales (Cursor, Claude Desktop) que spawnean el
proceso directamente:

```bash
CONVEX_SITE_URL=https://tu-deployment.convex.site \
JP_WALLET_TOKEN=jpw_xxx \
bun run start:stdio
```

### Typecheck

```bash
bun run typecheck
```

---

## Conectar un cliente MCP

### Cursor / Claude Desktop — remoto (HTTP)

```json
{
	"mcpServers": {
		"jp-wallet": {
			"url": "https://mcp.wallet.lavalex.co/mcp",
			"headers": {
				"Authorization": "Bearer jpw_xxx"
			}
		}
	}
}
```

### Cursor / Claude Desktop — local (stdio)

```json
{
	"mcpServers": {
		"jp-wallet": {
			"command": "bun",
			"args": ["run", "/ruta/absoluta/a/SDD/apps/mcp-server/src/index.ts", "--stdio"],
			"env": {
				"CONVEX_SITE_URL": "https://tu-deployment.convex.site",
				"JP_WALLET_TOKEN": "jpw_xxx"
			}
		}
	}
}
```

El token `jpw_…` se genera y revoca desde `/settings` → **Acceso para
agentes** en la app web (change `mcp-access`, US1). El secreto solo se
muestra una vez al crearlo.

---

## Catálogo de tools

| Grupo | Archivo | Tools |
|-------|---------|-------|
| Lectura | `src/tools/read.ts` | `get_financial_overview`, `list_transactions`, `get_spending_summary`, `list_accounts`, `list_categories`, `list_budgets`, `list_credits`, `list_savings_goals`, `list_tax_documents`, `get_tax_document` |
| Escritura — planes | `src/tools/write-plans.ts` | `upsert_budget`, `create_savings_goal`, `contribute_to_goal` |
| Escritura — CRUD/destructivo | `src/tools/write-ops.ts` | `create_transaction`, `update_transaction`, `delete_transaction` (requiere `confirm: true`), `create_tax_item`, `update_tax_item` |

Resources: `jpwallet://overview`, `jpwallet://budgets/active`,
`jpwallet://credits/active` (`src/resources.ts`).

Prompts opcionales: `monthly_review`, `savings_plan` (`src/prompts.ts`).

El catálogo completo de tools se expone siempre, sin importar los scopes del
token; el gateway de Convex es quien aplica `assertScope` y devuelve
`forbidden` (403) si el token no tiene permiso. Ese error se traduce a un
resultado de tool con `isError: true` y un mensaje legible, nunca a un stack
trace.

---

## Arquitectura interna

- `src/convexClient.ts` — único punto de salida HTTP hacia Convex (`POST
  {CONVEX_SITE_URL}/agent/v1/rpc`), reenvía el Bearer del usuario.
- `src/rateLimit.ts` — ventana deslizante en memoria, 60 solicitudes/min por
  prefijo de token (12 caracteres). Complementa (no reemplaza) el rate limit
  del lado de Convex.
- `src/tools/types.ts` — helpers compartidos (`makeRpcTool`,
  `registerToolDefs`) para no duplicar la traducción `RpcResult → CallToolResult`
  entre las distintas familias de tools.
- `src/server.ts` — `createMcpServer(token, siteUrl)` construye un
  `McpServer` del SDK oficial con todas las tools/resources/prompts
  registradas para ese token.
- `src/stdio.ts` — transporte `StdioServerTransport` (un proceso = un
  usuario, token fijo por variable de entorno).
- `src/http.ts` — transporte `WebStandardStreamableHTTPServerTransport` (Web
  Standards `Request`/`Response`), servido con `Bun.serve`. Se crea un
  `McpServer` + transporte nuevos **por solicitud** (modo stateless), porque
  el token viaja en cada request y no se comparte estado entre usuarios.

> Nota de implementación: se usa el transporte Streamable HTTP "Web
> Standards" del SDK (`server/webStandardStreamableHttp.js`), que trabaja de
> forma nativa con `fetch`/`Request`/`Response` y por tanto no requiere los
> objetos `http.IncomingMessage`/`ServerResponse` de Node. Si en el futuro el
> SDK instalado no trae esa variante, la alternativa documentada en el plan
> del change es un endpoint JSON-RPC pragmático hecho a mano sobre
> `initialize`, `tools/list`, `tools/call`, `resources/list`,
> `resources/read`, `prompts/list`, `prompts/get`.

---

## Deploy en VPS (`mcp.wallet.lavalex.co`)

v1 sin Docker: `bun` + `systemd` + `Nginx` como proxy TLS.

### 1. Build/copiar código al VPS

```bash
# En el VPS, dentro del monorepo ya clonado/actualizado:
cd /opt/jp-wallet/SDD
bun install --frozen-lockfile
```

No hay paso de build: `bun run src/index.ts` ejecuta TypeScript directamente.

### 2. Servicio systemd

`/etc/systemd/system/jp-wallet-mcp.service`:

```ini
[Unit]
Description=JP-WALLET MCP server
After=network.target

[Service]
Type=simple
User=jpwallet
WorkingDirectory=/opt/jp-wallet/SDD/apps/mcp-server
ExecStart=/usr/local/bin/bun run src/index.ts --http --port 3100
Environment=CONVEX_SITE_URL=https://tu-deployment.convex.site
Environment=PORT=3100
Restart=always
RestartSec=5
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now jp-wallet-mcp
sudo systemctl status jp-wallet-mcp
```

### 3. Nginx (proxy TLS → `127.0.0.1:3100`)

```nginx
server {
	listen 443 ssl http2;
	server_name mcp.wallet.lavalex.co;

	ssl_certificate     /etc/letsencrypt/live/mcp.wallet.lavalex.co/fullchain.pem;
	ssl_certificate_key /etc/letsencrypt/live/mcp.wallet.lavalex.co/privkey.pem;

	location /healthz {
		proxy_pass http://127.0.0.1:3100/healthz;
	}

	location /mcp {
		proxy_pass http://127.0.0.1:3100/mcp;
		proxy_http_version 1.1;
		proxy_set_header Host $host;
		proxy_set_header Authorization $http_authorization;
		# Streamable HTTP puede usar SSE: evitar buffering.
		proxy_buffering off;
		proxy_read_timeout 300s;
	}
}

server {
	listen 80;
	server_name mcp.wallet.lavalex.co;
	return 301 https://$host$request_uri;
}
```

```bash
sudo certbot --nginx -d mcp.wallet.lavalex.co
sudo nginx -t && sudo systemctl reload nginx
```

### 4. Verificar

```bash
curl https://mcp.wallet.lavalex.co/healthz
```

### Actualizar

Desde `main`, el workflow `Deploy Production` sincroniza `apps/mcp-server` a
`/opt/jp-wallet/mcp-server`, ejecuta `scripts/vps-deploy-mcp.sh` (systemd +
Nginx) y deja un **fallback** en `https://wallet.lavalex.co/mcp` mientras el
DNS de `mcp.wallet.lavalex.co` no exista.

Manual:

```bash
# En el VPS, tras rsync/copia del paquete:
export CONVEX_SITE_URL=https://tu-deployment.convex.site
sudo --preserve-env=CONVEX_SITE_URL /opt/jp-wallet/mcp-server/vps-deploy-mcp.sh
```

**DNS requerido (Hostinger → lavalex.co):**

| Tipo | Host | Valor |
|------|------|-------|
| A | `mcp.wallet` | `69.6.234.237` |

Hasta que propague, usa el fallback:

```json
{ "url": "https://wallet.lavalex.co/mcp", "headers": { "Authorization": "Bearer jpw_…" } }
```

---

## Notas de seguridad

- Nunca se expone `CONVEX_DEPLOY_KEY` a este proceso ni a los clientes MCP.
- Los tokens `jpw_…` se validan y hashean del lado de Convex; este paquete
  solo los reenvía como `Authorization: Bearer`.
- Los errores del gateway (`unauthorized`, `forbidden`, `validation`,
  `conflict`, `confirmation_required`, `rate_limited`, `internal`) se
  traducen a texto plano en la respuesta de la tool — nunca se reenvían
  stack traces del backend.
- Rate limit de 60 rpm por token en este proceso; es un límite adicional al
  del lado de Convex, no un sustituto.
