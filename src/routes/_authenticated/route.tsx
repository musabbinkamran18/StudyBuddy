import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_USER, backendMode } from "@/lib/backend";
import { useGameSync } from "@/hooks/useGameSync";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const mode = await backendMode();
    if (mode === "demo") return { user: DEMO_USER as unknown as User };
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: function AuthLayout() {
    const { user } = Route.useRouteContext();
    useGameSync(user.id);
    return <Outlet />;
  },
});
