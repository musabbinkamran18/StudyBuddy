import { supabase } from "@/integrations/supabase/client";
import type { LearningProfileDraft, DifficultyValue, SeriousnessValue } from "./learning";
import { emptyDraft } from "./learning";
import {
  DEMO_SUBJECTS,
  DEMO_TOPICS,
  isDemo,
  loadDemoProfile,
  saveDemoProfile,
  type DemoProfileState,
} from "./backend";
import {
  getTopicsForStudent,
  normalizeGrade,
  normalizeCurriculum,
  type SyllabusEntry,
} from "./syllabus";

export type Subject = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
};

export type Topic = {
  id: string;
  subject_id: string;
  name: string;
  slug: string | null;
  description: string | null;
  grade: string | null;
  curriculum: string | null;
  difficulty: DifficultyValue;
  sort_order: number;
};

export async function fetchSubjects(): Promise<Subject[]> {
  if (await isDemo()) return DEMO_SUBJECTS;
  const { data, error } = await supabase
    .from("subjects")
    .select("id, code, name, description, color, icon")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

function syllabusToTopics(
  entries: SyllabusEntry[],
  subject: { id: string; code: string },
  grade: string,
  curriculumKey: string,
): Topic[] {
  return entries.map((e, i) => ({
    id: `syllabus-${subject.code}-${grade}-${curriculumKey}-${i}`,
    subject_id: subject.id,
    name: e.name,
    slug: null,
    description: e.description ?? null,
    grade,
    curriculum: curriculumKey,
    difficulty: e.difficulty,
    sort_order: e.sort_order,
  }));
}

export async function fetchTopics(
  subjectId: string,
  grade?: string,
  curriculum?: string,
): Promise<Topic[]> {
  if (await isDemo()) {
    const subject = DEMO_SUBJECTS.find((s) => s.id === subjectId);
    if (!subject) return [];

    if (grade && curriculum) {
      const entries = getTopicsForStudent(subject.code, grade, curriculum);
      if (entries) {
        const key = normalizeCurriculum(curriculum, grade);
        return syllabusToTopics(entries, subject, normalizeGrade(grade), key);
      }
    }
    return (DEMO_TOPICS[subject.code] ?? []).map((t) => ({ ...t, curriculum: null }));
  }

  // Cloud mode — try grade+curriculum-specific topics first, fall back to generic
  const base = supabase
    .from("topics")
    .select("id, subject_id, name, slug, description, grade, curriculum, difficulty, sort_order")
    .eq("subject_id", subjectId)
    .eq("is_active", true);

  if (grade && curriculum) {
    const gradeKey = normalizeGrade(grade);
    const currKey = normalizeCurriculum(curriculum, grade);
    const { data: specific } = await base
      .eq("grade", gradeKey)
      .eq("curriculum", currKey)
      .order("sort_order");
    if (specific && specific.length > 0) {
      return specific.map((t) => ({ ...t, difficulty: t.difficulty as DifficultyValue, curriculum: t.curriculum ?? null }));
    }
  }

  // Generic fallback (no grade/curriculum filter)
  const { data, error } = await base.is("curriculum", null).order("sort_order");
  if (error) throw error;
  return (data ?? []).map((t) => ({ ...t, difficulty: t.difficulty as DifficultyValue, curriculum: null }));
}

export function fromDemoProfile(state: DemoProfileState): {
  draft: LearningProfileDraft;
  exists: boolean;
  completed: boolean;
} {
  return { draft: state.draft, exists: state.completed, completed: state.completed };
}

export async function fetchMyProfile(userId: string): Promise<{
  draft: LearningProfileDraft;
  exists: boolean;
  completed: boolean;
}> {
  if (await isDemo()) return fromDemoProfile(loadDemoProfile());

  const [profileRes, subjectsRes] = await Promise.all([
    supabase.from("student_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("student_subjects").select("subject_id, current_level").eq("user_id", userId),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (subjectsRes.error) throw subjectsRes.error;

  const row = profileRes.data;
  const subjectIds = (subjectsRes.data ?? []).map((s) => s.subject_id);
  const difficulty = (subjectsRes.data?.[0]?.current_level ?? "medium") as DifficultyValue;

  if (!row) {
    return { draft: { ...emptyDraft, subjectIds }, exists: false, completed: false };
  }

  return {
    exists: true,
    // A row can be marked complete with zero subjects if an earlier save was
    // interrupted between writing the profile and the subjects — treat that as
    // incomplete so the user is routed back to onboarding instead of getting
    // stuck with an empty subject picker everywhere else in the app.
    completed: row.onboarding_completed && subjectIds.length > 0,
    draft: {
      full_name: row.full_name ?? "",
      age: row.age == null ? "" : String(row.age),
      grade: row.grade ?? "",
      curriculum: row.curriculum ?? "",
      seriousness: row.seriousness as SeriousnessValue,
      difficulty,
      study_goals: row.study_goals ?? "",
      target_daily_minutes: row.target_daily_minutes,
      subjectIds,
    },
  };
}

export async function saveMyProfile(userId: string, draft: LearningProfileDraft) {
  if (await isDemo()) {
    saveDemoProfile(draft);
    return;
  }

  // Subjects are written first and must succeed before the profile is marked
  // "completed" — otherwise a failure here would leave onboarding_completed=true
  // with zero subjects, and the onboarding redirect would never let the user back
  // in to fix it (see the subjectIds.length check on fetchMyProfile's callers).
  const { error: deleteError } = await supabase
    .from("student_subjects")
    .delete()
    .eq("user_id", userId);
  if (deleteError) throw deleteError;

  if (draft.subjectIds.length > 0) {
    const { error: insertError } = await supabase.from("student_subjects").insert(
      draft.subjectIds.map((subject_id, index) => ({
        user_id: userId,
        subject_id,
        priority: index + 1,
        current_level: draft.difficulty,
      })),
    );
    if (insertError) throw insertError;
  }

  const { error: profileError } = await supabase.from("student_profiles").upsert(
    {
      user_id: userId,
      full_name: draft.full_name.trim(),
      age: draft.age === "" ? null : Number(draft.age),
      grade: draft.grade,
      curriculum: draft.curriculum,
      seriousness: draft.seriousness,
      study_goals: draft.study_goals.trim() || null,
      target_daily_minutes: draft.target_daily_minutes,
      onboarding_completed: true,
    },
    { onConflict: "user_id" },
  );
  if (profileError) throw profileError;

  await supabase.from("profiles").update({ display_name: draft.full_name.trim() }).eq("id", userId);
}
