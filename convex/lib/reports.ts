import type { Doc, Id } from "../_generated/dataModel";
import type { GroupingId } from "./period";
import { personalFinanceExpenseAmount } from "./personalFinance";

export type ReportFilters = {
	periodStart: number;
	periodEnd: number;
	categoryId?: Id<"categories">;
	accountId?: Id<"accounts">;
};

export type CategoryBreakdown = {
	categoryId: string;
	name: string;
	color: string;
	amount: number;
	percent: number;
};

export type TimeSeriesPoint = {
	bucketStart: number;
	bucketLabel: string;
	income: number;
	expense: number;
};

export type ReportSummary = {
	periodStart: number;
	periodEnd: number;
	totalIncome: number;
	totalExpense: number;
	net: number;
	byCategory: CategoryBreakdown[];
	timeSeries: TimeSeriesPoint[];
};

const MAX_CATEGORIES = 8;

export function aggregateTransactions(
	transactions: Doc<"transactions">[],
	categories: Map<Id<"categories">, Doc<"categories">>,
	filters: ReportFilters,
	grouping: GroupingId = "month",
	excludedAccountIds: Set<Id<"accounts">> = new Set(),
): ReportSummary {
	let filtered = transactions.filter(
		(t) => t.date >= filters.periodStart && t.date <= filters.periodEnd,
	);

	if (filters.categoryId) {
		filtered = filtered.filter((t) => t.categoryId === filters.categoryId);
	}
	if (filters.accountId) {
		filtered = filtered.filter(
			(t) =>
				t.accountId === filters.accountId ||
				t.toAccountId === filters.accountId,
		);
	}

	let totalIncome = 0;
	let totalExpense = 0;
	const byCat = new Map<string, number>();

	for (const t of filtered) {
		if (t.type === "income") totalIncome += t.amount;
		const expenseAmount = personalFinanceExpenseAmount(t, excludedAccountIds);
		if (expenseAmount > 0) {
			totalExpense += expenseAmount;
			const key = t.categoryId as string;
			byCat.set(key, (byCat.get(key) ?? 0) + expenseAmount);
		}
	}

	const sorted = [...byCat.entries()].sort((a, b) => b[1] - a[1]);
	const top = sorted.slice(0, MAX_CATEGORIES);
	const rest = sorted.slice(MAX_CATEGORIES);
	const restTotal = rest.reduce((s, [, amt]) => s + amt, 0);

	const byCategory: CategoryBreakdown[] = top.map(([categoryId, amount]) => {
		const cat = categories.get(categoryId as Id<"categories">);
		return {
			categoryId,
			name: cat?.name ?? "Categoría",
			color: cat?.color ?? "#7F8C8D",
			amount,
			percent: totalExpense > 0 ? amount / totalExpense : 0,
		};
	});

	if (restTotal > 0) {
		byCategory.push({
			categoryId: "other",
			name: "Otros",
			color: "#7F8C8D",
			amount: restTotal,
			percent: totalExpense > 0 ? restTotal / totalExpense : 0,
		});
	}

	const timeSeries = buildTimeSeries(
		filtered,
		filters.periodStart,
		filters.periodEnd,
		grouping,
		excludedAccountIds,
	);

	return {
		periodStart: filters.periodStart,
		periodEnd: filters.periodEnd,
		totalIncome,
		totalExpense,
		net: totalIncome - totalExpense,
		byCategory,
		timeSeries,
	};
}

function buildTimeSeries(
	transactions: Doc<"transactions">[],
	periodStart: number,
	periodEnd: number,
	grouping: GroupingId,
	excludedAccountIds: Set<Id<"accounts">> = new Set(),
): TimeSeriesPoint[] {
	const granularity = timeSeriesGranularityForGrouping(grouping);
	const buckets = createEmptyBuckets(periodStart, periodEnd, granularity);

	for (const t of transactions) {
		const bucketStart = bucketStartForDate(new Date(t.date), granularity);
		if (bucketStart < periodStart || bucketStart > periodEnd) continue;
		const entry = buckets.get(bucketStart) ?? { income: 0, expense: 0 };
		if (t.type === "income") entry.income += t.amount;
		entry.expense += personalFinanceExpenseAmount(t, excludedAccountIds);
		buckets.set(bucketStart, entry);
	}

	return [...buckets.entries()]
		.sort((a, b) => a[0] - b[0])
		.map(([bucketStart, vals]) => ({
			bucketStart,
			bucketLabel: formatBucketLabel(new Date(bucketStart), granularity),
			income: vals.income,
			expense: vals.expense,
		}));
}

type TimeSeriesGranularity = "day" | "month";

function timeSeriesGranularityForGrouping(
	grouping: GroupingId,
): TimeSeriesGranularity {
	switch (grouping) {
		case "week":
		case "month":
			return "day";
		case "quarter":
		case "semester":
			return "month";
	}
}

function createEmptyBuckets(
	periodStart: number,
	periodEnd: number,
	granularity: TimeSeriesGranularity,
): Map<number, { income: number; expense: number }> {
	const buckets = new Map<number, { income: number; expense: number }>();
	let cursor = bucketStartForDate(new Date(periodStart), granularity);

	while (cursor <= periodEnd) {
		buckets.set(cursor, { income: 0, expense: 0 });
		cursor = addBucketInterval(cursor, granularity);
	}

	return buckets;
}

function addBucketInterval(
	bucketStart: number,
	granularity: TimeSeriesGranularity,
): number {
	const next = new Date(bucketStart);
	if (granularity === "day") {
		next.setDate(next.getDate() + 1);
		return next.getTime();
	}

	next.setMonth(next.getMonth() + 1);
	return next.getTime();
}

function bucketStartForDate(
	date: Date,
	granularity: TimeSeriesGranularity,
): number {
	switch (granularity) {
		case "day": {
			const d = new Date(date);
			d.setHours(0, 0, 0, 0);
			return d.getTime();
		}
		case "month":
			return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
	}
}

function formatBucketLabel(
	date: Date,
	granularity: TimeSeriesGranularity,
): string {
	const months = [
		"Ene",
		"Feb",
		"Mar",
		"Abr",
		"May",
		"Jun",
		"Jul",
		"Ago",
		"Sep",
		"Oct",
		"Nov",
		"Dic",
	];
	if (granularity === "day") {
		return `${date.getDate()} ${months[date.getMonth()]}`;
	}
	return `${months[date.getMonth()]} ${date.getFullYear()}`;
}
