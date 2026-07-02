import { DashboardBalanceCard } from "@app/components/dashboard/DashboardBalanceCard";
import { MetricCard } from "@app/components/dashboard/MetricCard";
import { MonthOverview } from "@app/components/dashboard/MonthOverview";
import { MonthSwitcher } from "@app/components/dashboard/MonthSwitcher";
import { RecentTransactionsList } from "@app/components/dashboard/RecentTransactionsList";
import { EmptyState } from "@app/components/ui/EmptyState";
import { useAuth } from "@app/lib/auth/useAuth";
import { BrandLogoMark } from "@app/components/brand/BrandLogoMark";
import { ACCOUNT_TYPE_LABELS, CoreIcon } from "@app/lib/core/icons";
import { formatCOP } from "@app/lib/format/currency";
import { addMonths, monthRange } from "@app/lib/format/date";
import { useRecentListLimit } from "@app/lib/dashboard/useRecentListLimit";
import { useMediaQuery } from "@app/lib/core/useMediaQuery";
import { api } from "@convex/_generated/api";
import { Avatar, Button } from "@jp-ds";
import { useQuery } from "convex/react";
import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";

export function HomeRoute() {
	const navigate = useNavigate();
	const { session } = useAuth();
	const [month, setMonth] = useState(() => new Date());
	const range = monthRange(month);
	const recentSectionRef = useRef<HTMLElement>(null);
	const isDesktop = useMediaQuery("(min-width: 1024px)");
	const recentLimit = useRecentListLimit(recentSectionRef, isDesktop);

	const overview = useQuery(api.dashboard.overview, {
		monthStart: range.start,
		monthEnd: range.end,
		recentLimit,
	});

	const firstName = session?.name?.split(" ")[0] ?? "";

	if (overview === undefined) {
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

	return (
		<div className="dashboard-page animate-stagger">
			<header className="dash-greeting show-mobile animate-stagger-item">
				<div>
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
							Resumen financiero del mes en curso
						</p>
					</div>
				</div>
				<MonthSwitcher
					month={month}
					onPrev={() => setMonth((m) => addMonths(m, -1))}
					onNext={() => setMonth((m) => addMonths(m, 1))}
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
					month={month}
					onPrev={() => setMonth((m) => addMonths(m, -1))}
					onNext={() => setMonth((m) => addMonths(m, 1))}
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
				<MetricCard label="Neto del mes" value={net} signed />
			</div>

			<div className="dashboard-grid">
				<div className="dashboard-main">
					<RecentTransactionsList
						ref={recentSectionRef}
						transactions={overview.recentTransactions}
					/>
				</div>

				<aside className="dashboard-aside">
					<section
						className="accounts-compact glass"
						aria-label="Cuentas activas"
					>
						<div className="section-header">
							<h2 className="section-title">Cuentas</h2>
							<Link to="/accounts" className="link-accent">
								Ver todas
							</Link>
						</div>
						<div className="accounts-compact__grid">
							{overview.activeAccounts.map((account) => (
								<div key={account._id} className="account-compact glass">
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

					<div className="show-desktop">
						<MonthOverview
							income={overview.monthlyIncome}
							expense={overview.monthlyExpense}
						/>
					</div>
				</aside>
			</div>

			<div className="show-mobile dash-see-all">
				<Button
					variant="secondary"
					fullWidth
					onClick={() => navigate("/transactions")}
				>
					Ver todos los movimientos
				</Button>
			</div>
		</div>
	);
}
