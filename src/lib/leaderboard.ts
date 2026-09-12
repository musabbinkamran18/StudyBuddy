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
  "Aisha K.", "Omar B.", "Sara M.", "Ali R.", "Zara N.",
  "Hassan A.", "Layla Q.", "Bilal T.", "Noor F.", "Yusuf H.",
  "Fatima J.", "Ahmed S.", "Mia C.", "Noah W.", "Emma L.",
  "Lucas P.", "Olivia D.", "Ethan G.", "Ava R.", "James M.",
];

const AVATARS = ["😺", "🐼", "🦊", "🐯", "🐸", "🦁", "🐧", "🦄", "🐨", "🐙",
  "🦋", "🐝", "🦅", "🐬", "🦉", "🦊", "🐢", "🦋", "🦩", "🐻"];

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
): LeaderboardEntry[] {
  const seed = weekSeed();
  const count = 14; // 14 fake players + 1 real user = 15 total

  const fakes: { name: string; avatar: string; weeklyXp: number }[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    let name: string;
    do {
      name = FAKE_NAMES[seededRand(seed + i * 3, 0, FAKE_NAMES.length - 1)]!;
    } while (usedNames.has(name));
    usedNames.add(name);

    // Spread XP around the user's value: some above, some below
    const spread = seededRand(seed + i * 7, 0, 100);
    let xp: number;
    if (i < 4) {
      // Top players — clearly ahead
      xp = userWeeklyXp + seededRand(seed + i * 11, 80, 300);
    } else if (i >= count - 3) {
      // Bottom players — clearly behind
      xp = Math.max(0, userWeeklyXp - seededRand(seed + i * 13, 80, 250));
    } else {
      // Middle players — scattered around
      const delta = seededRand(seed + i * 17, -120, 120);
      xp = Math.max(0, userWeeklyXp + delta);
    }

    fakes.push({
      name,
      avatar: AVATARS[seededRand(seed + i * 5, 0, AVATARS.length - 1)]!,
      weeklyXp: xp,
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

export function getWeeklyXp(userId: string): number {
  // Sum XP earned this week from daily activity records
  // For now: use the rewards.ts data as an approximation
  try {
    const raw = localStorage.getItem(`rewards:${userId}`);
    if (!raw) return 0;
    const data = JSON.parse(raw) as { xp?: number };
    // Weekly XP = rough weekly estimate (last ~7 sessions)
    return Math.min(data.xp ?? 0, data.xp ?? 0);
  } catch {
    return 0;
  }
}
