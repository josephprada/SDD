import { ConvexReactClient } from "convex/react";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;

if (!convexUrl) {
	throw new Error(
		"VITE_CONVEX_URL no está definida. Añádela en .env.local en la raíz del monorepo y reinicia `bun dev`.",
	);
}

export const convex = new ConvexReactClient(convexUrl);
