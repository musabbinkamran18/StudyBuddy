import type { PracticeQuestion } from "./practice";

export interface DailyChallenge {
  date: string; // YYYY-MM-DD
  subject: string;
  topic: string;
  question: PracticeQuestion;
  answered: boolean;
  correct: boolean | null;
  userAnswer: string | null;
}

export const DAILY_XP = 25;
export const DAILY_COINS = 15;

const storageKey = (userId: string) => `daily-challenge:${userId}`;

export function loadDailyChallenge(userId: string): DailyChallenge | null {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    const c = JSON.parse(raw) as DailyChallenge;
    const today = new Date().toISOString().slice(0, 10);
    return c.date === today ? c : null;
  } catch {
    return null;
  }
}

export function saveDailyChallenge(userId: string, c: DailyChallenge): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(c));
  } catch {
    // localStorage unavailable (SSR or private browsing) — silently skip
  }
}
