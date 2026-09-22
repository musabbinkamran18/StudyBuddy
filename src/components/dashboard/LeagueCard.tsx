import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  getCurrentLeague,
  fetchLeaderboard,
  type LeaderboardEntry,
} from "@/lib/leaderboard";
import { loadAvatar } from "@/lib/avatar";
import { getWeeklyStats } from "@/lib/study-log";

interface LeagueCardProps {
  totalXp: number;
  userName: string;
  userId: string;
}

export function LeagueCard({ totalXp, userName, userId }: LeagueCardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const league = getCurrentLeague(totalXp);

  useEffect(() => {
    const userAvatar = loadAvatar(userId);
    const weeklyXp = getWeeklyStats(userId).reduce((sum, d) => sum + d.xp, 0);
    fetchLeaderboard(userId, userName, userAvatar, weeklyXp, totalXp).then(({ weekly }) =>
      setLeaderboard(weekly),
    );
  }, [totalXp, userName, userId]);

  // Show 5 entries around the current user
  const userEntry = leaderboard.find((e) => e.isCurrentUser);
  const userRank = userEntry?.rank ?? leaderboard.length;
  const visible = getVisibleEntries(leaderboard, userRank);

  const nextLeague = league.nextXp
    ? {
        xp: league.nextXp,
        pct: Math.min(
          100,
          Math.round(((totalXp - league.minXp) / (league.nextXp - league.minXp)) * 100),
        ),
      }
    : null;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      {/* League header */}
      <div className="mb-4 flex items-center gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
          style={{ backgroundColor: `${league.color}22` }}
        >
          {league.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Your League
          </p>
          <p className="text-lg font-bold text-foreground" style={{ color: league.color }}>
            {league.name}
          </p>
        </div>
        {userRank <= leaderboard.length && (
          <div className="shrink-0 text-right">
            <p className="text-2xl font-bold text-foreground">#{userRank}</p>
            <p className="text-xs text-muted-foreground">this week</p>
          </div>
        )}
      </div>

      {/* Progress to next league */}
      {nextLeague && (
        <div className="mb-4">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>{totalXp - league.minXp} XP earned</span>
            <span>{league.nextXp! - totalXp} XP to next league</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${nextLeague.pct}%`, backgroundColor: league.color }}
            />
          </div>
        </div>
      )}

      {/* Mini leaderboard */}
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          This week
        </p>
        <Link to="/leaderboard" className="text-xs font-medium text-primary hover:underline">
          Full leaderboard →
        </Link>
      </div>
      <div className="space-y-1.5">
        {visible.map((entry) => (
          <div
            key={entry.rank}
            className={cn(
              "flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm transition-colors",
              entry.isCurrentUser ? "bg-primary/10 font-semibold" : "hover:bg-muted/50",
            )}
          >
            <span
              className={cn(
                "w-6 shrink-0 text-center text-xs font-bold",
                entry.rank === 1 && "text-yellow-500",
                entry.rank === 2 && "text-slate-400",
                entry.rank === 3 && "text-amber-600",
                entry.rank > 3 && "text-muted-foreground",
              )}
            >
              {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : `#${entry.rank}`}
            </span>
            <span className="text-base">{entry.avatar}</span>
            <span className={cn("flex-1 truncate", entry.isCurrentUser && "text-primary")}>
              {entry.isCurrentUser ? "You" : entry.name}
            </span>
            <span className="shrink-0 text-xs font-semibold text-muted-foreground">
              {entry.weeklyXp.toLocaleString()} XP
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getVisibleEntries(board: LeaderboardEntry[], userRank: number): LeaderboardEntry[] {
  if (board.length <= 5) return board;
  // Always show top 3
  const top3 = board.slice(0, 3);
  // Show user + 1 above + 1 below
  const userIdx = board.findIndex((e) => e.isCurrentUser);
  const around: LeaderboardEntry[] = [];
  if (userIdx > 3) {
    if (board[userIdx - 1]) around.push(board[userIdx - 1]!);
    around.push(board[userIdx]!);
    if (board[userIdx + 1]) around.push(board[userIdx + 1]!);
  }
  // Merge + dedupe
  const seen = new Set<number>();
  const result: LeaderboardEntry[] = [];
  for (const e of [...top3, ...around]) {
    if (!seen.has(e.rank)) {
      seen.add(e.rank);
      result.push(e);
    }
  }
  // Add separator indicator if there's a gap
  return result.slice(0, 6);
}
