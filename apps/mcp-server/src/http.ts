import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { RateLimitError, checkRateLimit } from "./rateLimit.js";
import { createMcpServer } from "./server.js";

export interface HttpServerOptions {
	port: number;
	siteUrl: string;
}

function jsonError(status: number, code: string, message: string): Response {
	return Response.json({ ok: false, error: { code, message } }, { status });
}

function extractBearerToken(req: Request): string | null {
	const header = req.headers.get("authorization");
	if (!header) return null;
	const match = header.match(/^Bearer\s+(.+)$/i);
	const token = match?.[1]?.trim();
	return token && token.length > 0 ? token : null;
}

/**
 * Servidor HTTP del adaptador MCP.
 *
 * - `GET /healthz` — sin auth, para probes de infraestructura.
 * - `* /mcp` — requiere `Authorization: Bearer <token>`; delega en el
 *   transporte Streamable HTTP (Web Standards) del SDK oficial de MCP,
 *   que corre nativamente sobre `Request`/`Response` de Bun. Se crea un
 *   `McpServer` + transporte nuevos por solicitud (modo sin sesión/stateless),
 *   ya que el token puede variar entre solicitudes y no compartimos estado
 *   entre usuarios.
 */
export function startHttpServer(
	opts: HttpServerOptions,
): ReturnType<typeof Bun.serve> {
	const { port, siteUrl } = opts;

	const server = Bun.serve({
		port,
		async fetch(req) {
			const url = new URL(req.url);

			if (req.method === "GET" && url.pathname === "/healthz") {
				return Response.json({ ok: true });
			}

			if (url.pathname !== "/mcp") {
				return jsonError(
					404,
					"not_found",
					"Ruta no encontrada. Usa POST /mcp o GET /healthz.",
				);
			}

			const token = extractBearerToken(req);
			if (!token) {
				return jsonError(
					401,
					"unauthorized",
					"Falta encabezado Authorization: Bearer <token>.",
				);
			}

			try {
				checkRateLimit(token);
			} catch (err) {
				if (err instanceof RateLimitError) {
					return jsonError(429, "rate_limited", err.message);
				}
				throw err;
			}

			const mcpServer = createMcpServer(token, siteUrl);
			const transport = new WebStandardStreamableHTTPServerTransport({
				sessionIdGenerator: undefined,
				enableJsonResponse: true,
			});

			try {
				await mcpServer.connect(transport);
				return await transport.handleRequest(req);
			} catch (err) {
				console.error("[jp-wallet-mcp] Error manejando /mcp:", err);
				return jsonError(
					500,
					"internal",
					err instanceof Error ? err.message : "Error interno inesperado.",
				);
			} finally {
				void transport.close();
				void mcpServer.close();
			}
		},
	});

	console.log(
		`[jp-wallet-mcp] HTTP listo en http://localhost:${server.port} — POST /mcp (Bearer requerido) · GET /healthz`,
	);

	return server;
}
