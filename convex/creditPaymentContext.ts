import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireCategoryOwnership, requireCreditOwnership, requireUserId } from "./lib/auth";
import { markOverdueStatus } from "./lib/creditDates";
import { resolveCreditPaymentAccountId } from "./lib/creditPaymentRegistration";

export const getContextForCategory = query({
	args: { categoryId: v.id("categories") },
	handler: async (ctx, { categoryId }) => {
		const userId = await requireUserId(ctx);
		const category = await requireCategoryOwnership(ctx, userId, categoryId);
		if (!category.linkedCreditId) return null;
		if (
			category.linkedCreditPurpose &&
			category.linkedCreditPurpose !== "payment"
		) {
			return null;
		}

		const credit = await requireCreditOwnership(
			ctx,
			userId,
			category.linkedCreditId,
		);
		if (
			credit.paymentCategoryId &&
			category._id !== credit.paymentCategoryId
		) {
			return null;
		}
		const paymentAccountId = resolveCreditPaymentAccountId(credit);
		if (!paymentAccountId) return null;

		const now = Date.now();
		const monthStart = new Date(now);
		monthStart.setDate(1);
		monthStart.setHours(0, 0, 0, 0);
		const monthEnd = new Date(
			monthStart.getFullYear(),
			monthStart.getMonth() + 1,
			0,
			23,
			59,
			59,
			999,
		);

		const payments = await ctx.db
			.query("creditPayments")
			.withIndex("by_credit", (q) => q.eq("creditId", credit._id))
			.collect();

		const payable = payments
			.filter((p) => p.status !== "cancelled" && p.status !== "paid")
			.map((p) => ({
				...p,
				status: markOverdueStatus(p.status, p.dueDate, now),
			}))
			.filter((p) => p.status === "pending" || p.status === "overdue")
			.sort((a, b) => a.installmentNumber - b.installmentNumber);

		const defaultPayment =
			payable.find(
				(p) =>
					p.dueDate >= monthStart.getTime() &&
					p.dueDate <= monthEnd.getTime(),
			) ?? payable[0];

		return {
			creditId: credit._id,
			creditName: credit.name,
			paymentAccountId,
			defaultPaymentId: defaultPayment?._id,
			payableInstallments: payable.map((p) => ({
				_id: p._id,
				installmentNumber: p.installmentNumber,
				dueDate: p.dueDate,
				totalDue: p.totalDue,
				status: p.status,
			})),
		};
	},
});
