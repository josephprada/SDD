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

export const DEFAULT_READ_SCOPES: ApiScope[] = API_SCOPES.filter((scope) =>
	scope.startsWith("read:"),
);

export const SCOPE_LABELS_ES: Record<ApiScope, string> = {
	"read:dashboard": "Ver resumen financiero",
	"read:transactions": "Ver transacciones",
	"write:transactions": "Crear y editar transacciones",
	"read:accounts": "Ver cuentas",
	"write:accounts": "Crear y editar cuentas",
	"read:categories": "Ver categorías",
	"write:categories": "Crear y editar categorías",
	"read:budgets": "Ver presupuestos",
	"write:budgets": "Crear y editar presupuestos",
	"read:credits": "Ver créditos",
	"write:credits": "Crear y editar créditos",
	"read:savings": "Ver metas de ahorro",
	"write:savings": "Crear y editar metas de ahorro",
	"read:tax": "Ver documentos de impuestos",
	"write:tax": "Crear y editar documentos de impuestos",
	destructive: "Eliminar datos (requiere confirmación explícita)",
};

export function isApiScope(value: string): value is ApiScope {
	return (API_SCOPES as readonly string[]).includes(value);
}

export function hasScope(
	scopes: readonly string[],
	required: ApiScope,
): boolean {
	return scopes.includes(required);
}

export function hasAllScopes(
	scopes: readonly string[],
	required: readonly ApiScope[],
): boolean {
	return required.every((scope) => scopes.includes(scope));
}

export function hasAnyScope(
	scopes: readonly string[],
	required: readonly ApiScope[],
): boolean {
	return required.some((scope) => scopes.includes(scope));
}
