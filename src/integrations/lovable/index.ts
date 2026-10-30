// Standalone OAuth helper decoupled from Lovable cloud auth
import { supabase } from "../supabase/client";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (provider: "google" | "apple" | "microsoft" | "lovable", opts?: SignInOptions) => {
      if (provider === "google") {
        return supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: opts?.redirect_uri,
          },
        });
      }
      return { error: new Error(`Provider ${provider} is not configured for standalone mode`) };
    },
  },
};
