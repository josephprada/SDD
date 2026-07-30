export const API_SCOPES = [
	"read:dashboard",
	"read:transactions",
	"write:transactions",
	"read:accounts",
	"write:accounts",
	"read:categories",
	"write:categories",
	"read:budgets",
	"write:budgets",
	"read:credits",
	"write:credits",
	"read:savings",
	"write:savings",
	"read:tax",
	"write:tax",
	"destructive",
] as const;

export type ApiScope = (typeof API_SCOPES)[number];

export const DEFAULT_READ_SCOPES: ApiScope[] = API_SCOPES.filter((s) =>
	s.startsWith("read:"),
);

export const WRITE_SCOPES: ApiScope[] = API_SCOPES.filter(
	(s) => s.startsWith("write:") || s === "destructive",
);

export const SCOPE_LABELS_ES: Record<ApiScope, string> = {
	"read:dashboard": "Ver resumen",
	"read:transactions": "Ver movimientos",
	"write:transactions": "Crear/editar movimientos",
	"read:accounts": "Ver cuentas",
	"write:accounts": "Crear/editar cuentas",
	"read:categories": "Ver categorías",
	"write:categories": "Crear/editar categorías",
	"read:budgets": "Ver presupuestos",
	"write:budgets": "Crear/editar presupuestos",
	"read:credits": "Ver créditos",
	"write:credits": "Crear/editar créditos",
	"read:savings": "Ver metas de ahorro",
	"write:savings": "Crear/editar metas",
	"read:tax": "Ver renta",
	"write:tax": "Editar renta",
	destructive: "Eliminar datos",
};

export type ScopePresetId = "read" | "read_write" | "custom";

export const SCOPE_PRESETS: Record<
	Exclude<ScopePresetId, "custom">,
	{ label: string; description: string; scopes: ApiScope[] }
> = {
	read: {
		label: "Solo lectura",
		description: "El agente puede consultar tus finanzas, no modificarlas.",
		scopes: DEFAULT_READ_SCOPES,
	},
	read_write: {
		label: "Lectura + escritura",
		description: "Puede crear y editar; no incluye borrar (destructive).",
		scopes: API_SCOPES.filter((s) => s !== "destructive"),
	},
};

export type ExpiryPresetId = "30d" | "90d" | "never";

export function expiryFromPreset(preset: ExpiryPresetId): number | undefined {
	const now = Date.now();
	if (preset === "30d") return now + 30 * 24 * 60 * 60 * 1000;
	if (preset === "90d") return now + 90 * 24 * 60 * 60 * 1000;
	return undefined;
}
