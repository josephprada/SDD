import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
	type GetToken,
	type ToolDefinition,
	makeRpcTool,
	registerToolDefs,
} from "./types.js";

/**
 * Tools de escritura — presupuestos y ahorro (fase C).
 * Ver `changes/mcp-access/contracts/mcp-tools.md`.
 */
export function buildWritePlanToolDefs(
	getToken: GetToken,
	siteUrl: string,
): ToolDefinition[] {
	return [
		makeRpcTool({
			name: "upsert_budget",
			description:
				"Crea o actualiza un presupuesto por categoría y período. Requiere scope write:budgets. Para crear: categoryId + limit + period. Para actualizar: budgetId + categoryId + limit (period se ignora).",
			inputShape: {
				budgetId: z
					.string()
					.optional()
					.describe("Si se provee, actualiza el presupuesto existente."),
				categoryId: z
					.string()
					.describe(
						"ID de categoría de gasto (se mapea a categoryIds: [categoryId] en el backend).",
					),
				limit: z
					.number()
					.int()
					.positive()
					.describe("Límite en COP (entero, > 0). Alias interno: amount."),
				period: z
					.string()
					.describe(
						"Período del presupuesto (ej. '2026-08'). Requerido al crear. Alias interno: periodKey.",
					),
			},
			getToken,
			siteUrl,
		}),
		makeRpcTool({
			name: "create_savings_goal",
			description: "Crea una meta de ahorro. Requiere scope write:savings.",
			inputShape: {
				name: z.string(),
				targetAmount: z
					.number()
					.int()
					.positive()
					.describe("Monto objetivo en COP (entero, > 0)."),
				targetDate: z
					.number()
					.optional()
					.describe(
						"Fecha objetivo (epoch ms). Alias interno del campo deadline.",
					),
			},
			getToken,
			siteUrl,
		}),
		makeRpcTool({
			name: "contribute_to_goal",
			description:
				"Registra un aporte a una meta de ahorro existente. Requiere scope write:savings. Si la meta tiene cuenta vinculada, fromAccountId es obligatorio.",
			inputShape: {
				goalId: z.string(),
				amount: z
					.number()
					.int()
					.positive()
					.describe("Monto del aporte en COP (entero, > 0)."),
				fromAccountId: z
					.string()
					.optional()
					.describe(
						"Cuenta origen del aporte. Requerido si la meta tiene cuenta de ahorro vinculada.",
					),
				contributedAt: z
					.number()
					.optional()
					.describe("Fecha del aporte (epoch ms). Default: ahora."),
				notes: z.string().optional(),
			},
			getToken,
			siteUrl,
		}),
	];
}

export function registerWritePlanTools(
	server: McpServer,
	getToken: GetToken,
	siteUrl: string,
): void {
	registerToolDefs(server, buildWritePlanToolDefs(getToken, siteUrl));
}
