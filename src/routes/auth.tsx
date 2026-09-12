import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap } from "lucide-react";
import { backendMode, demoSignIn, demoSignUp, isDemo } from "@/lib/backend";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Study Buddy" },
      {
        name: "description",
        content:
          "Create your Study Buddy account or sign in to continue your adaptive practice, streaks and AI study coaching.",
      },
      { property: "og:title", content: "Sign in — Study Buddy" },
      {
        property: "og:description",
        content: "Create your Study Buddy account or sign in to continue learning.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const credentials = z.object({
  email: z.string().trim().email({ message: "Enter a valid email address" }).max(255),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }).max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [demoAvailable, setDemoAvailable] = useState(false);

  useEffect(() => {
    let active = true;
    void backendMode().then((mode) => {
      if (active) setDemoAvailable(mode === "demo");
    });
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (data.session) navigate({ to: "/dashboard", replace: true });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [navigate]);

  const parse = () => {
    const result = credentials.safeParse({ email, password });
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? "Please check your details");
      return null;
    }
    return result.data;
  };

  const signIn = async () => {
    const values = parse();
    if (!values) return;
    if (await isDemo()) {
      const result = demoSignIn(values.email, values.password);
      if (!result.ok) {
        toast.error(result.error ?? "Couldn't sign you in.");
        return;
      }
      navigate({ to: "/dashboard", replace: true });
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(values);
    setBusy(false);
    if (error) {
      const local = demoSignIn(values.email, values.password);
      if (local.ok) {
        toast.info("Signed in with a browser account — Supabase rejected the login.");
        navigate({ to: "/dashboard", replace: true });
        return;
      }
      toast.error(error.message);
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  };

  const signUp = async () => {
    const values = parse();
    if (!values) return;
    if (await isDemo()) {
      const result = demoSignUp(values.email, values.password);
      if (!result.ok) {
        toast.error(result.error ?? "Couldn't create your account.");
        return;
      }
      toast.success("Account created.");
      navigate({ to: "/onboarding", replace: true });
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      ...values,
      options: { emailRedirectTo: `${window.location.origin}/onboarding` },
    });
    setBusy(false);
    if (error) {
      const message = error.message.toLowerCase();
      const signupsOff =
        message.includes("signup") ||
        message.includes("sign up") ||
        message.includes("allow new users") ||
        message.includes("enable");
      if (signupsOff) {
        const local = demoSignUp(values.email, values.password);
        if (local.ok) {
          toast.success(
            "Account created — saved in this browser while Supabase sign-ups are switched off.",
          );
          navigate({ to: "/onboarding", replace: true });
          return;
        }
        toast.error(local.error ?? error.message);
        return;
      }
      toast.error(error.message);
      return;
    }
    if (data.session) {
      navigate({ to: "/onboarding", replace: true });
      return;
    }
    setSentTo(values.email);
  };

  const signInWithGoogle = async () => {
    if (await isDemo()) {
      toast.info("Google sign-in is only available with a connected account.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setBusy(false);
      toast.error(error.message || "Google sign-in didn't work. Please try again.");
    }
  };

  return (
    <main className="gradient-hero-bg flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card shadow-[var(--shadow-elevated)]">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <span className="mt-3 font-serif text-2xl tracking-tight">Study Buddy</span>
        </div>

        {sentTo ? (
          <Card className="overflow-hidden" style={{ boxShadow: "var(--shadow-elevated)" }}>
            <CardHeader>
              <CardTitle>Check your inbox</CardTitle>
              <CardDescription>
                We sent a confirmation link to {sentTo}. Open it to activate your account, then
                you'll land straight in onboarding.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full" onClick={() => setSentTo(null)}>
                Use a different email
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden" style={{ boxShadow: "var(--shadow-elevated)" }}>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome</CardTitle>
              <CardDescription>Your adaptive study coach, tuned to you.</CardDescription>
            </CardHeader>
            <CardContent>
              {demoAvailable && (
                <>
                  <Button
                    className="w-full rounded-full"
                    size="lg"
                    onClick={() => navigate({ to: "/dashboard", replace: true })}
                  >
                    Start exploring instantly (demo)
                  </Button>
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    No account or database needed — everything is saved in your browser.
                  </p>
                  <div className="my-6 flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="h-px flex-1 bg-border" />
                    or use your account
                    <span className="h-px flex-1 bg-border" />
                  </div>
                </>
              )}

              {!demoAvailable && (
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={busy}
                  onClick={signInWithGoogle}
                >
                  Continue with Google
                </Button>
              )}

              <div className="my-6 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or use email
                <span className="h-px flex-1 bg-border" />
              </div>

              <Tabs defaultValue="signup">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signup">Sign up</TabsTrigger>
                  <TabsTrigger value="signin">Sign in</TabsTrigger>
                </TabsList>

                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                    />
                  </div>
                </div>

                <TabsContent value="signup" className="mt-6">
                  <Button className="w-full rounded-full" disabled={busy} onClick={signUp}>
                    Create my account
                  </Button>
                </TabsContent>
                <TabsContent value="signin" className="mt-6">
                  <Button className="w-full rounded-full" disabled={busy} onClick={signIn}>
                    Sign in
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        <Link
          to="/"
          className="mt-6 block text-center text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to home
        </Link>
      </div>
    </main>
  );
}
