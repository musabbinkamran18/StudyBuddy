import type { RewardsStats } from "@/lib/rewards";
import type { ExtendedStats } from "@/lib/extended-stats";
import { earnCoins, type CoinState } from "@/lib/coins";

export type AchievementCategory =
  "streak" | "xp" | "questions" | "lessons" | "boss" | "mastery" | "perfect" | "coins" | "missions";

export interface Achievement {
  id: string;
  emoji: string;
  label: string;
  description: string;
  category: AchievementCategory;
  coinReward: number;
  check: (r: RewardsStats, e: ExtendedStats, c: CoinState) => boolean;
  progress?: (
    r: RewardsStats,
    e: ExtendedStats,
    c: CoinState,
  ) => { current: number; target: number };
}

export const ALL_ACHIEVEMENTS: Achievement[] = [
  // ─── Streak ───────────────────────────────────────────────────────────────
  {
    id: "streak-3",
    emoji: "🔥",
    label: "First Flame",
    description: "Maintain a 3-day study streak",
    category: "streak",
    coinReward: 15,
    check: (r) => r.streak >= 3,
    progress: (r) => ({ current: Math.min(r.streak, 3), target: 3 }),
  },
  {
    id: "streak-7",
    emoji: "🔥",
    label: "Week Warrior",
    description: "Maintain a 7-day study streak",
    category: "streak",
    coinReward: 30,
    check: (r) => r.bestStreak >= 7,
    progress: (r) => ({ current: Math.min(r.bestStreak, 7), target: 7 }),
  },
  {
    id: "streak-30",
    emoji: "🏅",
    label: "Unstoppable",
    description: "Maintain a 30-day study streak",
    category: "streak",
    coinReward: 100,
    check: (r) => r.bestStreak >= 30,
    progress: (r) => ({ current: Math.min(r.bestStreak, 30), target: 30 }),
  },

  // ─── XP ───────────────────────────────────────────────────────────────────
  {
    id: "xp-50",
    emoji: "⚡",
    label: "Problem Solver",
    description: "Earn your first 50 XP",
    category: "xp",
    coinReward: 10,
    check: (r) => r.xp >= 50,
    progress: (r) => ({ current: Math.min(r.xp, 50), target: 50 }),
  },
  {
    id: "xp-500",
    emoji: "⭐",
    label: "Rising Star",
    description: "Earn 500 XP total",
    category: "xp",
    coinReward: 25,
    check: (r) => r.xp >= 500,
    progress: (r) => ({ current: Math.min(r.xp, 500), target: 500 }),
  },
  {
    id: "xp-1000",
    emoji: "💫",
    label: "XP Champion",
    description: "Earn 1,000 XP total",
    category: "xp",
    coinReward: 50,
    check: (r) => r.xp >= 1000,
    progress: (r) => ({ current: Math.min(r.xp, 1000), target: 1000 }),
  },
  {
    id: "xp-5000",
    emoji: "🌌",
    label: "Legendary",
    description: "Earn 5,000 XP total",
    category: "xp",
    coinReward: 150,
    check: (r) => r.xp >= 5000,
    progress: (r) => ({ current: Math.min(r.xp, 5000), target: 5000 }),
  },

  // ─── Questions ────────────────────────────────────────────────────────────
  {
    id: "q-1",
    emoji: "🎯",
    label: "First Answer",
    description: "Answer your first question correctly",
    category: "questions",
    coinReward: 5,
    check: (_, e) => e.questionsCorrect >= 1,
    progress: (_, e) => ({ current: Math.min(e.questionsCorrect, 1), target: 1 }),
  },
  {
    id: "q-100",
    emoji: "🧠",
    label: "Century",
    description: "Answer 100 questions correctly",
    category: "questions",
    coinReward: 30,
    check: (_, e) => e.questionsCorrect >= 100,
    progress: (_, e) => ({ current: Math.min(e.questionsCorrect, 100), target: 100 }),
  },
  {
    id: "q-500",
    emoji: "📊",
    label: "Prolific",
    description: "Answer 500 questions correctly",
    category: "questions",
    coinReward: 80,
    check: (_, e) => e.questionsCorrect >= 500,
    progress: (_, e) => ({ current: Math.min(e.questionsCorrect, 500), target: 500 }),
  },

  // ─── Lessons ──────────────────────────────────────────────────────────────
  {
    id: "lesson-1",
    emoji: "📖",
    label: "First Lesson",
    description: "Complete your first lesson",
    category: "lessons",
    coinReward: 10,
    check: (_, e) => e.lessonsCompleted >= 1,
    progress: (_, e) => ({ current: Math.min(e.lessonsCompleted, 1), target: 1 }),
  },
  {
    id: "lesson-10",
    emoji: "🎓",
    label: "Scholar",
    description: "Complete 10 lessons",
    category: "lessons",
    coinReward: 35,
    check: (_, e) => e.lessonsCompleted >= 10,
    progress: (_, e) => ({ current: Math.min(e.lessonsCompleted, 10), target: 10 }),
  },
  {
    id: "lesson-25",
    emoji: "🏫",
    label: "Academic",
    description: "Complete 25 lessons",
    category: "lessons",
    coinReward: 75,
    check: (_, e) => e.lessonsCompleted >= 25,
    progress: (_, e) => ({ current: Math.min(e.lessonsCompleted, 25), target: 25 }),
  },

  // ─── Boss Battles ─────────────────────────────────────────────────────────
  {
    id: "boss-1",
    emoji: "👹",
    label: "Slayer",
    description: "Defeat your first Boss Battle",
    category: "boss",
    coinReward: 20,
    check: (_, e) => e.bossesDefeated >= 1,
    progress: (_, e) => ({ current: Math.min(e.bossesDefeated, 1), target: 1 }),
  },
  {
    id: "boss-5",
    emoji: "⚔️",
    label: "Boss Hunter",
    description: "Defeat 5 Boss Battles",
    category: "boss",
    coinReward: 50,
    check: (_, e) => e.bossesDefeated >= 5,
    progress: (_, e) => ({ current: Math.min(e.bossesDefeated, 5), target: 5 }),
  },
  {
    id: "boss-10",
    emoji: "👑",
    label: "Dragon Slayer",
    description: "Defeat 10 Boss Battles",
    category: "boss",
    coinReward: 100,
    check: (_, e) => e.bossesDefeated >= 10,
    progress: (_, e) => ({ current: Math.min(e.bossesDefeated, 10), target: 10 }),
  },

  // ─── Topic Mastery ────────────────────────────────────────────────────────
  {
    id: "mastery-1",
    emoji: "🌟",
    label: "First Topic",
    description: "Master your first topic (100%)",
    category: "mastery",
    coinReward: 20,
    check: (r) => r.topicsMastered >= 1,
    progress: (r) => ({ current: Math.min(r.topicsMastered, 1), target: 1 }),
  },
  {
    id: "mastery-3",
    emoji: "🗺️",
    label: "Explorer",
    description: "Master 3 topics",
    category: "mastery",
    coinReward: 50,
    check: (r) => r.topicsMastered >= 3,
    progress: (r) => ({ current: Math.min(r.topicsMastered, 3), target: 3 }),
  },
  {
    id: "mastery-10",
    emoji: "🌍",
    label: "Master Learner",
    description: "Master 10 topics",
    category: "mastery",
    coinReward: 120,
    check: (r) => r.topicsMastered >= 10,
    progress: (r) => ({ current: Math.min(r.topicsMastered, 10), target: 10 }),
  },

  // ─── Perfect Sessions ─────────────────────────────────────────────────────
  {
    id: "perfect-1",
    emoji: "💯",
    label: "Perfectionist",
    description: "Complete a session with zero mistakes",
    category: "perfect",
    coinReward: 20,
    check: (_, e) => e.perfectSessions >= 1,
    progress: (_, e) => ({ current: Math.min(e.perfectSessions, 1), target: 1 }),
  },
  {
    id: "perfect-5",
    emoji: "✨",
    label: "Flawless",
    description: "Complete 5 sessions with zero mistakes",
    category: "perfect",
    coinReward: 60,
    check: (_, e) => e.perfectSessions >= 5,
    progress: (_, e) => ({ current: Math.min(e.perfectSessions, 5), target: 5 }),
  },

  // ─── Coins ────────────────────────────────────────────────────────────────
  {
    id: "coins-10",
    emoji: "💰",
    label: "First Coins",
    description: "Earn your first 10 coins",
    category: "coins",
    coinReward: 0,
    check: (_, e) => e.coinsEarned >= 10,
    progress: (_, e) => ({ current: Math.min(e.coinsEarned, 10), target: 10 }),
  },
  {
    id: "coins-shop",
    emoji: "🛍️",
    label: "Shopper",
    description: "Make your first purchase from the shop",
    category: "coins",
    coinReward: 10,
    check: (_, e) => e.purchasesMade >= 1,
    progress: (_, e) => ({ current: Math.min(e.purchasesMade, 1), target: 1 }),
  },
  {
    id: "coins-100",
    emoji: "💎",
    label: "High Roller",
    description: "Accumulate 100 coins total earned",
    category: "coins",
    coinReward: 0,
    check: (_, e) => e.coinsEarned >= 100,
    progress: (_, e) => ({ current: Math.min(e.coinsEarned, 100), target: 100 }),
  },

  // ─── Missions ─────────────────────────────────────────────────────────────
  {
    id: "mission-1",
    emoji: "🎯",
    label: "Mission Complete",
    description: "Complete your first daily mission",
    category: "missions",
    coinReward: 10,
    check: (_, e) => e.missionsCompleted >= 1,
    progress: (_, e) => ({ current: Math.min(e.missionsCompleted, 1), target: 1 }),
  },
  {
    id: "mission-10",
    emoji: "💼",
    label: "Daily Grinder",
    description: "Complete 10 daily missions",
    category: "missions",
    coinReward: 40,
    check: (_, e) => e.missionsCompleted >= 10,
    progress: (_, e) => ({ current: Math.min(e.missionsCompleted, 10), target: 10 }),
  },
];

// ─── Unlock state ─────────────────────────────────────────────────────────────

interface AchievementState {
  unlocked: string[]; // achievement ids
  notified: string[]; // which ones have been shown as toast
}

function stateKey(userId: string) {
  return `achievements:${userId}`;
}

export function loadAchievementState(userId: string): AchievementState {
  try {
    const raw = localStorage.getItem(stateKey(userId));
    if (raw) return JSON.parse(raw) as AchievementState;
  } catch {}
  return { unlocked: [], notified: [] };
}

function saveAchievementState(userId: string, state: AchievementState): void {
  localStorage.setItem(stateKey(userId), JSON.stringify(state));
}

// Returns newly unlocked achievement ids (ones not previously unlocked)
export function checkAndUnlockAchievements(
  userId: string,
  rewards: RewardsStats,
  extended: ExtendedStats,
  coinState: CoinState,
): Achievement[] {
  const state = loadAchievementState(userId);
  const newlyUnlocked: Achievement[] = [];

  for (const achievement of ALL_ACHIEVEMENTS) {
    if (state.unlocked.includes(achievement.id)) continue;
    if (achievement.check(rewards, extended, coinState)) {
      state.unlocked.push(achievement.id);
      newlyUnlocked.push(achievement);
      if (achievement.coinReward > 0) {
        earnCoins(userId, achievement.coinReward);
      }
    }
  }

  if (newlyUnlocked.length > 0) {
    saveAchievementState(userId, state);
  }

  return newlyUnlocked;
}

// Mark achievements as notified (so we don't toast them again)
export function markNotified(userId: string, ids: string[]): void {
  const state = loadAchievementState(userId);
  for (const id of ids) {
    if (!state.notified.includes(id)) state.notified.push(id);
  }
  saveAchievementState(userId, state);
}

export function getUnnotifiedAchievements(userId: string): Achievement[] {
  const state = loadAchievementState(userId);
  const newOnes = state.unlocked.filter((id) => !state.notified.includes(id));
  return ALL_ACHIEVEMENTS.filter((a) => newOnes.includes(a.id));
}

export const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  streak: "Streak",
  xp: "XP",
  questions: "Questions",
  lessons: "Lessons",
  boss: "Boss Battles",
  mastery: "Mastery",
  perfect: "Perfect",
  coins: "Coins",
  missions: "Missions",
};
