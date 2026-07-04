import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@convex/_generated/api";
import { useConvexAuth } from "convex/react";
import { useQuery } from "convex/react";
import { useMutation } from "convex/react";
import { useEffect } from "react";
import {
	fetchGoogleOAuthRedirect,
	openGoogleOAuthPopup,
	OAUTH_NEXT_STORAGE_KEY,
	shouldUseOAuthRedirect,
} from "./googlePopupSignIn";

const convexUrl = import.meta.env.VITE_CONVEX_URL as string;

export function useAuth() {
	const { isLoading, isAuthenticated } = useConvexAuth();
	const { signIn, signOut } = useAuthActions();
	const user = useQuery(api.users.currentUser, isAuthenticated ? {} : "skip");
	const ensureProvisioned = useMutation(api.users.ensureProvisioned);

	useEffect(() => {
		if (isAuthenticated) {
			void ensureProvisioned({});
		}
	}, [isAuthenticated, ensureProvisioned]);

	return {
		isLoading: isLoading || (isAuthenticated && user === undefined),
		isAuthenticated,
		session: user
			? {
					userId: user.userId,
					email: user.email,
					name: user.name,
					picture: user.picture,
					hasCustomAvatar: user.hasCustomAvatar,
					theme: user.theme,
				}
			: null,
		signInWithGoogle: async () => {
			if (!convexUrl) {
				throw new Error("VITE_CONVEX_URL no está configurada.");
			}

			if (shouldUseOAuthRedirect()) {
				const next = new URLSearchParams(window.location.search).get(
					"next",
				);
				if (next) {
					sessionStorage.setItem(OAUTH_NEXT_STORAGE_KEY, next);
				}
				await signIn("google", { redirectTo: "/login" });
				return;
			}

			const redirect = await fetchGoogleOAuthRedirect(convexUrl);
			const code = await openGoogleOAuthPopup(redirect);
			await signIn("google", { code });
		},
		signOut: async () => {
			await signOut();
		},
	};
}
