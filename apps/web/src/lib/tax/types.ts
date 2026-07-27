export type TaxSection =
	| "assets"
	| "liabilities"
	| "income"
	| "deductions"
	| "exempt";

export type TaxStatus = "draft" | "review" | "filed";

export type TaxSourceType =
	| "account"
	| "credit"
	| "income_category"
	| "expense_category"
	| "credit_interest";

export const TAX_STATUS_LABELS: Record<TaxStatus, string> = {
	draft: "Borrador",
	review: "En revisión",
	filed: "Presentada",
};

export const TAX_DISCLAIMER =
	"Documento de apoyo; no constituye liquidación oficial DIAN.";
