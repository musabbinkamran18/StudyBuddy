import type { TutorMessage } from "./tutor";

export type TutorPersonality = "chill" | "funny" | "strict" | "motivational" | "genius";
export type ExplanationStyle = "short" | "detailed" | "stepbystep" | "examples" | "analogy";
export type TutorLanguage = "english" | "urdu" | "simple" | "mixed";

export interface TutorPrefs {
  personality: TutorPersonality;
  style: ExplanationStyle;
  language: TutorLanguage;
}

export const DEFAULT_PREFS: TutorPrefs = {
  personality: "chill",
  style: "stepbystep",
  language: "english",
};

export const PERSONALITY_LABELS: Record<TutorPersonality, { emoji: string; label: string }> = {
  chill:        { emoji: "😎", label: "Chill & Friendly" },
  funny:        { emoji: "😂", label: "Funny" },
  strict:       { emoji: "🧑‍🏫", label: "Strict Teacher" },
  motivational: { emoji: "🚀", label: "Motivational Coach" },
  genius:       { emoji: "🧠", label: "Genius/Expert" },
};

export const STYLE_LABELS: Record<ExplanationStyle, { emoji: string; label: string }> = {
  short:      { emoji: "⚡", label: "Super Short" },
  detailed:   { emoji: "📖", label: "Detailed" },
  stepbystep: { emoji: "🪜", label: "Step-by-step" },
  examples:   { emoji: "💡", label: "Examples First" },
  analogy:    { emoji: "🎨", label: "Visual/Analogy" },
};

export const LANGUAGE_LABELS: Record<TutorLanguage, { emoji: string; label: string }> = {
  english: { emoji: "🇬🇧", label: "English" },
  urdu:    { emoji: "🇵🇰", label: "Urdu" },
  simple:  { emoji: "🔤", label: "Simple English" },
  mixed:   { emoji: "🌐", label: "Mixed (Urdu+English)" },
};

const PREFS_KEY = (userId: string) => `tutor-prefs:${userId}`;
const HISTORY_KEY = (userId: string) => `tutor-history:${userId}`;
const MAX_HISTORY = 40;

export function loadTutorPrefs(userId: string): TutorPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY(userId));
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<TutorPrefs>) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function saveTutorPrefs(userId: string, prefs: TutorPrefs): void {
  try {
    localStorage.setItem(PREFS_KEY(userId), JSON.stringify(prefs));
  } catch {}
}

export function loadChatHistory(userId: string): TutorMessage[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY(userId));
    if (!raw) return [];
    return JSON.parse(raw) as TutorMessage[];
  } catch {
    return [];
  }
}

export function saveChatHistory(userId: string, messages: TutorMessage[]): void {
  try {
    const capped = messages.slice(-MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY(userId), JSON.stringify(capped));
  } catch {}
}

export function clearChatHistory(userId: string): void {
  try {
    localStorage.removeItem(HISTORY_KEY(userId));
  } catch {}
}
