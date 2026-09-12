import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_USER, backendMode } from "@/lib/backend";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    let active = true;

    const setDemoUser = () => {
      setSession(null);
      setUser(DEMO_USER as unknown as User);
      setDemo(true);
      setLoading(false);
    };

    const sub = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);
      setDemo(false);
    });

    void (async () => {
      const mode = await backendMode();
      if (!active) return;
      if (mode === "demo") {
        setDemoUser();
        return;
      }
      try {
        const { data } = await supabase.auth.getSession();
        if (!active) return;
        setSession(data.session);
        setUser(data.session?.user ?? null);
      } catch {
        if (active) setDemoUser();
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      sub.data.subscription.unsubscribe();
    };
  }, []);

  return { session, user, loading, demo };
}
