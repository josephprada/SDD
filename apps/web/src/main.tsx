import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GenieModalSvgDefs } from "@app/components/ui/GenieModalSvgDefs";
import { AppRouter } from "./routes/router";
import "@jp-ds/index";
import "./styles/aurora.css";
import "./styles/animations.css";
import "./styles/genie-modal.css";
import "./styles/core.css";
import "./styles/settings.css";
import "./styles/budgets-reports.css";
import "./styles/credits-savings.css";
import "./styles/login-brand.css";
import "./index.css";

function App() {
	return (
		<>
			<GenieModalSvgDefs />
			<AppRouter />
		</>
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
