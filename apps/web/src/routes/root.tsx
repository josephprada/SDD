import { Shell } from "@app/components/shell/Shell";
import { type LoaderFunctionArgs, redirect } from "react-router";

export async function rootLoader({ request }: LoaderFunctionArgs) {
	const url = new URL(request.url);
	// Auth check happens client-side via ConvexAuth; server loader only handles ?next preservation
	return { next: url.searchParams.get("next") };
}

export function RootRoute() {
	return <Shell />;
}

export function requireAuthLoader() {
	return null;
}

export function redirectToLogin(nextPath: string) {
	const search =
		nextPath && nextPath !== "/login"
			? `?next=${encodeURIComponent(nextPath)}`
			: "";
	return redirect(`/login${search}`);
}
