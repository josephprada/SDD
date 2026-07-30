import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { callAgentRpc } from "./convexClient.js";
import type { GetToken } from "./tools/types.js";

export interface ResourceDefinition {
	name: string;
	uri: string;
	description: string;
	mimeType: string;
	/** Tool del gateway que produce los datos de este resource. */
	tool: string;
	args: Record<string, unknown>;
}

/**
 * Resources de solo lectura — fase B.
 * Ver `changes/mcp-access/contracts/mcp-tools.md`.
 */
export function buildResourceDefs(): ResourceDefinition[] {
	return [
		{
			name: "overview",
			uri: "jpwallet://overview",
			description:
				"Snapshot de balances y resumen del período actual. Requiere scope read:dashboard.",
			mimeType: "application/json",
			tool: "get_financial_overview",
			args: {},
		},
		{
			name: "budgets-active",
			uri: "jpwallet://budgets/active",
			description:
				"Presupuestos activos y su progreso. Requiere scope read:budgets.",
			mimeType: "application/json",
			tool: "list_budgets",
			args: {},
		},
		{
			name: "credits-active",
			uri: "jpwallet://credits/active",
			description:
				"Créditos activos y sus saldos. Requiere scope read:credits.",
			mimeType: "application/json",
			tool: "list_credits",
			args: { status: "active" },
		},
	];
}

export interface ResourceReadResult {
	[key: string]: unknown;
	contents: Array<{ uri: string; mimeType: string; text: string }>;
}

export async function readResource(
	def: ResourceDefinition,
	getToken: GetToken,
	siteUrl: string,
): Promise<ResourceReadResult> {
	const result = await callAgentRpc({
		siteUrl,
		token: getToken(),
		tool: def.tool,
		args: def.args,
	});
	const text = result.ok
		? JSON.stringify(result.data, null, 2)
		: JSON.stringify({ error: result.error }, null, 2);

	return { contents: [{ uri: def.uri, mimeType: def.mimeType, text }] };
}

export function registerResources(
	server: McpServer,
	getToken: GetToken,
	siteUrl: string,
): void {
	for (const def of buildResourceDefs()) {
		server.registerResource(
			def.name,
			def.uri,
			{ description: def.description, mimeType: def.mimeType },
			async (uri) => readResource({ ...def, uri: uri.href }, getToken, siteUrl),
		);
	}
}
