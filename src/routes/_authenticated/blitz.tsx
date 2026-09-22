import { BottomNav } from "@/components/dashboard/BottomNav";
import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchSubjects, fetchTopics, fetchMyProfile } from "@/lib/profile-data";
import {
  generatePracticeQuestions,
  shuffleQuestionOptions,
  XP_PER_DIFFICULTY,
  type PracticeQuestion,
} from "@/lib/practice";
import { loadBlitzHighScore, saveBlitzHighScore } from "@/lib/blitz";
import { recordSessionCompleted } from "@/lib/rewards";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Flame, Timer, Zap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/blitz")({
  head: () => ({ meta: [{ title: "Blitz Mode — Study Buddy" }] }),
  component: BlitzPage,
});

type Screen = "setup" | "countdown" | "playing" | "results";

const INITIAL_TIME = 60;
const BONUS_CORRECT = 3;
const PENALTY_WRONG = 3;

function comboMult(combo: number): number {
  if (combo >= 10) return 3;
  if (combo >= 5) return 2;
  if (combo >= 3) return 1.5;
  return 1;
}

function BlitzPage() {
  const { user } = Route.useRouteContext();

  const [screen, setScreen] = useState<Screen>("setup");
  const [countdown, setCountdown] = useState(3);
  const [timeLeft, setTimeLeft] = useState(INITIAL_TIME);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);

  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [loading, setLoading] = useState(false);

  // State refs so timeout callbacks see fresh values
  const comboRef = useRef(0);
  const bestComboRef = useRef(0);
  const scoreRef = useRef(0);
  const answeredRef = useRef(0);
  const correctRef = useRef(0);
  const processingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const profileQuery = useQuery({
    queryKey: ["my-profile", user.id],
    queryFn: () => fetchMyProfile(user.id),
  });
  const subjectsQuery = useQuery({ queryKey: ["subjects"], queryFn: fetchSubjects });

  const allSubjects = subjectsQuery.data ?? [];
  const enrolledIds = profileQuery.data?.draft.subjectIds ?? [];
  const subjects =
    enrolledIds.length > 0 ? allSubjects.filter((s) => enrolledIds.includes(s.id)) : allSubjects;
  const selectedSubject = subjects.find((s) => s.id === subjectId) ?? null;

  const topicsQuery = useQuery({
    queryKey: ["topics", subjectId],
    queryFn: () => fetchTopics(subjectId),
    enabled: Boolean(subjectId),
  });
  const topics = topicsQuery.data ?? [];
  const selectedTopic = topics.find((t) => t.id === topicId) ?? null;

  const highScore =
    selectedSubject && selectedTopic
      ? loadBlitzHighScore(user.id, selectedSubject.name, selectedTopic.name)
      : null;

  // Countdown then start timer
  function startCountdown(qs: PracticeQuestion[]) {
    setQuestions(qs);
    setQIdx(0);
    setScore(0);
    scoreRef.current = 0;
    setAnswered(0);
    answeredRef.current = 0;
    setCorrect(0);
    correctRef.current = 0;
    setCombo(0);
    comboRef.current = 0;
    setBestCombo(0);
    bestComboRef.current = 0;
    setTimeLeft(INITIAL_TIME);
    setScreen("countdown");
    setCountdown(3);
    let c = 3;
    const tick = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(tick);
        setScreen("playing");
      }
    }, 1000);
  }

  // Timer: runs while playing
  useEffect(() => {
    if (screen !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setScreen("results");
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screen]);

  // Save high score + award XP when results appear
  useEffect(() => {
    if (screen !== "results") return;
    if (selectedSubject && selectedTopic) {
      saveBlitzHighScore(user.id, selectedSubject.name, selectedTopic.name, {
        score: scoreRef.current,
        answered: answeredRef.current,
        correct: correctRef.current,
        bestCombo: bestComboRef.current,
        date: new Date().toISOString().slice(0, 10),
      });
    }
    recordSessionCompleted(user.id, Math.ceil(scoreRef.current * 1.5));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  async function handleStart() {
    if (!selectedSubject || !selectedTopic || loading) return;
    setLoading(true);
    try {
      const draft = profileQuery.data?.draft;
      const { questions: qs } = await generatePracticeQuestions({
        data: {
          subject: selectedSubject.name,
          topic: selectedTopic.name,
          grade: draft?.grade ?? "9",
          difficulty,
          curriculum: draft?.curriculum ?? "",
          count: 20,
        },
      });
      startCountdown(shuffleQuestionOptions(qs));
    } catch {
      toast.error("Couldn't load questions. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleAnswer(option: string) {
    if (processingRef.current || selected !== null) return;
    const q = questions.length > 0 ? questions[qIdx % questions.length] : undefined;
    if (!q) return;

    processingRef.current = true;
    setSelected(option);

    const isCorrect = option === q.correct_answer;
    const newCombo = isCorrect ? comboRef.current + 1 : 0;
    const mult = comboMult(newCombo);
    const xp = isCorrect ? Math.round(XP_PER_DIFFICULTY[q.difficulty] * mult) : 0;

    comboRef.current = newCombo;
    bestComboRef.current = Math.max(bestComboRef.current, newCombo);
    scoreRef.current += xp;
    answeredRef.current += 1;
    if (isCorrect) correctRef.current += 1;

    setFeedback(isCorrect ? "correct" : "wrong");
    setCombo(newCombo);
    setBestCombo(bestComboRef.current);
    setScore(scoreRef.current);
    setAnswered(answeredRef.current);
    if (isCorrect) setCorrect(correctRef.current);
    setTimeLeft((t) => Math.min(99, Math.max(1, t + (isCorrect ? BONUS_CORRECT : -PENALTY_WRONG))));

    setTimeout(() => {
      processingRef.current = false;
      setSelected(null);
      setFeedback(null);
      setQIdx((i) => i + 1);
    }, 700);
  }

  // ── Screens ───────────────────────────────────────────────────────────────────

  if (screen === "countdown") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Blitz starting in
        </p>
        <p className="font-serif text-9xl font-bold text-primary tabular-nums">{countdown}</p>
      </div>
    );
  }

  if (screen === "results") {
    const accuracy =
      answeredRef.current > 0 ? Math.round((correctRef.current / answeredRef.current) * 100) : 0;
    const isNewBest = !highScore || scoreRef.current > highScore.score;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
        <div className="w-full max-w-md space-y-5">
          {isNewBest && scoreRef.current > 0 && (
            <div className="rounded-2xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-center text-sm font-semibold text-yellow-700 dark:text-yellow-400">
              🏆 New High Score!
            </div>
          )}
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="text-5xl">⚡</p>
            <h2 className="mt-3 font-serif text-3xl font-bold text-foreground">
              {scoreRef.current} XP
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {answeredRef.current === 0 ? "No questions answered — try again!" : "Blitz complete!"}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Answered", value: String(answeredRef.current) },
              { label: "Accuracy", value: `${accuracy}%` },
              { label: "Best Combo", value: `×${bestComboRef.current}` },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-border bg-card p-3 text-center"
              >
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          {highScore && !isNewBest && (
            <p className="text-center text-xs text-muted-foreground">
              High score: {highScore.score} XP ({highScore.answered} answered, ×
              {highScore.bestCombo} combo)
            </p>
          )}
          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => setScreen("setup")}>
              Play again
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "setup") {
    return (
      <main className="min-h-screen bg-background px-4 pb-24 pt-12 lg:pb-12">
      <BottomNav />
        <div className="mx-auto w-full max-w-md space-y-6">
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>

          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-4xl">
              ⚡
            </div>
            <h1 className="font-serif text-4xl tracking-tight">Blitz Mode</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              60 seconds. Answer fast. Build combos. Earn XP.
            </p>
          </div>

          {highScore && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-center text-sm">
              🏆 Best: <span className="font-bold text-primary">{highScore.score} XP</span>
              <span className="ml-1 text-muted-foreground">
                · {highScore.answered} answered · ×{highScore.bestCombo} combo
              </span>
            </div>
          )}

          <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Subject</p>
              <Select
                value={subjectId}
                onValueChange={(v) => {
                  setSubjectId(v);
                  setTopicId("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Topic</p>
              <Select value={topicId} disabled={!subjectId} onValueChange={setTopicId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a topic" />
                </SelectTrigger>
                <SelectContent>
                  {topics.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Difficulty</p>
              <div className="flex gap-2">
                {(["easy", "medium", "hard"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={cn(
                      "flex-1 rounded-lg border py-2 text-sm font-medium capitalize transition-colors",
                      difficulty === d
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40",
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Rules */}
          <div className="grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground">
            {[
              { icon: "⏱️", title: "60 seconds", desc: "+3s per correct" },
              { icon: "🔥", title: "Combos", desc: "3+ = ×1.5 XP" },
              { icon: "❌", title: "Wrong answer", desc: "−3s penalty" },
            ].map((r) => (
              <div key={r.title} className="rounded-xl border border-border bg-card p-3">
                <p className="text-xl">{r.icon}</p>
                <p className="mt-1 font-semibold text-foreground">{r.title}</p>
                <p className="mt-0.5">{r.desc}</p>
              </div>
            ))}
          </div>

          <Button
            size="lg"
            className="w-full"
            disabled={!topicId || loading}
            onClick={() => void handleStart()}
          >
            {loading ? "Loading questions…" : "Start Blitz! ⚡"}
          </Button>
        </div>
      </main>
    );
  }

  // Playing screen
  const currentQ = questions.length > 0 ? questions[qIdx % questions.length] : undefined;
  if (!currentQ) return null;

  const mult = comboMult(combo);
  const timeColor =
    timeLeft <= 10 ? "text-red-500" : timeLeft <= 20 ? "text-amber-500" : "text-foreground";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* HUD */}
      <div className="border-b border-border bg-card px-6 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
          {/* Timer */}
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-muted-foreground" />
            <span className={cn("font-mono text-2xl font-bold tabular-nums", timeColor)}>
              {String(timeLeft).padStart(2, "0")}
            </span>
          </div>

          {/* Combo */}
          <div className="flex-1 text-center">
            {combo >= 3 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <Flame className="h-3 w-3" />
                {combo} combo · {mult}× XP
              </span>
            ) : null}
          </div>

          {/* Score */}
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="font-bold tabular-nums">{score}</span>
          </div>
        </div>

        {/* Time bar */}
        <div className="mx-auto mt-2 max-w-2xl">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                timeLeft > 10 ? "bg-primary" : "bg-red-500",
              )}
              style={{ width: `${(timeLeft / INITIAL_TIME) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl space-y-5">
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {selectedTopic?.name}
            </p>
            <p className="mt-3 text-lg font-semibold leading-snug text-foreground">
              {currentQ.question}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {currentQ.options.map((opt) => {
              const isSelected = selected === opt;
              const isCorrect = opt === currentQ.correct_answer;
              const showResult = feedback !== null;
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={selected !== null}
                  onClick={() => handleAnswer(opt)}
                  className={cn(
                    "rounded-xl border p-4 text-left text-sm font-medium transition-all",
                    !showResult &&
                      "border-border bg-card hover:border-primary/60 hover:bg-primary/5",
                    showResult && isCorrect && "border-green-500 bg-green-500/10 text-green-700",
                    showResult &&
                      isSelected &&
                      !isCorrect &&
                      "border-red-500 bg-red-500/10 text-red-700",
                    showResult && !isSelected && !isCorrect && "border-border bg-card opacity-40",
                    !showResult && isSelected && "border-primary bg-primary/10",
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {feedback && (
            <div
              className={cn(
                "rounded-xl border px-4 py-2 text-sm font-medium",
                feedback === "correct"
                  ? "border-green-500/30 bg-green-500/10 text-green-700"
                  : "border-red-500/30 bg-red-500/10 text-red-700",
              )}
            >
              {feedback === "correct"
                ? `✅ +${Math.round(XP_PER_DIFFICULTY[currentQ.difficulty] * mult)} XP${combo >= 3 ? ` (${mult}× combo!)` : ""}`
                : `❌ ${currentQ.correct_answer}`}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
