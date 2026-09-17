export interface BlitzHighScore {
  score: number;
  answered: number;
  correct: number;
  bestCombo: number;
  date: string;
}

const scoreKey = (userId: string, subject: string, topic: string) =>
  `blitz:${userId}:${subject}:${topic}`;

export function loadBlitzHighScore(
  userId: string,
  subject: string,
  topic: string,
): BlitzHighScore | null {
  try {
    const raw = localStorage.getItem(scoreKey(userId, subject, topic));
    return raw ? (JSON.parse(raw) as BlitzHighScore) : null;
  } catch {
    return null;
  }
}

export function saveBlitzHighScore(
  userId: string,
  subject: string,
  topic: string,
  s: BlitzHighScore,
): void {
  try {
    const existing = loadBlitzHighScore(userId, subject, topic);
    if (!existing || s.score > existing.score) {
      localStorage.setItem(scoreKey(userId, subject, topic), JSON.stringify(s));
    }
  } catch {
    // localStorage unavailable (SSR or private browsing) — silently skip
  }
}
