import { LoadingScreen } from "@app/components/shell/LoadingScreen";
import { ConvexAuthShell } from "@app/components/shell/ConvexAuthShell";
import { OAUTH_NEXT_STORAGE_KEY } from "@app/lib/auth/googlePopupSignIn";
import { usePreferencesStore } from "@app/stores/preferences";
import { useConvexAuth } from "convex/react";
import { useEffect, useState } from "react";
import {
	Navigate,
	RouterProvider,
	createBrowserRouter,
	useLocation,
	useNavigate,
} from "react-router";
import { AccountsRoute } from "./accounts";
import { CategoriesRoute } from "./categories";
import { HomeRoute } from "./home";
import { LoginRoute } from "./login";
import { NotFoundRoute } from "./notFound";
import { OAuthCallbackRoute } from "./oauthCallback";
import { RootRoute } from "./root";
import { SettingsRoute } from "./settings";
import { BudgetsRoute } from "./budgets";
import { ReportsRoute } from "./reports";
import { TransactionsRoute } from "./transactions";
import { CreditsRoute } from "./credits";
import { CreditDetailRoute } from "./credit-detail";
import { SavingsRoute } from "./savings";

function AuthGate({ children }: { children: React.ReactNode }) {
	const { isAuthenticated, isLoading } = useConvexAuth();
	const location = useLocation();

	if (isLoading) {
		return <LoadingScreen />;
	}

	if (!isAuthenticated) {
		const next = location.pathname + location.search;
		const search =
			next && next !== "/login" ? `?next=${encodeURIComponent(next)}` : "";
		return <Navigate to={`/login${search}`} replace />;
	}

	return <>{children}</>;
}

function GuestGate({ children }: { children: React.ReactNode }) {
	const { isAuthenticated, isLoading } = useConvexAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const [authTimedOut, setAuthTimedOut] = useState(false);
	const searchParams = new URLSearchParams(location.search);
	const hasOAuthCode = searchParams.has("code");
	const oauthError = searchParams.get("error");

	useEffect(() => {
		if (!isLoading) {
			setAuthTimedOut(false);
			return;
		}
		const timer = window.setTimeout(() => setAuthTimedOut(true), 10_000);
		return () => window.clearTimeout(timer);
	}, [isLoading]);

	useEffect(() => {
		if (oauthError && !hasOAuthCode) {
			navigate("/login?error=oauth_denied", { replace: true });
		}
	}, [oauthError, hasOAuthCode, navigate]);

	useEffect(() => {
		if (!isLoading && isAuthenticated) {
			sessionStorage.removeItem(OAUTH_NEXT_STORAGE_KEY);
			navigate("/", { replace: true });
		}
	}, [isAuthenticated, isLoading, navigate]);

	useEffect(() => {
		if (!hasOAuthCode || isAuthenticated) {
			return;
		}
		const timer = window.setTimeout(() => {
			if (!isAuthenticated) {
				sessionStorage.removeItem(OAUTH_NEXT_STORAGE_KEY);
				navigate("/login?error=signin_failed", { replace: true });
			}
		}, 12_000);
		return () => window.clearTimeout(timer);
	}, [hasOAuthCode, isAuthenticated, navigate]);

	// Solo spinner mientras Convex Auth resuelve sesión; timeout si Convex no responde.
	if ((isLoading || isAuthenticated) && !authTimedOut) {
		return (
			<div className="login-brand login-screen aurora-bg aurora-bg--galaxy">
				<LoadingScreen brand label="Iniciando sesión" />
			</div>
		);
	}

	return <>{children}</>;
}

function ProtectedLayout() {
	return (
		<AuthGate>
			<RootRoute />
		</AuthGate>
	);
}

export const router = createBrowserRouter([
	{
		element: <ConvexAuthShell />,
		children: [
			{
				path: "/oauth-callback",
				element: <OAuthCallbackRoute />,
			},
			{
				path: "/login",
				element: (
					<GuestGate>
						<LoginRoute />
					</GuestGate>
				),
			},
			{
				path: "/",
				element: <ProtectedLayout />,
				children: [
					{ index: true, element: <HomeRoute /> },
					{ path: "accounts", element: <AccountsRoute /> },
					{ path: "transactions", element: <TransactionsRoute /> },
					{ path: "categories", element: <CategoriesRoute /> },
					{ path: "budgets", element: <BudgetsRoute /> },
					{ path: "reports", element: <ReportsRoute /> },
					{ path: "credits", element: <CreditsRoute /> },
					{ path: "credits/:id", element: <CreditDetailRoute /> },
					{ path: "savings", element: <SavingsRoute /> },
					{ path: "settings", element: <SettingsRoute /> },
				],
			},
			{
				path: "/404",
				element: <NotFoundRoute />,
			},
			{
				path: "*",
				element: <NotFoundRoute />,
			},
		],
	},
]);

export function AppRouter() {
	const init = usePreferencesStore((s) => s.init);

	useEffect(() => {
		init();
	}, [init]);

	return <RouterProvider router={router} />;
}
