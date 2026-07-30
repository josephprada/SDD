import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
	type GetToken,
	type ToolDefinition,
	makeRpcTool,
	registerToolDefs,
} from "./types.js";

/**
 * Tools de solo lectura — fase B.
 * Ver `changes/mcp-access/contracts/mcp-tools.md`.
 */
export function buildReadToolDefs(
	getToken: GetToken,
	siteUrl: string,
): ToolDefinition[] {
	return [
		makeRpcTool({
			name: "get_financial_overview",
			description:
				"Resumen financiero: balances, ingresos/gastos del período y movimientos recientes. Requiere scope read:dashboard.",
			inputShape: {
				period: z
					.enum(["week", "month", "quarter", "semester"])
					.optional()
					.describe(
						"Período a resumir; por defecto la preferencia del usuario o 'month'.",
					),
			},
			getToken,
			siteUrl,
		}),
		makeRpcTool({
			name: "list_transactions",
			description:
				"Lista transacciones con filtros opcionales de rango de fecha, cuenta y categoría. Requiere scope read:transactions.",
			inputShape: {
				from: z.number().optional().describe("Timestamp de inicio (epoch ms)."),
				to: z.number().optional().describe("Timestamp de fin (epoch ms)."),
				accountId: z.string().optional(),
				categoryId: z.string().optional(),
				limit: z
					.number()
					.optional()
					.describe("Máximo de resultados a devolver."),
			},
			getToken,
			siteUrl,
		}),
		makeRpcTool({
			name: "get_spending_summary",
			description:
				"Totales y desglose de gasto por categoría en un rango de fechas. Requiere scope read:dashboard o read:transactions.",
			inputShape: {
				from: z.number().describe("Timestamp de inicio (epoch ms)."),
				to: z.number().describe("Timestamp de fin (epoch ms)."),
			},
			getToken,
			siteUrl,
		}),
		makeRpcTool({
			name: "list_accounts",
			description:
				"Lista las cuentas del usuario. Requiere scope read:accounts.",
			inputShape: {
				includeArchived: z
					.boolean()
					.optional()
					.describe("Incluir cuentas archivadas."),
			},
			getToken,
			siteUrl,
		}),
		makeRpcTool({
			name: "list_categories",
			description:
				"Lista las categorías del usuario. Requiere scope read:categories.",
			inputShape: {
				includeArchived: z
					.boolean()
					.optional()
					.describe("Incluir categorías archivadas."),
			},
			getToken,
			siteUrl,
		}),
		makeRpcTool({
			name: "list_budgets",
			description:
				"Lista presupuestos, opcionalmente filtrados por período. Requiere scope read:budgets.",
			inputShape: {
				period: z
					.string()
					.optional()
					.describe("Período a filtrar (ej. '2026-07')."),
			},
			getToken,
			siteUrl,
		}),
		makeRpcTool({
			name: "list_credits",
			description: "Lista créditos del usuario. Requiere scope read:credits.",
			inputShape: {
				status: z
					.enum(["active", "all"])
					.optional()
					.describe("Filtrar por estado; por defecto 'active'."),
			},
			getToken,
			siteUrl,
		}),
		makeRpcTool({
			name: "list_savings_goals",
			description:
				"Lista metas de ahorro del usuario. Requiere scope read:savings.",
			inputShape: {},
			getToken,
			siteUrl,
		}),
		makeRpcTool({
			name: "list_tax_documents",
			description:
				"Lista documentos de impuestos del usuario. Requiere scope read:tax.",
			inputShape: {},
			getToken,
			siteUrl,
		}),
		makeRpcTool({
			name: "get_tax_document",
			description:
				"Obtiene un documento de impuestos por id, opcionalmente con sus items. Requiere scope read:tax.",
			inputShape: {
				documentId: z.string(),
				includeItems: z.boolean().optional(),
			},
			getToken,
			siteUrl,
		}),
	];
}

export function registerReadTools(
	server: McpServer,
	getToken: GetToken,
	siteUrl: string,
): void {
	registerToolDefs(server, buildReadToolDefs(getToken, siteUrl));
}
