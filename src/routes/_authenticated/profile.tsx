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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { loadAvatar, saveAvatar, AVATAR_OPTIONS, type AvatarEmoji } from "@/lib/avatar";
import { loadRewards } from "@/lib/rewards";
import { loadExtendedStats } from "@/lib/extended-stats";
import { loadAchievementState } from "@/lib/achievements";
import {
  loadTutorPrefs,
  saveTutorPrefs,
  PERSONALITY_LABELS,
  STYLE_LABELS,
  LANGUAGE_LABELS,
  type TutorPersonality,
  type ExplanationStyle,
  type TutorLanguage,
} from "@/lib/tutor-prefs";
import {
  loadUserPrefs,
  saveUserPrefs,
  type UserPrefs,
  type StudyDay,
  ALL_STUDY_DAYS,
  STUDY_DAY_LABELS,
  STUDY_TIME_OPTIONS,
  LEARNING_STYLE_OPTIONS,
  QUESTIONS_PER_SESSION_OPTIONS,
  LIVES_OPTIONS,
  WEEKLY_XP_GOALS,
  daysUntilExam,
} from "@/lib/user-prefs";
import { cn } from "@/lib/utils";
import { useSignOut } from "@/hooks/useSignOut";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — Study Buddy" },
      {
        name: "description",
        content: "Personalize your learning profile, AI tutor, schedule and practice settings.",
      },
      { property: "og:title", content: "My Profile — Study Buddy" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const signOut = useSignOut();
  const queryClient = useQueryClient();

  // Learning profile draft
  const [draft, setDraft] = useState<LearningProfileDraft>(emptyDraft);
  const [savingLearning, setSavingLearning] = useState(false);

  // Avatar
  const [avatar, setAvatar] = useState<AvatarEmoji>(() => loadAvatar(user.id));

  // User prefs (schedule, practice, appearance)
  const [prefs, setPrefs] = useState<UserPrefs>(() => loadUserPrefs(user.id));
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Tutor prefs (auto-save on change)
  const [tutorPrefs, setTutorPrefs] = useState(() => loadTutorPrefs(user.id));

  // Stats
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

  useEffect(() => {
    if (profileQuery.data && !profileQuery.data.completed) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [profileQuery.data, navigate]);

  const set = (patch: Partial<LearningProfileDraft>) =>
    setDraft((current) => ({ ...current, ...patch }));

  const toggleSubject = (id: string) =>
    setDraft((current) => ({
      ...current,
      subjectIds: current.subjectIds.includes(id)
        ? current.subjectIds.filter((s) => s !== id)
        : [...current.subjectIds, id],
    }));

  const saveLearning = async () => {
    const problem = validateDraft(draft);
    if (problem) {
      toast.error(problem);
      return;
    }
    setSavingLearning(true);
    try {
      await saveMyProfile(user.id, draft);
      await queryClient.invalidateQueries({ queryKey: ["my-profile", user.id] });
      toast.success("Learning profile saved.");
    } catch {
      toast.error("Couldn't save changes. Please try again.");
    } finally {
      setSavingLearning(false);
    }
  };

  const handleSavePrefs = async () => {
    setSavingPrefs(true);
    try {
      saveUserPrefs(user.id, prefs);
      toast.success("Preferences saved.");
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleTutorChange = <K extends keyof typeof tutorPrefs>(
    key: K,
    value: (typeof tutorPrefs)[K],
  ) => {
    const updated = { ...tutorPrefs, [key]: value };
    setTutorPrefs(updated);
    saveTutorPrefs(user.id, updated);
    toast.success("Tutor preference updated.");
  };

  const loading = subjectsQuery.isLoading || profileQuery.isLoading;
  const examDays = daysUntilExam(prefs.examDate);

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              ← Dashboard
            </Link>
            <h1 className="mt-2 font-serif text-3xl tracking-tight">My Profile</h1>
          </div>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => void signOut()}
          >
            Sign out
          </button>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="w-full justify-start gap-1 overflow-x-auto h-auto p-1 flex-wrap">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="learning">Learning</TabsTrigger>
            <TabsTrigger value="tutor">AI Tutor</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="practice">Practice</TabsTrigger>
          </TabsList>

          {/* ── PROFILE TAB ── */}
          <TabsContent value="profile" className="mt-6 space-y-6">
            {/* Avatar + identity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Identity</CardTitle>
                <CardDescription>How you appear in the app and on the leaderboard.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar picker */}
                <div>
                  <p className="mb-3 text-sm font-medium text-foreground">Avatar</p>
                  <div className="mb-4 flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-4xl ring-2 ring-primary/20">
                      {avatar}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {draft.full_name || "Student"}
                      </p>
                      {prefs.bio && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{prefs.bio}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-10 gap-2">
                    {AVATAR_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
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
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio / tagline</Label>
                  <Input
                    id="bio"
                    maxLength={120}
                    value={prefs.bio}
                    placeholder="e.g. Acing my A Levels one topic at a time 🚀"
                    onChange={(e) => setPrefs((p) => ({ ...p, bio: e.target.value }))}
                    onBlur={() => saveUserPrefs(user.id, prefs)}
                  />
                  <p className="text-xs text-muted-foreground">{prefs.bio.length}/120</p>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: "Total XP", value: rewards.xp.toLocaleString(), emoji: "⭐" },
                    { label: "Best Streak", value: `${rewards.bestStreak}d`, emoji: "🔥" },
                    { label: "Sessions", value: extended.totalSessions, emoji: "📚" },
                    { label: "Achievements", value: `${unlockedCount}/25`, emoji: "🏆" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-border bg-muted/30 p-4 text-center"
                    >
                      <p className="text-2xl">{stat.emoji}</p>
                      <p className="mt-1 text-lg font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {examDays !== null && (
                  <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                    <span className="text-2xl">📅</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {examDays === 0
                          ? "Exam day is TODAY!"
                          : `${examDays} day${examDays !== 1 ? "s" : ""} until ${prefs.examLabel || "your exam"}`}
                      </p>
                      <p className="text-xs text-muted-foreground">Set on the Schedule tab</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick links */}
            <div className="flex flex-wrap gap-3">
              <Link
                to="/achievements"
                className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:border-primary/30 hover:bg-primary/5 transition-colors"
              >
                🏆 Achievements
              </Link>
              <Link
                to="/shop"
                className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:border-primary/30 hover:bg-primary/5 transition-colors"
              >
                🛍️ Shop
              </Link>
              <Link
                to="/mistakes"
                className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:border-primary/30 hover:bg-primary/5 transition-colors"
              >
                🔁 Mistake log
              </Link>
            </div>
          </TabsContent>

          {/* ── LEARNING TAB ── */}
          <TabsContent value="learning" className="mt-6 space-y-6">
            {loading ? (
              <p className="text-sm text-muted-foreground py-8">Loading…</p>
            ) : (
              <>
                <Section title="About you" description="Your name and age.">
                  <AboutYouFields draft={draft} set={set} />
                </Section>

                <Section
                  title="School setup"
                  description="Grade and curriculum shape every question."
                >
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
                  <Button size="lg" disabled={savingLearning} onClick={saveLearning}>
                    {savingLearning ? "Saving…" : "Save learning profile"}
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          {/* ── AI TUTOR TAB ── */}
          <TabsContent value="tutor" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Tutor Personality</CardTitle>
                <CardDescription>
                  Changes take effect in your next tutor session. Saves automatically.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <PrefsGrid
                  label="Personality"
                  items={Object.entries(PERSONALITY_LABELS).map(([v, { emoji, label }]) => ({
                    value: v,
                    label,
                    emoji,
                    hint: "",
                  }))}
                  selected={tutorPrefs.personality}
                  onSelect={(v) => handleTutorChange("personality", v as TutorPersonality)}
                />
                <PrefsGrid
                  label="Explanation style"
                  items={Object.entries(STYLE_LABELS).map(([v, { emoji, label }]) => ({
                    value: v,
                    label,
                    emoji,
                    hint: "",
                  }))}
                  selected={tutorPrefs.style}
                  onSelect={(v) => handleTutorChange("style", v as ExplanationStyle)}
                />
                <PrefsGrid
                  label="Language"
                  items={Object.entries(LANGUAGE_LABELS).map(([v, { emoji, label }]) => ({
                    value: v,
                    label,
                    emoji,
                    hint: "",
                  }))}
                  selected={tutorPrefs.language}
                  onSelect={(v) => handleTutorChange("language", v as TutorLanguage)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── SCHEDULE TAB ── */}
          <TabsContent value="schedule" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Study Schedule</CardTitle>
                <CardDescription>Tell Study Buddy when and how much you study.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Study days */}
                <div>
                  <p className="mb-3 text-sm font-medium text-foreground">Days you plan to study</p>
                  <div className="flex flex-wrap gap-2">
                    {ALL_STUDY_DAYS.map((day) => {
                      const active = prefs.studyDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() =>
                            setPrefs((p) => ({
                              ...p,
                              studyDays: active
                                ? p.studyDays.filter((d) => d !== day)
                                : [...p.studyDays, day],
                            }))
                          }
                          className={cn(
                            "w-14 rounded-xl border py-2 text-sm font-medium transition-colors",
                            active
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-muted-foreground hover:border-primary/40",
                          )}
                        >
                          {STUDY_DAY_LABELS[day]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Preferred time */}
                <div>
                  <p className="mb-3 text-sm font-medium text-foreground">Preferred study time</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {STUDY_TIME_OPTIONS.map((opt) => {
                      const active = prefs.preferredStudyTime === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setPrefs((p) => ({ ...p, preferredStudyTime: opt.value }))}
                          className={cn(
                            "rounded-xl border p-3 text-left transition-colors",
                            active
                              ? "border-primary bg-primary/10"
                              : "border-border bg-card hover:border-primary/40",
                          )}
                        >
                          <p className="text-xl">{opt.emoji}</p>
                          <p className="mt-1 text-sm font-medium text-foreground">{opt.label}</p>
                          <p className="text-xs text-muted-foreground">{opt.hint}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Exam date */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="examLabel">Exam name</Label>
                    <Input
                      id="examLabel"
                      maxLength={60}
                      value={prefs.examLabel}
                      placeholder="e.g. A Level Physics Paper 2"
                      onChange={(e) => setPrefs((p) => ({ ...p, examLabel: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="examDate">Exam date</Label>
                    <Input
                      id="examDate"
                      type="date"
                      value={prefs.examDate ?? ""}
                      onChange={(e) =>
                        setPrefs((p) => ({ ...p, examDate: e.target.value || null }))
                      }
                    />
                    {examDays !== null && (
                      <p className="text-xs font-medium text-amber-600">
                        {examDays === 0
                          ? "That's today!"
                          : `${examDays} day${examDays !== 1 ? "s" : ""} away`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Weekly XP goal */}
                <div className="space-y-2">
                  <Label>Weekly XP goal</Label>
                  <Select
                    value={String(prefs.weeklyXpGoal)}
                    onValueChange={(v) => setPrefs((p) => ({ ...p, weeklyXpGoal: Number(v) }))}
                  >
                    <SelectTrigger className="w-60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WEEKLY_XP_GOALS.map((g) => (
                        <SelectItem key={g} value={String(g)}>
                          {g.toLocaleString()} XP / week
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button size="lg" disabled={savingPrefs} onClick={handleSavePrefs}>
                {savingPrefs ? "Saving…" : "Save schedule"}
              </Button>
            </div>
          </TabsContent>

          {/* ── PRACTICE TAB ── */}
          <TabsContent value="practice" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Practice Settings</CardTitle>
                <CardDescription>Tune how each practice session works.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Questions per session */}
                <div>
                  <p className="mb-3 text-sm font-medium text-foreground">Questions per session</p>
                  <div className="flex flex-wrap gap-3">
                    {QUESTIONS_PER_SESSION_OPTIONS.map((n) => {
                      const active = prefs.questionsPerSession === n;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setPrefs((p) => ({ ...p, questionsPerSession: n }))}
                          className={cn(
                            "w-16 rounded-xl border py-3 text-center text-base font-bold transition-colors",
                            active
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-muted-foreground hover:border-primary/40",
                          )}
                        >
                          {n}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Lives per session */}
                <div>
                  <p className="mb-3 text-sm font-medium text-foreground">Lives per session</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {LIVES_OPTIONS.map((opt) => {
                      const active = prefs.livesPerSession === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setPrefs((p) => ({ ...p, livesPerSession: opt.value }))}
                          className={cn(
                            "rounded-xl border p-3 text-left transition-colors",
                            active
                              ? "border-primary bg-primary/10"
                              : "border-border bg-card hover:border-primary/40",
                          )}
                        >
                          <p className="text-sm font-medium text-foreground">
                            {opt.value === 0 ? "∞" : "❤️".repeat(Math.min(opt.value, 3))}
                            {opt.value > 3 ? ` ×${opt.value}` : ""}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{opt.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Learning style */}
                <div>
                  <p className="mb-3 text-sm font-medium text-foreground">Your learning style</p>
                  <p className="mb-3 text-xs text-muted-foreground">
                    This influences how your AI tutor explains concepts.
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {LEARNING_STYLE_OPTIONS.map((opt) => {
                      const active = prefs.learningStyle === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setPrefs((p) => ({ ...p, learningStyle: opt.value }))}
                          className={cn(
                            "rounded-xl border p-3 text-left transition-colors",
                            active
                              ? "border-primary bg-primary/10"
                              : "border-border bg-card hover:border-primary/40",
                          )}
                        >
                          <p className="text-xl">{opt.emoji}</p>
                          <p className="mt-1 text-sm font-medium text-foreground">{opt.label}</p>
                          <p className="text-xs text-muted-foreground">{opt.hint}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Leaderboard visibility */}
                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Show on leaderboard</p>
                    <p className="text-xs text-muted-foreground">
                      Your name and XP appear in the weekly league rankings.
                    </p>
                  </div>
                  <Switch
                    checked={prefs.showOnLeaderboard}
                    onCheckedChange={(v) => setPrefs((p) => ({ ...p, showOnLeaderboard: v }))}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button size="lg" disabled={savingPrefs} onClick={handleSavePrefs}>
                {savingPrefs ? "Saving…" : "Save practice settings"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function PrefsGrid({
  label,
  items,
  selected,
  onSelect,
}: {
  label: string;
  items: { value: string; label: string; emoji: string; hint: string }[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium text-foreground">{label}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map((item) => {
          const active = item.value === selected;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => onSelect(item.value)}
              className={cn(
                "flex items-center gap-2.5 rounded-xl border p-3 text-left transition-colors",
                active
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              <span className="text-xl">{item.emoji}</span>
              <span className="text-sm font-medium text-foreground">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
