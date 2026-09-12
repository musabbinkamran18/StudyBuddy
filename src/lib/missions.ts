// Daily missions: 3 per day, auto-reset at midnight

export interface Mission {
  id: string;
  emoji: string;
  title: string;
  target: number;
  progress: number;
  rewardCoins: number;
  rewardXp: number;
  claimed: boolean;
}

export interface DailyActivity {
  date: string;
  xpEarned: number;
  lessonsCompleted: number;
  questionsCorrect: number;
  bossesDefeated: number;
}

function todayKey() {
  return new Date().toLocaleDateString("en-CA");
}

function activityKey(userId: string) {
  return `daily-activity:${userId}`;
}

function missionsKey(userId: string) {
  return `daily-missions:${userId}`;
}

export function loadDailyActivity(userId: string): DailyActivity {
  try {
    const raw = localStorage.getItem(activityKey(userId));
    if (raw) {
      const data = JSON.parse(raw) as DailyActivity;
      if (data.date === todayKey()) return data;
    }
  } catch {}
  return {
    date: todayKey(),
    xpEarned: 0,
    lessonsCompleted: 0,
    questionsCorrect: 0,
    bossesDefeated: 0,
  };
}

export function trackActivity(
  userId: string,
  delta: Partial<Omit<DailyActivity, "date">>,
): DailyActivity {
  const activity = loadDailyActivity(userId);
  if (delta.xpEarned) activity.xpEarned += delta.xpEarned;
  if (delta.lessonsCompleted) activity.lessonsCompleted += delta.lessonsCompleted;
  if (delta.questionsCorrect) activity.questionsCorrect += delta.questionsCorrect;
  if (delta.bossesDefeated) activity.bossesDefeated += delta.bossesDefeated;
  localStorage.setItem(activityKey(userId), JSON.stringify(activity));
  return activity;
}

// Fixed daily mission templates — shuffled with a date-based seed
const MISSION_POOL: Omit<Mission, "id" | "progress" | "claimed">[] = [
  { emoji: "⭐", title: "Earn 100 XP today", target: 100, rewardCoins: 20, rewardXp: 30 },
  { emoji: "⭐", title: "Earn 200 XP today", target: 200, rewardCoins: 35, rewardXp: 50 },
  { emoji: "📚", title: "Complete 2 lessons", target: 2, rewardCoins: 20, rewardXp: 40 },
  { emoji: "📚", title: "Complete 3 lessons", target: 3, rewardCoins: 30, rewardXp: 50 },
  { emoji: "🎯", title: "Answer 10 questions correctly", target: 10, rewardCoins: 15, rewardXp: 25 },
  { emoji: "🎯", title: "Answer 20 questions correctly", target: 20, rewardCoins: 25, rewardXp: 40 },
  { emoji: "👹", title: "Defeat a Boss Battle", target: 1, rewardCoins: 40, rewardXp: 60 },
  { emoji: "🔥", title: "Earn 50 XP today", target: 50, rewardCoins: 10, rewardXp: 15 },
];

function dateSeededShuffle<T>(arr: T[], seed: string): T[] {
  const numSeed = seed.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = (numSeed + i * 17) % (i + 1);
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function generateMissionSet(): Omit<Mission, "id" | "progress" | "claimed">[] {
  const today = todayKey();
  const shuffled = dateSeededShuffle(MISSION_POOL, today);
  // Pick 3 diverse ones (first is XP, second is lessons/correct, third is boss or other)
  const picked: typeof MISSION_POOL = [];
  const categories = new Set<string>();
  for (const m of shuffled) {
    const cat = m.emoji;
    if (!categories.has(cat) && picked.length < 3) {
      picked.push(m);
      categories.add(cat);
    }
  }
  // Fill remaining if needed
  for (const m of shuffled) {
    if (picked.length >= 3) break;
    if (!picked.includes(m)) picked.push(m);
  }
  return picked.slice(0, 3);
}

export function loadDailyMissions(userId: string): Mission[] {
  try {
    const raw = localStorage.getItem(missionsKey(userId));
    if (raw) {
      const data = JSON.parse(raw) as { date: string; missions: Mission[] };
      if (data.date === todayKey()) return data.missions;
    }
  } catch {}
  return generateDailyMissions(userId);
}

export function generateDailyMissions(userId: string): Mission[] {
  const templates = generateMissionSet();
  const missions: Mission[] = templates.map((t, i) => ({
    ...t,
    id: `mission-${i}`,
    progress: 0,
    claimed: false,
  }));
  localStorage.setItem(missionsKey(userId), JSON.stringify({ date: todayKey(), missions }));
  return missions;
}

export function syncMissionProgress(userId: string): Mission[] {
  const missions = loadDailyMissions(userId);
  const activity = loadDailyActivity(userId);

  const updated = missions.map((m) => {
    if (m.claimed) return m;
    let progress = 0;
    if (m.title.toLowerCase().includes("xp")) {
      progress = Math.min(activity.xpEarned, m.target);
    } else if (m.title.toLowerCase().includes("lesson")) {
      progress = Math.min(activity.lessonsCompleted, m.target);
    } else if (m.title.toLowerCase().includes("question")) {
      progress = Math.min(activity.questionsCorrect, m.target);
    } else if (m.title.toLowerCase().includes("boss")) {
      progress = Math.min(activity.bossesDefeated, m.target);
    }
    return { ...m, progress };
  });

  localStorage.setItem(missionsKey(userId), JSON.stringify({ date: todayKey(), missions: updated }));
  return updated;
}

export function claimMission(
  userId: string,
  missionId: string,
): { coins: number; xp: number } | null {
  const missions = loadDailyMissions(userId);
  const mission = missions.find((m) => m.id === missionId);
  if (!mission || mission.claimed || mission.progress < mission.target) return null;

  const updated = missions.map((m) => (m.id === missionId ? { ...m, claimed: true } : m));
  localStorage.setItem(missionsKey(userId), JSON.stringify({ date: todayKey(), missions: updated }));
  return { coins: mission.rewardCoins, xp: mission.rewardXp };
}
