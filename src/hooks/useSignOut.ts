import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isDemo } from "@/lib/backend";

// Demo-mode sessions live only in localStorage — there's no Supabase session
// to destroy, so signing out there just sends the user back to /auth.
export function useSignOut(): () => Promise<void> {
  const navigate = useNavigate();
  return async () => {
    if (!(await isDemo())) {
      try {
        await supabase.auth.signOut();
      } catch {
        // sign-out request failed; navigate away regardless to clear local state
      }
    }
    navigate({ to: "/auth", replace: true });
  };
}
