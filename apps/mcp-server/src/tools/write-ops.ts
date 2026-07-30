import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
	type GetToken,
	type ToolDefinition,
	makeRpcTool,
	registerToolDefs,
} from "./types.js";

/**
 * Tools de escritura/CRUD sobre transacciones e impuestos, incluyendo el
 * flujo destructivo con `confirm` — fase C.
 * Ver `changes/mcp-access/contracts/mcp-tools.md`.
 */
export function buildWriteOpsToolDefs(
	getToken: GetToken,
	siteUrl: string,
): ToolDefinition[] {
	return [
		makeRpcTool({
			name: "create_transaction",
			description:
				"Crea una transacción (ingreso o gasto). Requiere scope write:transactions.",
			inputShape: {
				type: z.enum(["income", "expense"]),
				amount: z
					.number()
					.int()
					.positive()
					.describe("Monto en COP (entero, > 0)."),
				accountId: z.string(),
				categoryId: z.string(),
				date: z.number().describe("Fecha de la transacción (epoch ms)."),
				notes: z.string().optional(),
			},
			getToken,
			siteUrl,
		}),
		makeRpcTool({
			name: "update_transaction",
			description:
				"Actualiza campos de una transacción existente. Requiere scope write:transactions.",
			inputShape: {
				transactionId: z.string(),
				type: z.enum(["income", "expense"]).optional(),
				amount: z.number().int().positive().optional(),
				accountId: z.string().optional(),
				categoryId: z.string().optional(),
				date: z.number().optional(),
				notes: z.string().optional(),
			},
			getToken,
			siteUrl,
		}),
		makeRpcTool({
			name: "delete_transaction",
			description:
				"Elimina una transacción de forma permanente. Requiere scope write:transactions + destructive. Sin confirm=true el gateway responde confirmation_required.",
			inputShape: {
				transactionId: z.string(),
				confirm: z
					.boolean()
					.describe(
						"Debe ser true para ejecutar la eliminación; de lo contrario se rechaza con confirmation_required.",
					),
			},
			getToken,
			siteUrl,
			confirm: (args) => Boolean((args as { confirm?: unknown }).confirm),
		}),
		makeRpcTool({
			name: "create_tax_item",
			description:
				"Crea un item dentro de un documento de impuestos. Requiere scope write:tax.",
			inputShape: {
				documentId: z.string(),
				concept: z.string(),
				amount: z
					.number()
					.int()
					.positive()
					.describe("Monto en COP (entero, > 0)."),
				notes: z.string().optional(),
			},
			getToken,
			siteUrl,
		}),
		makeRpcTool({
			name: "update_tax_item",
			description:
				"Actualiza un item de impuestos existente. Rechazado (conflict) si el documento padre está en estado 'filed'. Requiere scope write:tax.",
			inputShape: {
				itemId: z.string(),
				concept: z.string().optional(),
				amount: z.number().int().positive().optional(),
				notes: z.string().optional(),
			},
			getToken,
			siteUrl,
		}),
	];
}

export function registerWriteOpsTools(
	server: McpServer,
	getToken: GetToken,
	siteUrl: string,
): void {
	registerToolDefs(server, buildWriteOpsToolDefs(getToken, siteUrl));
}
