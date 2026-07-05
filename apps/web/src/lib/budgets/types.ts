export type ThresholdStatus = "ok" | "info" | "warning" | "danger";

export type BudgetCategory = {
	id: string;
	name: string;
	color: string;
	icon: string;
};

export type BudgetItem = {
	_id: string;
	categoryIds: string[];
	categories: BudgetCategory[];
	amount: number;
	spent: number;
	remaining: number;
	percent: number;
	thresholdStatus: ThresholdStatus;
	notes?: string;
};

export type FixedExpenseItem = {
	_id: string;
	name: string;
	amount: number;
	categoryId: string;
	categoryName: string;
	categoryColor: string;
	categoryIcon: string;
	dayOfMonth: number;
	reminderOffsets: number[];
	emailReminders: boolean;
	pushReminders: boolean;
	active: boolean;
	nextDueDate: number;
	lastPaidPeriodKey?: string;
	isPaidCurrentPeriod: boolean;
	notes?: string;
};
