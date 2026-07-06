import { CategoryBreakdownChart } from "@app/components/reports/CategoryBreakdownChart";
import { IncomeExpenseChart } from "@app/components/reports/IncomeExpenseChart";
import { ReportBudgetsSection } from "@app/components/reports/ReportBudgetsSection";
import { ReportExportActions } from "@app/components/reports/ReportExportActions";
import { ReportFilters } from "@app/components/reports/ReportFilters";
import { ReportFixedExpensesSection } from "@app/components/reports/ReportFixedExpensesSection";
import { ReportSummaryCard } from "@app/components/reports/ReportSummaryCard";
import { TrendChart } from "@app/components/reports/TrendChart";
import { BrandLogoMark } from "@app/components/brand/BrandLogoMark";
import type { BudgetItem, FixedExpenseItem } from "@app/lib/budgets/types";
import type { ReportExportPayload } from "@app/lib/export/reportExportTypes";
import type { ReportSummary } from "@app/lib/reports/types";
import { formatMonthYear } from "@app/lib/format/date";
import { formatPeriodLabel, periodKeyFromDate, periodRange } from "@app/lib/period";
import { usePreferencesStore } from "@app/stores/preferences";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { GroupingId } from "@jp-ds/index";
import { useQuery } from "convex/react";
import { useMemo, useState } from "react";

export function ReportsRoute() {
	const defaultGrouping = usePreferencesStore((s) => s.defaultGrouping);
	const [grouping, setGrouping] = useState<GroupingId>(defaultGrouping);
	const [anchor, setAnchor] = useState(() => new Date());
	const [categoryId, setCategoryId] = useState<Id<"categories"> | "">("");
	const [accountId, setAccountId] = useState<Id<"accounts"> | "">("");

	const range = periodRange(grouping, anchor);
	const periodKey = periodKeyFromDate(anchor);
	const periodLabel = formatPeriodLabel(grouping, anchor);
	const monthLabel = formatMonthYear(anchor);

	const summary = useQuery(api.reports.summary, {
		periodStart: range.start,
		periodEnd: range.end,
		grouping,
		categoryId: categoryId || undefined,
		accountId: accountId || undefined,
	});

	const categories = useQuery(api.categories.list, { type: "expense" });
	const accounts = useQuery(api.accounts.list, { includeArchived: false });
	const budgets = useQuery(api.budgets.list, { periodKey });
	const fixedExpenses = useQuery(api.fixedExpenses.list, { periodKey });
	const transactions = useQuery(api.transactions.list, {
		dateFrom: range.start,
		dateTo: range.end,
		categoryId: categoryId || undefined,
		accountId: accountId || undefined,
	});

	const categoryOptions = useMemo(
		() => (categories ?? []).map((category) => ({ _id: category._id, name: category.name })),
		[categories],
	);
	const accountOptions = useMemo(
		() => (accounts ?? []).map((account) => ({ _id: account._id, name: account.name })),
		[accounts],
	);

	const exportPayload = useMemo<ReportExportPayload | null>(() => {
		if (
			summary === undefined ||
			budgets === undefined ||
			fixedExpenses === undefined ||
			transactions === undefined
		) {
			return null;
		}

		const selectedCategory = categoryOptions.find(
			(category) => category._id === categoryId,
		);
		const selectedAccount = accountOptions.find(
			(account) => account._id === accountId,
		);

		return {
			summary: summary as ReportSummary,
			grouping,
			periodLabel,
			periodKey,
			dateFrom: range.start,
			dateTo: range.end,
			filters: {
				categoryLabel: selectedCategory?.name ?? "Todas",
				accountLabel: selectedAccount?.name ?? "Todas",
			},
			budgets: budgets as BudgetItem[],
			fixedExpenses: fixedExpenses as FixedExpenseItem[],
			transactions: transactions.map((transaction) => ({
				date: transaction.date,
				type: transaction.type,
				amount: transaction.amount,
				accountName: transaction.accountName,
				toAccountName: transaction.toAccountName,
				categoryName: transaction.categoryName,
				notes: transaction.notes,
			})),
		};
	}, [
		summary,
		budgets,
		fixedExpenses,
		transactions,
		grouping,
		periodLabel,
		periodKey,
		range.start,
		range.end,
		categoryOptions,
		accountOptions,
		categoryId,
		accountId,
	]);

	if (!exportPayload) return null;

	const report = exportPayload.summary;

	return (
		<div className="animate-stagger">
			<header className="page-header animate-stagger-item">
				<div className="dash-header__brand show-desktop">
					<BrandLogoMark size={42} />
					<div>
						<h1 className="page-title">Reportes</h1>
						<p className="page-subtitle">Panel de resultados financieros</p>
					</div>
				</div>
				<div className="page-header__mobile show-mobile">
					<BrandLogoMark size={28} />
					<h1 className="page-title">Reportes</h1>
				</div>
			</header>

			<ReportFilters
				grouping={grouping}
				anchor={anchor}
				categoryId={categoryId}
				accountId={accountId}
				categories={categoryOptions}
				accounts={accountOptions}
				onGroupingChange={setGrouping}
				onAnchorChange={setAnchor}
				onCategoryChange={setCategoryId}
				onAccountChange={setAccountId}
			/>

			<ReportExportActions
				payload={exportPayload}
				grouping={grouping}
				anchor={anchor}
			/>

			<div className="report-export-panel animate-stagger-item">
				<ReportSummaryCard summary={report} />
				<div className="report-charts">
					<IncomeExpenseChart summary={report} />
					<CategoryBreakdownChart summary={report} />
					<TrendChart summary={report} />
				</div>

				<div className="report-commitments">
					<ReportBudgetsSection
						items={exportPayload.budgets}
						periodLabel={monthLabel}
					/>
					<ReportFixedExpensesSection
						items={exportPayload.fixedExpenses}
						periodLabel={monthLabel}
					/>
				</div>
			</div>
		</div>
	);
}
