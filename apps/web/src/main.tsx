import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppRouter } from "./routes/router";
import { PreferencesSyncBridge } from "./components/PreferencesSyncBridge";
import "@jp-ds/index";
import "./styles/aurora.css";
import "./styles/animations.css";
import "./styles/core.css";
import "./styles/settings.css";
import "./styles/login-brand.css";
import "./index.css";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;

if (!convexUrl) {
	throw new Error(
		"VITE_CONVEX_URL no está definida. Añádela en .env.local en la raíz del monorepo y reinicia `bun dev`.",
	);
}

const convex = new ConvexReactClient(convexUrl);

function App() {
	return (
		<ConvexAuthProvider client={convex}>
			<PreferencesSyncBridge />
			<AppRouter />
		</ConvexAuthProvider>
	);
}

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Root element #root not found");
}

createRoot(rootElement).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
