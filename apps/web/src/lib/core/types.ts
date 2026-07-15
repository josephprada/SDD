import type { Id } from "@convex/_generated/dataModel";

export type AccountType = "cash" | "bank" | "credit";
export type CategoryType = "expense" | "income" | "transfer";
export type TransactionType = "income" | "expense" | "transfer";

export type AccountFormValues = {
	name: string;
	type: AccountType;
	initialBalance: string;
	excludeFromPersonalFinance: boolean;
};

export type CategoryFormValues = {
	name: string;
	icon: string;
	color: string;
	type: CategoryType;
};

export type TransactionFormValues = {
	type: TransactionType;
	amount: string;
	date: string;
	accountId: Id<"accounts"> | "";
	toAccountId: Id<"accounts"> | "";
	categoryId: Id<"categories"> | "";
	notes: string;
};

export type TransactionFiltersState = {
	search: string;
	accountId: Id<"accounts"> | "";
	categoryId: Id<"categories"> | "";
	amountMin: string;
	amountMax: string;
	dateFrom: string;
	dateTo: string;
};

export const CATEGORY_COLORS = [
	// Verdes / marca
	"#07FBA2",
	"#2ECC71",
	"#27AE60",
	"#16A085",
	"#1ABC9C",
	"#4ECDC4",
	// Azules
	"#3498DB",
	"#2980B9",
	"#5DADE2",
	"#00B8D4",
	// Morados / rosas
	"#9B59B6",
	"#8E44AD",
	"#A569BD",
	"#E056FD",
	"#FF6BCB",
	// Rojos / naranjas
	"#E74C3C",
	"#FF6B6B",
	"#FF7F50",
	"#F39C12",
	"#FFB142",
	"#F1C40F",
	// Neutros / tierra
	"#D35400",
	"#A0522D",
	"#95A5A6",
	"#7F8C8D",
	"#607D8B",
	"#34495E",
	"#2C3E50",
];
