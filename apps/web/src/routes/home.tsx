import { CreditFundCard } from "@app/components/credits/CreditFundCard";
import { DashboardBalanceCard } from "@app/components/dashboard/DashboardBalanceCard";
import { DashboardBudgetAlerts } from "@app/components/dashboard/DashboardBudgetAlerts";
import { DashboardFixedExpenses } from "@app/components/dashboard/DashboardFixedExpenses";
import type { UpcomingFixedExpenseItem } from "@app/components/dashboard/DashboardFixedExpenses";
import { MarkFixedExpensePaidModal } from "@app/components/budgets/MarkFixedExpensePaidModal";
import { MetricCard } from "@app/components/dashboard/MetricCard";
import { MonthOverview } from "@app/components/dashboard/MonthOverview";
import { PeriodSwitcher } from "@app/components/dashboard/PeriodSwitcher";
import { RecentTransactionsList } from "@app/components/dashboard/RecentTransactionsList";
import { EmptyState } from "@app/components/ui/EmptyState";
import { useAuth } from "@app/lib/auth/useAuth";
import { BrandLogoMark } from "@app/components/brand/BrandLogoMark";
import { ACCOUNT_TYPE_LABELS, CoreIcon } from "@app/lib/core/icons";
import { formatCOP } from "@app/lib/format/currency";
import { formatMonthYear } from "@app/lib/format/date";
import { useRecentListLimit } from "@app/lib/dashboard/useRecentListLimit";
import { useFixedExpensePayment } from "@app/lib/budgets/useFixedExpensePayment";
import { useReconcileFixedExpensePayments } from "@app/lib/budgets/useReconcileFixedExpensePayments";
import {
	addPeriod,
	dashboardSubtitle,
	periodKeyFromDate,
	periodNetLabel,
	periodRange,
} from "@app/lib/period";
import type { BudgetItem } from "@app/lib/budgets/types";
import { MEDIA_DESKTOP } from "@app/lib/core/breakpoints";
import { useMediaQuery } from "@app/lib/core/useMediaQuery";
import { usePreferencesStore } from "@app/stores/preferences";
import { api } from "@convex/_generated/api";
import { Avatar } from "@jp-ds";
import { useQuery } from "convex/react";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";

export function HomeRoute() {
	const navigate = useNavigate();
	useReconcileFixedExpensePayments();
	const { session } = useAuth();
	const defaultGrouping = usePreferencesStore((s) => s.defaultGrouping);
	const [anchor, setAnchor] = useState(() => new Date());
	const range = periodRange(defaultGrouping, anchor);
	const dashboardMainRef = useRef<HTMLDivElement>(null);
	const isDesktop = useMediaQuery(MEDIA_DESKTOP);
	const recentLimit = useRecentListLimit(dashboardMainRef, isDesktop);
	const fixedPayment = useFixedExpensePayment();

	const overview = useQuery(api.dashboard.overview, {
		periodStart: range.start,
		periodEnd: range.end,
		recentLimit,
	});
	const periodKey = periodKeyFromDate(anchor);
	const atRiskBudgets = useQuery(api.budgets.listAtRisk, { periodKey, limit: 3 });
	const upcomingFixed = useQuery(api.fixedExpenses.listUpcomingForPeriod, {
		periodStart: range.start,
		periodEnd: range.end,
		limit: 3,
	});

	const firstName = session?.name?.split(" ")[0] ?? "";

	if (overview === undefined || upcomingFixed === undefined) {
		return null;
	}

	if (overview.activeAccounts.length === 0) {
		return (
			<div className="animate-stagger">
				<h1 className="page-title animate-stagger-item">Inicio</h1>
				<EmptyState
					title="Empieza creando una cuenta"
					description="Necesitas al menos una cuenta para ver tu balance y registrar movimientos."
					actionLabel="Crear cuenta"
					onAction={() => navigate("/accounts")}
					icon={<CoreIcon name="wallet" size={32} />}
				/>
			</div>
		);
	}

	const net = overview.monthlyIncome - overview.monthlyExpense;
	const pendingFixedExpenses = upcomingFixed.pendingTotal;

	return (
		<div className="dashboard-page animate-stagger">
			<header className="dash-greeting show-mobile animate-stagger-item">
				<div className="dash-greeting__brand">
					<BrandLogoMark
						size={30}
						height={28}
						className="brand-logo-mark--greeting"
					/>
					<span className="dash-greeting__hi">Hola, {firstName}</span>
				</div>
				<Link to="/settings" aria-label="Perfil">
					<Avatar src={session?.picture} alt="" name={session?.name} />
				</Link>
			</header>

			<div className="dash-header show-desktop animate-stagger-item">
				<div className="dash-header__brand">
					<BrandLogoMark size={42} />
					<div>
						<h1 className="page-title">Inicio</h1>
						<p className="page-subtitle">
							{dashboardSubtitle(defaultGrouping)}
						</p>
					</div>
				</div>
				<PeriodSwitcher
					grouping={defaultGrouping}
					anchor={anchor}
					onPrev={() => setAnchor((a) => addPeriod(defaultGrouping, a, -1))}
					onNext={() => setAnchor((a) => addPeriod(defaultGrouping, a, 1))}
				/>
			</div>

			<div className="dash-mobile-summary show-mobile animate-stagger-item">
				<DashboardBalanceCard
					totalBalance={overview.totalBalance}
					accountCount={overview.activeAccounts.length}
				/>
				<MonthOverview
					income={overview.monthlyIncome}
					expense={overview.monthlyExpense}
					pendingFixedExpenses={pendingFixedExpenses}
					grouping={defaultGrouping}
					anchor={anchor}
					onPrev={() => setAnchor((a) => addPeriod(defaultGrouping, a, -1))}
					onNext={() => setAnchor((a) => addPeriod(defaultGrouping, a, 1))}
					showSwitcher
				/>
			</div>

			<div className="dash-metrics show-desktop animate-stagger-item">
				<MetricCard label="Balance total" value={overview.totalBalance} />
				<MetricCard
					label="Ingresos"
					value={overview.monthlyIncome}
					tone="income"
				/>
				<MetricCard
					label="Gastos"
					value={overview.monthlyExpense}
					tone="expense"
				/>
				<MetricCard
					label={periodNetLabel(defaultGrouping)}
					value={net}
					signed
					projectedValue={
						pendingFixedExpenses > 0 ? net - pendingFixedExpenses : undefined
					}
				/>
			</div>

			<div className="dashboard-grid">
				<div className="dashboard-main" ref={dashboardMainRef}>
					<RecentTransactionsList
						transactions={overview.recentTransactions}
					/>
				</div>

				<aside className="dashboard-aside">
					{upcomingFixed.items.length > 0 ? (
						<DashboardFixedExpenses
							items={upcomingFixed.items as UpcomingFixedExpenseItem[]}
							onMarkPaid={(item) =>
								fixedPayment.openPayment({
									id: item._id,
									name: item.name,
									amount: item.amount,
									categoryName: item.categoryName,
									dueDate: item.dueDate,
								})
							}
						/>
					) : null}

					{atRiskBudgets && atRiskBudgets.length > 0 ? (
						<DashboardBudgetAlerts
							items={atRiskBudgets as BudgetItem[]}
							periodLabel={formatMonthYear(anchor)}
						/>
					) : null}

					{overview.creditFundCards &&
					overview.creditFundCards.length > 0 ? (
						<section
							className="dash-credits glass"
							aria-label="Créditos activos"
						>
							<div className="section-header">
								<h2 className="section-title">Créditos</h2>
								<Link to="/credits" className="link-accent show-desktop">
									Ver todos
								</Link>
							</div>
							<ul className="dash-credits__list">
								{overview.creditFundCards.map((card) => (
									<li key={card.creditId}>
										<CreditFundCard {...card} />
									</li>
								))}
							</ul>
						</section>
					) : null}

					<section
						className="accounts-compact accounts-compact--scroll glass"
						aria-label="Cuentas activas"
					>
						<div className="section-header">
							<h2 className="section-title">Cuentas</h2>
							<Link to="/accounts" className="link-accent show-desktop">
								Ver todas
							</Link>
						</div>
						<div className="accounts-compact__grid">
							{overview.activeAccounts.map((account) => (
								<div key={account._id} className="account-compact">
									<span className="account-compact__name">{account.name}</span>
									<span className="account-compact__type">
										{ACCOUNT_TYPE_LABELS[account.type]}
									</span>
									<span
										className={`amount account-compact__balance${account.balance < 0 ? " amount--negative" : ""}`}
									>
										{formatCOP(account.balance)}
									</span>
								</div>
							))}
						</div>
					</section>
				</aside>
			</div>

			<MarkFixedExpensePaidModal
				open={fixedPayment.paymentOpen}
				target={fixedPayment.target}
				accounts={fixedPayment.accounts}
				loading={fixedPayment.loading}
				error={fixedPayment.error}
				onClose={fixedPayment.closePayment}
				onConfirm={fixedPayment.confirmPayment}
			/>
		</div>
	);
}
