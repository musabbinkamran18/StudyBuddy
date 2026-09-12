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

export async function fetchTopics(subjectId: string): Promise<Topic[]> {
  if (await isDemo()) {
    const subject = DEMO_SUBJECTS.find((s) => s.id === subjectId);
    return subject ? (DEMO_TOPICS[subject.code] ?? []) : [];
  }
  const { data, error } = await supabase
    .from("topics")
    .select("id, subject_id, name, slug, description, grade, difficulty, sort_order")
    .eq("subject_id", subjectId)
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map((t) => ({ ...t, difficulty: t.difficulty as DifficultyValue }));
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
    completed: row.onboarding_completed,
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

  await supabase.from("profiles").update({ display_name: draft.full_name.trim() }).eq("id", userId);
}
