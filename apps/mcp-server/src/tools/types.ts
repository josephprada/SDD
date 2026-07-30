import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { z } from "zod";
import { type RpcResult, callAgentRpc } from "../convexClient.js";

/** Token del usuario para la sesión/solicitud MCP actual. */
export type GetToken = () => string;

export interface ToolCallResult {
	[key: string]: unknown;
	content: Array<{ type: "text"; text: string }>;
	isError?: boolean;
}

export interface ToolDefinition {
	name: string;
	description: string;
	/** Forma Zod de los argumentos (objeto plano de esquemas, sin envolver en z.object). */
	inputShape: z.ZodRawShape;
	handler: (args: Record<string, unknown>) => Promise<ToolCallResult>;
}

/** Convierte el resultado del gateway Convex en el formato de respuesta MCP. */
export function rpcResultToToolResult(result: RpcResult): ToolCallResult {
	if (result.ok) {
		return {
			content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
		};
	}
	return {
		content: [
			{
				type: "text",
				text: `Error [${result.error.code}]: ${result.error.message}`,
			},
		],
		isError: true,
	};
}

/**
 * Crea una `ToolDefinition` que simplemente reenvía sus argumentos al gateway
 * `/agent/v1/rpc` con el nombre de la tool y traduce el resultado a MCP.
 */
export function makeRpcTool(opts: {
	name: string;
	description: string;
	inputShape: z.ZodRawShape;
	getToken: GetToken;
	siteUrl: string;
	/** Deriva el flag `confirm` a partir de los args (por defecto: `args.confirm === true`). */
	confirm?: (args: Record<string, unknown>) => boolean;
}): ToolDefinition {
	return {
		name: opts.name,
		description: opts.description,
		inputShape: opts.inputShape,
		async handler(args) {
			const confirm = opts.confirm
				? opts.confirm(args)
				: Boolean((args as { confirm?: unknown }).confirm);
			const result = await callAgentRpc({
				siteUrl: opts.siteUrl,
				token: opts.getToken(),
				tool: opts.name,
				args,
				confirm,
			});
			return rpcResultToToolResult(result);
		},
	};
}

/** Registra una lista de `ToolDefinition` en una instancia real de `McpServer` (modo stdio). */
export function registerToolDefs(
	server: McpServer,
	defs: ToolDefinition[],
): void {
	for (const def of defs) {
		server.registerTool(
			def.name,
			{ description: def.description, inputSchema: def.inputShape },
			async (args) => def.handler(args as Record<string, unknown>),
		);
	}
}
