import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerPrompts } from "./prompts.js";
import { registerResources } from "./resources.js";
import { registerReadTools } from "./tools/read.js";
import { registerWriteOpsTools } from "./tools/write-ops.js";
import { registerWritePlanTools } from "./tools/write-plans.js";

const SERVER_NAME = "jp-wallet-mcp";
const SERVER_VERSION = "0.1.0";

/**
 * Construye un `McpServer` completo (tools + resources + prompts) atado a
 * un único token/usuario. Se crea una instancia nueva por conexión stdio o
 * por solicitud HTTP: nunca se comparte token entre usuarios.
 */
export function createMcpServer(token: string, siteUrl: string): McpServer {
	const getToken = () => token;

	const server = new McpServer(
		{ name: SERVER_NAME, version: SERVER_VERSION },
		{
			instructions:
				"Servidor MCP de JP-WALLET. Expone datos financieros y mutaciones controladas vía el gateway de Convex, respetando los scopes del token (jpw_...) usado para conectarte. Las operaciones destructivas requieren confirm=true.",
		},
	);

	registerReadTools(server, getToken, siteUrl);
	registerWritePlanTools(server, getToken, siteUrl);
	registerWriteOpsTools(server, getToken, siteUrl);
	registerResources(server, getToken, siteUrl);
	registerPrompts(server);

	return server;
}
