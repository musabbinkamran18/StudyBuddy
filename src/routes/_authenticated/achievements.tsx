import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Lock } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { fetchMyProfile } from "@/lib/profile-data";
import {
  ALL_ACHIEVEMENTS,
  loadAchievementState,
  CATEGORY_LABELS,
  type AchievementCategory,
} from "@/lib/achievements";
import { loadRewards } from "@/lib/rewards";
import { loadExtendedStats } from "@/lib/extended-stats";
import { loadCoinState } from "@/lib/coins";
import { loadAvatar } from "@/lib/avatar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/achievements")({
  head: () => ({
    meta: [{ title: "Achievements â€” Study Buddy" }],
  }),
  component: AchievementsPage,
});

const CATEGORIES: AchievementCategory[] = [
  "streak",
  "xp",
  "questions",
  "lessons",
  "boss",
  "mastery",
  "perfect",
  "coins",
  "missions",
];

function AchievementsPage() {
  const { user } = Route.useRouteContext();

  const profileQuery = useQuery({
    queryKey: ["my-profile", user.id],
    queryFn: () => fetchMyProfile(user.id),
  });

  const [filter, setFilter] = useState<AchievementCategory | "all">("all");
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);

  const rewards = loadRewards(user.id);
  const extended = loadExtendedStats(user.id);
  const coinState = loadCoinState(user.id);

  useEffect(() => {
    const state = loadAchievementState(user.id);
    setUnlockedIds(state.unlocked);
  }, [user.id]);

  const userName = profileQuery.data?.draft.full_name || "Student";
  const coins = coinState.balance;
  const avatar = loadAvatar(user.id);

  const displayed =
    filter === "all" ? ALL_ACHIEVEMENTS : ALL_ACHIEVEMENTS.filter((a) => a.category === filter);

  const unlockedCount = ALL_ACHIEVEMENTS.filter((a) => unlockedIds.includes(a.id)).length;
  const totalCount = ALL_ACHIEVEMENTS.length;

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex min-h-screen flex-col lg:pl-[240px]">
        <TopBar userName={userName} coins={coins} avatar={avatar} />
        <main className="flex-1 px-4 py-6 pb-24 sm:px-8 sm:py-8 lg:pb-8">
          <div className="mx-auto max-w-3xl">
            <Link
              to="/dashboard"
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back to dashboard
            </Link>

            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Achievements</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {unlockedCount}/{totalCount} unlocked
                </p>
              </div>
              {/* Overall progress */}
              <div className="text-right">
                <div className="relative h-14 w-14">
                  <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
                    <circle
                      cx="28"
                      cy="28"
                      r="22"
                      fill="none"
                      strokeWidth="5"
                      className="stroke-muted"
                    />
                    <circle
                      cx="28"
                      cy="28"
                      r="22"
                      fill="none"
                      strokeWidth="5"
                      className="stroke-primary transition-all"
                      strokeDasharray={`${(unlockedCount / totalCount) * 138.2} 138.2`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
                    {Math.round((unlockedCount / totalCount) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Overall progress bar */}
            <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
              />
            </div>

            {/* Category filter */}
            <div className="mb-6 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={filter === "all" ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setFilter("all")}
              >
                All ({ALL_ACHIEVEMENTS.length})
              </Button>
              {CATEGORIES.map((cat) => {
                const catCount = ALL_ACHIEVEMENTS.filter(
                  (a) => a.category === cat && unlockedIds.includes(a.id),
                ).length;
                const catTotal = ALL_ACHIEVEMENTS.filter((a) => a.category === cat).length;
                return (
                  <Button
                    key={cat}
                    size="sm"
                    variant={filter === cat ? "default" : "outline"}
                    className="rounded-full"
                    onClick={() => setFilter(cat)}
                  >
                    {CATEGORY_LABELS[cat]} ({catCount}/{catTotal})
                  </Button>
                );
              })}
            </div>

            {/* Achievement grid */}
            <div className="grid gap-3 sm:grid-cols-2">
              {displayed.map((achievement) => {
                const unlocked = unlockedIds.includes(achievement.id);
                const prog = achievement.progress?.(rewards, extended, coinState);
                const progPct = prog
                  ? Math.min(100, Math.round((prog.current / prog.target) * 100))
                  : unlocked
                    ? 100
                    : 0;

                return (
                  <div
                    key={achievement.id}
                    className={cn(
                      "relative overflow-hidden rounded-2xl border p-4 transition-all",
                      unlocked
                        ? "border-primary/30 bg-primary/5"
                        : "border-muted/70 bg-card opacity-75",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Emoji / lock */}
                      <div
                        className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl",
                          unlocked ? "bg-primary/15" : "bg-muted",
                        )}
                      >
                        {unlocked ? (
                          achievement.emoji
                        ) : (
                          <span className="relative">
                            <span className="opacity-30">{achievement.emoji}</span>
                            <Lock className="absolute -bottom-0.5 -right-0.5 h-3 w-3 text-muted-foreground" />
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p
                            className={cn(
                              "font-semibold leading-tight",
                              unlocked ? "text-foreground" : "text-muted-foreground",
                            )}
                          >
                            {achievement.label}
                          </p>
                          {unlocked && achievement.coinReward > 0 && (
                            <span className="rounded-full bg-yellow-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-600 dark:text-yellow-400">
                              +{achievement.coinReward}ðŸ’Ž
                            </span>
                          )}
                        </div>
                        <p
                          className={cn(
                            "mt-0.5 text-xs leading-relaxed",
                            unlocked ? "text-muted-foreground" : "text-muted-foreground/60",
                          )}
                        >
                          {achievement.description}
                        </p>

                        {/* Progress bar */}
                        {prog && !unlocked && (
                          <div className="mt-2">
                            <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
                              <span>
                                {prog.current.toLocaleString()} / {prog.target.toLocaleString()}
                              </span>
                              <span>{progPct}%</span>
                            </div>
                            <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary/50 transition-all"
                                style={{ width: `${progPct}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Unlocked badge */}
                      {unlocked && <div className="shrink-0 text-xl">âœ…</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
