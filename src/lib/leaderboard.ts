// League system + demo weekly leaderboard

export interface League {
  name: string;
  emoji: string;
  color: string;
  minXp: number;
  nextXp: number | null;
}

export const LEAGUES: League[] = [
  { name: "Bronze", emoji: "🥉", color: "#cd7f32", minXp: 0, nextXp: 500 },
  { name: "Silver", emoji: "🥈", color: "#c0c0c0", minXp: 500, nextXp: 1500 },
  { name: "Gold", emoji: "🥇", color: "#ffd700", minXp: 1500, nextXp: 3500 },
  { name: "Platinum", emoji: "💎", color: "#a0d8ef", minXp: 3500, nextXp: 7500 },
  { name: "Diamond", emoji: "🏆", color: "#b9f2ff", minXp: 7500, nextXp: null },
];

export function getCurrentLeague(totalXp: number): League {
  for (let i = LEAGUES.length - 1; i >= 0; i--) {
    if (totalXp >= LEAGUES[i]!.minXp) return LEAGUES[i]!;
  }
  return LEAGUES[0]!;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  weeklyXp: number;
  isCurrentUser?: boolean;
}

const FAKE_NAMES = [
  "Aisha K.",
  "Omar B.",
  "Sara M.",
  "Ali R.",
  "Zara N.",
  "Hassan A.",
  "Layla Q.",
  "Bilal T.",
  "Noor F.",
  "Yusuf H.",
  "Fatima J.",
  "Ahmed S.",
  "Mia C.",
  "Noah W.",
  "Emma L.",
  "Lucas P.",
  "Olivia D.",
  "Ethan G.",
  "Ava R.",
  "James M.",
];

const AVATARS = [
  "😺",
  "🐼",
  "🦊",
  "🐯",
  "🐸",
  "🦁",
  "🐧",
  "🦄",
  "🐨",
  "🐙",
  "🦋",
  "🐝",
  "🦅",
  "🐬",
  "🦉",
  "🦊",
  "🐢",
  "🦋",
  "🦩",
  "🐻",
];

// Seed based on week number so the leaderboard stays consistent within a week
function weekSeed() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const week = Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return week * 997 + now.getFullYear() * 13;
}

function seededRand(seed: number, min: number, max: number) {
  const x = Math.sin(seed) * 10000;
  return min + Math.floor((x - Math.floor(x)) * (max - min + 1));
}

export function generateWeeklyLeaderboard(
  userWeeklyXp: number,
  userName: string,
  userAvatar = "⭐",
  userTotalXp = 0,
): LeaderboardEntry[] {
  const seed = weekSeed();
  const league = getCurrentLeague(userTotalXp);
  // Clamp fake weekly XP so it stays plausible for the league's total XP tier
  const leagueRange = league.nextXp != null ? league.nextXp - league.minXp : 5000;
  const maxWeeklyXp = Math.max(userWeeklyXp + 300, Math.round(leagueRange * 0.4));

  const count = 14; // 14 fake players + 1 real user = 15 total

  const fakes: { name: string; avatar: string; weeklyXp: number }[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    let name: string;
    let attempt = 0;
    do {
      name = FAKE_NAMES[seededRand(seed + i * 3 + attempt * 97, 0, FAKE_NAMES.length - 1)]!;
      attempt++;
    } while (usedNames.has(name) && attempt < FAKE_NAMES.length * 2);
    usedNames.add(name);

    // Spread XP around the user's value: some above, some below
    let xp: number;
    if (i < 4) {
      xp = userWeeklyXp + seededRand(seed + i * 11, 80, 300);
    } else if (i >= count - 3) {
      xp = Math.max(0, userWeeklyXp - seededRand(seed + i * 13, 80, 250));
    } else {
      const delta = seededRand(seed + i * 17, -120, 120);
      xp = Math.max(0, userWeeklyXp + delta);
    }

    fakes.push({
      name,
      avatar: AVATARS[seededRand(seed + i * 5, 0, AVATARS.length - 1)]!,
      weeklyXp: Math.min(xp, maxWeeklyXp),
    });
  }

  const all = [
    ...fakes,
    {
      name: userName,
      avatar: userAvatar,
      weeklyXp: userWeeklyXp,
      isCurrentUser: true,
    },
  ];

  all.sort((a, b) => b.weeklyXp - a.weeklyXp);

  return all.map((entry, i) => ({ ...entry, rank: i + 1 }));
}

/** Fetch real leaderboard from Supabase. Falls back to generated fake data in demo mode. */
export async function fetchLeaderboard(
  currentUserId: string,
  fallbackUserName: string,
  fallbackAvatar: string,
  fallbackWeeklyXp: number,
  fallbackTotalXp: number,
): Promise<{ weekly: LeaderboardEntry[]; allTime: LeaderboardEntry[] }> {
  try {
    const { supabase } = await import("@/integrations/supabase/client");

    const [gsRes, profRes] = await Promise.all([
      supabase.from("game_state").select("user_id, rewards, avatar, study_log"),
      supabase
        .from("student_profiles")
        .select("user_id, full_name")
        .eq("onboarding_completed", true),
    ]);

    const rows = gsRes.data;
    if (!rows || rows.length === 0) throw new Error("empty");

    const nameMap = new Map<string, string>();
    (profRes.data ?? []).forEach((p) => nameMap.set(p.user_id, p.full_name));

    type Raw = { userId: string; name: string; avatar: string; totalXp: number; weekXp: number; isCurrentUser: boolean };

    const today = new Date();
    const last7: string[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      return d.toISOString().slice(0, 10);
    });

    const entries: Raw[] = rows.map((gs) => {
      const rwd = gs.rewards as { xp?: number } | null;
      const totalXp = rwd?.xp ?? 0;

      const log = gs.study_log as Record<string, { xp?: number } | undefined> | null;
      const weekXp = log
        ? last7.reduce((sum, k) => sum + (log[k]?.xp ?? 0), 0)
        : 0;

      return {
        userId: gs.user_id,
        name: nameMap.get(gs.user_id) ?? "Anonymous",
        avatar: gs.avatar || "⭐",
        totalXp,
        weekXp,
        isCurrentUser: gs.user_id === currentUserId,
      };
    });

    // Only show users who are in the same league as the current user
    const currentUserXp = entries.find((e) => e.isCurrentUser)?.totalXp ?? fallbackTotalXp;
    const currentLeagueName = getCurrentLeague(currentUserXp).name;
    const leagueEntries = entries.filter(
      (e) => getCurrentLeague(e.totalXp).name === currentLeagueName,
    );

    const toBoard = (sorted: Raw[]): LeaderboardEntry[] =>
      sorted.map((e, i) => ({
        rank: i + 1,
        name: e.name,
        avatar: e.avatar,
        weeklyXp: e.totalXp, // repurposed as the display value; callers pick the right sort
        isCurrentUser: e.isCurrentUser,
      }));

    const weekly = toBoard(
      [...leagueEntries].sort((a, b) => b.weekXp - a.weekXp).map((e) => ({ ...e, totalXp: e.weekXp })),
    );
    const allTime = toBoard([...leagueEntries].sort((a, b) => b.totalXp - a.totalXp));

    return { weekly, allTime };
  } catch {
    return {
      weekly: generateWeeklyLeaderboard(fallbackWeeklyXp, fallbackUserName, fallbackAvatar, fallbackTotalXp),
      allTime: generateAllTimeLeaderboard(fallbackTotalXp, fallbackUserName, fallbackAvatar),
    };
  }
}

export function getWeeklyXp(userId: string): number {
  try {
    const raw = localStorage.getItem(`study-log:${userId}`);
    if (!raw) return 0;
    const log = JSON.parse(raw) as Record<string, { xp?: number }>;
    const today = new Date();
    let total = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      total += log[key]?.xp ?? 0;
    }
    return total;
  } catch {
    return 0;
  }
}

export function generateAllTimeLeaderboard(
  userTotalXp: number,
  userName: string,
  userAvatar = "⭐",
): LeaderboardEntry[] {
  const seed = weekSeed() + 9999;
  const count = 14;
  const fakes: { name: string; avatar: string; weeklyXp: number }[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    let name: string;
    let attempt = 0;
    do {
      name = FAKE_NAMES[seededRand(seed + i * 7 + attempt * 53, 0, FAKE_NAMES.length - 1)]!;
      attempt++;
    } while (usedNames.has(name) && attempt < FAKE_NAMES.length * 2);
    usedNames.add(name);

    let xp: number;
    if (i < 3) {
      xp = userTotalXp + seededRand(seed + i * 23, 500, 3000);
    } else if (i >= count - 3) {
      xp = Math.max(0, userTotalXp - seededRand(seed + i * 31, 300, 1500));
    } else {
      const delta = seededRand(seed + i * 41, -800, 800);
      xp = Math.max(0, userTotalXp + delta);
    }

    fakes.push({
      name,
      avatar: AVATARS[seededRand(seed + i * 9, 0, AVATARS.length - 1)]!,
      weeklyXp: xp,
    });
  }

  const userLeagueName = getCurrentLeague(userTotalXp).name;
  const all = [
    ...fakes.filter((f) => getCurrentLeague(f.weeklyXp).name === userLeagueName),
    { name: userName, avatar: userAvatar, weeklyXp: userTotalXp, isCurrentUser: true },
  ];
  all.sort((a, b) => b.weeklyXp - a.weeklyXp);
  return all.map((entry, i) => ({ ...entry, rank: i + 1 }));
}
