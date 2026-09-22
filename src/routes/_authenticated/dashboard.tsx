import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueries } from "@tanstack/react-query";
import { Zap } from "lucide-react";
import { fetchMyProfile, fetchSubjects, fetchTopics } from "@/lib/profile-data";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { HeroBanner } from "@/components/dashboard/HeroBanner";
import { SubjectCards, type SubjectCardData } from "@/components/dashboard/SubjectCards";
import { RecentActivity, type ActivityItem } from "@/components/dashboard/RecentActivity";
import { RightSidebar, type ProgressSlice } from "@/components/dashboard/RightSidebar";
import { DailyTasks } from "@/components/dashboard/DailyTasks";
import { DailyMissions } from "@/components/dashboard/DailyMissions";
import { LeagueCard } from "@/components/dashboard/LeagueCard";
import { LoginRewardBanner } from "@/components/dashboard/LoginRewardBanner";
import { DailyChallengeCard } from "@/components/dashboard/DailyChallenge";
import { WeeklyChart } from "@/components/dashboard/WeeklyChart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FALLBACK_COLOR } from "@/lib/subject-icons";
import { loadCoinState } from "@/lib/coins";
import { loadRewards } from "@/lib/rewards";
import { loadAvatar } from "@/lib/avatar";
import { loadSubjectProgress, calculateMastery, getDefaultTopicProgress } from "@/lib/progress";
import { loadStudyLog } from "@/lib/study-log";
import { loadUserPrefs, daysUntilExam } from "@/lib/user-prefs";
import { SmartInsights } from "@/components/dashboard/SmartInsights";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Study Buddy" },
      {
        name: "description",
        content:
          "Your learning dashboard: subjects, progress, streaks, and AI-powered study tools.",
      },
      { property: "og:title", content: "Dashboard — Study Buddy" },
      { property: "og:description", content: "Your adaptive learning dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();

  const profileQuery = useQuery({
    queryKey: ["my-profile", user.id],
    queryFn: () => fetchMyProfile(user.id),
  });
  const subjectsQuery = useQuery({ queryKey: ["subjects"], queryFn: fetchSubjects });

  useEffect(() => {
    if (profileQuery.data && !profileQuery.data.completed) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [profileQuery.data, navigate]);

  const draft = profileQuery.data?.draft;
  const mySubjects = (subjectsQuery.data ?? []).filter((s) => draft?.subjectIds.includes(s.id));

  const grade = draft?.grade;
  const curriculum = draft?.curriculum;

  const topicQueries = useQueries({
    queries: mySubjects.map((s) => ({
      queryKey: ["topics", s.id, grade, curriculum],
      queryFn: () => fetchTopics(s.id, grade, curriculum),
    })),
  });

  const subjectData: SubjectCardData[] = mySubjects.map((s, i) => {
    const topics = topicQueries[i]?.data ?? [];
    let progressPercent = 0;
    if (topics.length > 0) {
      const subjectProgress = loadSubjectProgress(user.id, s.id);
      const total = topics.reduce((sum, t) => sum + (subjectProgress[t.id]?.masteryPct ?? 0), 0);
      progressPercent = Math.round(total / topics.length);
    }
    return {
      code: s.code,
      name: s.name,
      icon: s.icon,
      color: s.color,
      progressPercent,
      subtopics: topics.map((t) => t.name),
    };
  });

  const progressSlices: ProgressSlice[] = subjectData.map((s) => ({
    name: s.name,
    value: s.progressPercent,
    color: s.color ?? FALLBACK_COLOR,
  }));

  // Shared userPrefs (replaces inline loadUserPrefs calls below)
  const userPrefs = useMemo(() => loadUserPrefs(user.id), [user.id]);

  // Topics-by-subject map for SmartInsights (no extra fetches — reuses topicQueries above)
  const topicsBySubjectMap = useMemo(() => {
    const map: Record<string, { id: string; name: string }[]> = {};
    mySubjects.forEach((s, i) => {
      map[s.id] = topicQueries[i]?.data ?? [];
    });
    return map;
  }, [mySubjects, topicQueries]);

  // Top 3 weak topics (mastery < 60%) for daily task personalisation
  const weakTopics = useMemo((): string[] => {
    const entries: { name: string; mastery: number }[] = [];
    mySubjects.forEach((s, i) => {
      const topics = topicQueries[i]?.data ?? [];
      const prog = loadSubjectProgress(user.id, s.id);
      topics.forEach((t) => {
        const p = prog[t.id] ?? getDefaultTopicProgress();
        const pct = calculateMastery(p);
        if (pct < 60) entries.push({ name: t.name, mastery: pct });
      });
    });
    return entries
      .sort((a, b) => a.mastery - b.mastery)
      .slice(0, 3)
      .map((e) => e.name);
  }, [user.id, mySubjects, topicQueries]);

  const userName = draft?.full_name || "Student";
  const isProfileError = profileQuery.isError;
  const isLoading = profileQuery.isLoading || (!draft && !isProfileError);

  const recentActivities = useMemo((): ActivityItem[] => {
    const log = loadStudyLog(user.id);
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    return Object.entries(log)
      .filter(([, stats]) => stats.sessions > 0)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 5)
      .map(([date, stats]): ActivityItem => ({
        icon: Zap,
        tint: "text-primary",
        bg: "bg-primary/10",
        text: `${stats.sessions} practice session${stats.sessions !== 1 ? "s" : ""}`,
        detail: `${stats.questions} questions · ${stats.xp} XP earned`,
        time: date === today ? "Today" : date === yesterday ? "Yesterday" : date,
      }));
  }, [user.id]);

  // Client-side gamification state
  const [coins, setCoins] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [avatar, setAvatar] = useState("⭐");

  const [examDays, setExamDays] = useState<number | null>(null);
  const [examLabel, setExamLabel] = useState("");

  useEffect(() => {
    const coinState = loadCoinState(user.id);
    setCoins(coinState.balance);
    const rewards = loadRewards(user.id);
    setStreak(rewards.streak);
    setTotalXp(rewards.xp);
    setAvatar(loadAvatar(user.id));
    setExamDays(daysUntilExam(userPrefs.examDate));
    setExamLabel(userPrefs.examLabel);
  }, [user.id]);

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <div className="flex min-h-screen flex-col lg:pl-[240px]">
        <TopBar userName={userName} streak={streak} coins={coins} avatar={avatar} />

        <main className="flex-1 px-4 py-5 pb-24 sm:px-8 sm:py-8 lg:pb-8">
          {isProfileError ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <p className="text-sm font-semibold text-foreground">Couldn't load your dashboard</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your profile couldn't be loaded. Check your connection and try again.
              </p>
              <Button className="mt-4" onClick={() => profileQuery.refetch()}>
                Try again
              </Button>
            </div>
          ) : isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-72 w-full rounded-2xl" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="min-w-0 flex-1 space-y-6">
                {/* Daily login reward — shows only on first visit of the day */}
                <LoginRewardBanner userId={user.id} />

                <HeroBanner
                  userName={userName}
                  subjectCount={subjectData.length}
                  examDays={examDays}
                  examLabel={examLabel}
                />

                {mySubjects.length > 0 && topicQueries.every((q) => !q.isLoading) && (
                  <SmartInsights
                    userId={user.id}
                    enrolledSubjects={mySubjects}
                    topicsBySubject={topicsBySubjectMap}
                    examDate={userPrefs.examDate}
                    examLabel={userPrefs.examLabel}
                    currentDifficulty={draft?.difficulty ?? "medium"}
                  />
                )}

                {subjectData.length > 0 ? (
                  <SubjectCards subjects={subjectData} />
                ) : (
                  <div className="rounded-2xl border border-border bg-card p-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      No subjects selected yet. Complete your profile to get started.
                    </p>
                  </div>
                )}

                <DailyTasks
                  userId={user.id}
                  profile={{
                    studentName: draft?.full_name ?? "Student",
                    grade: draft?.grade ?? "",
                    curriculum: draft?.curriculum ?? "",
                    subjects: mySubjects.map((s) => s.name),
                    difficulty: draft?.difficulty ?? "medium",
                    weakTopics,
                  }}
                />

                <DailyMissions userId={user.id} />

                <DailyChallengeCard
                  userId={user.id}
                  subjects={mySubjects.map((s) => s.name)}
                  grade={draft?.grade ?? "9"}
                  curriculum={draft?.curriculum ?? ""}
                />

                <RecentActivity activities={recentActivities} />
              </div>

              <div className="w-full lg:w-80 shrink-0 space-y-6">
                <RightSidebar userId={user.id} progress={progressSlices} />
                <WeeklyChart userId={user.id} />
                <LeagueCard totalXp={totalXp} userName={userName} userId={user.id} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
