import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueries } from "@tanstack/react-query";
import {
  ArrowLeft,
  Heart,
  Zap,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Trophy,
  RefreshCw,
  Flame,
} from "lucide-react";
import {
  generatePracticeQuestions,
  shuffleQuestionOptions,
  type PracticeQuestion,
  type GeneratePracticeInput,
  XP_PER_DIFFICULTY,
  HEARTS_PER_SESSION,
} from "@/lib/practice";
import { fetchMyProfile, fetchSubjects, fetchTopics } from "@/lib/profile-data";
import { toast } from "sonner";
import { recordSessionCompleted, loadRewards } from "@/lib/rewards";
import { earnCoins, hasXpBoost, useXpBoost as consumeXpBoost, loadCoinState } from "@/lib/coins";
import { trackActivity } from "@/lib/missions";
import { updateExtendedStats } from "@/lib/extended-stats";
import { checkAndUnlockAchievements, markNotified } from "@/lib/achievements";
import { logStudyActivity } from "@/lib/study-log";
import { saveMistake } from "@/lib/progress";
import { loadUserPrefs } from "@/lib/user-prefs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/practice")({
  head: () => ({ meta: [{ title: "Practice — Study Buddy" }] }),
  component: PracticePage,
});

type Screen = "setup" | "generating" | "question" | "feedback" | "summary" | "no_hearts";

interface SessionState {
  questions: PracticeQuestion[];
  current: number;
  hearts: number;
  xpEarned: number;
  correctCount: number;
  mistakes: PracticeQuestion[];
  selected: string | null;
  xpMultiplier: 1 | 2;
}

function PracticePage() {
  const { user } = Route.useRouteContext();

  // Profile + subjects
  const profileQuery = useQuery({
    queryKey: ["my-profile", user.id],
    queryFn: () => fetchMyProfile(user.id),
  });
  const subjectsQuery = useQuery({ queryKey: ["subjects"], queryFn: fetchSubjects });

  const draft = profileQuery.data?.draft;
  const allSubjects = subjectsQuery.data ?? [];
  const enrolledSubjects = allSubjects.filter((s) => draft?.subjectIds.includes(s.id));

  // Setup selections
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<"easy" | "medium" | "hard">(
    (draft?.difficulty as "easy" | "medium" | "hard") ?? "medium",
  );

  const selectedSubject = enrolledSubjects.find((s) => s.id === selectedSubjectId) ?? null;

  // Load topics for selected subject
  const topicQueries = useQueries({
    queries: enrolledSubjects.map((s) => ({
      queryKey: ["topics", s.id],
      queryFn: () => fetchTopics(s.id),
      enabled: s.id === selectedSubjectId,
    })),
  });
  const subjectIndex = enrolledSubjects.findIndex((s) => s.id === selectedSubjectId);
  const availableTopics = topicQueries[subjectIndex]?.data ?? [];
  const selectedTopic = availableTopics.find((t) => t.id === selectedTopicId) ?? null;

  // User prefs for session settings
  const userPrefs = loadUserPrefs(user.id);
  const sessionHearts = userPrefs.livesPerSession === 0 ? 999 : userPrefs.livesPerSession;
  const sessionQuestions = userPrefs.questionsPerSession;

  // Session state
  const [screen, setScreen] = useState<Screen>("setup");
  const [session, setSession] = useState<SessionState>({
    questions: [],
    current: 0,
    hearts: sessionHearts,
    xpEarned: 0,
    correctCount: 0,
    mistakes: [],
    selected: null,
    xpMultiplier: 1,
  });

  const generateMutation = useMutation({
    mutationFn: (input: GeneratePracticeInput) => generatePracticeQuestions({ data: input }),
    onSuccess: ({ questions }) => {
      const boostActive = hasXpBoost(user.id);
      setSession({
        questions: shuffleQuestionOptions(questions),
        current: 0,
        hearts: sessionHearts,
        xpEarned: 0,
        correctCount: 0,
        mistakes: [],
        selected: null,
        xpMultiplier: boostActive ? 2 : 1,
      });
      setScreen("question");
    },
    onError: (error) => {
      console.error("generatePracticeQuestions failed", error);
      const message = error instanceof Error ? error.message : undefined;
      toast.error(
        message
          ? `Couldn't generate questions: ${message}`
          : "Couldn't generate questions. Please try again.",
      );
      setScreen("setup");
    },
  });

  function startSession() {
    if (!selectedSubject || !selectedTopic) return;
    setScreen("generating");
    generateMutation.mutate({
      subject: selectedSubject.name,
      topic: selectedTopic.name,
      grade: draft?.grade ?? "7",
      difficulty: selectedDifficulty,
      curriculum: draft?.curriculum ?? "",
      count: sessionQuestions,
      learningStyle: userPrefs.learningStyle,
    });
  }

  function handleAnswer(option: string) {
    if (session.selected !== null) return;
    const q = session.questions[session.current]!;
    const isCorrect = option === q.correct_answer;
    const xp = isCorrect ? XP_PER_DIFFICULTY[q.difficulty] * session.xpMultiplier : 0;
    const newHearts = isCorrect ? session.hearts : session.hearts - 1;

    if (!isCorrect) {
      saveMistake(user.id, {
        question: q.question,
        correct_answer: q.correct_answer,
        user_answer: option,
        subject: selectedSubject?.name ?? "",
        topic: q.topic || selectedTopic?.name || "",
      });
    }

    setSession((prev) => ({
      ...prev,
      selected: option,
      hearts: newHearts,
      xpEarned: prev.xpEarned + xp,
      correctCount: isCorrect ? prev.correctCount + 1 : prev.correctCount,
      mistakes: isCorrect ? prev.mistakes : [...prev.mistakes, q],
    }));
    setScreen("feedback");
  }

  function handleContinue() {
    if (session.hearts <= 0) {
      setScreen("no_hearts");
      return;
    }
    const next = session.current + 1;
    if (next >= session.questions.length) {
      const perfect = session.mistakes.length === 0;
      const perfectBonus = perfect ? 20 : 0;
      const totalXp = session.xpEarned + perfectBonus;
      if (session.xpMultiplier === 2) consumeXpBoost(user.id);
      recordSessionCompleted(user.id, Math.ceil(session.questions.length * 1.5));
      earnCoins(user.id, 15 + (perfect ? 10 : 0));
      trackActivity(user.id, {
        xpEarned: totalXp,
        questionsCorrect: session.correctCount,
      });
      logStudyActivity(user.id, {
        xp: totalXp,
        questions: session.correctCount,
        sessions: 1,
      });
      const updatedExtended = updateExtendedStats(user.id, {
        questionsCorrect: session.correctCount,
        sessionsCompleted: 1,
        perfectSessions: perfect ? 1 : 0,
        coinsEarned: 15 + (perfect ? 10 : 0),
      });
      const freshRewards = loadRewards(user.id);
      const freshCoins = loadCoinState(user.id);
      const newAchievements = checkAndUnlockAchievements(
        user.id,
        freshRewards,
        updatedExtended,
        freshCoins,
      );
      newAchievements.forEach((a) =>
        toast.success(`${a.emoji} ${a.label}`, { description: a.description }),
      );
      if (newAchievements.length > 0)
        markNotified(
          user.id,
          newAchievements.map((a) => a.id),
        );
      setScreen("summary");
      return;
    }
    setSession((prev) => ({ ...prev, current: next, selected: null }));
    setScreen("question");
  }

  function resetSetup() {
    setScreen("setup");
    setSelectedSubjectId(null);
    setSelectedTopicId(null);
    setSession({
      questions: [],
      current: 0,
      hearts: HEARTS_PER_SESSION,
      xpEarned: 0,
      correctCount: 0,
      mistakes: [],
      selected: null,
      xpMultiplier: 1,
    });
  }

  // ─── Setup screen ────────────────────────────────────────────────────────────
  if (screen === "setup") {
    const isLoading = profileQuery.isLoading || subjectsQuery.isLoading;
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-lg px-4 py-10">
          <Link
            to="/dashboard"
            className="mb-8 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back to dashboard
          </Link>

          <h1 className="mb-1 text-2xl font-bold text-foreground">Practice Mode</h1>
          <p className="mb-8 text-sm text-muted-foreground">
            AI generates 10 questions just for you.
          </p>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Subject picker */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Choose Subject
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {enrolledSubjects.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSelectedSubjectId(s.id);
                        setSelectedTopicId(null);
                      }}
                      className={cn(
                        "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                        selectedSubjectId === s.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-foreground hover:border-primary/40",
                      )}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topic picker */}
              {selectedSubjectId && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Choose Topic
                  </p>
                  {topicQueries[subjectIndex]?.isLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-10 animate-pulse rounded-xl bg-muted" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {availableTopics.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTopicId(t.id)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
                            selectedTopicId === t.id
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-card text-foreground hover:border-primary/40",
                          )}
                        >
                          {t.name}
                          {selectedTopicId === t.id && (
                            <CheckCircle2 className="h-4 w-4 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Difficulty picker */}
              {selectedTopicId && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Difficulty
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["easy", "medium", "hard"] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => setSelectedDifficulty(d)}
                        className={cn(
                          "rounded-xl border py-2.5 text-sm font-medium capitalize transition-colors",
                          selectedDifficulty === d
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-foreground hover:border-primary/40",
                        )}
                      >
                        {d === "easy" ? "😊 Easy" : d === "medium" ? "🎯 Medium" : "🔥 Hard"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Start button */}
              {selectedTopicId && (
                <Button onClick={startSession} className="w-full rounded-2xl py-6 text-base">
                  Start Practice <ChevronRight className="ml-1 h-5 w-5" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Generating screen ───────────────────────────────────────────────────────
  if (screen === "generating") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Zap className="h-8 w-8 animate-pulse text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Generating your questions…</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          AI is crafting 10 questions on{" "}
          <span className="font-medium text-foreground">{selectedTopic?.name}</span>
        </p>
      </div>
    );
  }

  // ─── Question screen ─────────────────────────────────────────────────────────
  if (screen === "question" || screen === "feedback") {
    const q = session.questions[session.current];
    if (!q) return null;
    const isCorrect = session.selected === q.correct_answer;
    const progress =
      ((session.current + (screen === "feedback" ? 1 : 0)) / session.questions.length) * 100;

    return (
      <div className="flex min-h-screen flex-col bg-background">
        {/* Top bar */}
        <div className="flex items-center gap-4 border-b border-border px-4 py-4 sm:px-6">
          <button onClick={resetSetup} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>

          {/* Progress bar */}
          <div className="flex-1 overflow-hidden rounded-full bg-muted h-3">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Hearts */}
          <div className="flex items-center gap-0.5">
            {Array.from({ length: HEARTS_PER_SESSION }).map((_, i) => (
              <Heart
                key={i}
                className={cn(
                  "h-5 w-5 transition-all",
                  i < session.hearts
                    ? "fill-red-500 text-red-500"
                    : "fill-muted text-muted-foreground/30",
                )}
              />
            ))}
          </div>

          {/* XP counter */}
          <div className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
            <Zap className="h-3 w-3" />
            {session.xpEarned} XP
          </div>
        </div>

        {/* Question */}
        <div className="flex flex-1 flex-col items-center px-4 py-8 sm:px-6">
          <div className="w-full max-w-xl">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Question {session.current + 1} of {session.questions.length}
            </p>
            <h2 className="mb-8 text-xl font-semibold leading-snug text-foreground">
              {q.question}
            </h2>

            {/* Options */}
            <div className="space-y-3">
              {q.options.map((opt) => {
                let style =
                  "border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5";
                if (screen === "feedback") {
                  if (opt === q.correct_answer) {
                    style = "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400";
                  } else if (opt === session.selected && !isCorrect) {
                    style = "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400";
                  } else {
                    style = "border-border/50 bg-card/50 text-muted-foreground";
                  }
                } else if (session.selected === opt) {
                  style = "border-primary bg-primary/10 text-primary";
                }

                return (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(opt)}
                    disabled={screen === "feedback"}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border px-5 py-4 text-left text-sm font-medium transition-all",
                      style,
                      screen === "feedback" && "cursor-default",
                    )}
                  >
                    {screen === "feedback" && opt === q.correct_answer && (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                    )}
                    {screen === "feedback" && opt === session.selected && !isCorrect && (
                      <XCircle className="h-4 w-4 shrink-0 text-red-500" />
                    )}
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Feedback panel */}
        {screen === "feedback" && (
          <div
            className={cn(
              "border-t px-4 py-5 sm:px-6",
              isCorrect ? "border-green-500/30 bg-green-500/10" : "border-red-500/30 bg-red-500/10",
            )}
          >
            <div className="mx-auto max-w-xl">
              <div className="mb-1 flex items-center gap-2">
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-semibold text-green-700 dark:text-green-400">
                      Correct! +{XP_PER_DIFFICULTY[q.difficulty]} XP
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      Not quite — correct answer highlighted above
                    </span>
                  </>
                )}
              </div>
              <p className="mb-4 text-sm text-muted-foreground">{q.explanation}</p>
              <Button
                onClick={handleContinue}
                className={cn(
                  "w-full rounded-2xl py-5",
                  isCorrect ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700",
                )}
              >
                Continue <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── No hearts screen ────────────────────────────────────────────────────────
  if (screen === "no_hearts") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="mb-4 text-5xl">💔</div>
        <h2 className="mb-2 text-xl font-bold text-foreground">Out of hearts!</h2>
        <p className="mb-8 max-w-xs text-center text-sm text-muted-foreground">
          Review your mistakes to earn another heart, or start a fresh session.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Button onClick={startSession} className="w-full rounded-2xl py-5">
            <RefreshCw className="mr-2 h-4 w-4" /> Try again
          </Button>
          <Button variant="outline" onClick={resetSetup} className="w-full rounded-2xl py-5">
            Change topic
          </Button>
          <Link to="/dashboard">
            <Button variant="ghost" className="w-full rounded-2xl py-5">
              Back to home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ─── Summary screen ──────────────────────────────────────────────────────────
  if (screen === "summary") {
    const total = session.questions.length;
    const correct = session.correctCount;
    const pct = Math.round((correct / total) * 100);
    const perfect = correct === total;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm">
          {/* Trophy */}
          <div className="mb-6 text-center">
            <div className="mb-3 inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Trophy className={cn("h-10 w-10", perfect ? "text-yellow-500" : "text-primary")} />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              {perfect ? "Perfect! 🎉" : pct >= 70 ? "Great job! 👏" : "Keep practising! 💪"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {selectedTopic?.name} · {selectedSubject?.name}
            </p>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-border bg-card p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{pct}%</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Score</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-center">
              <div className="flex items-center justify-center gap-1">
                <Zap className="h-4 w-4 text-primary" />
                <p className="text-2xl font-bold text-primary">
                  +{session.xpEarned + (perfect ? 20 : 0)}
                </p>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">XP earned</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-center">
              <div className="flex items-center justify-center gap-1">
                <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                <p className="text-2xl font-bold text-foreground">{session.hearts}</p>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">Hearts left</p>
            </div>
          </div>

          {perfect && (
            <div className="mb-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-center text-sm font-medium text-yellow-700 dark:text-yellow-400">
              🌟 Perfect lesson bonus: +20 XP
            </div>
          )}

          {/* Mistakes preview */}
          {session.mistakes.length > 0 && (
            <div className="mb-6 rounded-2xl border border-border bg-card p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Review these ({session.mistakes.length})
              </p>
              <div className="space-y-1.5">
                {session.mistakes.slice(0, 3).map((m) => (
                  <p key={m.id} className="truncate text-xs text-foreground">
                    • {m.question}
                  </p>
                ))}
                {session.mistakes.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{session.mistakes.length - 3} more…
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Streak reminder */}
          <div className="mb-6 flex items-center gap-2 rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-3">
            <Flame className="h-5 w-5 text-orange-500" />
            <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
              Session counts toward your daily streak!
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button onClick={startSession} className="w-full rounded-2xl py-5">
              <RefreshCw className="mr-2 h-4 w-4" /> Practice again
            </Button>
            <Button variant="outline" onClick={resetSetup} className="w-full rounded-2xl py-5">
              Change topic
            </Button>
            <Link to="/dashboard" className="block">
              <Button variant="ghost" className="w-full rounded-2xl py-5">
                Back to home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
