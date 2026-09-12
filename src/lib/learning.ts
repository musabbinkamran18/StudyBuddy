export const CURRICULA = [
  "Cambridge (IGCSE / O Level)",
  "Cambridge A Level",
  "Edexcel",
  "IB",
  "Matric / FSc (Pakistan)",
  "CBSE (India)",
  "US Common Core",
  "National curriculum (other)",
] as const;

export const GRADES = [
  "Grade 1",
  "Grade 2",
  "Grade 3",
  "Grade 4",
  "Grade 5",
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
  "Grade 10",
  "Grade 11",
  "Grade 12",
  "University",
] as const;

export const DIFFICULTIES = [
  { value: "very_easy", label: "Very easy", hint: "Start with the basics" },
  { value: "easy", label: "Easy", hint: "Build confidence first" },
  { value: "medium", label: "Medium", hint: "Standard grade level" },
  { value: "hard", label: "Hard", hint: "Push beyond the syllabus" },
  { value: "very_hard", label: "Very hard", hint: "Olympiad / exam elite" },
] as const;

export const SERIOUSNESS = [
  { value: "casual", label: "Casual", hint: "A few minutes when I feel like it" },
  { value: "regular", label: "Regular", hint: "Steady daily practice" },
  { value: "serious", label: "Serious", hint: "Exams are coming, I need results" },
  { value: "intense", label: "Intense", hint: "Full throttle, push me hard" },
] as const;

export const DAILY_MINUTES = [10, 15, 20, 30, 45, 60, 90, 120] as const;

export type DifficultyValue = (typeof DIFFICULTIES)[number]["value"];
export type SeriousnessValue = (typeof SERIOUSNESS)[number]["value"];

export type LearningProfileDraft = {
  full_name: string;
  age: string;
  grade: string;
  curriculum: string;
  seriousness: SeriousnessValue;
  difficulty: DifficultyValue;
  study_goals: string;
  target_daily_minutes: number;
  subjectIds: string[];
};

export const emptyDraft: LearningProfileDraft = {
  full_name: "",
  age: "",
  grade: "",
  curriculum: "",
  seriousness: "regular",
  difficulty: "medium",
  study_goals: "",
  target_daily_minutes: 30,
  subjectIds: [],
};

export function validateDraft(draft: LearningProfileDraft): string | null {
  if (draft.full_name.trim().length < 2) return "Please enter your name.";
  if (draft.full_name.trim().length > 80) return "That name is too long.";
  const age = Number(draft.age);
  if (draft.age !== "" && (!Number.isFinite(age) || age < 3 || age > 120))
    return "Please enter a real age between 3 and 120.";
  if (!draft.grade) return "Please choose your grade.";
  if (!draft.curriculum) return "Please choose your curriculum.";
  if (draft.subjectIds.length === 0) return "Pick at least one subject.";
  if (draft.study_goals.length > 1000) return "Please keep your goals under 1000 characters.";
  return null;
}
