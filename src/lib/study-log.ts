export interface DayStats {
  xp: number;
  questions: number;
  sessions: number;
}

function logKey(userId: string) {
  return `study-log:${userId}`;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function loadStudyLog(userId: string): Record<string, DayStats> {
  try {
    const raw = localStorage.getItem(logKey(userId));
    return raw ? (JSON.parse(raw) as Record<string, DayStats>) : {};
  } catch {
    return {};
  }
}

export function logStudyActivity(userId: string, delta: Partial<DayStats>): void {
  const log = loadStudyLog(userId);
  const today = todayStr();
  const curr = log[today] ?? { xp: 0, questions: 0, sessions: 0 };
  log[today] = {
    xp: curr.xp + (delta.xp ?? 0),
    questions: curr.questions + (delta.questions ?? 0),
    sessions: curr.sessions + (delta.sessions ?? 0),
  };
  // Keep last 30 days
  const dates = Object.keys(log).sort();
  if (dates.length > 30) {
    for (const old of dates.slice(0, dates.length - 30)) {
      delete log[old];
    }
  }
  try {
    localStorage.setItem(logKey(userId), JSON.stringify(log));
  } catch {}
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function getWeeklyStats(
  userId: string,
): Array<{ date: string; label: string; isToday: boolean } & DayStats> {
  const log = loadStudyLog(userId);
  const today = new Date();
  const days: Array<{ date: string; label: string; isToday: boolean } & DayStats> = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const stats = log[dateStr] ?? { xp: 0, questions: 0, sessions: 0 };
    days.push({
      date: dateStr,
      label: i === 0 ? "Today" : DAY_LABELS[d.getDay()]!,
      isToday: i === 0,
      ...stats,
    });
  }
  return days;
}
