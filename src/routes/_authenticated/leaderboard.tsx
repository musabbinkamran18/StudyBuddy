import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  getCurrentLeague,
  fetchLeaderboard,
  LEAGUES,
  type LeaderboardEntry,
} from "@/lib/leaderboard";
import { getWeeklyStats } from "@/lib/study-log";
import { loadRewards } from "@/lib/rewards";
import { loadAvatar } from "@/lib/avatar";
import { fetchMyProfile } from "@/lib/profile-data";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — Study Buddy" }] }),
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const { user } = Route.useRouteContext();

  const profileQuery = useQuery({
    queryKey: ["my-profile", user.id],
    queryFn: () => fetchMyProfile(user.id),
  });

  const userName = profileQuery.data?.draft.full_name || "You";
  const avatar = loadAvatar(user.id);
  const rewards = loadRewards(user.id);
  const weeklyXp = getWeeklyStats(user.id).reduce((s, d) => s + d.xp, 0);
  const totalXp = rewards.xp;
  const league = getCurrentLeague(totalXp);

  const lbQuery = useQuery({
    queryKey: ["leaderboard", user.id],
    queryFn: () => fetchLeaderboard(user.id, userName, avatar, weeklyXp, totalXp),
    staleTime: 60_000,
  });

  const weeklyBoard = lbQuery.data?.weekly ?? [];
  const allTimeBoard = lbQuery.data?.allTime ?? [];
  const weeklyUserEntry = weeklyBoard.find((e) => e.isCurrentUser);
  const allTimeUserEntry = allTimeBoard.find((e) => e.isCurrentUser);

  // Week range label
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay());
  const weekLabel = `${weekStart.toLocaleDateString("en", { month: "short", day: "numeric" })} – ${today.toLocaleDateString("en", { month: "short", day: "numeric" })}`;

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          to="/dashboard"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>

        {/* Hero: user's standing */}
        <div
          className="mt-6 rounded-2xl p-6"
          style={{
            background: `linear-gradient(135deg, ${league.color}22, ${league.color}08)`,
            border: `1px solid ${league.color}44`,
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl"
              style={{ backgroundColor: `${league.color}22` }}
            >
              {avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground">{userName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-lg">{league.emoji}</span>
                <span className="font-bold text-foreground" style={{ color: league.color }}>
                  {league.name} League
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-foreground">
                {weeklyUserEntry ? `#${weeklyUserEntry.rank}` : "–"}
              </p>
              <p className="text-xs text-muted-foreground">this week</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: "Weekly XP", value: weeklyXp.toLocaleString() },
              { label: "Total XP", value: totalXp.toLocaleString() },
              { label: "All-time rank", value: allTimeUserEntry ? `#${allTimeUserEntry.rank}` : "–" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-background/60 p-3 text-center">
                <p className="text-lg font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {league.nextXp && (
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>
                  {totalXp - league.minXp} XP in {league.name}
                </span>
                <span>{league.nextXp - totalXp} to next league</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-background/60">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, Math.round(((totalXp - league.minXp) / (league.nextXp - league.minXp)) * 100))}%`,
                    backgroundColor: league.color,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="weekly" className="mt-8">
          <TabsList className="w-full">
            <TabsTrigger value="weekly" className="flex-1">
              Weekly
            </TabsTrigger>
            <TabsTrigger value="alltime" className="flex-1">
              All-time
            </TabsTrigger>
            <TabsTrigger value="leagues" className="flex-1">
              Leagues
            </TabsTrigger>
          </TabsList>

          {/* Weekly */}
          <TabsContent value="weekly" className="mt-6">
            <p className="mb-4 text-xs text-muted-foreground text-center">{weekLabel}</p>
            {lbQuery.isPending ? (
              <LeaderboardSkeleton />
            ) : (
              <>
                <Podium entries={weeklyBoard.slice(0, 3)} />
                <RankList board={weeklyBoard} startFrom={Math.min(3, weeklyBoard.length)} userId={user.id} labelSuffix="XP this week" />
              </>
            )}
          </TabsContent>

          {/* All-time */}
          <TabsContent value="alltime" className="mt-6">
            <p className="mb-4 text-xs text-muted-foreground text-center">Total XP ever earned</p>
            {lbQuery.isPending ? (
              <LeaderboardSkeleton />
            ) : (
              <>
                <Podium entries={allTimeBoard.slice(0, 3)} />
                <RankList board={allTimeBoard} startFrom={Math.min(3, allTimeBoard.length)} userId={user.id} labelSuffix="XP total" />
              </>
            )}
          </TabsContent>

          {/* Leagues */}
          <TabsContent value="leagues" className="mt-6 space-y-3">
            {LEAGUES.slice()
              .reverse()
              .map((lg) => {
                const isCurrent = lg.name === league.name;
                const achieved = totalXp >= lg.minXp;
                return (
                  <div
                    key={lg.name}
                    className={cn(
                      "flex items-center gap-4 rounded-2xl border p-4 transition-all",
                      isCurrent
                        ? "border-2 shadow-sm"
                        : achieved
                          ? "border-border bg-card"
                          : "border-dashed border-border bg-muted/20 opacity-60",
                    )}
                    style={isCurrent ? { borderColor: lg.color, background: `${lg.color}10` } : {}}
                  >
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
                      style={{ backgroundColor: `${lg.color}22` }}
                    >
                      {lg.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className="font-bold text-foreground"
                          style={isCurrent ? { color: lg.color } : {}}
                        >
                          {lg.name}
                        </p>
                        {isCurrent && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            YOU ARE HERE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {lg.minXp.toLocaleString()} XP{" "}
                        {lg.nextXp ? `– ${lg.nextXp.toLocaleString()} XP` : "and above"}
                      </p>
                      {isCurrent && lg.nextXp && (
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, Math.round(((totalXp - lg.minXp) / (lg.nextXp - lg.minXp)) * 100))}%`,
                              backgroundColor: lg.color,
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      {achieved && !isCurrent && <span className="text-lg">✅</span>}
                      {!achieved && <span className="text-lg">🔒</span>}
                    </div>
                  </div>
                );
              })}

            <div className="mt-4 rounded-xl border border-border bg-muted/30 px-4 py-3 text-center text-xs text-muted-foreground">
              Earn XP by completing practice sessions, missions, and daily streaks.
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function LeaderboardSkeleton() {
  return (
    <div className="space-y-2">
      <div className="mb-6 flex items-end justify-center gap-3">
        <Skeleton className="h-20 w-[90px] rounded-xl" />
        <Skeleton className="h-28 w-[90px] rounded-xl" />
        <Skeleton className="h-14 w-[90px] rounded-xl" />
      </div>
      {Array.from({ length: 7 }, (_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-xl" />
      ))}
    </div>
  );
}

// ── Podium ────────────────────────────────────────────────────────────────────

function Podium({ entries }: { entries: LeaderboardEntry[] }) {
  const [first, second, third] = entries;
  if (!first) return null;

  return (
    <div className="mb-6 flex items-end justify-center gap-3">
      {second && <PodiumStand entry={second} height="h-20" position={2} color="#c0c0c0" />}
      <PodiumStand entry={first} height="h-28" position={1} color="#ffd700" />
      {third && <PodiumStand entry={third} height="h-14" position={3} color="#cd7f32" />}
    </div>
  );
}

function PodiumStand({
  entry,
  height,
  position,
  color,
}: {
  entry: LeaderboardEntry;
  height: string;
  position: 1 | 2 | 3;
  color: string;
}) {
  const medals = ["🥇", "🥈", "🥉"];
  return (
    <div className="flex w-[90px] flex-col items-center gap-1">
      <p className="text-xl">{entry.avatar}</p>
      <p
        className={cn(
          "max-w-full truncate text-center text-xs font-semibold",
          entry.isCurrentUser ? "text-primary" : "text-foreground",
        )}
      >
        {entry.isCurrentUser ? "You" : entry.name}
      </p>
      <p className="text-[10px] text-muted-foreground">{entry.weeklyXp.toLocaleString()} XP</p>
      <div
        className={cn("flex w-full items-center justify-center rounded-t-xl text-xl", height)}
        style={{ backgroundColor: `${color}30`, border: `1px solid ${color}60` }}
      >
        {medals[position - 1]}
      </div>
    </div>
  );
}

// ── Ranked list ───────────────────────────────────────────────────────────────

function RankList({
  board,
  startFrom = 3,
  userId: _userId,
  labelSuffix,
}: {
  board: LeaderboardEntry[];
  startFrom?: number;
  userId: string;
  labelSuffix: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const userRef = useRef<HTMLDivElement>(null);
  const userEntry = board.find((e) => e.isCurrentUser);
  const userRank = userEntry?.rank ?? board.length;

  const pageSize = 10;
  const visible = showAll ? board.slice(startFrom) : board.slice(startFrom, startFrom + pageSize);
  const userVisible = showAll || userRank <= startFrom + pageSize;

  const scrollToUser = () => {
    setShowAll(true);
    setTimeout(() => userRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  };

  return (
    <div className="space-y-1.5">
      {visible.map((entry) => (
        <div
          key={entry.rank}
          ref={entry.isCurrentUser ? userRef : undefined}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
            entry.isCurrentUser
              ? "bg-primary/10 ring-1 ring-primary/20"
              : "bg-card border border-border hover:bg-muted/50",
          )}
        >
          <span
            className={cn(
              "w-7 shrink-0 text-center text-xs font-bold tabular-nums",
              entry.rank === 4 && "text-muted-foreground",
              entry.rank > 4 && "text-muted-foreground",
            )}
          >
            #{entry.rank}
          </span>
          <span className="text-lg shrink-0">{entry.avatar}</span>
          <span
            className={cn(
              "flex-1 truncate text-sm font-medium",
              entry.isCurrentUser ? "text-primary font-semibold" : "text-foreground",
            )}
          >
            {entry.isCurrentUser ? "You" : entry.name}
            {entry.isCurrentUser && (
              <span className="ml-2 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                YOU
              </span>
            )}
          </span>
          <span className="shrink-0 text-xs font-semibold text-muted-foreground">
            {entry.weeklyXp.toLocaleString()} {labelSuffix}
          </span>
        </div>
      ))}

      {!showAll && board.length > startFrom + pageSize && (
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowAll(true)}>
            <ChevronDown className="h-4 w-4" />
            Show all {board.length - 3} players
          </Button>
          {!userVisible && (
            <Button variant="ghost" size="sm" onClick={scrollToUser}>
              Jump to my rank #{userRank}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
