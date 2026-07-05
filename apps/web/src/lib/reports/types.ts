export type ReportSummary = {
	periodStart: number;
	periodEnd: number;
	totalIncome: number;
	totalExpense: number;
	net: number;
	byCategory: Array<{
		categoryId: string;
		name: string;
		color: string;
		amount: number;
		percent: number;
	}>;
	timeSeries: Array<{
		bucketStart: number;
		bucketLabel: string;
		income: number;
		expense: number;
	}>;
};
