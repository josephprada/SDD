import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { AppRouter } from "./routes/router";
import { ThemeSyncBridge } from "./stores/theme";
import "@jp-ds/index";
import "./styles/aurora.css";
import "./styles/animations.css";
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
      <ThemeSyncBridge />
      <AppRouter />
    </ConvexAuthProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
