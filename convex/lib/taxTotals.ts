import { TAX_SECTIONS, type TaxSection } from "./taxCategories";

export type SectionTotals = Record<TaxSection, number> & {
	grandTotal: number;
};

export type TaxItemAmount = {
	section: TaxSection;
	amount: number;
};

export function emptySectionTotals(): SectionTotals {
	return {
		assets: 0,
		liabilities: 0,
		income: 0,
		deductions: 0,
		exempt: 0,
		grandTotal: 0,
	};
}

export function computeSectionTotals(items: TaxItemAmount[]): SectionTotals {
	const totals = emptySectionTotals();
	for (const item of items) {
		if (!TAX_SECTIONS.includes(item.section)) continue;
		totals[item.section] += item.amount;
		totals.grandTotal += item.amount;
	}
	return totals;
}
