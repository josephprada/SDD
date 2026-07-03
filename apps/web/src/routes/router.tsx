import { LoadingScreen } from "@app/components/shell/LoadingScreen";
import { OAUTH_NEXT_STORAGE_KEY } from "@app/lib/auth/googlePopupSignIn";
import { useAuth } from "@app/lib/auth/useAuth";
import { useThemeStore } from "@app/stores/theme";
import { useConvexAuth } from "convex/react";
import { useEffect } from "react";
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
import { TransactionsRoute } from "./transactions";

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
	const searchParams = new URLSearchParams(location.search);
	const hasOAuthCode = searchParams.has("code");
	const oauthError = searchParams.get("error");

	useEffect(() => {
		if (oauthError && !hasOAuthCode) {
			navigate("/login?error=oauth_denied", { replace: true });
		}
	}, [oauthError, hasOAuthCode, navigate]);

	useEffect(() => {
		if (!isLoading && isAuthenticated) {
			const params = new URLSearchParams(location.search);
			const next =
				params.get("next") ??
				sessionStorage.getItem(OAUTH_NEXT_STORAGE_KEY) ??
				"/";
			sessionStorage.removeItem(OAUTH_NEXT_STORAGE_KEY);
			navigate(next, { replace: true });
		}
	}, [isAuthenticated, isLoading, location.search, navigate]);

	useEffect(() => {
		if (!hasOAuthCode || isAuthenticated) {
			return;
		}
		const timer = window.setTimeout(() => {
			if (!isAuthenticated) {
				sessionStorage.removeItem(OAUTH_NEXT_STORAGE_KEY);
				navigate("/login?error=signin_failed", { replace: true });
			}
		}, 20_000);
		return () => window.clearTimeout(timer);
	}, [hasOAuthCode, isAuthenticated, navigate]);

	if (isLoading || isAuthenticated || hasOAuthCode) {
		return <LoadingScreen />;
	}

	return <>{children}</>;
}

function ThemeReconcile() {
	const { session } = useAuth();
	const reconcile = useThemeStore((s) => s.reconcileFromServer);

	useEffect(() => {
		if (session?.theme) {
			reconcile(session.theme);
		}
	}, [session?.theme, reconcile]);

	return null;
}

function ProtectedLayout() {
	return (
		<AuthGate>
			<ThemeReconcile />
			<RootRoute />
		</AuthGate>
	);
}

export const router = createBrowserRouter([
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
]);

export function AppRouter() {
	const initTheme = useThemeStore((s) => s.init);

	useEffect(() => {
		initTheme();
	}, [initTheme]);

	return <RouterProvider router={router} />;
}
