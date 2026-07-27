import type { TaxSection } from "./taxCategories";

export type TaxSourceType =
	| "account"
	| "credit"
	| "income_category"
	| "expense_category"
	| "credit_interest";

export type TaxSuggestionInput = {
	accounts: Array<{
		_id: string;
		name: string;
		type: string;
		balance: number;
		archived: boolean;
	}>;
	credits: Array<{
		_id: string;
		name: string;
		status: string;
		outstandingBalance: number;
		creditProfile?: string;
	}>;
	transactions: Array<{
		type: string;
		amount: number;
		date: number;
		categoryId: string;
		categoryName: string;
		creditId?: string;
		isCreditInstallmentPayment?: boolean;
	}>;
	acceptedSources: Array<{ sourceType: string; sourceId: string }>;
	taxYear: number;
};

export type TaxSuggestion = {
	key: string;
	section: TaxSection;
	category: string;
	description: string;
	amount: number;
	sourceType: TaxSourceType;
	sourceId: string;
	rationale: string;
};

const DEDUCTION_KEYWORDS: Array<{ re: RegExp; category: string }> = [
	{ re: /salud|medic|eps|prepagad/i, category: "salud" },
	{ re: /educa|colegio|universidad|matr[ií]cula/i, category: "educacion" },
	{ re: /vivienda|arriendo|alquiler|hipotec/i, category: "vivienda" },
	{ re: /dependiente|hijo|familia/i, category: "dependientes" },
	{
		re: /inter[eé]s.*vivienda|vivienda.*inter[eé]s/i,
		category: "intereses_vivienda",
	},
];

const INCOME_KEYWORDS: Array<{ re: RegExp; category: string }> = [
	{ re: /salario|n[oó]mina|sueldo/i, category: "salarios" },
	{ re: /cesant/i, category: "cesantias" },
	{ re: /inter[eé]s|rendimiento/i, category: "intereses" },
	{ re: /dividendo/i, category: "dividendos" },
	{ re: /honorario|freelance|consultor/i, category: "honorarios" },
];

/** Midnight América/Bogota (UTC−5) for Jan 1 of taxYear → exclusive end next year. */
export function taxYearBounds(taxYear: number): { start: number; end: number } {
	const start = Date.UTC(taxYear, 0, 1, 5, 0, 0, 0);
	const end = Date.UTC(taxYear + 1, 0, 1, 5, 0, 0, 0);
	return { start, end };
}

function sourceKey(sourceType: string, sourceId: string): string {
	return `${sourceType}:${sourceId}`;
}

function mapIncomeCategory(name: string): string {
	for (const { re, category } of INCOME_KEYWORDS) {
		if (re.test(name)) return category;
	}
	return "otros";
}

function mapDeductionCategory(name: string): string | null {
	for (const { re, category } of DEDUCTION_KEYWORDS) {
		if (re.test(name)) return category;
	}
	return null;
}

export function buildTaxSuggestions(input: TaxSuggestionInput): {
	suggestions: TaxSuggestion[];
	skippedAlreadyAccepted: number;
} {
	const accepted = new Set(
		input.acceptedSources
			.filter((s) => s.sourceType && s.sourceId)
			.map((s) => sourceKey(s.sourceType, s.sourceId)),
	);
	let skippedAlreadyAccepted = 0;
	const suggestions: TaxSuggestion[] = [];

	const push = (s: Omit<TaxSuggestion, "key">) => {
		const key = sourceKey(s.sourceType, s.sourceId);
		if (accepted.has(key)) {
			skippedAlreadyAccepted += 1;
			return;
		}
		suggestions.push({ ...s, key });
	};

	for (const account of input.accounts) {
		if (account.archived || account.type === "credit") continue;
		if (account.balance <= 0) continue;
		push({
			section: "assets",
			category: "cuentas_bancarias",
			description: account.name,
			amount: Math.round(account.balance),
			sourceType: "account",
			sourceId: account._id,
			rationale: `Saldo cuenta ${account.name}`,
		});
	}

	for (const credit of input.credits) {
		if (credit.status !== "active") continue;
		if (credit.outstandingBalance <= 0) continue;
		push({
			section: "liabilities",
			category:
				credit.creditProfile === "tangible_product" ||
				/tarjeta/i.test(credit.name)
					? "tarjetas_credito"
					: "creditos_prestamos",
			description: credit.name,
			amount: Math.round(credit.outstandingBalance),
			sourceType: "credit",
			sourceId: credit._id,
			rationale: `Saldo pendiente crédito ${credit.name}`,
		});
	}

	const { start, end } = taxYearBounds(input.taxYear);
	const incomeByCategory = new Map<string, { name: string; amount: number }>();
	const expenseByCategory = new Map<
		string,
		{ name: string; amount: number; dian: string }
	>();
	let housingInterest = 0;

	for (const tx of input.transactions) {
		if (tx.date < start || tx.date >= end) continue;
		if (tx.type === "income") {
			const bucket = incomeByCategory.get(tx.categoryId) ?? {
				name: tx.categoryName,
				amount: 0,
			};
			bucket.amount += tx.amount;
			incomeByCategory.set(tx.categoryId, bucket);
		} else if (tx.type === "expense") {
			if (
				tx.isCreditInstallmentPayment &&
				tx.creditId &&
				/vivienda|hipotec|housing/i.test(tx.categoryName)
			) {
				housingInterest += tx.amount;
			}
			const dian = mapDeductionCategory(tx.categoryName);
			if (!dian) continue;
			const bucket = expenseByCategory.get(tx.categoryId) ?? {
				name: tx.categoryName,
				amount: 0,
				dian,
			};
			bucket.amount += tx.amount;
			expenseByCategory.set(tx.categoryId, bucket);
		}
	}

	for (const [categoryId, bucket] of incomeByCategory) {
		if (bucket.amount <= 0) continue;
		push({
			section: "income",
			category: mapIncomeCategory(bucket.name),
			description: `${bucket.name} (${input.taxYear})`,
			amount: Math.round(bucket.amount),
			sourceType: "income_category",
			sourceId: categoryId,
			rationale: `Suma ingresos categoría ${bucket.name} en ${input.taxYear}`,
		});
	}

	for (const [categoryId, bucket] of expenseByCategory) {
		if (bucket.amount <= 0) continue;
		push({
			section: "deductions",
			category: bucket.dian,
			description: `${bucket.name} (${input.taxYear})`,
			amount: Math.round(bucket.amount),
			sourceType: "expense_category",
			sourceId: categoryId,
			rationale: `Suma gastos categoría ${bucket.name} en ${input.taxYear}`,
		});
	}

	if (housingInterest > 0) {
		push({
			section: "deductions",
			category: "intereses_vivienda",
			description: `Intereses vivienda (${input.taxYear})`,
			amount: Math.round(housingInterest),
			sourceType: "credit_interest",
			sourceId: `housing-interest-${input.taxYear}`,
			rationale: "Pagos de cuota con categoría relacionada a vivienda",
		});
	}

	return { suggestions, skippedAlreadyAccepted };
}
