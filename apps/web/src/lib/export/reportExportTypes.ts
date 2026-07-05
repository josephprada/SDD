import type { BudgetItem, FixedExpenseItem } from "@app/lib/budgets/types";
import type { ReportSummary } from "@app/lib/reports/types";
import type { GroupingId } from "@jp-ds/index";

export type ReportExportTransaction = {
	date: number;
	type: "income" | "expense" | "transfer";
	amount: number;
	accountName: string;
	toAccountName?: string;
	categoryName: string;
	notes?: string;
};

export type ReportExportPayload = {
	summary: ReportSummary;
	grouping: GroupingId;
	periodLabel: string;
	periodKey: string;
	dateFrom: number;
	dateTo: number;
	filters: {
		categoryLabel: string;
		accountLabel: string;
	};
	budgets: BudgetItem[];
	fixedExpenses: FixedExpenseItem[];
	transactions: ReportExportTransaction[];
};
