import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchBattleRoom,
  joinBattleRoom,
  updateBattleConfig,
  startBattleWithQuestions,
  recordBattleAnswer,
  finalizeBattle,
  subscribeToBattleRoom,
  BOT_ID,
  BOT_NAME,
  BOT_AVATAR,
  BOT_ACCURACY,
  type BattleRoom,
} from "@/lib/battle";
import {
  generatePracticeQuestions,
  XP_PER_DIFFICULTY,
  type PracticeQuestion,
} from "@/lib/practice";
import { fetchSubjects, fetchTopics, fetchMyProfile } from "@/lib/profile-data";
import { loadAvatar } from "@/lib/avatar";
import { isDemo } from "@/lib/backend";
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
import { Copy, Check, ArrowLeft, Loader2, Trophy, Sword } from "lucide-react";

export const Route = createFileRoute("/_authenticated/battle/$code")({
  head: () => ({ meta: [{ title: "Battle Room — Study Buddy" }] }),
  component: BattleRoom,
});

type Screen = "loading" | "lobby" | "countdown" | "playing" | "feedback" | "results";

interface PlayerState {
  score: number;
  correct: number;
  finished: boolean;
}

function BattleRoom() {
  const { user } = Route.useRouteContext();
  const { code } = Route.useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState<BattleRoom | null>(null);
  const [screen, setScreen] = useState<Screen>("loading");
  const [countdown, setCountdown] = useState(3);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [demo, setDemo] = useState(false);

  // Track both player states locally (optimistic) + from DB (source of truth)
  const [me, setMe] = useState<PlayerState>({ score: 0, correct: 0, finished: false });
  const [opponent, setOpponent] = useState<PlayerState>({ score: 0, correct: 0, finished: false });
  const [winnerName, setWinnerName] = useState<string | null>(null);

  const botTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const processingRef = useRef(false);
  const screenRef = useRef<Screen>("loading");

  const profileQuery = useQuery({
    queryKey: ["my-profile", user.id],
    queryFn: () => fetchMyProfile(user.id),
  });

  const subjectsQuery = useQuery({ queryKey: ["subjects"], queryFn: fetchSubjects });

  const playerName = profileQuery.data?.draft.full_name || "Student";
  const avatar = loadAvatar(user.id);
  const allSubjects = subjectsQuery.data ?? [];
  const enrolledSubjectIds = profileQuery.data?.draft.subjectIds ?? [];
  const enrolledSubjects = allSubjects.filter((s) => enrolledSubjectIds.includes(s.id));
  // Fall back to all subjects so the battle lobby is usable before onboarding
  const battleSubjects = enrolledSubjects.length > 0 ? enrolledSubjects : allSubjects;

  const topicsQuery = useQuery({
    queryKey: ["topics", room?.subject],
    queryFn: () => {
      const s = allSubjects.find((s) => s.name === room?.subject);
      return s ? fetchTopics(s.id) : Promise.resolve([]);
    },
    enabled: Boolean(room?.subject),
  });

  const isHost = room?.hostId === user.id;
  const questions = useMemo(() => room?.questions ?? [], [room]);
  const currentQuestion = questions[currentQ];

  // Keep a ref in sync with screen so Realtime callbacks avoid stale closures
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  // Award XP exactly once when results appear
  useEffect(() => {
    if (screen === "results") {
      recordSessionCompleted(user.id, Math.ceil(questions.length * 1.5));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // ── Load room & resolve role ────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const demoMode = await isDemo();
      if (cancelled) return;
      setDemo(demoMode);

      let r = await fetchBattleRoom(code);
      if (!r) {
        toast.error("Room not found.");
        void navigate({ to: "/battle" });
        return;
      }

      // If we're not in the room yet and it's waiting → join as guest
      if (r.hostId !== user.id && !r.guestId && r.status === "waiting") {
        r = await joinBattleRoom(code, user.id, playerName, avatar);
        if (!demoMode) toast.success("Joined the battle lobby!");
      }

      if (cancelled) return;
      setRoom(r);

      if (r.status === "playing") {
        setScreen("playing");
      } else if (r.status === "finished") {
        resolveResults(r);
        setScreen("results");
      } else {
        setScreen("lobby");
      }

      // Subscribe to DB changes (cloud mode only)
      if (!demoMode) {
        unsubRef.current = subscribeToBattleRoom(code, (updated) => {
          if (cancelled) return;
          setRoom(updated);
          if (updated.status === "playing" && screenRef.current !== "playing") {
            startCountdown();
          }
          if (updated.status === "finished") {
            resolveResults(updated);
            setScreen("results");
          }
          // Sync opponent stats
          const iAmHost = updated.hostId === user.id;
          setOpponent({
            score: iAmHost ? updated.guestScore : updated.hostScore,
            correct: iAmHost ? updated.guestCorrect : updated.hostCorrect,
            finished: iAmHost ? updated.guestFinished : updated.hostFinished,
          });
        });
      }
    }

    void init();
    return () => {
      cancelled = true;
      if (unsubRef.current) unsubRef.current();
      if (botTimerRef.current) clearTimeout(botTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, user.id]);

  // ── Countdown helper ────────────────────────────────────────────────────────

  function startCountdown() {
    setScreen("countdown");
    setCountdown(3);
    let c = 3;
    const tick = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(tick);
        setCurrentQ(0);
        setMe({ score: 0, correct: 0, finished: false });
        setOpponent({ score: 0, correct: 0, finished: false });
        setScreen("playing");
      }
    }, 1000);
  }

  // ── Bot simulation ──────────────────────────────────────────────────────────

  const simulateBotAnswer = useCallback(
    (qIdx: number, qs: PracticeQuestion[]) => {
      if (!demo) return;
      const q = qs[qIdx];
      if (!q) return;
      const delay = 600 + Math.random() * 1800;
      botTimerRef.current = setTimeout(() => {
        const correct = Math.random() < BOT_ACCURACY;
        const xp = correct ? XP_PER_DIFFICULTY[q.difficulty] : 0;
        const finished = qIdx >= qs.length - 1;

        setOpponent((prev) => ({
          score: prev.score + xp,
          correct: prev.correct + (correct ? 1 : 0),
          finished,
        }));

        void recordBattleAnswer(code, false, xp, correct, finished);

        if (finished) {
          // Let the host finalize when both are done (handled in handleAnswer)
        }
      }, delay);
    },
    [code, demo],
  );

  // ── Start battle (host only) ────────────────────────────────────────────────

  const [generating, setGenerating] = useState(false);

  async function handleStart() {
    if (!room || generating) return;
    if (!room.subject || !room.topic) {
      toast.error("Pick a subject and topic first.");
      return;
    }
    setGenerating(true);
    try {
      const draft = profileQuery.data?.draft;
      const { questions: qs } = await generatePracticeQuestions({
        data: {
          subject: room.subject,
          topic: room.topic,
          grade: draft?.grade ?? "9",
          difficulty: room.difficulty,
          curriculum: draft?.curriculum ?? "",
          count: 10,
        },
      });
      await startBattleWithQuestions(code, qs);
      const updated = { ...room, questions: qs, status: "playing" as const };
      setRoom(updated);

      if (demo) {
        startCountdown();
        // Bot will answer after countdown + small delay; we start bot on first question
      } else {
        // DB update triggers Realtime for both players
        startCountdown();
      }
    } catch (err) {
      toast.error("Couldn't generate questions. Try again.");
      console.error(err);
    } finally {
      setGenerating(false);
    }
  }

  // ── After countdown → start bot for first question ─────────────────────────

  useEffect(() => {
    if (screen === "playing" && demo && currentQ === 0 && questions.length > 0) {
      simulateBotAnswer(0, questions);
    }
  }, [screen, demo, currentQ, questions, simulateBotAnswer]);

  // ── Answer a question ───────────────────────────────────────────────────────

  async function handleAnswer(option: string) {
    if (selected !== null || processingRef.current) return;
    const q = currentQuestion;
    if (!q) return;

    processingRef.current = true;
    setSelected(option);

    const correct = option === q.correct_answer;
    const xp = correct ? XP_PER_DIFFICULTY[q.difficulty] : 0;
    const isLastQ = currentQ >= questions.length - 1;

    const nextMe: PlayerState = {
      score: me.score + xp,
      correct: me.correct + (correct ? 1 : 0),
      finished: isLastQ,
    };
    setMe(nextMe);

    await recordBattleAnswer(code, isHost, xp, correct, isLastQ);

    setScreen("feedback");

    // Auto-advance after 1.5 s
    setTimeout(async () => {
      processingRef.current = false;

      if (isLastQ) {
        // Check if both are done
        const latestRoom = await fetchBattleRoom(code);
        const opponentDone = isHost
          ? (latestRoom?.guestFinished ?? opponent.finished)
          : (latestRoom?.hostFinished ?? opponent.finished);

        if (opponentDone || demo) {
          const myScore = nextMe.score;
          const oppScore = demo
            ? opponent.score
            : isHost
              ? (latestRoom?.guestScore ?? 0)
              : (latestRoom?.hostScore ?? 0);
          const winnerId =
            myScore > oppScore
              ? user.id
              : oppScore > myScore
                ? (room?.guestId ?? room?.hostId ?? null)
                : null;
          await finalizeBattle(code, winnerId);
          resolveResults({
            ...room!,
            hostScore: isHost ? myScore : oppScore,
            guestScore: isHost ? oppScore : myScore,
            winnerId,
            status: "finished",
          });
          setScreen("results");
        } else {
          toast("Waiting for your opponent to finish…");
          setScreen("playing");
        }
      } else {
        const nextIdx = currentQ + 1;
        setCurrentQ(nextIdx);
        setSelected(null);
        setScreen("playing");
        if (demo) simulateBotAnswer(nextIdx, questions);
      }
    }, 1500);
  }

  // ── Resolve winner name ─────────────────────────────────────────────────────

  function resolveResults(r: BattleRoom) {
    if (!r.winnerId) {
      setWinnerName(null);
      return;
    }
    if (r.winnerId === user.id) {
      setWinnerName("you");
    } else if (r.winnerId === BOT_ID) {
      setWinnerName(BOT_NAME);
    } else {
      setWinnerName(r.guestName ?? r.hostName ?? "Opponent");
    }
  }

  // ── Copy room code ──────────────────────────────────────────────────────────

  function copyCode() {
    void navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Derived display values ──────────────────────────────────────────────────

  const myName = playerName;
  const myAvatar = avatar;
  const oppName = isHost ? (room?.guestName ?? "Waiting…") : (room?.hostName ?? "Host");
  const oppAvatar = isHost ? (room?.guestAvatar ?? "❓") : (room?.hostAvatar ?? "⭐");

  // ── Screens ─────────────────────────────────────────────────────────────────

  if (screen === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (screen === "countdown") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background">
        <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
          Battle starting in
        </p>
        <p className="font-serif text-9xl font-bold text-primary tabular-nums">{countdown}</p>
        <p className="text-muted-foreground">
          {myName} vs {oppName}
        </p>
      </div>
    );
  }

  if (screen === "results") {
    const iWon = winnerName === "you";
    const isDraw = winnerName === null;
    const myFinalScore = isHost ? (room?.hostScore ?? me.score) : (room?.guestScore ?? me.score);
    const oppFinalScore = isHost
      ? (room?.guestScore ?? opponent.score)
      : (room?.hostScore ?? opponent.score);
    const myFinalCorrect = isHost
      ? (room?.hostCorrect ?? me.correct)
      : (room?.guestCorrect ?? me.correct);
    const oppFinalCorrect = isHost
      ? (room?.guestCorrect ?? opponent.correct)
      : (room?.hostCorrect ?? opponent.correct);
    const bonusXp = iWon ? 50 : isDraw ? 20 : 10;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
        <div className="w-full max-w-md space-y-6">
          {/* Result banner */}
          <div
            className={cn(
              "rounded-2xl border p-8 text-center",
              iWon
                ? "border-yellow-500/40 bg-yellow-500/10"
                : isDraw
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-card",
            )}
          >
            <p className="text-5xl">{iWon ? "🏆" : isDraw ? "🤝" : "💪"}</p>
            <h2 className="mt-3 font-serif text-3xl tracking-tight">
              {iWon ? "You won!" : isDraw ? "It's a draw!" : `${winnerName ?? "Opponent"} wins!`}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {iWon
                ? "Brilliant — well played."
                : isDraw
                  ? "Evenly matched!"
                  : "Better luck next time."}
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
              ⭐ +{bonusXp} XP earned
            </div>
          </div>

          {/* Score comparison */}
          <div className="grid grid-cols-2 gap-4">
            <ScoreCard
              name={myName}
              avatar={myAvatar}
              score={myFinalScore}
              correct={myFinalCorrect}
              total={questions.length}
              highlight={iWon}
            />
            <ScoreCard
              name={oppName}
              avatar={oppAvatar}
              score={oppFinalScore}
              correct={oppFinalCorrect}
              total={questions.length}
              highlight={!iWon && !isDraw}
            />
          </div>

          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => void navigate({ to: "/battle" })}>
              <Sword className="h-4 w-4" />
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

  if (screen === "lobby") {
    const guestReady = Boolean(room?.guestId);
    return (
      <main className="min-h-screen bg-background px-4 py-10">
        <div className="mx-auto w-full max-w-xl space-y-6">
          <Link
            to="/battle"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          {/* Room code */}
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Room code
            </p>
            <p className="mt-2 font-mono text-4xl font-bold tracking-[0.3em] text-foreground">
              {code}
            </p>
            {!demo && (
              <button
                type="button"
                onClick={copyCode}
                className="mt-3 flex items-center gap-1.5 mx-auto text-sm text-primary hover:underline"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy code"}
              </button>
            )}
          </div>

          {/* Players */}
          <div className="grid grid-cols-2 gap-4">
            <PlayerCard name={myName} avatar={myAvatar} label="You" ready />
            <PlayerCard
              name={guestReady ? oppName : "Waiting…"}
              avatar={guestReady ? oppAvatar : "❓"}
              label={isHost ? "Opponent" : "Host"}
              ready={guestReady}
            />
          </div>

          {/* Config (host only) */}
          {isHost && (
            <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
              <h3 className="font-semibold text-foreground">Battle settings</h3>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Subject</p>
                <Select
                  value={room?.subject ?? ""}
                  onValueChange={(v) => {
                    setRoom((r) => (r ? { ...r, subject: v, topic: "" } : r));
                    void updateBattleConfig(code, v, "", room?.difficulty ?? "medium");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {battleSubjects.map((s) => (
                      <SelectItem key={s.id} value={s.name}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Topic</p>
                <Select
                  value={room?.topic ?? ""}
                  disabled={!room?.subject}
                  onValueChange={(v) => {
                    setRoom((r) => (r ? { ...r, topic: v } : r));
                    void updateBattleConfig(
                      code,
                      room?.subject ?? "",
                      v,
                      room?.difficulty ?? "medium",
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {(topicsQuery.data ?? []).map((t) => (
                      <SelectItem key={t.id} value={t.name}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Difficulty</p>
                <div className="flex gap-2">
                  {(["easy", "medium", "hard"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setRoom((r) => (r ? { ...r, difficulty: d } : r));
                        void updateBattleConfig(code, room?.subject ?? "", room?.topic ?? "", d);
                      }}
                      className={cn(
                        "flex-1 rounded-lg border py-2 text-sm font-medium capitalize transition-colors",
                        room?.difficulty === d
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
          )}

          {/* Guest: view config */}
          {!isHost && room?.subject && (
            <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              {room.subject} · {room.topic || "No topic yet"} ·{" "}
              <span className="capitalize">{room.difficulty}</span>
            </div>
          )}

          {/* Start button (host only) */}
          {isHost && (
            <Button
              size="lg"
              className="w-full"
              disabled={!guestReady || !room?.subject || !room?.topic || generating}
              onClick={() => void handleStart()}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating questions…
                </>
              ) : !guestReady ? (
                "Waiting for opponent…"
              ) : (
                <>
                  <Sword className="h-4 w-4" />
                  Start Battle!
                </>
              )}
            </Button>
          )}

          {!isHost && (
            <p className="text-center text-sm text-muted-foreground">
              Waiting for the host to start…
            </p>
          )}
        </div>
      </main>
    );
  }

  // ── Playing / Feedback ──────────────────────────────────────────────────────

  if (!currentQuestion) return null;
  const progress = ((currentQ + 1) / Math.max(questions.length, 1)) * 100;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Score bar */}
      <div className="border-b border-border bg-card px-6 py-3">
        <div className="mx-auto flex max-w-2xl items-center gap-4">
          <ScorePill name={myName} avatar={myAvatar} score={me.score} correct={me.correct} mine />
          <div className="flex-1 text-center">
            <p className="text-xs font-medium text-muted-foreground">
              Q {currentQ + 1}/{questions.length}
            </p>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <ScorePill
            name={oppName}
            avatar={oppAvatar}
            score={opponent.score}
            correct={opponent.correct}
          />
        </div>
      </div>

      {/* Question */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {room?.topic}
            </p>
            <p className="mt-3 text-lg font-semibold leading-snug text-foreground">
              {currentQuestion.question}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {currentQuestion.options.map((opt) => {
              const isSelected = selected === opt;
              const isCorrect = opt === currentQuestion.correct_answer;
              const showResult = screen === "feedback";

              return (
                <button
                  key={opt}
                  type="button"
                  disabled={selected !== null}
                  onClick={() => void handleAnswer(opt)}
                  className={cn(
                    "rounded-xl border p-4 text-left text-sm font-medium transition-all",
                    !showResult &&
                      "border-border bg-card hover:border-primary/60 hover:bg-primary/5",
                    showResult && isCorrect && "border-green-500 bg-green-500/10 text-green-700",
                    showResult &&
                      isSelected &&
                      !isCorrect &&
                      "border-red-500 bg-red-500/10 text-red-700",
                    showResult && !isSelected && !isCorrect && "border-border bg-card opacity-50",
                    !showResult && isSelected && "border-primary bg-primary/10",
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {screen === "feedback" && (
            <div
              className={cn(
                "rounded-xl border px-4 py-3 text-sm",
                selected === currentQuestion.correct_answer
                  ? "border-green-500/30 bg-green-500/10 text-green-700"
                  : "border-red-500/30 bg-red-500/10 text-red-700",
              )}
            >
              <p className="font-semibold">
                {selected === currentQuestion.correct_answer ? "✅ Correct!" : "❌ Incorrect"}
              </p>
              <p className="mt-1 text-xs opacity-80">{currentQuestion.explanation}</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PlayerCard({
  name,
  avatar,
  label,
  ready,
}: {
  name: string;
  avatar: string;
  label: string;
  ready: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 text-center transition-colors",
        ready ? "border-primary/30 bg-primary/5" : "border-dashed border-border bg-muted/20",
      )}
    >
      <p className="text-3xl">{avatar}</p>
      <p className="mt-2 text-sm font-semibold text-foreground truncate">{name}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {ready && <p className="mt-1 text-xs font-medium text-primary">Ready</p>}
    </div>
  );
}

function ScoreCard({
  name,
  avatar,
  score,
  correct,
  total,
  highlight,
}: {
  name: string;
  avatar: string;
  score: number;
  correct: number;
  total: number;
  highlight: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 text-center",
        highlight ? "border-yellow-500/40 bg-yellow-500/10" : "border-border bg-card",
      )}
    >
      <p className="text-3xl">{avatar}</p>
      <p className="mt-1.5 text-sm font-semibold text-foreground truncate">{name}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{score}</p>
      <p className="text-xs text-muted-foreground">XP</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {correct}/{total} correct
      </p>
      {highlight && <Trophy className="mx-auto mt-2 h-4 w-4 text-yellow-500" />}
    </div>
  );
}

function ScorePill({
  name,
  avatar,
  score,
  correct,
  mine,
}: {
  name: string;
  avatar: string;
  score: number;
  correct: number;
  mine?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2", mine ? "flex-row" : "flex-row-reverse")}>
      <span className="text-xl">{avatar}</span>
      <div className={mine ? "text-left" : "text-right"}>
        <p className="text-xs font-semibold text-foreground truncate max-w-[80px]">{name}</p>
        <p className="text-xs text-muted-foreground">
          {score} XP · {correct}✓
        </p>
      </div>
    </div>
  );
}
