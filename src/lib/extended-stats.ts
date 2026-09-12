// Extended progress stats tracked separately from rewards.ts to avoid breaking existing code

export interface ExtendedStats {
  questionsCorrect: number;
  lessonsCompleted: number;
  bossesDefeated: number;
  sessionsCompleted: number;
  perfectSessions: number;
  purchasesMade: number;
  missionsCompleted: number;
  coinsEarned: number;
}

const DEFAULT: ExtendedStats = {
  questionsCorrect: 0,
  lessonsCompleted: 0,
  bossesDefeated: 0,
  sessionsCompleted: 0,
  perfectSessions: 0,
  purchasesMade: 0,
  missionsCompleted: 0,
  coinsEarned: 0,
};

function key(userId: string) {
  return `ext-stats:${userId}`;
}

export function loadExtendedStats(userId: string): ExtendedStats {
  try {
    const raw = localStorage.getItem(key(userId));
    if (raw) return { ...DEFAULT, ...(JSON.parse(raw) as Partial<ExtendedStats>) };
  } catch {}
  return { ...DEFAULT };
}

export function updateExtendedStats(
  userId: string,
  delta: Partial<ExtendedStats>,
): ExtendedStats {
  const current = loadExtendedStats(userId);
  const next: ExtendedStats = { ...current };
  for (const k of Object.keys(delta) as (keyof ExtendedStats)[]) {
    next[k] = (current[k] ?? 0) + (delta[k] ?? 0);
  }
  localStorage.setItem(key(userId), JSON.stringify(next));
  return next;
}
