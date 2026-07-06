import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { internalMutation, mutation, query } from "./_generated/server";
import {
	requireAccountOwnership,
	requireCreditOwnership,
	requireUserId,
} from "./lib/auth";
import {
	simulatePayoffWithAnnualAbonos,
	generateScheduleCapitalConstant,
	generateScheduleCuotaFija,
	toMonthlyRate,
} from "./lib/creditAmortization";
import { dateKeyFromTimestamp, generateDueDates, markOverdueStatus } from "./lib/creditDates";
import {
	createCreditDisbursementCategory,
	createCreditPaymentCategory,
	deleteCategoriesLinkedToCredit,
	syncFundExpenseCategories,
	unlinkFundExpenseCategory,
} from "./lib/creditCategories";
import { executeSpendFromFund } from "./lib/creditFundSpend";
import {
	insertCreditLinkedTransaction,
	removeCreditLinkedTransaction,
} from "./lib/creditTransactions";
import { resolveFixedInstallmentForCredit, recalcAfterAbono } from "./lib/creditRecalc";
import {
	buildScheduleForCredit,
	cancelPendingPayments,
	generateManualScheduleSkeleton,
	insertGeneratedPayments,
	sumDestinationAllocated,
} from "./lib/creditsHelpers";
import {
	abonoRecalcEffectValidator,
	rateTypeValidator,
	scheduleModeValidator,
	validateCreditName,
	validateCreditNotes,
	validateDayOfMonth,
	validateInterestRate,
	validatePositiveCopAmount,
	validateReminderOffsets,
	validateTermMonths,
} from "./lib/validators";

export const list = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUserId(ctx);
		const credits = await ctx.db
			.query("credits")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();

		const now = Date.now();
		const results = [];
		for (const credit of credits) {
			const payments = await ctx.db
				.query("creditPayments")
				.withIndex("by_credit", (q) => q.eq("creditId", credit._id))
				.collect();
			const pending = payments
				.filter((p) => p.status === "pending" || p.status === "overdue")
				.map((p) => ({
					...p,
					status: markOverdueStatus(p.status, p.dueDate, now),
				}))
				.sort((a, b) => a.installmentNumber - b.installmentNumber)[0];

			results.push({
				_id: credit._id,
				name: credit.name,
				lender: credit.lender,
				principal: credit.principal,
				outstandingBalance: credit.outstandingBalance,
				defaultRecalcOnAbono: credit.defaultRecalcOnAbono,
				status: credit.status,
				nextPayment: pending
					? {
							dueDate: pending.dueDate,
							totalDue: pending.totalDue,
							installmentNumber: pending.installmentNumber,
						}
					: undefined,
			});
		}
		return results;
	},
});

export const get = query({
	args: { creditId: v.id("credits") },
	handler: async (ctx, { creditId }) => {
		const userId = await requireUserId(ctx);
		const credit = await requireCreditOwnership(ctx, userId, creditId);

		const disbursementAccount = credit.disbursementAccountId
			? await ctx.db.get(credit.disbursementAccountId)
			: null;
		const operatingAccount = credit.operatingAccountId
			? await ctx.db.get(credit.operatingAccountId)
			: null;

		const totalAllocated = await sumDestinationAllocated(ctx, creditId);
		const payments = await ctx.db
			.query("creditPayments")
			.withIndex("by_credit", (q) => q.eq("creditId", creditId))
			.collect();
		const activePayments = payments.filter((p) => p.status !== "cancelled");
		const paidCount = activePayments.filter((p) => p.status === "paid").length;
		const pendingCount = activePayments.filter(
			(p) => p.status === "pending",
		).length;

		return {
			...credit,
			disbursementAccountName: disbursementAccount?.name,
			operatingAccountName: operatingAccount?.name,
			paymentAccountName: operatingAccount?.name,
			fundExpenseCategories: await Promise.all(
				(credit.fundExpenseCategoryIds ?? []).map(async (categoryId) => {
					const cat = await ctx.db.get(categoryId);
					return cat
						? { _id: cat._id, name: cat.name, icon: cat.icon, color: cat.color }
						: null;
				}),
			).then((items) =>
				items.filter(
					(item): item is NonNullable<typeof item> => item !== null,
				),
			),
			destinationsSummary: {
				totalAllocated,
				unallocated: credit.principal - totalAllocated,
			},
			paymentsSummary: {
				total: activePayments.length || credit.termMonths,
				paid: paidCount,
				pending: pendingCount,
			},
		};
	},
});

export const create = mutation({
	args: {
		name: v.string(),
		lender: v.string(),
		principal: v.number(),
		rateType: rateTypeValidator,
		interestRate: v.number(),
		termMonths: v.number(),
		startDate: v.number(),
		paymentDay: v.number(),
		scheduleMode: scheduleModeValidator,
		fixedInstallment: v.optional(v.number()),
		insuranceMonthly: v.optional(v.number()),
		disbursementAccountId: v.id("accounts"),
		paymentAccountId: v.id("accounts"),
		registerDisbursementIncome: v.optional(v.boolean()),
		fundExpenseCategoryIds: v.optional(v.array(v.id("categories"))),
		newFundExpenseCategoryNames: v.optional(v.array(v.string())),
		targetPayoffDate: v.optional(v.number()),
		defaultRecalcOnAbono: v.optional(abonoRecalcEffectValidator),
		reminderOffsets: v.optional(v.array(v.number())),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const name = validateCreditName(args.name);
		const lender = validateCreditName(args.lender);
		const principal = validatePositiveCopAmount(args.principal);
		const interestRate = validateInterestRate(args.interestRate);
		const termMonths = validateTermMonths(args.termMonths);
		const paymentDay = validateDayOfMonth(args.paymentDay);
		const notes = validateCreditNotes(args.notes);
		const reminderOffsets = validateReminderOffsets(
			args.reminderOffsets ?? [3, 0],
		);
		const now = Date.now();

		await requireAccountOwnership(ctx, userId, args.disbursementAccountId);
		await requireAccountOwnership(ctx, userId, args.paymentAccountId);

		const monthlyRate = toMonthlyRate(args.rateType, interestRate);
		const fixedInstallment =
			args.scheduleMode === "manual"
				? args.fixedInstallment
				: resolveFixedInstallmentForCredit({
						principal,
						monthlyRate,
						termMonths,
						scheduleMode: args.scheduleMode,
						fixedInstallment: args.fixedInstallment,
					});

		const creditId = await ctx.db.insert("credits", {
			userId,
			name,
			lender,
			principal,
			rateType: args.rateType,
			interestRate,
			termMonths,
			startDate: args.startDate,
			paymentDay,
			scheduleMode: args.scheduleMode,
			fixedInstallment,
			defaultRecalcOnAbono: args.defaultRecalcOnAbono ?? "shorten_term",
			targetPayoffDate: args.targetPayoffDate,
			insuranceMonthly: args.insuranceMonthly,
			disbursementAccountId: args.disbursementAccountId,
			operatingAccountId: args.paymentAccountId,
			outstandingBalance: principal,
			reminderOffsets,
			status: "active",
			notes,
			createdAt: now,
			updatedAt: now,
		});

		if (args.scheduleMode === "manual") {
			const schedule = generateManualScheduleSkeleton({
				startDate: args.startDate,
				paymentDay,
				termMonths,
				insuranceMonthly: args.insuranceMonthly,
			});
			await insertGeneratedPayments(ctx, creditId, schedule, false);
		} else {
			const schedule = buildScheduleForCredit({
				principal,
				rateType: args.rateType,
				interestRate,
				termMonths,
				startDate: args.startDate,
				paymentDay,
				scheduleMode: args.scheduleMode,
				fixedInstallment,
				insuranceMonthly: args.insuranceMonthly,
			});
			await insertGeneratedPayments(ctx, creditId, schedule, true);
		}

		const paymentCategoryId = await createCreditPaymentCategory(
			ctx,
			userId,
			creditId,
			name,
		);

		let disbursementIncomeCategoryId: Id<"categories"> | undefined;
		let disbursementTransactionId: Id<"transactions"> | undefined;

		if (args.registerDisbursementIncome) {
			disbursementIncomeCategoryId = await createCreditDisbursementCategory(
				ctx,
				userId,
				creditId,
				name,
			);
			disbursementTransactionId = await insertCreditLinkedTransaction(
				ctx,
				userId,
				{
					type: "income",
					amount: principal,
					date: args.startDate,
					accountId: args.disbursementAccountId,
					categoryId: disbursementIncomeCategoryId,
					creditId,
					notes: `Desembolso — ${name}`,
				},
			);
		}

		await ctx.db.patch(creditId, {
			paymentCategoryId,
			disbursementIncomeCategoryId,
			disbursementTransactionId,
			updatedAt: now,
		});

		const fundExpenseCategoryIds = await syncFundExpenseCategories(
			ctx,
			userId,
			creditId,
			args.fundExpenseCategoryIds ?? [],
			args.newFundExpenseCategoryNames ?? [],
			{ deleteNewWithCredit: true },
		);
		if (fundExpenseCategoryIds.length > 0) {
			await ctx.db.patch(creditId, {
				fundExpenseCategoryIds,
				updatedAt: Date.now(),
			});
		}

		return creditId;
	},
});

export const update = mutation({
	args: {
		creditId: v.id("credits"),
		name: v.optional(v.string()),
		lender: v.optional(v.string()),
		notes: v.optional(v.string()),
		targetPayoffDate: v.optional(v.number()),
		clearTargetPayoffDate: v.optional(v.boolean()),
		defaultRecalcOnAbono: v.optional(abonoRecalcEffectValidator),
		disbursementAccountId: v.optional(v.id("accounts")),
		operatingAccountId: v.optional(v.id("accounts")),
		clearDisbursementAccount: v.optional(v.boolean()),
		clearOperatingAccount: v.optional(v.boolean()),
		fundExpenseCategoryIds: v.optional(v.array(v.id("categories"))),
		newFundExpenseCategoryNames: v.optional(v.array(v.string())),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const credit = await requireCreditOwnership(ctx, userId, args.creditId);
		const now = Date.now();
		const patch: Record<string, unknown> = { updatedAt: now };

		if (args.name !== undefined) patch.name = validateCreditName(args.name);
		if (args.lender !== undefined) patch.lender = validateCreditName(args.lender);
		if (args.notes !== undefined) patch.notes = validateCreditNotes(args.notes);
		if (args.clearTargetPayoffDate) {
			patch.targetPayoffDate = undefined;
		} else if (args.targetPayoffDate !== undefined) {
			patch.targetPayoffDate = args.targetPayoffDate;
		}
		if (args.defaultRecalcOnAbono !== undefined) {
			patch.defaultRecalcOnAbono = args.defaultRecalcOnAbono;
		}

		const prevDisbursement = credit.disbursementAccountId;

		if (args.clearDisbursementAccount) {
			patch.disbursementAccountId = undefined;
		} else if (args.disbursementAccountId !== undefined) {
			await requireAccountOwnership(ctx, userId, args.disbursementAccountId);
			patch.disbursementAccountId = args.disbursementAccountId;
			await ctx.db.patch(args.disbursementAccountId, {
				isCreditEscrow: true,
				updatedAt: now,
			});
		}

		if (args.clearOperatingAccount) {
			patch.operatingAccountId = undefined;
		} else if (args.operatingAccountId !== undefined) {
			await requireAccountOwnership(ctx, userId, args.operatingAccountId);
			patch.operatingAccountId = args.operatingAccountId;
		}

		if (
			args.fundExpenseCategoryIds !== undefined ||
			args.newFundExpenseCategoryNames !== undefined
		) {
			const prevIds = credit.fundExpenseCategoryIds ?? [];
			const nextIds = args.fundExpenseCategoryIds ?? prevIds;
			const allIds = await syncFundExpenseCategories(
				ctx,
				userId,
				args.creditId,
				nextIds,
				args.newFundExpenseCategoryNames ?? [],
				{ deleteNewWithCredit: false },
			);
			for (const prevId of prevIds) {
				if (!allIds.includes(prevId)) {
					await unlinkFundExpenseCategory(ctx, prevId);
				}
			}
			patch.fundExpenseCategoryIds = allIds;
		}

		await ctx.db.patch(args.creditId, patch);

		if (args.clearDisbursementAccount && prevDisbursement) {
			const other = await ctx.db
				.query("credits")
				.withIndex("by_user", (q) => q.eq("userId", userId))
				.collect();
			const stillUsed = other.some(
				(c) =>
					c._id !== args.creditId &&
					c.disbursementAccountId === prevDisbursement,
			);
			if (!stillUsed) {
				await ctx.db.patch(prevDisbursement, {
					isCreditEscrow: false,
					updatedAt: now,
				});
			}
		}

		return null;
	},
});

export const remove = mutation({
	args: { creditId: v.id("credits") },
	handler: async (ctx, { creditId }) => {
		const userId = await requireUserId(ctx);
		const credit = await requireCreditOwnership(ctx, userId, creditId);
		const now = Date.now();

		const payments = await ctx.db
			.query("creditPayments")
			.withIndex("by_credit", (q) => q.eq("creditId", creditId))
			.collect();
		for (const p of payments) await ctx.db.delete(p._id);

		const abonos = await ctx.db
			.query("creditCapitalAbonos")
			.withIndex("by_credit", (q) => q.eq("creditId", creditId))
			.collect();
		for (const a of abonos) await ctx.db.delete(a._id);

		const destinations = await ctx.db
			.query("creditDestinations")
			.withIndex("by_credit", (q) => q.eq("creditId", creditId))
			.collect();
		for (const d of destinations) await ctx.db.delete(d._id);

		const userTransactions = await ctx.db
			.query("transactions")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();
		for (const transaction of userTransactions) {
			if (transaction.creditId !== creditId) continue;
			await removeCreditLinkedTransaction(ctx, userId, transaction._id);
		}

		await deleteCategoriesLinkedToCredit(ctx, creditId);

		const goals = await ctx.db
			.query("savingsGoals")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();
		for (const goal of goals) {
			if (goal.linkedCreditId === creditId) {
				await ctx.db.patch(goal._id, {
					linkedCreditId: undefined,
					updatedAt: now,
				});
			}
		}

		if (credit.disbursementAccountId) {
			const others = await ctx.db
				.query("credits")
				.withIndex("by_user", (q) => q.eq("userId", userId))
				.collect();
			const stillUsed = others.some(
				(c) =>
					c._id !== creditId &&
					c.disbursementAccountId === credit.disbursementAccountId,
			);
			if (!stillUsed) {
				await ctx.db.patch(credit.disbursementAccountId, {
					isCreditEscrow: false,
					updatedAt: now,
				});
			}
		}

		await ctx.db.delete(creditId);
		return null;
	},
});

export const simulatePayoff = query({
	args: {
		creditId: v.id("credits"),
		annualAbonoAmount: v.number(),
		years: v.optional(v.number()),
	},
	handler: async (ctx, { creditId, annualAbonoAmount, years }) => {
		const userId = await requireUserId(ctx);
		const credit = await requireCreditOwnership(ctx, userId, creditId);
		const abono = validatePositiveCopAmount(annualAbonoAmount);
		const monthlyRate = toMonthlyRate(credit.rateType, credit.interestRate);
		const fixedInstallment =
			credit.fixedInstallment ??
			resolveFixedInstallmentForCredit({
				principal: credit.outstandingBalance,
				monthlyRate,
				termMonths: credit.termMonths,
				scheduleMode: credit.scheduleMode,
			});
		const dueDates = generateDueDates(
			credit.startDate,
			credit.paymentDay,
			credit.termMonths,
		);

		return simulatePayoffWithAnnualAbonos({
			outstandingBalance: credit.outstandingBalance,
			monthlyRate,
			fixedInstallment,
			insuranceMonthly: credit.insuranceMonthly ?? 0,
			dueDates,
			annualAbonoAmount: abono,
			annualAbonoMonth: 11,
			maxYears: years ?? 30,
		});
	},
});

export const fundSummary = query({
	args: { creditId: v.id("credits") },
	handler: async (ctx, { creditId }) => {
		const userId = await requireUserId(ctx);
		const credit = await requireCreditOwnership(ctx, userId, creditId);
		const totalAllocated = await sumDestinationAllocated(ctx, creditId);
		let escrowBalance = 0;
		if (credit.disbursementAccountId) {
			const account = await ctx.db.get(credit.disbursementAccountId);
			escrowBalance = account?.balance ?? 0;
		}
		return {
			disbursementAccountId: credit.disbursementAccountId,
			escrowBalance,
			principal: credit.principal,
			totalAllocated,
			unallocated: credit.principal - totalAllocated,
			spentFromDisbursement: Math.max(0, credit.principal - escrowBalance),
			availableFromDisbursement: escrowBalance,
			operatingAccountId: credit.operatingAccountId,
		};
	},
});

export const listFundMovements = query({
	args: {
		creditId: v.id("credits"),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, { creditId, limit }) => {
		const userId = await requireUserId(ctx);
		await requireCreditOwnership(ctx, userId, creditId);
		const cap = Math.min(limit ?? 50, 100);
		const all = await ctx.db
			.query("transactions")
			.withIndex("by_user", (q) => q.eq("userId", userId))
			.collect();

		const expenses = all
			.filter(
				(t) =>
					t.creditId === creditId &&
					t.type === "expense" &&
					t.creditDestinationId,
			)
			.sort((a, b) => b.date - a.date || b.createdAt - a.createdAt)
			.slice(0, cap);

		const enriched = [];
		for (const transaction of expenses) {
			const destination = transaction.creditDestinationId
				? await ctx.db.get(transaction.creditDestinationId)
				: null;
			const category = await ctx.db.get(transaction.categoryId);
			const account = await ctx.db.get(transaction.accountId);
			enriched.push({
				_id: transaction._id,
				amount: transaction.amount,
				date: transaction.date,
				notes: transaction.notes,
				destinationName: destination?.name ?? "Rubro",
				categoryName: category?.name ?? "Categoría",
				accountName: account?.name ?? "Cuenta",
			});
		}
		return enriched;
	},
});

export const spendFromFund = mutation({
	args: {
		creditId: v.id("credits"),
		destinationId: v.id("creditDestinations"),
		amount: v.number(),
		expenseAccountId: v.optional(v.id("accounts")),
		categoryId: v.id("categories"),
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		return await executeSpendFromFund(ctx, userId, args);
	},
});

export const updateManualRow = mutation({
	args: {
		paymentId: v.id("creditPayments"),
		totalAmount: v.optional(v.number()),
		principal: v.optional(v.number()),
		interest: v.optional(v.number()),
		insuranceAmount: v.optional(v.number()),
		otherFees: v.optional(v.number()),
		dueDate: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const payment = await ctx.db.get(args.paymentId);
		if (!payment) throw new Error("Payment not found");
		const credit = await requireCreditOwnership(ctx, userId, payment.creditId);
		if (credit.scheduleMode !== "manual") {
			throw new Error("Only manual schedule rows can be edited");
		}
		if (payment.status === "paid" || payment.status === "cancelled") {
			throw new Error("Cannot edit paid or cancelled payment");
		}

		let principal: number;
		let interest: number;
		let insurance: number;
		let fees: number;

		if (args.totalAmount !== undefined) {
			const total = validatePositiveCopAmount(args.totalAmount);
			principal = total;
			interest = 0;
			insurance = 0;
			fees = 0;
		} else if (args.principal !== undefined && args.interest !== undefined) {
			principal = validatePositiveCopAmount(args.principal);
			interest = args.interest < 0 ? 0 : Math.round(args.interest);
			insurance = args.insuranceAmount ?? payment.insuranceAmount ?? 0;
			fees = args.otherFees ?? payment.otherFees ?? 0;
		} else {
			throw new Error("Provide totalAmount or principal and interest");
		}

		await ctx.db.patch(args.paymentId, {
			principal,
			interest,
			insuranceAmount: insurance,
			otherFees: fees,
			totalDue: principal + interest + insurance + fees,
			dueDate: args.dueDate ?? payment.dueDate,
			isProjected: false,
			updatedAt: Date.now(),
		});
		return null;
	},
});

export const ensurePaymentSchedule = mutation({
	args: { creditId: v.id("credits") },
	handler: async (ctx, { creditId }) => {
		const userId = await requireUserId(ctx);
		const credit = await requireCreditOwnership(ctx, userId, creditId);

		if (credit.status === "paid_off" || credit.outstandingBalance <= 0) {
			return { generated: 0, reason: "paid_off" as const };
		}

		const all = await ctx.db
			.query("creditPayments")
			.withIndex("by_credit", (q) => q.eq("creditId", creditId))
			.collect();
		const active = all.filter((p) => p.status !== "cancelled");
		if (active.length > 0) {
			return { generated: 0, reason: "exists" as const };
		}

		if (credit.scheduleMode === "manual") {
			const schedule = generateManualScheduleSkeleton({
				startDate: credit.startDate,
				paymentDay: credit.paymentDay,
				termMonths: credit.termMonths,
				insuranceMonthly: credit.insuranceMonthly,
			});
			if (schedule.length === 0) {
				return { generated: 0, reason: "empty" as const };
			}
			await insertGeneratedPayments(ctx, creditId, schedule, false);
			return { generated: schedule.length, reason: "created" as const };
		}

		const paidCount = all.filter((p) => p.status === "paid").length;
		const allDueDates = generateDueDates(
			credit.startDate,
			credit.paymentDay,
			credit.termMonths,
		);
		const dueDates = allDueDates.slice(paidCount);
		if (dueDates.length === 0) {
			return { generated: 0, reason: "no_dates" as const };
		}

		const monthlyRate = toMonthlyRate(credit.rateType, credit.interestRate);
		const fixedInstallment =
			credit.fixedInstallment ??
			resolveFixedInstallmentForCredit({
				principal: credit.outstandingBalance,
				monthlyRate,
				termMonths: dueDates.length,
				scheduleMode: credit.scheduleMode,
			});

		let schedule;
		if (credit.scheduleMode === "capital_constant") {
			schedule = generateScheduleCapitalConstant({
				outstandingBalance: credit.outstandingBalance,
				monthlyRate,
				termMonths: dueDates.length,
				dueDates,
				insuranceMonthly: credit.insuranceMonthly,
				startInstallmentNumber: paidCount + 1,
			});
		} else {
			schedule = generateScheduleCuotaFija({
				outstandingBalance: credit.outstandingBalance,
				monthlyRate,
				dueDates,
				insuranceMonthly: credit.insuranceMonthly,
				fixedInstallment,
				startInstallmentNumber: paidCount + 1,
			});
		}

		if (schedule.length === 0) {
			return { generated: 0, reason: "empty" as const };
		}

		await insertGeneratedPayments(ctx, creditId, schedule, true);
		return { generated: schedule.length, reason: "created" as const };
	},
});

export const addManualPaymentRow = mutation({
	args: {
		creditId: v.id("credits"),
		dueDate: v.number(),
		principal: v.number(),
		interest: v.number(),
		insuranceAmount: v.optional(v.number()),
		otherFees: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const credit = await requireCreditOwnership(ctx, userId, args.creditId);
		if (credit.scheduleMode !== "manual") {
			throw new Error("Credit is not in manual mode");
		}
		const existing = await ctx.db
			.query("creditPayments")
			.withIndex("by_credit", (q) => q.eq("creditId", args.creditId))
			.collect();
		const maxNum = existing.reduce(
			(max, p) => Math.max(max, p.installmentNumber),
			0,
		);
		const principal = validatePositiveCopAmount(args.principal);
		const interest = validatePositiveCopAmount(args.interest);
		const insurance = args.insuranceAmount ?? 0;
		const fees = args.otherFees ?? 0;
		const now = Date.now();

		return await ctx.db.insert("creditPayments", {
			creditId: args.creditId,
			installmentNumber: maxNum + 1,
			dueDate: args.dueDate,
			principal,
			interest,
			insuranceAmount: insurance,
			otherFees: fees,
			totalDue: principal + interest + insurance + fees,
			status: "pending",
			isProjected: false,
			createdAt: now,
			updatedAt: now,
		});
	},
});

export const processReminders = internalMutation({
	args: {},
	handler: async (ctx) => {
		const credits = await ctx.db.query("credits").collect();
		const now = Date.now();
		const todayKey = dateKeyFromTimestamp(now);

		for (const credit of credits) {
			if (credit.status !== "active") continue;
			const payments = await ctx.db
				.query("creditPayments")
				.withIndex("by_credit_status", (q) =>
					q.eq("creditId", credit._id).eq("status", "pending"),
				)
				.collect();

			for (const payment of payments) {
				const dueStart = new Date(payment.dueDate);
				dueStart.setHours(0, 0, 0, 0);
				const daysUntilDue = Math.round(
					(dueStart.getTime() - now) / (24 * 60 * 60 * 1000),
				);

				for (const offset of credit.reminderOffsets) {
					if (daysUntilDue !== offset) continue;
					const refId = `${credit._id}:${payment._id}:${offset}`;
					await ctx.scheduler.runAfter(0, internal.notifications.dispatch, {
						userId: credit.userId,
						type: "credit_due" as const,
						referenceId: refId,
						channels: ["in_app", "push"],
						payload: {
							title: `Cuota crédito: ${credit.name}`,
							body: `Cuota #${payment.installmentNumber} vence ${offset === 0 ? "hoy" : `en ${offset} días`} — ${payment.totalDue.toLocaleString("es-CO")} COP`,
							url: `/credits/${credit._id}`,
						},
						dateKey: todayKey,
					});
				}
			}
		}
		return null;
	},
});

export async function applyAbonoRecalc(
	ctx: MutationCtx,
	credit: Doc<"credits">,
	abonoAmount: number,
	recalcEffect: Doc<"credits">["defaultRecalcOnAbono"],
) {
	const newBalance = Math.max(0, credit.outstandingBalance - abonoAmount);
	const pending = await ctx.db
		.query("creditPayments")
		.withIndex("by_credit", (q) => q.eq("creditId", credit._id))
		.collect();
	const pendingRows = pending
		.filter((p) => p.status === "pending" || p.status === "overdue")
		.sort((a, b) => a.installmentNumber - b.installmentNumber);

	const startInstallment =
		pendingRows[0]?.installmentNumber ??
		pending.filter((p) => p.status === "paid").length + 1;
	const dueDates = pendingRows.map((p) => p.dueDate);
	if (dueDates.length === 0 && newBalance > 0) {
		const remainingMonths = Math.max(
			1,
			credit.termMonths - pending.filter((p) => p.status === "paid").length,
		);
		dueDates.push(
			...generateDueDates(
				Date.now(),
				credit.paymentDay,
				remainingMonths,
			),
		);
	}

	await cancelPendingPayments(ctx, credit._id);

	if (newBalance <= 0) {
		await ctx.db.patch(credit._id, {
			outstandingBalance: 0,
			status: "paid_off",
			updatedAt: Date.now(),
		});
		return;
	}

	const monthlyRate = toMonthlyRate(credit.rateType, credit.interestRate);
	const fixedInstallment =
		credit.fixedInstallment ??
		resolveFixedInstallmentForCredit({
			principal: credit.outstandingBalance,
			monthlyRate,
			termMonths: credit.termMonths,
			scheduleMode: credit.scheduleMode,
		});

	const rows = recalcAfterAbono(recalcEffect, {
		outstandingBalance: newBalance,
		monthlyRate,
		fixedInstallment,
		insuranceMonthly: credit.insuranceMonthly ?? 0,
		dueDates,
		scheduleMode: credit.scheduleMode,
		startInstallmentNumber: startInstallment,
	});

	await insertGeneratedPayments(ctx, credit._id, rows, true);

	const paidCount = pending.filter((p) => p.status === "paid").length;
	const patch: Record<string, unknown> = {
		outstandingBalance: newBalance,
		status: "active",
		termMonths: paidCount + rows.length,
		updatedAt: Date.now(),
	};

	if (
		recalcEffect === "lower_installment" &&
		rows.length > 0 &&
		credit.scheduleMode !== "capital_constant"
	) {
		patch.fixedInstallment = rows[0].principal + rows[0].interest;
	}

	await ctx.db.patch(credit._id, patch);
}
