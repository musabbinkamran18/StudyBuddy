import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Lock,
  CheckCircle2,
  Zap,
  Heart,
  Trophy,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  BookOpen,
  Skull,
  Star,
} from "lucide-react";
import { fetchMyProfile, fetchSubjects, fetchTopics } from "@/lib/profile-data";
import { subjectIcon, FALLBACK_COLOR } from "@/lib/subject-icons";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { Button } from "@/components/ui/button";
import {
  generatePracticeQuestions,
  type PracticeQuestion,
  XP_PER_DIFFICULTY,
} from "@/lib/practice";
import {
  loadSubjectProgress,
  completeLesson,
  completePractice,
  completeBoss,
  isTopicUnlocked,
  saveMistake,
  getDefaultTopicProgress,
  type TopicProgress,
} from "@/lib/progress";
import { toast } from "sonner";
import { recordSessionCompleted, recordTopicMastered, loadRewards } from "@/lib/rewards";
import { loadAvatar } from "@/lib/avatar";
import { earnCoins, hasXpBoost, useXpBoost as consumeXpBoost, loadCoinState } from "@/lib/coins";
import { trackActivity } from "@/lib/missions";
import { updateExtendedStats } from "@/lib/extended-stats";
import { checkAndUnlockAchievements, markNotified } from "@/lib/achievements";
import { logStudyActivity } from "@/lib/study-log";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = "path" | "generating" | "question" | "feedback" | "summary" | "failed";
type SessionMode = "lesson1" | "lesson2" | "lesson3" | "practice" | "boss";

interface SessionConfig {
  mode: SessionMode;
  topicId: string;
  topicName: string;
}

interface SessionState {
  questions: PracticeQuestion[];
  current: number;
  hearts: number;
  xpEarned: number;
  correctCount: number;
  mistakes: PracticeQuestion[];
  selected: string | null;
  isCorrect: boolean | null;
  consecutiveCorrect: number;
  consecutiveWrong: number;
  currentDifficulty: "easy" | "medium" | "hard";
  xpMultiplier: 1 | 2;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sessionDifficulty(mode: SessionMode): "easy" | "medium" | "hard" {
  switch (mode) {
    case "lesson1":
      return "easy";
    case "lesson2":
      return "medium";
    case "lesson3":
    case "boss":
      return "hard";
    case "practice":
      return "medium";
  }
}

function sessionCount(mode: SessionMode): number {
  if (mode === "boss") return 10;
  if (mode === "practice") return 7;
  return 5;
}

function sessionLabel(mode: SessionMode): string {
  const map: Record<SessionMode, string> = {
    lesson1: "Lesson 1",
    lesson2: "Lesson 2",
    lesson3: "Lesson 3",
    practice: "Practice",
    boss: "Boss Battle",
  };
  return map[mode];
}

function completionBonus(mode: SessionMode, perfect: boolean): number {
  const base = mode === "boss" ? 50 : mode === "practice" ? 20 : 25;
  return base + (perfect ? 20 : 0);
}

// ─── Route ────────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/_authenticated/learn/$code")({
  head: () => ({
    meta: [
      { title: "Learning Path — Study Buddy" },
      { name: "description", content: "Follow your personalised learning path." },
    ],
  }),
  component: LearnPage,
});

// ─── Main Page ────────────────────────────────────────────────────────────────

function LearnPage() {
  const { code } = Route.useParams();
  const { user } = Route.useRouteContext();

  const profileQuery = useQuery({
    queryKey: ["my-profile", user.id],
    queryFn: () => fetchMyProfile(user.id),
  });
  const subjectsQuery = useQuery({ queryKey: ["subjects"], queryFn: fetchSubjects });
  const subject = subjectsQuery.data?.find((s) => s.code === code);

  const grade = profileQuery.data?.draft.grade;
  const curriculum = profileQuery.data?.draft.curriculum;

  const topicsQuery = useQuery({
    queryKey: ["topics", subject?.id ?? code, grade, curriculum],
    queryFn: () => fetchTopics(subject?.id ?? "", grade, curriculum),
    enabled: Boolean(subject?.id),
  });

  const topics = topicsQuery.data ?? [];
  const topicIds = topics.map((t) => t.id);

  const [progress, setProgress] = useState<Record<string, TopicProgress>>({});
  const reloadProgress = () => {
    if (subject?.id) setProgress(loadSubjectProgress(user.id, subject.id));
  };
  useEffect(() => {
    if (subject?.id) reloadProgress();
  }, [subject?.id]);

  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  useEffect(() => {
    if (topics.length > 0 && expandedTopicId === null) {
      const first = topics.find((t, i) => {
        const p = progress[t.id];
        return isTopicUnlocked(i, topicIds, progress) && (!p || p.masteryPct < 100);
      });
      setExpandedTopicId(first?.id ?? topics[0]?.id ?? null);
    }
  }, [topics.length, Object.keys(progress).length]);

  // Session state
  const [screen, setScreen] = useState<Screen>("path");
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);
  const [sessionState, setSessionState] = useState<SessionState | null>(null);

  const generateMutation = useMutation({
    mutationFn: (input: Parameters<typeof generatePracticeQuestions>[0]) =>
      generatePracticeQuestions(input),
    onSuccess: (result, variables) => {
      const boostActive = hasXpBoost(user.id);
      if (boostActive) consumeXpBoost(user.id);
      setSessionState({
        questions: result.questions,
        current: 0,
        hearts: 5,
        xpEarned: 0,
        correctCount: 0,
        mistakes: [],
        selected: null,
        isCorrect: null,
        consecutiveCorrect: 0,
        consecutiveWrong: 0,
        currentDifficulty: variables.data.difficulty,
        xpMultiplier: boostActive ? 2 : 1,
      });
      setScreen("question");
    },
    onError: () => setScreen("path"),
  });

  function startSession(config: SessionConfig) {
    const draft = profileQuery.data?.draft;
    setSessionConfig(config);
    setScreen("generating");
    generateMutation.mutate({
      data: {
        subject: subject?.name ?? "",
        topic: config.topicName,
        grade: draft?.grade ?? "Grade 8",
        difficulty: sessionDifficulty(config.mode),
        curriculum: draft?.curriculum ?? "General",
        count: sessionCount(config.mode),
      },
    });
  }

  function handleAnswer(selected: string) {
    if (!sessionState || screen !== "question") return;
    const q = sessionState.questions[sessionState.current];
    if (!q) return;
    const isCorrect = selected === q.correct_answer;
    setSessionState((s) => s && { ...s, selected, isCorrect });
    setScreen("feedback");
  }

  function handleContinue() {
    if (!sessionState || !sessionConfig) return;
    const {
      questions,
      current,
      hearts,
      xpEarned,
      correctCount,
      mistakes,
      isCorrect,
      consecutiveCorrect,
      consecutiveWrong,
    } = sessionState;
    const q = questions[current];
    if (!q) return;

    const correct = isCorrect ?? false;
    const xpGain = correct ? XP_PER_DIFFICULTY[q.difficulty] * sessionState.xpMultiplier : 0;
    const newXp = xpEarned + xpGain;
    const newCorrect = correct ? correctCount + 1 : correctCount;
    const newMistakes = correct ? mistakes : [...mistakes, q];
    const newHearts = correct ? hearts : hearts - 1;

    if (!correct && subject) {
      saveMistake(user.id, {
        question: q.question,
        correct_answer: q.correct_answer,
        user_answer: sessionState.selected ?? "",
        subject: subject.name,
        topic: q.topic,
      });
    }

    const newConsecCorrect = correct ? consecutiveCorrect + 1 : 0;
    const newConsecWrong = correct ? 0 : consecutiveWrong + 1;
    let newDiff = sessionState.currentDifficulty;
    if (newConsecCorrect >= 3 && newDiff !== "hard") {
      newDiff = newDiff === "easy" ? "medium" : "hard";
    } else if (newConsecWrong >= 2 && newDiff !== "easy") {
      newDiff = newDiff === "hard" ? "medium" : "easy";
    }

    if (newHearts <= 0) {
      setSessionState(
        (s) =>
          s && {
            ...s,
            hearts: 0,
            xpEarned: newXp,
            correctCount: newCorrect,
            mistakes: newMistakes,
            consecutiveCorrect: newConsecCorrect,
            consecutiveWrong: newConsecWrong,
            currentDifficulty: newDiff,
          },
      );
      setScreen("failed");
      return;
    }

    const isLast = current === questions.length - 1;
    if (isLast) {
      const bonus = completionBonus(sessionConfig.mode, newMistakes.length === 0);
      const totalXp = newXp + bonus;
      const mode = sessionConfig.mode;

      if (subject?.id) {
        const { topicId, topicName } = sessionConfig;
        if (mode === "lesson1") completeLesson(user.id, subject.id, topicId, 1);
        else if (mode === "lesson2") completeLesson(user.id, subject.id, topicId, 2);
        else if (mode === "lesson3") completeLesson(user.id, subject.id, topicId, 3);
        else if (mode === "practice") completePractice(user.id, subject.id, topicId);
        else if (mode === "boss") {
          completeBoss(user.id, subject.id, topicId);
          recordTopicMastered(user.id, topicName);
        }
        reloadProgress();
      }

      recordSessionCompleted(user.id, Math.round(sessionCount(mode) * 0.5));

      // Award coins
      const coinReward = mode === "boss" ? 25 : mode === "practice" ? 15 : 10;
      const perfectCoinBonus = newMistakes.length === 0 ? 10 : 0;
      earnCoins(user.id, coinReward + perfectCoinBonus);

      // Track daily activity for missions
      const isLesson = ["lesson1", "lesson2", "lesson3"].includes(mode);
      trackActivity(user.id, {
        xpEarned: totalXp,
        lessonsCompleted: isLesson ? 1 : 0,
        questionsCorrect: newCorrect,
        bossesDefeated: mode === "boss" ? 1 : 0,
      });

      // Log to study log (weekly chart)
      logStudyActivity(user.id, { xp: totalXp, questions: newCorrect, sessions: 1 });

      // Update extended stats and check achievements
      const updatedExtended = updateExtendedStats(user.id, {
        questionsCorrect: newCorrect,
        lessonsCompleted: isLesson ? 1 : 0,
        bossesDefeated: mode === "boss" ? 1 : 0,
        sessionsCompleted: 1,
        perfectSessions: newMistakes.length === 0 ? 1 : 0,
        coinsEarned: coinReward + perfectCoinBonus,
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

      setSessionState(
        (s) =>
          s && {
            ...s,
            hearts: newHearts,
            xpEarned: totalXp,
            correctCount: newCorrect,
            mistakes: newMistakes,
            consecutiveCorrect: newConsecCorrect,
            consecutiveWrong: newConsecWrong,
            currentDifficulty: newDiff,
          },
      );
      setScreen("summary");
    } else {
      setSessionState(
        (s) =>
          s && {
            ...s,
            current: current + 1,
            hearts: newHearts,
            xpEarned: newXp,
            correctCount: newCorrect,
            mistakes: newMistakes,
            selected: null,
            isCorrect: null,
            consecutiveCorrect: newConsecCorrect,
            consecutiveWrong: newConsecWrong,
            currentDifficulty: newDiff,
          },
      );
      setScreen("question");
    }
  }

  function returnToPath() {
    setScreen("path");
    setSessionConfig(null);
    setSessionState(null);
    reloadProgress();
  }

  const Icon = subject?.icon ? subjectIcon(subject.icon) : BookOpen;
  const accent = subject?.color ?? FALLBACK_COLOR;
  const userName = profileQuery.data?.draft.full_name || "Student";
  const [coins, setCoins] = useState(0);
  const [avatar, setAvatar] = useState("⭐");
  useEffect(() => {
    setCoins(loadCoinState(user.id).balance);
    setAvatar(loadAvatar(user.id));
  }, [user.id, screen]);
  const totalMastery =
    topics.length > 0
      ? Math.round(
          topics.reduce((sum, t) => sum + (progress[t.id]?.masteryPct ?? 0), 0) / topics.length,
        )
      : 0;

  const isBoss = sessionConfig?.mode === "boss";

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex min-h-screen flex-col lg:pl-[240px]">
        <TopBar userName={userName} coins={coins} avatar={avatar} />
        <main className="flex-1 px-4 py-6 pb-24 sm:px-8 sm:py-8 lg:pb-8">
          {screen === "path" && (
            <PathView
              subject={subject}
              subjectLoading={subjectsQuery.isLoading || topicsQuery.isLoading}
              topics={topics}
              topicIds={topicIds}
              progress={progress}
              accent={accent}
              totalMastery={totalMastery}
              Icon={Icon}
              expandedTopicId={expandedTopicId}
              setExpandedTopicId={setExpandedTopicId}
              onStartSession={startSession}
            />
          )}

          {screen === "generating" && sessionConfig && (
            <GeneratingView label={sessionLabel(sessionConfig.mode)} isBoss={isBoss} />
          )}

          {screen === "question" && sessionState && sessionConfig && (
            <QuestionView
              sessionConfig={sessionConfig}
              sessionState={sessionState}
              isBoss={isBoss}
              onAnswer={handleAnswer}
            />
          )}

          {screen === "feedback" && sessionState && sessionConfig && (
            <FeedbackView
              sessionConfig={sessionConfig}
              sessionState={sessionState}
              isBoss={isBoss}
              onContinue={handleContinue}
            />
          )}

          {screen === "summary" && sessionState && sessionConfig && (
            <SummaryView
              sessionConfig={sessionConfig}
              sessionState={sessionState}
              totalQuestions={sessionCount(sessionConfig.mode)}
              isBoss={isBoss}
              onContinue={returnToPath}
            />
          )}

          {screen === "failed" && sessionState && sessionConfig && (
            <FailedView
              sessionConfig={sessionConfig}
              sessionState={sessionState}
              totalQuestions={sessionCount(sessionConfig.mode)}
              onTryAgain={() => startSession(sessionConfig)}
              onGoBack={returnToPath}
            />
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Path View ────────────────────────────────────────────────────────────────

interface PathViewProps {
  subject: { name: string; description?: string | null; code: string } | undefined;
  subjectLoading: boolean;
  topics: Array<{ id: string; name: string; description?: string | null; difficulty: string }>;
  topicIds: string[];
  progress: Record<string, TopicProgress>;
  accent: string;
  totalMastery: number;
  Icon: React.ElementType;
  expandedTopicId: string | null;
  setExpandedTopicId: (id: string | null) => void;
  onStartSession: (config: SessionConfig) => void;
}

function PathView({
  subject,
  subjectLoading,
  topics,
  topicIds,
  progress,
  accent,
  totalMastery,
  Icon,
  expandedTopicId,
  setExpandedTopicId,
  onStartSession,
}: PathViewProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      {!subject && !subjectLoading ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">Subject not found.</p>
        </div>
      ) : (
        <>
          {/* Subject header */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${accent}1a`, color: accent }}
              >
                <Icon className="h-7 w-7" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  {subject?.name ?? "Loading…"}
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {totalMastery}% mastered · {topics.length}{" "}
                  {topics.length === 1 ? "topic" : "topics"}
                </p>
              </div>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${totalMastery}%`, backgroundColor: accent }}
              />
            </div>
          </div>

          {/* Topic path */}
          <h2 className="mt-8 mb-4 text-lg font-semibold tracking-tight text-foreground">
            Learning Path
          </h2>

          {subjectLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : topics.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No topics available yet. Check back soon.
              </p>
            </div>
          ) : (
            <div>
              {topics.map((topic, index) => {
                const topicProgress = progress[topic.id] ?? getDefaultTopicProgress();
                const unlocked = isTopicUnlocked(index, topicIds, progress);
                return (
                  <div key={topic.id}>
                    {index > 0 && (
                      <div className="mx-auto my-0 flex w-0.5 justify-center">
                        <div className="h-6 w-0 border-l-2 border-dashed border-muted-foreground/30" />
                      </div>
                    )}
                    <TopicNode
                      topic={topic}
                      index={index}
                      isUnlocked={unlocked}
                      topicProgress={topicProgress}
                      isExpanded={expandedTopicId === topic.id}
                      onToggle={() =>
                        setExpandedTopicId(expandedTopicId === topic.id ? null : topic.id)
                      }
                      onStartSession={onStartSession}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Topic Node ───────────────────────────────────────────────────────────────

interface TopicNodeProps {
  topic: { id: string; name: string };
  index: number;
  isUnlocked: boolean;
  topicProgress: TopicProgress;
  isExpanded: boolean;
  onToggle: () => void;
  onStartSession: (config: SessionConfig) => void;
}

function TopicNode({
  topic,
  index,
  isUnlocked,
  topicProgress,
  isExpanded,
  onToggle,
  onStartSession,
}: TopicNodeProps) {
  const isDone = topicProgress.masteryPct >= 100;
  const status = !isUnlocked ? "locked" : isDone ? "done" : "active";

  const lessonUnlocked = (n: 1 | 2 | 3) => {
    if (!isUnlocked) return false;
    if (n === 1) return true;
    return topicProgress.lessonsCompleted.includes(n - 1);
  };
  const practiceUnlocked = isUnlocked && topicProgress.lessonsCompleted.length >= 3;
  const bossUnlocked = isUnlocked && topicProgress.practiceCompleted;

  const steps: {
    id: SessionMode;
    label: string;
    shortLabel: string;
    done: boolean;
    unlocked: boolean;
  }[] = [
    {
      id: "lesson1",
      label: "Lesson 1",
      shortLabel: "1",
      done: topicProgress.lessonsCompleted.includes(1),
      unlocked: lessonUnlocked(1),
    },
    {
      id: "lesson2",
      label: "Lesson 2",
      shortLabel: "2",
      done: topicProgress.lessonsCompleted.includes(2),
      unlocked: lessonUnlocked(2),
    },
    {
      id: "lesson3",
      label: "Lesson 3",
      shortLabel: "3",
      done: topicProgress.lessonsCompleted.includes(3),
      unlocked: lessonUnlocked(3),
    },
    {
      id: "practice",
      label: "Practice",
      shortLabel: "P",
      done: topicProgress.practiceCompleted,
      unlocked: practiceUnlocked,
    },
    {
      id: "boss",
      label: "Boss",
      shortLabel: "👹",
      done: topicProgress.bossDone,
      unlocked: bossUnlocked,
    },
  ];

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 transition-all",
        status === "done" && "border-green-500/40 bg-green-500/5",
        status === "active" && "border-primary/40 bg-primary/5 ring-2 ring-primary/15",
        status === "locked" && "border-muted/80 opacity-60",
      )}
    >
      {/* Header row */}
      <button
        onClick={isUnlocked ? onToggle : undefined}
        disabled={!isUnlocked}
        className={cn(
          "w-full text-left",
          isUnlocked && "cursor-pointer",
          !isUnlocked && "cursor-not-allowed",
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold",
              status === "done" && "bg-green-500 text-white",
              status === "active" && "bg-primary text-primary-foreground",
              status === "locked" && "bg-muted text-muted-foreground",
            )}
          >
            {status === "done" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : status === "locked" ? (
              <Lock className="h-4 w-4" />
            ) : (
              <span>{index + 1}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground leading-tight">{topic.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {topicProgress.masteryPct}% mastered
            </p>
          </div>
          {isUnlocked && (
            <div className="text-muted-foreground">
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          )}
        </div>

        {/* Mastery bar */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              status === "done" ? "bg-green-500" : "bg-primary",
            )}
            style={{ width: `${topicProgress.masteryPct}%` }}
          />
        </div>
      </button>

      {/* Expanded lesson row */}
      {isExpanded && isUnlocked && (
        <div className="mt-4 border-t border-border/50 pt-4">
          <div className="flex items-start justify-between gap-1">
            {steps.map((step, i) => (
              <div key={step.id} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1.5 flex-1">
                  {/* Step circle */}
                  <button
                    onClick={
                      step.unlocked && !step.done
                        ? () =>
                            onStartSession({
                              mode: step.id,
                              topicId: topic.id,
                              topicName: topic.name,
                            })
                        : undefined
                    }
                    disabled={!step.unlocked || step.done}
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold transition-transform",
                      step.done && "bg-green-500 text-white",
                      step.unlocked &&
                        !step.done &&
                        step.id === "boss" &&
                        "bg-red-500 text-white hover:scale-105 cursor-pointer shadow-lg shadow-red-500/25",
                      step.unlocked &&
                        !step.done &&
                        step.id !== "boss" &&
                        "bg-primary text-primary-foreground hover:scale-105 cursor-pointer shadow-lg shadow-primary/25",
                      !step.unlocked && "bg-muted text-muted-foreground cursor-not-allowed",
                    )}
                  >
                    {step.done ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : !step.unlocked ? (
                      <Lock className="h-3.5 w-3.5" />
                    ) : (
                      <span>{step.shortLabel}</span>
                    )}
                  </button>

                  {/* Label */}
                  <p
                    className={cn(
                      "text-center text-[10px] font-medium leading-tight",
                      step.done && "text-green-600 dark:text-green-400",
                      step.unlocked && !step.done && "text-foreground",
                      !step.unlocked && "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </p>

                  {/* Start button */}
                  {step.unlocked && !step.done && (
                    <Button
                      size="sm"
                      variant={step.id === "boss" ? "destructive" : "default"}
                      className="h-6 rounded-full px-2.5 text-[10px]"
                      onClick={() =>
                        onStartSession({
                          mode: step.id,
                          topicId: topic.id,
                          topicName: topic.name,
                        })
                      }
                    >
                      Start
                    </Button>
                  )}
                  {step.done && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 rounded-full px-2.5 text-[10px] text-muted-foreground"
                      onClick={() =>
                        onStartSession({
                          mode: step.id,
                          topicId: topic.id,
                          topicName: topic.name,
                        })
                      }
                    >
                      Review
                    </Button>
                  )}
                </div>

                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div
                    className={cn(
                      "mb-6 h-0.5 w-4 shrink-0",
                      steps[i + 1]?.unlocked ? "bg-muted-foreground/30" : "bg-muted/50",
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Generating View ──────────────────────────────────────────────────────────

function GeneratingView({ label, isBoss }: { label: string; isBoss: boolean }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center justify-center py-24 text-center">
      <div
        className={cn(
          "flex h-20 w-20 animate-pulse items-center justify-center rounded-full text-4xl",
          isBoss ? "bg-red-500/10" : "bg-primary/10",
        )}
      >
        {isBoss ? "👹" : <Zap className="h-9 w-9 text-primary" />}
      </div>
      <p className="mt-6 text-xl font-semibold text-foreground">
        {isBoss ? "Preparing Boss Battle…" : `Loading ${label}…`}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        {isBoss ? "Your opponent is waiting." : "Generating your questions."}
      </p>
    </div>
  );
}

// ─── Question View ────────────────────────────────────────────────────────────

interface QuestionViewProps {
  sessionConfig: SessionConfig;
  sessionState: SessionState;
  isBoss: boolean;
  onAnswer: (selected: string) => void;
}

function QuestionView({ sessionConfig, sessionState, isBoss, onAnswer }: QuestionViewProps) {
  const {
    questions,
    current,
    hearts,
    xpEarned,
    consecutiveCorrect,
    consecutiveWrong,
    currentDifficulty,
    xpMultiplier,
  } = sessionState;
  const q = questions[current];
  const total = questions.length;
  if (!q) return null;

  const diffLabel =
    xpMultiplier === 2
      ? "⚡ 2× XP Boost active!"
      : consecutiveCorrect >= 3
        ? "🔥 Getting harder!"
        : consecutiveWrong >= 2
          ? "💧 Easing up…"
          : null;

  return (
    <div className="mx-auto max-w-xl">
      {/* Session header */}
      <div
        className={cn(
          "mb-6 rounded-2xl p-4",
          isBoss
            ? "bg-red-950/80 border border-red-500/30 text-white"
            : "bg-card border border-border",
        )}
      >
        {isBoss && (
          <p className="mb-1 text-xs font-bold tracking-widest text-red-400 uppercase">
            👹 Boss Battle — {sessionConfig.topicName}
          </p>
        )}
        {!isBoss && (
          <p className="mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {sessionConfig.topicName} · {sessionLabel(sessionConfig.mode)}
          </p>
        )}

        <div className="flex items-center justify-between gap-4">
          {/* Progress bar */}
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className={isBoss ? "text-red-200" : "text-muted-foreground"}>
                Question {current + 1} of {total}
              </span>
              {diffLabel && <span className="text-xs font-medium text-amber-500">{diffLabel}</span>}
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  isBoss ? "bg-red-500" : "bg-primary",
                )}
                style={{ width: `${((current + 1) / total) * 100}%` }}
              />
            </div>
          </div>

          {/* Hearts */}
          <div className="flex gap-0.5 shrink-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <Heart
                key={i}
                className={cn(
                  "h-4 w-4",
                  i < hearts ? "fill-red-500 text-red-500" : "fill-muted text-muted-foreground/30",
                )}
              />
            ))}
          </div>

          {/* XP */}
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold shrink-0",
              isBoss ? "bg-yellow-500/20 text-yellow-300" : "bg-primary/10 text-primary",
            )}
          >
            <Zap className="h-3 w-3" />
            {xpEarned} XP
          </div>
        </div>
      </div>

      {/* Question card */}
      <div
        className={cn(
          "rounded-2xl border p-6",
          isBoss ? "border-red-500/20 bg-red-950/40 text-white" : "border-border bg-card",
        )}
      >
        <p
          className={cn(
            "text-lg font-semibold leading-snug",
            isBoss ? "text-white" : "text-foreground",
          )}
        >
          {q.question}
        </p>

        <div className="mt-6 grid gap-3">
          {q.options.map((option, i) => (
            <button
              key={i}
              onClick={() => onAnswer(option)}
              className={cn(
                "w-full rounded-xl border p-4 text-left text-sm font-medium transition-all hover:-translate-y-px hover:shadow-md",
                isBoss
                  ? "border-red-500/20 bg-red-900/30 text-red-100 hover:border-red-400/50 hover:bg-red-900/50"
                  : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary/5",
              )}
            >
              <span
                className={cn(
                  "mr-3 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                  isBoss ? "bg-red-500/20 text-red-300" : "bg-muted text-muted-foreground",
                )}
              >
                {String.fromCharCode(65 + i)}
              </span>
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Feedback View ────────────────────────────────────────────────────────────

interface FeedbackViewProps {
  sessionConfig: SessionConfig;
  sessionState: SessionState;
  isBoss: boolean;
  onContinue: () => void;
}

function FeedbackView({ sessionConfig, sessionState, isBoss, onContinue }: FeedbackViewProps) {
  const { questions, current, selected, isCorrect, xpEarned } = sessionState;
  const q = questions[current];
  if (!q) return null;
  const correct = isCorrect ?? false;

  return (
    <div className="mx-auto max-w-xl">
      {/* Question recap */}
      <div className="mb-4 rounded-2xl border border-border bg-card p-5">
        <p className="text-sm font-medium text-muted-foreground">{q.question}</p>
      </div>

      {/* Feedback banner */}
      <div
        className={cn(
          "rounded-2xl border p-6",
          correct ? "border-green-500/30 bg-green-500/10" : "border-red-500/30 bg-red-500/10",
        )}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full text-xl",
              correct ? "bg-green-500" : "bg-red-500",
            )}
          >
            {correct ? "✓" : "✗"}
          </div>
          <div>
            <p
              className={cn(
                "font-bold text-lg",
                correct ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
              )}
            >
              {correct ? "Correct!" : "Incorrect"}
            </p>
            {correct && (
              <p className="text-xs text-muted-foreground">
                +{XP_PER_DIFFICULTY[q.difficulty]} XP earned
              </p>
            )}
          </div>
        </div>

        {!correct && (
          <div className="mb-4 rounded-xl bg-background/50 p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Correct answer:</p>
            <p className="text-sm font-semibold text-foreground">{q.correct_answer}</p>
          </div>
        )}

        <div className="rounded-xl bg-background/50 p-3">
          <p className="text-xs font-semibold text-muted-foreground mb-1">Explanation:</p>
          <p className="text-sm text-foreground leading-relaxed">{q.explanation}</p>
        </div>
      </div>

      <Button
        className={cn(
          "mt-4 w-full rounded-xl py-3 font-semibold",
          correct
            ? isBoss
              ? "bg-red-500 hover:bg-red-600 text-white"
              : ""
            : "bg-muted text-foreground hover:bg-muted/80",
        )}
        variant={correct && !isBoss ? "default" : "ghost"}
        onClick={onContinue}
      >
        Continue →
      </Button>
    </div>
  );
}

// ─── Summary View ─────────────────────────────────────────────────────────────

interface SummaryViewProps {
  sessionConfig: SessionConfig;
  sessionState: SessionState;
  totalQuestions: number;
  isBoss: boolean;
  onContinue: () => void;
}

function SummaryView({
  sessionConfig,
  sessionState,
  totalQuestions,
  isBoss,
  onContinue,
}: SummaryViewProps) {
  const { correctCount, xpEarned, mistakes, hearts } = sessionState;
  const scorePct = Math.round((correctCount / totalQuestions) * 100);
  const perfect = mistakes.length === 0;

  return (
    <div className="mx-auto max-w-lg text-center">
      {/* Trophy / celebration */}
      <div
        className={cn(
          "mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full text-5xl",
          isBoss
            ? "bg-yellow-500/20 ring-4 ring-yellow-500/30"
            : "bg-primary/10 ring-4 ring-primary/20",
        )}
      >
        {isBoss ? "🏆" : perfect ? "⭐" : "🎉"}
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-foreground">
        {isBoss
          ? "Boss Defeated!"
          : perfect
            ? "Perfect Score!"
            : `${sessionLabel(sessionConfig.mode)} Complete!`}
      </h2>

      {isBoss && (
        <p className="mt-1 text-sm font-semibold text-yellow-600 dark:text-yellow-400">
          {sessionConfig.topicName} — Topic Mastered 🏅
        </p>
      )}

      {/* Stats row */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-2xl font-bold text-foreground">{scorePct}%</p>
          <p className="text-xs text-muted-foreground mt-1">
            {correctCount}/{totalQuestions} correct
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-center gap-1">
            <Zap className="h-5 w-5 text-primary" />
            <p className="text-2xl font-bold text-primary">{xpEarned}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">XP earned</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-center gap-0.5">
            {Array.from({ length: hearts }).map((_, i) => (
              <Heart key={i} className="h-4 w-4 fill-red-500 text-red-500" />
            ))}
            {Array.from({ length: 5 - hearts }).map((_, i) => (
              <Heart key={i} className="h-4 w-4 fill-muted text-muted-foreground/30" />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">{hearts} hearts left</p>
        </div>
      </div>

      {/* Bonus badges */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {perfect && (
          <div className="flex items-center gap-1.5 rounded-full bg-yellow-500/10 px-3 py-1.5 text-xs font-semibold text-yellow-600 dark:text-yellow-400">
            <Star className="h-3.5 w-3.5" /> Perfect +20 XP
          </div>
        )}
        {isBoss && (
          <div className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
            <Trophy className="h-3.5 w-3.5" /> Boss Bonus +50 XP
          </div>
        )}
      </div>

      {/* Mistakes list */}
      {mistakes.length > 0 && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-5 text-left">
          <p className="mb-3 text-sm font-semibold text-foreground">
            Review ({mistakes.length} {mistakes.length === 1 ? "mistake" : "mistakes"})
          </p>
          <div className="space-y-3">
            {mistakes.slice(0, 3).map((m, i) => (
              <div key={i} className="rounded-xl bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground mb-1 line-clamp-2">{m.question}</p>
                <p className="text-xs font-semibold text-green-600 dark:text-green-400">
                  ✓ {m.correct_answer}
                </p>
              </div>
            ))}
            {mistakes.length > 3 && (
              <p className="text-xs text-muted-foreground text-center">
                +{mistakes.length - 3} more saved to your mistake log
              </p>
            )}
          </div>
        </div>
      )}

      <Button className="mt-6 w-full rounded-xl py-3 font-semibold" onClick={onContinue}>
        Back to Learning Path →
      </Button>
    </div>
  );
}

// ─── Failed View ──────────────────────────────────────────────────────────────

interface FailedViewProps {
  sessionConfig: SessionConfig;
  sessionState: SessionState;
  totalQuestions: number;
  onTryAgain: () => void;
  onGoBack: () => void;
}

function FailedView({
  sessionConfig,
  sessionState,
  totalQuestions,
  onTryAgain,
  onGoBack,
}: FailedViewProps) {
  const { correctCount } = sessionState;
  const scorePct = Math.round((correctCount / totalQuestions) * 100);

  return (
    <div className="mx-auto max-w-md text-center">
      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-500/10 text-5xl ring-4 ring-red-500/20">
        💔
      </div>
      <h2 className="text-2xl font-bold text-foreground">Out of Hearts</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        You got {correctCount}/{totalQuestions} correct ({scorePct}%) before running out.
      </p>

      <div className="mt-6 grid gap-3">
        <Button className="w-full rounded-xl py-3 font-semibold" onClick={onTryAgain}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
        <Button variant="outline" className="w-full rounded-xl py-3" onClick={onGoBack}>
          Back to Learning Path
        </Button>
      </div>
    </div>
  );
}
