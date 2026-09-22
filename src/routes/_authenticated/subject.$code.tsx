import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookMarked, GraduationCap, Play } from "lucide-react";
import { fetchMyProfile, fetchSubjects, fetchTopics } from "@/lib/profile-data";
import { subjectIcon, FALLBACK_COLOR } from "@/lib/subject-icons";
import { DIFFICULTIES, type DifficultyValue } from "@/lib/learning";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/subject/$code")({
  head: () => ({
    meta: [
      { title: "Subject — Study Buddy" },
      {
        name: "description",
        content: "Browse the topics for a subject and start practising.",
      },
    ],
  }),
  component: SubjectPage,
});

const DIFFICULTY_STYLES: Record<DifficultyValue, string> = {
  very_easy: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  easy: "bg-green-500/10 text-green-600 dark:text-green-400",
  medium: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  hard: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  very_hard: "bg-red-500/10 text-red-600 dark:text-red-400",
};

function difficultyLabel(value: DifficultyValue): string {
  return DIFFICULTIES.find((d) => d.value === value)?.label ?? value;
}

function SubjectPage() {
  const { code } = Route.useParams();
  const { user } = Route.useRouteContext();

  const profileQuery = useQuery({
    queryKey: ["my-profile", user.id],
    queryFn: () => fetchMyProfile(user.id),
  });
  const subjectsQuery = useQuery({ queryKey: ["subjects"], queryFn: fetchSubjects });

  const subject = subjectsQuery.data?.find((s) => s.code === code);

  const grade = profileQuery.data?.draft.grade;
  const curriculum = profileQuery.data?.draft.curriculum;

  const topicsQuery = useQuery({
    queryKey: ["topics", subject?.id ?? code, grade, curriculum],
    queryFn: () => fetchTopics(subject?.id ?? "", grade, curriculum),
    enabled: Boolean(subject),
  });

  const Icon = subject?.icon ? subjectIcon(subject.icon) : BookMarked;
  const accent = subject?.color ?? FALLBACK_COLOR;
  const userName = profileQuery.data?.draft.full_name || "Student";

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <div className="flex min-h-screen flex-col lg:pl-[240px]">
        <TopBar userName={userName} />

        <main className="flex-1 px-4 py-5 pb-24 sm:px-8 sm:py-8 lg:pb-8">
          <Link
            to="/dashboard"
            className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>

          {!subject ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">
                {subjectsQuery.isLoading ? "Loading subject…" : "Subject not found."}
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col justify-between gap-6 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${accent}1a`, color: accent }}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                      {subject.name}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">{subject.description}</p>
                  </div>
                </div>

                <Badge
                  variant="secondary"
                  className="self-start rounded-full px-3 py-1 sm:self-auto"
                >
                  {topicsQuery.data?.length ?? 0}{" "}
                  {(topicsQuery.data?.length ?? 0) === 1 ? "topic" : "topics"}
                </Badge>
              </div>

              <h2 className="mb-4 mt-8 text-lg font-semibold tracking-tight text-foreground">
                Topics
              </h2>

              {topicsQuery.isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Skeleton className="h-32 rounded-2xl" />
                  <Skeleton className="h-32 rounded-2xl" />
                  <Skeleton className="h-32 rounded-2xl" />
                </div>
              ) : (topicsQuery.data ?? []).length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No topics for this subject yet. Check back soon.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(topicsQuery.data ?? []).map((topic) => (
                    <div
                      key={topic.id}
                      className="flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/25 hover:shadow-[var(--shadow-elevated)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-semibold text-foreground">{topic.name}</h3>
                        <Badge className={DIFFICULTY_STYLES[topic.difficulty]}>
                          {difficultyLabel(topic.difficulty)}
                        </Badge>
                      </div>

                      {topic.description && (
                        <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground">
                          {topic.description}
                        </p>
                      )}

                      {topic.curriculum && (
                        <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <GraduationCap className="h-3.5 w-3.5" /> {curriculum ?? topic.grade}
                        </p>
                      )}

                      <Button variant="outline" size="sm" className="mt-4 rounded-full" disabled>
                        <Play className="mr-1.5 h-3.5 w-3.5" /> Practice (soon)
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
