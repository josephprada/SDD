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
import { dateKeyFromTimestamp, generateDueDates, markOverdueStatus, resolvePaymentDate } from "./lib/creditDates";
import {
	createCreditDisbursementCategory,
	createCreditPaymentCategory,
	deleteCategoriesLinkedToCredit,
	syncFundExpenseCategories,
	unlinkFundExpenseCategory,
} from "./lib/creditCategories";
import {
	createLinkedCreditFixedExpense,
	deleteLinkedCreditFixedExpense,
	resolveCreditInstallmentAmount,
	syncLinkedCreditFixedExpense,
} from "./lib/creditFixedExpense";
import {
	applyPaymentTotalOverride,
	canEditPendingPaymentAmount,
} from "./lib/creditPaymentEdit";
import { executeSpendFromFund } from "./lib/creditFundSpend";
import {
	insertCreditLinkedTransaction,
	removeCreditLinkedTransaction,
} from "./lib/creditTransactions";
import { syncDisbursementAccountIsolation } from "./lib/personalFinance";
import { resolveFixedInstallmentForCredit, recalcAfterAbono, resolveShortenTermBaseline } from "./lib/creditRecalc";
import {
	buildScheduleForCredit,
	cancelPendingPayments,
	generateManualScheduleSkeleton,
	insertGeneratedPayments,
	rebuildPendingSchedule,
	resolveInProgressCreditSchedule,
	sumDestinationAllocated,
} from "./lib/creditsHelpers";
import {
	getMissingScheduleFields,
	hasMinimumScheduleFields,
	inferCreditProfile,
	isDraftCredit,
} from "./lib/creditProfile";
import {
	abonoRecalcEffectValidator,
	creditProfileValidator,
	informalAgreementValidator,
	linkedAssetValidator,
	rateTypeValidator,
	scheduleModeValidator,
	validateCreditName,
	validateCreditNotes,
	validateDayOfMonth,
	validateInterestRate,
	validateOptionalCreditLender,
	validatePaidInstallmentsCount,
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
				creditProfile: inferCreditProfile(credit),
				setupStatus: credit.setupStatus ?? "active",
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
			creditProfile: inferCreditProfile(credit),
			setupStatus: credit.setupStatus ?? "active",
			missingFields: getMissingScheduleFields(credit),
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
		creditProfile: v.optional(creditProfileValidator),
		lender: v.optional(v.string()),
		principal: v.optional(v.number()),
		rateType: v.optional(rateTypeValidator),
		interestRate: v.optional(v.number()),
		termMonths: v.optional(v.number()),
		startDate: v.optional(v.number()),
		paymentDay: v.optional(v.number()),
		scheduleMode: v.optional(scheduleModeValidator),
		fixedInstallment: v.optional(v.number()),
		insuranceMonthly: v.optional(v.number()),
		disbursementAccountId: v.optional(v.id("accounts")),
		paymentAccountId: v.optional(v.id("accounts")),
		registerDisbursementIncome: v.optional(v.boolean()),
		alreadyInProgress: v.optional(v.boolean()),
		paidInstallmentsCount: v.optional(v.number()),
		trackRemainingOnly: v.optional(v.boolean()),
		outstandingBalance: v.optional(v.number()),
		fundExpenseCategoryIds: v.optional(v.array(v.id("categories"))),
		newFundExpenseCategoryNames: v.optional(v.array(v.string())),
		linkedAsset: v.optional(linkedAssetValidator),
		informalAgreement: v.optional(informalAgreementValidator),
		targetPayoffDate: v.optional(v.number()),
		defaultRecalcOnAbono: v.optional(abonoRecalcEffectValidator),
		reminderOffsets: v.optional(v.array(v.number())),
		notes: v.optional(v.string()),
		createFixedExpense: v.optional(v.boolean()),
		fixedExpenseMonthlyAmount: v.optional(v.number()),
		excludeFromPersonalFinance: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const name = validateCreditName(args.name);
		const lender = validateOptionalCreditLender(args.lender);
		const notes = validateCreditNotes(args.notes);
		const reminderOffsets = validateReminderOffsets(
			args.reminderOffsets ?? [3, 0],
		);
		const creditProfile = args.creditProfile ?? "free_purpose";
		const excludeFromPersonalFinance = args.excludeFromPersonalFinance ?? true;
		const now = Date.now();
		const today = new Date();
		const startDate =
			args.startDate ??
			resolvePaymentDate(
				today.getFullYear(),
				today.getMonth(),
				today.getDate(),
			).getTime();

		if (args.paymentAccountId) {
			await requireAccountOwnership(ctx, userId, args.paymentAccountId);
		}
		if (args.disbursementAccountId) {
			await requireAccountOwnership(ctx, userId, args.disbursementAccountId);
		}

		const draftCandidate = {
			principal: args.principal,
			rateType: args.rateType,
			interestRate: args.interestRate,
			termMonths: args.termMonths,
			paymentDay: args.paymentDay,
			scheduleMode: args.scheduleMode,
		};
		const canGenerateSchedule = hasMinimumScheduleFields(draftCandidate);

		const principal = canGenerateSchedule
			? validatePositiveCopAmount(args.principal!)
			: (args.principal ?? 0);
		const interestRate = canGenerateSchedule
			? validateInterestRate(args.interestRate!)
			: (args.interestRate ?? 0);
		const termMonths = canGenerateSchedule
			? validateTermMonths(args.termMonths!)
			: (args.termMonths ?? 0);
		const paymentDay = canGenerateSchedule
			? validateDayOfMonth(args.paymentDay!)
			: (args.paymentDay ?? 1);
		const scheduleMode = args.scheduleMode ?? "cuota_fija";
		const rateType = args.rateType ?? "MV";

		if (!canGenerateSchedule) {
			const creditId = await ctx.db.insert("credits", {
				userId,
				name,
				creditProfile,
				setupStatus: "draft",
				lender,
				principal,
				rateType,
				interestRate,
				termMonths,
				startDate,
				paymentDay,
				scheduleMode,
				defaultRecalcOnAbono: args.defaultRecalcOnAbono ?? "shorten_term",
				targetPayoffDate: args.targetPayoffDate,
				insuranceMonthly: args.insuranceMonthly,
				disbursementAccountId: args.disbursementAccountId,
				operatingAccountId: args.paymentAccountId,
				linkedAsset: args.linkedAsset,
				informalAgreement: args.informalAgreement,
				outstandingBalance: 0,
				excludeFromPersonalFinance,
				reminderOffsets,
				status: "active",
				notes,
				createdAt: now,
				updatedAt: now,
			});

			if (args.disbursementAccountId) {
				await syncDisbursementAccountIsolation(
					ctx,
					args.disbursementAccountId,
					excludeFromPersonalFinance,
				);
			}

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
		}

		const monthlyRate = toMonthlyRate(rateType, interestRate);
		const fixedInstallment =
			scheduleMode === "manual"
				? args.fixedInstallment
				: resolveFixedInstallmentForCredit({
						principal,
						monthlyRate,
						termMonths,
						scheduleMode,
						fixedInstallment: args.fixedInstallment,
					});

		const inProgress = args.alreadyInProgress === true;
		const paidInstallmentsCount = inProgress
			? validatePaidInstallmentsCount(
					args.paidInstallmentsCount ?? 0,
					termMonths,
				)
			: 0;
		const trackRemainingOnly = inProgress
			? (args.trackRemainingOnly ?? true)
			: false;

		if (
			inProgress &&
			scheduleMode === "manual" &&
			args.outstandingBalance === undefined
		) {
			throw new Error(
				"Indica el saldo capital pendiente para un crédito manual ya en marcha",
			);
		}

		const outstandingBalanceOverride =
			inProgress && args.outstandingBalance !== undefined
				? validatePositiveCopAmount(args.outstandingBalance)
				: undefined;

		const initialOutstandingBalance = inProgress
			? resolveInProgressCreditSchedule({
					principal,
					rateType,
					interestRate,
					termMonths,
					startDate,
					paymentDay,
					scheduleMode,
					fixedInstallment,
					insuranceMonthly: args.insuranceMonthly,
					paidInstallmentsCount,
					trackRemainingOnly,
					outstandingBalanceOverride,
				}).outstandingBalance
			: principal;

		const creditId = await ctx.db.insert("credits", {
			userId,
			name,
			creditProfile,
			setupStatus: "active",
			lender,
			principal,
			rateType,
			interestRate,
			termMonths,
			startDate,
			paymentDay,
			scheduleMode,
			fixedInstallment,
			defaultRecalcOnAbono: args.defaultRecalcOnAbono ?? "shorten_term",
			targetPayoffDate: args.targetPayoffDate,
			insuranceMonthly: args.insuranceMonthly,
			disbursementAccountId: args.disbursementAccountId,
			operatingAccountId: args.paymentAccountId,
			linkedAsset: args.linkedAsset,
			informalAgreement: args.informalAgreement,
			outstandingBalance: initialOutstandingBalance,
			excludeFromPersonalFinance,
			reminderOffsets,
			status: "active",
			notes,
			createdAt: now,
			updatedAt: now,
		});

		if (inProgress) {
			const resolved = resolveInProgressCreditSchedule({
				principal,
				rateType,
				interestRate,
				termMonths,
				startDate,
				paymentDay,
				scheduleMode,
				fixedInstallment,
				insuranceMonthly: args.insuranceMonthly,
				paidInstallmentsCount,
				trackRemainingOnly,
				outstandingBalanceOverride,
			});
			await insertGeneratedPayments(
				ctx,
				creditId,
				resolved.schedule,
				resolved.isProjected,
				{ markFirstPaidCount: resolved.markFirstPaidCount },
			);
		} else if (scheduleMode === "manual") {
			const schedule = generateManualScheduleSkeleton({
				startDate,
				paymentDay,
				termMonths,
				insuranceMonthly: args.insuranceMonthly,
			});
			await insertGeneratedPayments(ctx, creditId, schedule, false);
		} else {
			const schedule = buildScheduleForCredit({
				principal,
				rateType,
				interestRate,
				termMonths,
				startDate,
				paymentDay,
				scheduleMode,
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

		if (args.registerDisbursementIncome && !inProgress && args.disbursementAccountId) {
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
					date: startDate,
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

		if (args.createFixedExpense) {
			const creditDoc = await ctx.db.get(creditId);
			if (!creditDoc?.paymentCategoryId) {
				throw new Error(
					"No se pudo crear el gasto fijo: falta la categoría de cuota",
				);
			}
			const installmentAmount =
				args.fixedExpenseMonthlyAmount !== undefined
					? validatePositiveCopAmount(args.fixedExpenseMonthlyAmount)
					: await resolveCreditInstallmentAmount(ctx, creditId, {
							fixedInstallment,
							scheduleMode,
						});
			await createLinkedCreditFixedExpense(
				ctx,
				userId,
				creditId,
				creditDoc,
				creditDoc.paymentCategoryId,
				installmentAmount,
			);
		}

		await syncDisbursementAccountIsolation(
			ctx,
			args.disbursementAccountId,
			excludeFromPersonalFinance,
		);

		return creditId;
	},
});

export const update = mutation({
	args: {
		creditId: v.id("credits"),
		name: v.optional(v.string()),
		lender: v.optional(v.string()),
		notes: v.optional(v.string()),
		creditProfile: v.optional(creditProfileValidator),
		principal: v.optional(v.number()),
		rateType: v.optional(rateTypeValidator),
		interestRate: v.optional(v.number()),
		termMonths: v.optional(v.number()),
		paymentDay: v.optional(v.number()),
		scheduleMode: v.optional(scheduleModeValidator),
		insuranceMonthly: v.optional(v.number()),
		startDate: v.optional(v.number()),
		outstandingBalance: v.optional(v.number()),
		fixedInstallment: v.optional(v.number()),
		clearFixedInstallment: v.optional(v.boolean()),
		linkedAsset: v.optional(linkedAssetValidator),
		informalAgreement: v.optional(informalAgreementValidator),
		clearLinkedAsset: v.optional(v.boolean()),
		clearInformalAgreement: v.optional(v.boolean()),
		targetPayoffDate: v.optional(v.number()),
		clearTargetPayoffDate: v.optional(v.boolean()),
		defaultRecalcOnAbono: v.optional(abonoRecalcEffectValidator),
		disbursementAccountId: v.optional(v.id("accounts")),
		operatingAccountId: v.optional(v.id("accounts")),
		clearDisbursementAccount: v.optional(v.boolean()),
		clearOperatingAccount: v.optional(v.boolean()),
		fundExpenseCategoryIds: v.optional(v.array(v.id("categories"))),
		newFundExpenseCategoryNames: v.optional(v.array(v.string())),
		excludeFromPersonalFinance: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const credit = await requireCreditOwnership(ctx, userId, args.creditId);
		const now = Date.now();
		const patch: Record<string, unknown> = { updatedAt: now };

		if (args.excludeFromPersonalFinance !== undefined) {
			patch.excludeFromPersonalFinance = args.excludeFromPersonalFinance;
		}

		if (args.name !== undefined) patch.name = validateCreditName(args.name);
		if (args.lender !== undefined) {
			patch.lender = validateOptionalCreditLender(args.lender);
		}
		if (args.notes !== undefined) patch.notes = validateCreditNotes(args.notes);
		if (args.creditProfile !== undefined) patch.creditProfile = args.creditProfile;
		if (args.principal !== undefined) {
			patch.principal =
				args.principal > 0
					? validatePositiveCopAmount(args.principal)
					: 0;
			patch.outstandingBalance =
				credit.setupStatus === "draft" || credit.setupStatus === "ready"
					? (args.principal > 0 ? args.principal : 0)
					: credit.outstandingBalance;
		}
		if (args.rateType !== undefined) patch.rateType = args.rateType;
		if (args.interestRate !== undefined) {
			patch.interestRate = validateInterestRate(args.interestRate);
		}
		if (args.termMonths !== undefined) {
			patch.termMonths =
				args.termMonths > 0 ? validateTermMonths(args.termMonths) : 0;
		}
		if (args.paymentDay !== undefined) {
			patch.paymentDay = validateDayOfMonth(args.paymentDay);
		}
		if (args.scheduleMode !== undefined) patch.scheduleMode = args.scheduleMode;
		if (args.insuranceMonthly !== undefined) {
			patch.insuranceMonthly = args.insuranceMonthly;
		}
		if (args.startDate !== undefined) patch.startDate = args.startDate;
		if (args.outstandingBalance !== undefined) {
			patch.outstandingBalance =
				args.outstandingBalance > 0
					? validatePositiveCopAmount(args.outstandingBalance)
					: 0;
		}
		if (args.clearFixedInstallment) patch.fixedInstallment = undefined;
		else if (args.fixedInstallment !== undefined) {
			patch.fixedInstallment =
				args.fixedInstallment > 0
					? validatePositiveCopAmount(args.fixedInstallment)
					: undefined;
		}
		if (args.clearLinkedAsset) patch.linkedAsset = undefined;
		else if (args.linkedAsset !== undefined) patch.linkedAsset = args.linkedAsset;
		if (args.clearInformalAgreement) patch.informalAgreement = undefined;
		else if (args.informalAgreement !== undefined) {
			patch.informalAgreement = args.informalAgreement;
		}
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

		const scheduleFieldsChanged =
			args.principal !== undefined ||
			args.rateType !== undefined ||
			args.interestRate !== undefined ||
			args.termMonths !== undefined ||
			args.paymentDay !== undefined ||
			args.scheduleMode !== undefined ||
			args.startDate !== undefined ||
			args.insuranceMonthly !== undefined ||
			args.outstandingBalance !== undefined ||
			args.fixedInstallment !== undefined ||
			args.clearFixedInstallment === true;

		const merged = { ...credit, ...patch } as Doc<"credits">;
		const payments = await ctx.db
			.query("creditPayments")
			.withIndex("by_credit", (q) => q.eq("creditId", args.creditId))
			.collect();
		const hasPayments = payments.some((p) => p.status !== "cancelled");
		if (!hasPayments) {
			patch.setupStatus = hasMinimumScheduleFields(merged) ? "ready" : "draft";
		}

		await ctx.db.patch(args.creditId, patch);

		const isolationFlag =
			(patch.excludeFromPersonalFinance as boolean | undefined) ??
			credit.excludeFromPersonalFinance ??
			true;
		const nextDisbursementId = args.clearDisbursementAccount
			? undefined
			: ((patch.disbursementAccountId as Id<"accounts"> | undefined) ??
				credit.disbursementAccountId);
		if (nextDisbursementId) {
			await syncDisbursementAccountIsolation(
				ctx,
				nextDisbursementId,
				isolationFlag !== false,
			);
		}

		if (scheduleFieldsChanged && hasMinimumScheduleFields(merged)) {
			const updated = { ...credit, ...patch } as Doc<"credits">;
			const { regenerated } = await rebuildPendingSchedule(ctx, updated);
			const schedulePatch: Record<string, unknown> = {
				updatedAt: Date.now(),
			};
			if (regenerated > 0 || !hasPayments) {
				schedulePatch.setupStatus = "active";
				if (updated.status !== "paid_off") {
					schedulePatch.status = "active";
				}
			}
			await ctx.db.patch(args.creditId, schedulePatch);

			if (regenerated > 0 && !credit.paymentCategoryId) {
				const paymentCategoryId = await createCreditPaymentCategory(
					ctx,
					userId,
					args.creditId,
					(updated.name as string) ?? credit.name,
				);
				await ctx.db.patch(args.creditId, {
					paymentCategoryId,
					updatedAt: Date.now(),
				});
			}

			const syncedCredit = await ctx.db.get(args.creditId);
			if (syncedCredit) {
				await syncLinkedCreditFixedExpense(ctx, args.creditId, syncedCredit);
			}
		}

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
					excludeFromPersonalFinance: false,
					updatedAt: now,
				});
			}
		}

		return null;
	},
});

export const updateSetupProfile = mutation({
	args: {
		creditId: v.id("credits"),
		creditProfile: creditProfileValidator,
		preserveIncompatibleData: v.boolean(),
	},
	handler: async (ctx, args) => {
		const userId = await requireUserId(ctx);
		const credit = await requireCreditOwnership(ctx, userId, args.creditId);
		const now = Date.now();
		const patch: Record<string, unknown> = {
			creditProfile: args.creditProfile,
			updatedAt: now,
		};

		if (!args.preserveIncompatibleData) {
			if (
				args.creditProfile === "tangible_product" ||
				args.creditProfile === "intangible_service"
			) {
				patch.informalAgreement = undefined;
			} else if (args.creditProfile === "p2p_agreement") {
				patch.linkedAsset = undefined;
			} else {
				patch.linkedAsset = undefined;
				patch.informalAgreement = undefined;
			}
		} else {
			const metadata = {
				...(typeof credit.profileMetadata === "object" &&
				credit.profileMetadata !== null
					? (credit.profileMetadata as Record<string, unknown>)
					: {}),
			};
			if (credit.linkedAsset) metadata.linkedAsset = credit.linkedAsset;
			if (credit.informalAgreement) {
				metadata.informalAgreement = credit.informalAgreement;
			}
			patch.profileMetadata = metadata;
		}

		await ctx.db.patch(args.creditId, patch);
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

		await deleteLinkedCreditFixedExpense(ctx, credit);

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
					excludeFromPersonalFinance: false,
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
		if (!canEditPendingPaymentAmount(credit.scheduleMode)) {
			throw new Error("Este modo de cuotas no permite editar montos");
		}
		if (payment.status === "paid" || payment.status === "cancelled") {
			throw new Error("Cannot edit paid or cancelled payment");
		}

		let principal: number;
		let interest: number;
		let insurance: number;
		let fees: number;
		let totalDue: number;

		if (args.totalAmount !== undefined) {
			const patch = applyPaymentTotalOverride(
				payment,
				validatePositiveCopAmount(args.totalAmount),
				credit.scheduleMode,
			);
			principal = patch.principal;
			interest = patch.interest;
			insurance = patch.insuranceAmount ?? 0;
			fees = patch.otherFees ?? 0;
			totalDue = patch.totalDue;
		} else if (args.principal !== undefined && args.interest !== undefined) {
			principal = validatePositiveCopAmount(args.principal);
			interest = args.interest < 0 ? 0 : Math.round(args.interest);
			insurance = args.insuranceAmount ?? payment.insuranceAmount ?? 0;
			fees = args.otherFees ?? payment.otherFees ?? 0;
			totalDue = principal + interest + insurance + fees;
		} else {
			throw new Error("Provide totalAmount or principal and interest");
		}

		await ctx.db.patch(args.paymentId, {
			principal,
			interest,
			insuranceAmount: insurance,
			otherFees: fees,
			totalDue,
			dueDate: args.dueDate ?? payment.dueDate,
			isProjected: false,
			updatedAt: Date.now(),
		});
		return null;
	},
});

export const updateManualRows = mutation({
	args: {
		paymentIds: v.array(v.id("creditPayments")),
		totalAmount: v.number(),
	},
	handler: async (ctx, { paymentIds, totalAmount }) => {
		const userId = await requireUserId(ctx);
		if (paymentIds.length === 0) {
			throw new Error("Selecciona al menos una cuota");
		}

		const total = validatePositiveCopAmount(totalAmount);
		let creditId: Id<"credits"> | null = null;

		for (const paymentId of paymentIds) {
			const payment = await ctx.db.get(paymentId);
			if (!payment) throw new Error("Payment not found");
			const credit = await requireCreditOwnership(ctx, userId, payment.creditId);
			if (!canEditPendingPaymentAmount(credit.scheduleMode)) {
				throw new Error("Este modo de cuotas no permite editar montos");
			}
			if (payment.status === "paid" || payment.status === "cancelled") {
				throw new Error("Cannot edit paid or cancelled payment");
			}
			if (creditId === null) {
				creditId = credit._id;
			} else if (creditId !== credit._id) {
				throw new Error("All payments must belong to the same credit");
			}

			const patch = applyPaymentTotalOverride(payment, total, credit.scheduleMode);

			await ctx.db.patch(paymentId, {
				...patch,
				isProjected: false,
				updatedAt: Date.now(),
			});
		}

		return { updated: paymentIds.length };
	},
});

export const ensurePaymentSchedule = mutation({
	args: { creditId: v.id("credits") },
	handler: async (ctx, { creditId }) => {
		const userId = await requireUserId(ctx);
		const credit = await requireCreditOwnership(ctx, userId, creditId);

		if (isDraftCredit(credit) || !hasMinimumScheduleFields(credit)) {
			return { generated: 0, reason: "incomplete" as const };
		}

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
			await ctx.db.patch(creditId, {
				setupStatus: "active",
				outstandingBalance:
					credit.outstandingBalance > 0
						? credit.outstandingBalance
						: credit.principal,
				updatedAt: Date.now(),
			});
			if (!credit.paymentCategoryId) {
				const paymentCategoryId = await createCreditPaymentCategory(
					ctx,
					userId,
					creditId,
					credit.name,
				);
				await ctx.db.patch(creditId, {
					paymentCategoryId,
					updatedAt: Date.now(),
				});
			}
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
		await ctx.db.patch(creditId, {
			setupStatus: "active",
			outstandingBalance:
				credit.outstandingBalance > 0
					? credit.outstandingBalance
					: credit.principal,
			updatedAt: Date.now(),
		});
		if (!credit.paymentCategoryId) {
			const paymentCategoryId = await createCreditPaymentCategory(
				ctx,
				userId,
				creditId,
				credit.name,
			);
			await ctx.db.patch(creditId, {
				paymentCategoryId,
				updatedAt: Date.now(),
			});
		}
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
	const shortenBaseline =
		recalcEffect === "shorten_term"
			? resolveShortenTermBaseline({ credit, pendingRows })
			: null;
	const fixedInstallment =
		recalcEffect === "shorten_term"
			? (shortenBaseline?.fixedInstallment ??
				resolveFixedInstallmentForCredit({
					principal: credit.principal,
					monthlyRate,
					termMonths: credit.termMonths,
					scheduleMode: credit.scheduleMode,
					fixedInstallment: credit.fixedInstallment,
				}))
			: (credit.fixedInstallment ??
				resolveFixedInstallmentForCredit({
					principal: credit.outstandingBalance,
					monthlyRate,
					termMonths: credit.termMonths,
					scheduleMode: credit.scheduleMode,
				}));

	const rows = recalcAfterAbono(recalcEffect, {
		outstandingBalance: newBalance,
		monthlyRate,
		fixedInstallment,
		monthlyPrincipal: shortenBaseline?.monthlyPrincipal,
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
