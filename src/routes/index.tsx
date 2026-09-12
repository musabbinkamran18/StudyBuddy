import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { GraduationCap, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Study Buddy — Adaptive Learning" },
      {
        name: "description",
        content:
          "Study Buddy: student profiles, a multi-format question engine, adaptive practice metrics, AI coaching and gamified progress.",
      },
      { property: "og:title", content: "Study Buddy — Adaptive Learning" },
      {
        property: "og:description",
        content:
          "Student profiles, question engine, adaptive metrics, AI coaching and gamification — the backbone of Study Buddy.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const features = [
  {
    title: "Students",
    text: "Accounts, profiles, grade, curriculum, seriousness level and chosen subjects with priority.",
  },
  {
    title: "Learning content",
    text: "Subjects, topics and sub-topics tuned to your curriculum, with multi-format question types.",
  },
  {
    title: "Practice & adaptation",
    text: "Sessions, attempts, mistake logs and adaptive metrics — accuracy, speed, mastery and difficulty.",
  },
  {
    title: "Coaching & motivation",
    text: "AI chat coaching, XP, levels, streaks, badges and smart recommendations that push you into flow.",
  },
];

/** Decorative stylised preview of the dashboard. Purely visual. */
function DashboardPreview() {
  const rows = [
    { w: "w-3/4", t: "w-10/12" },
    { w: "w-2/3", t: "w-8/12" },
    { w: "w-4/5", t: "w-9/12" },
  ];

  return (
    <div
      aria-hidden
      className="relative mx-auto mt-16 w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-elevated)]"
    >
      <div className="flex items-center gap-1.5 border-b border-border px-5 py-3.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#dcb6a4]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#e2cd9a]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#a8c4a0]" />
        <span className="ml-3 hidden rounded-md bg-muted px-3 py-1 text-[11px] text-muted-foreground sm:block">
          studybuddy.app/dashboard
        </span>
      </div>

      <div className="grid gap-5 p-6 sm:grid-cols-[220px_1fr] sm:p-8">
        <div className="hidden space-y-4 sm:block">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <GraduationCap className="h-4 w-4 text-primary" />
            </div>
            <div className="h-3 w-24 rounded bg-muted" />
          </div>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-2.5 rounded bg-muted" style={{ width: `${84 - i * 9}%` }} />
          ))}
        </div>

        <div className="space-y-6">
          <div className="space-y-2.5">
            <div className="h-5 w-1/2 rounded-lg bg-primary/20" />
            <div className="h-3 w-2/3 rounded bg-muted" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {rows.map((r, i) => (
              <div key={i} className="rounded-xl border border-border p-4">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-primary/10" />
                  <div className={`h-2.5 rounded bg-muted ${r.w}`} />
                </div>
                <div className={`mt-3 h-2 rounded bg-muted-foreground/20 ${r.t}`} />
                <div className="mt-2 h-1.5 rounded-full bg-primary/15">
                  <div className="h-full w-2/3 rounded-full bg-primary/50" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Index() {
  const { user, loading } = useAuth();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <GraduationCap className="h-4 w-4 text-primary" />
          </div>
          <span className="font-serif text-xl tracking-tight">Study Buddy</span>
        </div>
        {loading ? null : user ? (
          <Button asChild variant="outline">
            <Link to="/dashboard">Go to dashboard</Link>
          </Button>
        ) : (
          <Button asChild>
            <Link to="/auth">Sign in</Link>
          </Button>
        )}
      </header>

      <section className="gradient-hero-bg px-6 pb-16 pt-20 text-center sm:pt-24">
        <div className="mx-auto max-w-3xl">
          <Badge
            variant="secondary"
            className="mx-auto mb-7 rounded-full px-3.5 py-1.5 text-xs font-medium"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" />
            Adaptive practice, built for how you learn
          </Badge>
          <h1 className="font-serif text-4xl leading-[1.05] tracking-tight sm:text-6xl">
            Practice that adapts to <em className="text-primary">exactly</em> how you learn
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Tell us your grade, curriculum, subjects and goals. Study Buddy shapes every question,
            tracks every mistake, and keeps you right at the edge of what you can do.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="h-12 rounded-full px-8 text-base">
              <Link to={user ? "/dashboard" : "/auth"}>
                {user ? "Continue learning" : "Create my learning profile"}
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="h-12 rounded-full px-8 text-base"
            >
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        </div>
        <DashboardPreview />
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-[var(--shadow-elevated)]"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 font-semibold text-primary">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-5 font-serif text-xl tracking-tight">{feature.title}</h3>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <GraduationCap className="h-4 w-4 text-primary" />
            Study Buddy
          </div>
          <p className="text-sm text-muted-foreground">
            Adaptive learning, one question at a time.
          </p>
        </div>
      </footer>
    </main>
  );
}
