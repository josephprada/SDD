import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export interface PromptMessage {
	role: "user" | "assistant";
	content: { type: "text"; text: string };
}

export interface PromptDefinition {
	name: string;
	description: string;
	messages: () => PromptMessage[];
}

/**
 * Prompts opcionales — fase D. Guían al modelo a usar las tools de lectura
 * antes de proponer acciones; no mutan datos por sí solos.
 * Ver `changes/mcp-access/contracts/mcp-tools.md`.
 */
export function buildPromptDefs(): PromptDefinition[] {
	return [
		{
			name: "monthly_review",
			description:
				"Guía al modelo a revisar el mes: overview + resumen de gasto por categoría.",
			messages: () => [
				{
					role: "user",
					content: {
						type: "text",
						text: [
							"Quiero una revisión de mi mes financiero en JP-WALLET.",
							"1. Llama a `get_financial_overview` con period='month'.",
							"2. Llama a `get_spending_summary` con el rango del mes actual.",
							"3. Resume ingresos, gastos y las categorías con mayor gasto.",
							"4. Si hay datos del mes anterior, compara la tendencia.",
							"5. Sugiere 2-3 acciones concretas para el resto del mes.",
						].join("\n"),
					},
				},
			],
		},
		{
			name: "savings_plan",
			description:
				"Guía al modelo a proponer un plan de ahorro según ingresos, gastos y metas activas.",
			messages: () => [
				{
					role: "user",
					content: {
						type: "text",
						text: [
							"Ayúdame a planear mi ahorro del mes en JP-WALLET.",
							"1. Llama a `get_financial_overview` y `list_savings_goals`.",
							"2. Calcula el excedente disponible tras gastos fijos y presupuestos.",
							"3. Propón un monto de aporte por cada meta activa, priorizando por fecha objetivo.",
							"4. Solo si confirmo explícitamente, usa `contribute_to_goal` para registrar el aporte.",
						].join("\n"),
					},
				},
			],
		},
	];
}

export function registerPrompts(server: McpServer): void {
	for (const def of buildPromptDefs()) {
		server.registerPrompt(
			def.name,
			{ description: def.description },
			async () => ({ messages: def.messages() }),
		);
	}
}
