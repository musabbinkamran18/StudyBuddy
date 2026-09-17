import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchSubjects, fetchMyProfile, saveMyProfile } from "@/lib/profile-data";
import {
  emptyDraft,
  validateDraft,
  type LearningProfileDraft,
  type DifficultyValue,
  type SeriousnessValue,
} from "@/lib/learning";
import {
  AboutYouFields,
  SchoolFields,
  SubjectPicker,
  OptionCards,
  GoalFields,
  DIFFICULTIES,
  SERIOUSNESS,
} from "@/components/ProfileFields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSignOut } from "@/hooks/useSignOut";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your learning profile — Study Buddy" },
      {
        name: "description",
        content:
          "Tell Study Buddy your grade, curriculum, subjects, difficulty and study goals so practice adapts to you.",
      },
      { property: "og:title", content: "Set up your learning profile — Study Buddy" },
      {
        property: "og:description",
        content: "A few quick questions so your practice adapts to you.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Onboarding,
});

const STEPS = [
  { title: "About you", description: "So we know who we're coaching." },
  { title: "Your school setup", description: "Grade and curriculum shape every question." },
  { title: "Your subjects", description: "Pick everything you want to practise." },
  { title: "Your challenge level", description: "How hard should we push?" },
  { title: "Your goals", description: "What are we working towards?" },
];

function Onboarding() {
  const navigate = useNavigate();
  const signOut = useSignOut();
  const { user } = Route.useRouteContext();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<LearningProfileDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);

  const subjectsQuery = useQuery({ queryKey: ["subjects"], queryFn: fetchSubjects });
  const profileQuery = useQuery({
    queryKey: ["my-profile", user.id],
    queryFn: () => fetchMyProfile(user.id),
  });

  useEffect(() => {
    if (!profileQuery.data) return;
    if (profileQuery.data.completed) {
      navigate({ to: "/dashboard", replace: true });
      return;
    }
    setDraft((current) => ({
      ...profileQuery.data.draft,
      full_name:
        profileQuery.data.draft.full_name ||
        current.full_name ||
        (user.user_metadata?.["full_name"] as string | undefined) ||
        "",
    }));
  }, [profileQuery.data, navigate, user]);

  const set = (patch: Partial<LearningProfileDraft>) =>
    setDraft((current) => ({ ...current, ...patch }));

  const toggleSubject = (id: string) =>
    setDraft((current) => ({
      ...current,
      subjectIds: current.subjectIds.includes(id)
        ? current.subjectIds.filter((s) => s !== id)
        : [...current.subjectIds, id],
    }));

  const stepValid = () => {
    if (step === 0) return draft.full_name.trim().length >= 2;
    if (step === 1) return Boolean(draft.grade && draft.curriculum);
    if (step === 2) return draft.subjectIds.length > 0;
    return true;
  };

  const finish = async () => {
    const problem = validateDraft(draft);
    if (problem) {
      toast.error(problem);
      return;
    }
    setSaving(true);
    try {
      await saveMyProfile(user.id, draft);
      toast.success("Your learning profile is ready.");
      navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      console.error("saveMyProfile failed", error);
      const message = error instanceof Error ? error.message : undefined;
      toast.error(
        message
          ? `We couldn't save your profile: ${message}`
          : "We couldn't save your profile. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const loading = subjectsQuery.isLoading || profileQuery.isLoading;

  return (
    <main className="min-h-screen bg-background px-4 py-14">
      <div className="mx-auto w-full max-w-2xl">
        <p className="text-sm text-muted-foreground">
          Step {step + 1} of {STEPS.length}
        </p>
        <Progress className="mt-3" value={((step + 1) / STEPS.length) * 100} />

        <Card className="mt-8" style={{ boxShadow: "var(--shadow-elevated)" }}>
          <CardHeader>
            <CardTitle className="font-serif text-3xl tracking-tight">
              {STEPS[step]!.title}
            </CardTitle>
            <CardDescription>{STEPS[step]!.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="py-8 text-sm text-muted-foreground">Loading…</p>
            ) : (
              <>
                {step === 0 && <AboutYouFields draft={draft} set={set} />}
                {step === 1 && <SchoolFields draft={draft} set={set} />}
                {step === 2 && (
                  <SubjectPicker
                    subjects={subjectsQuery.data ?? []}
                    selected={draft.subjectIds}
                    toggle={toggleSubject}
                  />
                )}
                {step === 3 && (
                  <div className="space-y-8">
                    <div>
                      <h3 className="mb-3 text-sm font-medium">Question difficulty</h3>
                      <OptionCards
                        options={DIFFICULTIES}
                        value={draft.difficulty}
                        onChange={(v) => set({ difficulty: v as DifficultyValue })}
                      />
                    </div>
                    <div>
                      <h3 className="mb-3 text-sm font-medium">How serious are you?</h3>
                      <OptionCards
                        options={SERIOUSNESS}
                        value={draft.seriousness}
                        onChange={(v) => set({ seriousness: v as SeriousnessValue })}
                      />
                    </div>
                  </div>
                )}
                {step === 4 && <GoalFields draft={draft} set={set} />}
              </>
            )}

            <div className="mt-10 flex items-center justify-between gap-4">
              <Button
                variant="ghost"
                disabled={step === 0 || saving}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                Back
              </Button>
              {step < STEPS.length - 1 ? (
                <Button disabled={!stepValid() || loading} onClick={() => setStep((s) => s + 1)}>
                  Continue
                </Button>
              ) : (
                <Button disabled={saving} onClick={finish}>
                  {saving ? "Saving…" : "Finish setup"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <button
          type="button"
          className="mt-6 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => void signOut()}
        >
          Sign out
        </button>
      </div>
    </main>
  );
}
