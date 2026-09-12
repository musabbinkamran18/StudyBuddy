import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { loadAvatar, saveAvatar, AVATAR_OPTIONS, type AvatarEmoji } from "@/lib/avatar";
import { loadRewards } from "@/lib/rewards";
import { loadExtendedStats } from "@/lib/extended-stats";
import { loadAchievementState } from "@/lib/achievements";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My Learning Profile — Study Buddy" },
      {
        name: "description",
        content:
          "Update your grade, curriculum, subjects, difficulty, seriousness and study goals whenever they change.",
      },
      { property: "og:title", content: "My Learning Profile — Study Buddy" },
      {
        property: "og:description",
        content: "Change your subjects, difficulty and goals at any time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<LearningProfileDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [avatar, setAvatar] = useState<AvatarEmoji>(() => loadAvatar(user.id));

  const rewards = loadRewards(user.id);
  const extended = loadExtendedStats(user.id);
  const achievementState = loadAchievementState(user.id);
  const unlockedCount = achievementState.unlocked.length;

  const subjectsQuery = useQuery({ queryKey: ["subjects"], queryFn: fetchSubjects });
  const profileQuery = useQuery({
    queryKey: ["my-profile", user.id],
    queryFn: () => fetchMyProfile(user.id),
  });

  useEffect(() => {
    if (profileQuery.data) setDraft(profileQuery.data.draft);
  }, [profileQuery.data]);

  const set = (patch: Partial<LearningProfileDraft>) =>
    setDraft((current) => ({ ...current, ...patch }));

  const toggleSubject = (id: string) =>
    setDraft((current) => ({
      ...current,
      subjectIds: current.subjectIds.includes(id)
        ? current.subjectIds.filter((s) => s !== id)
        : [...current.subjectIds, id],
    }));

  const save = async () => {
    const problem = validateDraft(draft);
    if (problem) {
      toast.error(problem);
      return;
    }
    setSaving(true);
    try {
      await saveMyProfile(user.id, draft);
      await queryClient.invalidateQueries({ queryKey: ["my-profile", user.id] });
      toast.success("Preferences saved.");
    } catch {
      toast.error("We couldn't save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (profileQuery.data && !profileQuery.data.completed) {
    navigate({ to: "/onboarding", replace: true });
  }

  const loading = subjectsQuery.isLoading || profileQuery.isLoading;

  return (
    <main className="min-h-screen bg-background px-4 py-14">
      <div className="mx-auto w-full max-w-3xl">
        <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to dashboard
        </Link>
        <h1 className="mt-6 font-serif text-4xl tracking-tight">My Learning Profile</h1>
        <p className="mt-2 text-muted-foreground">
          Change anything here at any time — your practice adapts immediately.
        </p>

        {/* Stats overview */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total XP", value: rewards.xp.toLocaleString(), emoji: "⭐" },
            { label: "Best Streak", value: `${rewards.bestStreak}d`, emoji: "🔥" },
            { label: "Topics Mastered", value: rewards.topicsMastered, emoji: "🏅" },
            { label: "Achievements", value: `${unlockedCount}/25`, emoji: "🏆" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border bg-card p-4 text-center">
              <p className="text-2xl">{stat.emoji}</p>
              <p className="mt-1 text-lg font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="mt-4 flex gap-3">
          <Link
            to="/achievements"
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors"
          >
            🏆 View Achievements
          </Link>
          <Link
            to="/shop"
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors"
          >
            🛍️ Shop
          </Link>
        </div>

        {loading ? (
          <p className="mt-10 text-sm text-muted-foreground">Loading your profile…</p>
        ) : (
          <div className="mt-10 space-y-6">
            {/* Avatar section */}
            <Card style={{ boxShadow: "var(--shadow-elevated)" }}>
              <CardHeader>
                <CardTitle className="text-lg">Your Avatar</CardTitle>
                <CardDescription>Pick an emoji that represents you.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-4xl">
                    {avatar}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your avatar appears on the leaderboard and your profile.
                  </p>
                </div>
                <div className="grid grid-cols-10 gap-2">
                  {AVATAR_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setAvatar(emoji);
                        saveAvatar(user.id, emoji);
                        toast.success("Avatar updated!");
                      }}
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl text-xl transition-all hover:scale-110",
                        avatar === emoji
                          ? "bg-primary/20 ring-2 ring-primary scale-110"
                          : "bg-muted hover:bg-muted/80",
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Section title="About you" description="Your name and age.">
              <AboutYouFields draft={draft} set={set} />
            </Section>

            <Section title="School setup" description="Grade and curriculum.">
              <SchoolFields draft={draft} set={set} />
            </Section>

            <Section title="Subjects" description="Everything you want to practise.">
              <SubjectPicker
                subjects={subjectsQuery.data ?? []}
                selected={draft.subjectIds}
                toggle={toggleSubject}
              />
            </Section>

            <Section title="Difficulty" description="How hard your questions should be.">
              <OptionCards
                options={DIFFICULTIES}
                value={draft.difficulty}
                onChange={(v) => set({ difficulty: v as DifficultyValue })}
              />
            </Section>

            <Section title="Seriousness" description="How intensely you want to be pushed.">
              <OptionCards
                options={SERIOUSNESS}
                value={draft.seriousness}
                onChange={(v) => set({ seriousness: v as SeriousnessValue })}
              />
            </Section>

            <Section title="Goals" description="What you're working towards.">
              <GoalFields draft={draft} set={set} />
            </Section>

            <div className="flex justify-end">
              <Button size="lg" disabled={saving} onClick={save}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card style={{ boxShadow: "var(--shadow-elevated)" }}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
