const DEFAULT_MCP_HTTP_URL =
	import.meta.env.VITE_MCP_URL ?? "https://mcp.wallet.lavalex.co/mcp";

const DEFAULT_CONVEX_SITE =
	import.meta.env.VITE_CONVEX_SITE_URL ?? "https://YOUR_DEPLOYMENT.convex.site";

export function remoteMcpSnippet(
	token: string,
	mcpUrl = DEFAULT_MCP_HTTP_URL,
): string {
	return JSON.stringify(
		{
			mcpServers: {
				"jp-wallet": {
					url: mcpUrl,
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			},
		},
		null,
		2,
	);
}

export function cursorRemoteSnippet(
	token: string,
	mcpUrl = DEFAULT_MCP_HTTP_URL,
): string {
	return remoteMcpSnippet(token, mcpUrl);
}

export function stdioSnippet(
	token: string,
	convexSiteUrl = DEFAULT_CONVEX_SITE,
): string {
	return JSON.stringify(
		{
			mcpServers: {
				"jp-wallet": {
					command: "bun",
					args: [
						"run",
						"--cwd",
						"/path/to/SDD/apps/mcp-server",
						"src/index.ts",
						"--stdio",
					],
					env: {
						CONVEX_SITE_URL: convexSiteUrl,
						JP_WALLET_TOKEN: token,
					},
				},
			},
		},
		null,
		2,
	);
}

export function curlRpcExample(
	token: string,
	convexSiteUrl = DEFAULT_CONVEX_SITE,
): string {
	const base = convexSiteUrl.replace(/\/$/, "");
	return `curl -sS -X POST "${base}/agent/v1/rpc" \\
  -H "Authorization: Bearer ${token}" \\
  -H "Content-Type: application/json" \\
  -d '{"tool":"get_financial_overview","args":{}}'`;
}
