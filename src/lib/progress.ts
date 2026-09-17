export interface TopicProgress {
  lessonsCompleted: number[];
  practiceCompleted: boolean;
  bossDone: boolean;
  masteryPct: number;
}

export interface MistakeEntry {
  id: string;
  question: string;
  correct_answer: string;
  user_answer: string;
  subject: string;
  topic: string;
  timestamp: number;
  // SRS fields (may be absent on entries saved before Phase 5)
  interval: number; // days until next review
  nextReview: number; // ms timestamp
  repetitions: number; // times correctly recalled
}

export function getDefaultTopicProgress(): TopicProgress {
  return { lessonsCompleted: [], practiceCompleted: false, bossDone: false, masteryPct: 0 };
}

export function calculateMastery(p: TopicProgress): number {
  const lessons = p.lessonsCompleted.filter((n) => n >= 1 && n <= 3).length;
  return Math.min(lessons * 20 + (p.practiceCompleted ? 20 : 0) + (p.bossDone ? 20 : 0), 100);
}

function progressKey(userId: string, subjectId: string) {
  return `progress:${userId}:${subjectId}`;
}

export function loadSubjectProgress(
  userId: string,
  subjectId: string,
): Record<string, TopicProgress> {
  try {
    const raw = localStorage.getItem(progressKey(userId, subjectId));
    return raw ? (JSON.parse(raw) as Record<string, TopicProgress>) : {};
  } catch {
    return {};
  }
}

function saveAllProgress(userId: string, subjectId: string, all: Record<string, TopicProgress>) {
  localStorage.setItem(progressKey(userId, subjectId), JSON.stringify(all));
}

export function completeLesson(
  userId: string,
  subjectId: string,
  topicId: string,
  lessonNum: number,
): TopicProgress {
  const all = loadSubjectProgress(userId, subjectId);
  const curr = all[topicId] ?? getDefaultTopicProgress();
  if (!curr.lessonsCompleted.includes(lessonNum)) {
    curr.lessonsCompleted = [...curr.lessonsCompleted, lessonNum].sort((a, b) => a - b);
  }
  curr.masteryPct = calculateMastery(curr);
  all[topicId] = curr;
  saveAllProgress(userId, subjectId, all);
  return curr;
}

export function completePractice(
  userId: string,
  subjectId: string,
  topicId: string,
): TopicProgress {
  const all = loadSubjectProgress(userId, subjectId);
  const curr = all[topicId] ?? getDefaultTopicProgress();
  curr.practiceCompleted = true;
  curr.masteryPct = calculateMastery(curr);
  all[topicId] = curr;
  saveAllProgress(userId, subjectId, all);
  return curr;
}

export function completeBoss(userId: string, subjectId: string, topicId: string): TopicProgress {
  const all = loadSubjectProgress(userId, subjectId);
  const curr = all[topicId] ?? getDefaultTopicProgress();
  curr.bossDone = true;
  curr.lessonsCompleted = [1, 2, 3];
  curr.practiceCompleted = true;
  curr.masteryPct = 100;
  all[topicId] = curr;
  saveAllProgress(userId, subjectId, all);
  return curr;
}

export function isTopicUnlocked(
  topicIndex: number,
  topicIds: string[],
  progress: Record<string, TopicProgress>,
): boolean {
  if (topicIndex === 0) return true;
  const prevId = topicIds[topicIndex - 1];
  if (!prevId) return false;
  const prev = progress[prevId] ?? getDefaultTopicProgress();
  return prev.lessonsCompleted.length >= 3;
}

const SRS_INTERVALS = [1, 2, 4, 7, 14, 30] as const;

export function saveMistake(
  userId: string,
  entry: Omit<MistakeEntry, "id" | "timestamp" | "interval" | "nextReview" | "repetitions">,
): void {
  const list = loadMistakes(userId);
  const now = Date.now();
  const full: MistakeEntry = {
    ...entry,
    id: Math.random().toString(36).slice(2),
    timestamp: now,
    interval: 1,
    nextReview: now + 24 * 60 * 60 * 1000, // due tomorrow
    repetitions: 0,
  };
  localStorage.setItem(`mistakes:${userId}`, JSON.stringify([full, ...list].slice(0, 50)));
}

// Advance SRS interval after a correct recall; removes entry when fully mastered.
export function advanceMistake(userId: string, id: string): void {
  const list = loadMistakes(userId);
  const entry = list.find((m) => m.id === id);
  if (!entry) return;
  const currentInterval = entry.interval ?? 1;
  const idx = SRS_INTERVALS.indexOf(currentInterval as (typeof SRS_INTERVALS)[number]);
  const nextIdx = Math.min(idx + 1, SRS_INTERVALS.length - 1);
  const nextInterval = SRS_INTERVALS[nextIdx] ?? 30;
  const reps = (entry.repetitions ?? 0) + 1;
  if (nextInterval >= 30 && reps >= 4) {
    // Fully mastered — remove
    localStorage.setItem(`mistakes:${userId}`, JSON.stringify(list.filter((m) => m.id !== id)));
    return;
  }
  const now = Date.now();
  localStorage.setItem(
    `mistakes:${userId}`,
    JSON.stringify(
      list.map((m) =>
        m.id === id
          ? {
              ...m,
              interval: nextInterval,
              nextReview: now + nextInterval * 24 * 60 * 60 * 1000,
              repetitions: reps,
            }
          : m,
      ),
    ),
  );
}

// Reset SRS to day-1 after a wrong recall.
export function resetMistakeInterval(userId: string, id: string): void {
  const list = loadMistakes(userId);
  const now = Date.now();
  localStorage.setItem(
    `mistakes:${userId}`,
    JSON.stringify(
      list.map((m) =>
        m.id === id
          ? { ...m, interval: 1, nextReview: now + 24 * 60 * 60 * 1000, repetitions: 0 }
          : m,
      ),
    ),
  );
}

export function loadMistakes(userId: string): MistakeEntry[] {
  try {
    const raw = localStorage.getItem(`mistakes:${userId}`);
    return raw ? (JSON.parse(raw) as MistakeEntry[]) : [];
  } catch {
    return [];
  }
}

export function removeMistake(userId: string, id: string): void {
  const list = loadMistakes(userId);
  localStorage.setItem(`mistakes:${userId}`, JSON.stringify(list.filter((m) => m.id !== id)));
}

export function clearMistakes(userId: string): void {
  localStorage.removeItem(`mistakes:${userId}`);
}
