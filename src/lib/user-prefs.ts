export type StudyDay = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type StudyTime = "morning" | "afternoon" | "evening" | "night";
export type LearningStyle = "visual" | "reading" | "practical" | "mixed";

export const STUDY_DAY_LABELS: Record<StudyDay, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

export const ALL_STUDY_DAYS: StudyDay[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const STUDY_TIME_OPTIONS: {
  value: StudyTime;
  label: string;
  emoji: string;
  hint: string;
}[] = [
  { value: "morning", label: "Morning", emoji: "🌅", hint: "6 am – 12 pm" },
  { value: "afternoon", label: "Afternoon", emoji: "☀️", hint: "12 pm – 5 pm" },
  { value: "evening", label: "Evening", emoji: "🌇", hint: "5 pm – 9 pm" },
  { value: "night", label: "Night owl", emoji: "🌙", hint: "9 pm – late" },
];

export const LEARNING_STYLE_OPTIONS: {
  value: LearningStyle;
  label: string;
  emoji: string;
  hint: string;
}[] = [
  { value: "visual", label: "Visual", emoji: "👁️", hint: "Diagrams, charts, analogies" },
  { value: "reading", label: "Reading", emoji: "📖", hint: "Text, definitions, structured notes" },
  { value: "practical", label: "Practical", emoji: "🔧", hint: "Examples, worked problems" },
  { value: "mixed", label: "Mixed", emoji: "🎨", hint: "A bit of everything" },
];

export const QUESTIONS_PER_SESSION_OPTIONS = [5, 10, 15, 20] as const;

export const LIVES_OPTIONS: { value: number; label: string }[] = [
  { value: 3, label: "3 lives (strict)" },
  { value: 5, label: "5 lives (standard)" },
  { value: 10, label: "10 lives (relaxed)" },
  { value: 0, label: "Unlimited (chill mode)" },
];

export const WEEKLY_XP_GOALS = [100, 250, 500, 750, 1000, 1500, 2000] as const;

export interface UserPrefs {
  bio: string;
  studyDays: StudyDay[];
  preferredStudyTime: StudyTime;
  examDate: string | null;
  examLabel: string;
  questionsPerSession: number;
  livesPerSession: number;
  learningStyle: LearningStyle;
  weeklyXpGoal: number;
  showOnLeaderboard: boolean;
}

export const DEFAULT_USER_PREFS: UserPrefs = {
  bio: "",
  studyDays: ["mon", "tue", "wed", "thu", "fri"],
  preferredStudyTime: "afternoon",
  examDate: null,
  examLabel: "My exam",
  questionsPerSession: 10,
  livesPerSession: 5,
  learningStyle: "mixed",
  weeklyXpGoal: 500,
  showOnLeaderboard: true,
};

const KEY = (userId: string) => `user-prefs:${userId}`;

export function loadUserPrefs(userId: string): UserPrefs {
  try {
    const raw = localStorage.getItem(KEY(userId));
    if (!raw) return { ...DEFAULT_USER_PREFS };
    return { ...DEFAULT_USER_PREFS, ...(JSON.parse(raw) as Partial<UserPrefs>) };
  } catch {
    return { ...DEFAULT_USER_PREFS };
  }
}

export function saveUserPrefs(userId: string, prefs: UserPrefs): void {
  try {
    localStorage.setItem(KEY(userId), JSON.stringify(prefs));
  } catch {
    // localStorage unavailable (SSR or private browsing) — silently skip
  }
}

export function daysUntilExam(examDate: string | null): number | null {
  if (!examDate) return null;
  const exam = new Date(examDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  exam.setHours(0, 0, 0, 0);
  const diff = Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : null;
}
