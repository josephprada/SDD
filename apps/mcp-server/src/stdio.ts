import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "./server.js";

export interface StdioServerOptions {
	token: string;
	siteUrl: string;
}

/**
 * Arranca el servidor MCP en modo stdio (para clientes locales tipo Cursor
 * o Claude Desktop). El token se toma una sola vez de `JP_WALLET_TOKEN` y
 * se usa para todas las llamadas de esta sesión.
 */
export async function startStdioServer(
	opts: StdioServerOptions,
): Promise<void> {
	const server = createMcpServer(opts.token, opts.siteUrl);
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error(`[jp-wallet-mcp] stdio listo — gateway: ${opts.siteUrl}`);
}
