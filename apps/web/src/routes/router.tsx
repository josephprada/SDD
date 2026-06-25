import { useEffect } from "react";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
  useLocation,
  useNavigate,
} from "react-router";
import { useConvexAuth } from "convex/react";
import { useAuth } from "@app/lib/auth/useAuth";
import { LoadingScreen } from "@app/components/shell/LoadingScreen";
import { useThemeStore } from "@app/stores/theme";
import { RootRoute } from "./root";
import { LoginRoute } from "./login";
import { HomeRoute } from "./home";
import { SettingsRoute } from "./settings";
import { NotFoundRoute } from "./notFound";
import { OAuthCallbackRoute } from "./oauthCallback";

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

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      const next = new URLSearchParams(location.search).get("next") ?? "/";
      navigate(next, { replace: true });
    }
  }, [isAuthenticated, isLoading, location.search, navigate]);

  if (isLoading || isAuthenticated) {
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
