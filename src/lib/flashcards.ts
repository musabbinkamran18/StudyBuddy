import type { PracticeQuestion } from "./practice";

export interface FlashcardRecord {
  id: string;
  front: string;
  answer: string;
  explanation: string;
  topic: string;
  interval: number; // days between reviews (SRS)
  dueDate: string; // YYYY-MM-DD
  reviews: number;
}

const storageKey = (userId: string, subject: string, topic: string) =>
  `flashcards:${userId}:${subject}:${topic}`;

export function loadFlashcardDeck(
  userId: string,
  subject: string,
  topic: string,
): FlashcardRecord[] {
  try {
    const raw = localStorage.getItem(storageKey(userId, subject, topic));
    return raw ? (JSON.parse(raw) as FlashcardRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveFlashcardDeck(
  userId: string,
  subject: string,
  topic: string,
  deck: FlashcardRecord[],
): void {
  try {
    localStorage.setItem(storageKey(userId, subject, topic), JSON.stringify(deck));
  } catch {
    // localStorage unavailable (SSR or private browsing) — silently skip
  }
}

export function createDeck(questions: PracticeQuestion[]): FlashcardRecord[] {
  const today = new Date().toISOString().slice(0, 10);
  return questions.map((q, i) => ({
    id: String(i),
    front: q.question,
    answer: q.correct_answer,
    explanation: q.explanation,
    topic: q.topic,
    interval: 1,
    dueDate: today,
    reviews: 0,
  }));
}

export function getDueCount(deck: FlashcardRecord[]): number {
  const today = new Date().toISOString().slice(0, 10);
  return deck.filter((c) => c.dueDate <= today).length;
}

export function getDueCards(deck: FlashcardRecord[]): FlashcardRecord[] {
  const today = new Date().toISOString().slice(0, 10);
  return deck.filter((c) => c.dueDate <= today);
}

// Double the review interval (up to 30 days)
export function markKnown(card: FlashcardRecord): FlashcardRecord {
  const newInterval = Math.min(card.interval * 2, 30);
  const due = new Date();
  due.setDate(due.getDate() + newInterval);
  return {
    ...card,
    interval: newInterval,
    dueDate: due.toISOString().slice(0, 10),
    reviews: card.reviews + 1,
  };
}

// Reset to 1-day interval
export function markHard(card: FlashcardRecord): FlashcardRecord {
  const due = new Date();
  due.setDate(due.getDate() + 1);
  return {
    ...card,
    interval: 1,
    dueDate: due.toISOString().slice(0, 10),
    reviews: card.reviews + 1,
  };
}
