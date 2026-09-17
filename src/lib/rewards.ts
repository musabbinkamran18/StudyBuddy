import { Brain, Flame, Star, type LucideIcon, Zap } from "lucide-react";

export interface RewardsStats {
  xp: number;
  level: number;
  streak: number;
  bestStreak: number;
  topicsMastered: number;
  lastActiveDay: string | null;
  lastSessionAt: string | null;
  lastAiAskedAt: string | null;
}

export const EMPTY_REWARDS: RewardsStats = {
  xp: 0,
  level: 1,
  streak: 0,
  bestStreak: 0,
  topicsMastered: 0,
  lastActiveDay: null,
  lastSessionAt: null,
  lastAiAskedAt: null,
};

export function loadRewards(userId: string): RewardsStats {
  try {
    const raw = localStorage.getItem(`rewards:${userId}`);
    if (!raw) return EMPTY_REWARDS;
    const parsed = JSON.parse(raw) as Partial<RewardsStats>;
    return { ...EMPTY_REWARDS, ...parsed };
  } catch {
    return EMPTY_REWARDS;
  }
}

export function saveRewards(userId: string, stats: RewardsStats): void {
  try {
    localStorage.setItem(`rewards:${userId}`, JSON.stringify(stats));
  } catch {
    // storage unavailable; ignore
  }
}

function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function recordSessionCompleted(userId: string, minutes: number): RewardsStats {
  const stats = loadRewards(userId);
  const today = todayKey();
  const yesterday = todayKey(new Date(Date.now() - 86_400_000));

  const streak =
    stats.lastActiveDay === yesterday
      ? stats.streak + 1
      : stats.lastActiveDay === today
        ? stats.streak
        : 1;

  const next: RewardsStats = {
    ...stats,
    xp: stats.xp + Math.max(10, minutes * 2),
    streak,
    bestStreak: Math.max(stats.bestStreak, streak),
    lastActiveDay: today,
    lastSessionAt: new Date().toISOString(),
  };

  saveRewards(userId, next);
  return next;
}

export function recordAiQuestion(userId: string): RewardsStats {
  const stats = loadRewards(userId);
  const next: RewardsStats = {
    ...stats,
    xp: stats.xp + 5,
    lastAiAskedAt: new Date().toISOString(),
  };
  saveRewards(userId, next);
  return next;
}

export function recordTopicMastered(userId: string, topic: string): RewardsStats {
  const stats = loadRewards(userId);
  const next: RewardsStats = {
    ...stats,
    xp: stats.xp + 50,
    topicsMastered: stats.topicsMastered + 1,
  };
  saveRewards(userId, next);
  return next;
}

export interface GoalItem {
  id: string;
  text: string;
  earned: boolean;
}

export function goalsFor(stats: RewardsStats): GoalItem[] {
  return [
    { id: "xp", text: "Earn your first XP", earned: stats.xp > 0 },
    { id: "level", text: "Reach Level 2", earned: stats.level >= 2 },
    { id: "streak", text: "Start a 7-day streak", earned: stats.streak >= 7 },
    { id: "topic", text: "Master your first topic", earned: stats.topicsMastered >= 1 },
  ];
}

export interface AchievementItem {
  id: string;
  icon: LucideIcon;
  label: string;
  tile: string;
  tint: string;
  locked: boolean;
}

export function achievementsFor(stats: RewardsStats): AchievementItem[] {
  return [
    {
      id: "streak-7",
      icon: Flame,
      label: "7 Day Streak",
      tile:
        stats.streak >= 7 ? "bg-primary/15 ring-primary/30" : "bg-muted ring-muted-foreground/15",
      tint: stats.streak >= 7 ? "text-primary" : "text-muted-foreground/70",
      locked: stats.streak < 7,
    },
    {
      id: "first-topic",
      icon: Star,
      label: "First Topic Mastered",
      tile:
        stats.topicsMastered >= 1
          ? "bg-primary/15 ring-primary/30"
          : "bg-muted ring-muted-foreground/15",
      tint: stats.topicsMastered >= 1 ? "text-primary" : "text-muted-foreground/70",
      locked: stats.topicsMastered < 1,
    },
    {
      id: "problem-solver",
      icon: Brain,
      label: "Problem Solver",
      tile: stats.xp >= 50 ? "bg-primary/15 ring-primary/30" : "bg-muted ring-muted-foreground/15",
      tint: stats.xp >= 50 ? "text-primary" : "text-muted-foreground/70",
      locked: stats.xp < 50,
    },
    {
      id: "perfect-10",
      icon: Zap,
      label: "10 Perfect Questions",
      tile:
        stats.bestStreak >= 10
          ? "bg-primary/15 ring-primary/30"
          : "bg-muted ring-muted-foreground/15",
      tint: stats.bestStreak >= 10 ? "text-primary" : "text-muted-foreground/70",
      locked: stats.bestStreak < 10,
    },
  ];
}
