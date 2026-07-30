#!/usr/bin/env bun
import { startHttpServer } from "./http.js";
import { startStdioServer } from "./stdio.js";

const DEFAULT_PORT = 3100;

interface CliOptions {
	mode: "http" | "stdio";
	port: number;
	help: boolean;
}

function parseArgs(argv: string[]): CliOptions {
	const mode: CliOptions["mode"] = argv.includes("--stdio") ? "stdio" : "http";
	const help = argv.includes("--help") || argv.includes("-h");

	const portFlagIndex = argv.indexOf("--port");
	const rawPort =
		portFlagIndex !== -1 ? argv[portFlagIndex + 1] : process.env.PORT;
	const parsedPort = Number(rawPort ?? DEFAULT_PORT);
	const port =
		Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : DEFAULT_PORT;

	return { mode, port, help };
}

function printHelp(): void {
	console.log(`jp-wallet-mcp — servidor MCP de JP-WALLET

Uso:
  bun run src/index.ts --http [--port 3100]   Inicia el servidor HTTP
                                               (Streamable HTTP en POST /mcp,
                                               healthcheck en GET /healthz)
  bun run src/index.ts --stdio                Inicia el servidor en modo stdio
                                               (clientes locales: Cursor, Claude Desktop)

Variables de entorno:
  CONVEX_SITE_URL   (requerido)              URL del deployment Convex, ej:
                                              https://tu-deployment.convex.site
  JP_WALLET_TOKEN   (requerido en --stdio)   Token personal jpw_... con los
                                              scopes deseados
  PORT              (opcional, modo http)    Puerto de escucha (default 3100)

En modo --http el token NO se lee de env: cada solicitud a /mcp debe incluir
"Authorization: Bearer jpw_...".
`);
}

async function main(): Promise<void> {
	const { mode, port, help } = parseArgs(process.argv.slice(2));

	if (help) {
		printHelp();
		return;
	}

	const siteUrl = process.env.CONVEX_SITE_URL;
	if (!siteUrl) {
		console.error(
			"[jp-wallet-mcp] Falta la variable de entorno CONVEX_SITE_URL (ej. https://tu-deployment.convex.site)",
		);
		process.exit(1);
	}

	if (mode === "stdio") {
		const token = process.env.JP_WALLET_TOKEN;
		if (!token) {
			console.error(
				"[jp-wallet-mcp] Falta la variable de entorno JP_WALLET_TOKEN para el modo --stdio",
			);
			process.exit(1);
		}
		await startStdioServer({ token, siteUrl });
		return;
	}

	startHttpServer({ port, siteUrl });
}

main().catch((err) => {
	console.error("[jp-wallet-mcp] Error fatal:", err);
	process.exit(1);
});
