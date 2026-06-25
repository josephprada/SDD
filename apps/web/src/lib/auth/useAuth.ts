import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useQuery } from "convex/react";
import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { fetchGoogleOAuthRedirect, openGoogleOAuthPopup } from "./googlePopupSignIn";

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
          theme: user.theme,
        }
      : null,
    signInWithGoogle: async () => {
      if (!convexUrl) {
        throw new Error("VITE_CONVEX_URL no está configurada.");
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
