import { BottomNav } from "@/components/dashboard/BottomNav";
import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchSubjects, fetchTopics, fetchMyProfile } from "@/lib/profile-data";
import { generateMatchingPairs, type MatchingPair } from "@/lib/matching";
import { earnCoins } from "@/lib/coins";
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
import { ArrowLeft, CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/match")({
  head: () => ({ meta: [{ title: "Matching — Study Buddy" }] }),
  component: MatchPage,
});

type Screen = "setup" | "playing" | "results";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const ai = a[i];
    const aj = a[j];
    if (ai !== undefined && aj !== undefined) {
      a[i] = aj;
      a[j] = ai;
    }
  }
  return a;
}

function MatchPage() {
  const { user } = Route.useRouteContext();

  const [screen, setScreen] = useState<Screen>("setup");
  const [pairs, setPairs] = useState<MatchingPair[]>([]);
  const [shuffledDefs, setShuffledDefs] = useState<MatchingPair[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [flashWrong, setFlashWrong] = useState<[string, string] | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);

  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");

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

  // Timer
  useEffect(() => {
    if (screen !== "playing") return;
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screen]);

  async function handleStart() {
    if (!selectedSubject || !selectedTopic || loading) return;
    setLoading(true);
    try {
      const draft = profileQuery.data?.draft;
      const { pairs: p } = await generateMatchingPairs({
        data: {
          subject: selectedSubject.name,
          topic: selectedTopic.name,
          grade: draft?.grade ?? "9",
          curriculum: draft?.curriculum ?? "",
          count: 6,
        },
      });
      setPairs(p);
      setShuffledDefs(shuffle(p));
      setMatched(new Set());
      setSelectedTermId(null);
      setAttempts(0);
      setElapsed(0);
      setFlashWrong(null);
      setScreen("playing");
    } catch {
      toast.error("Couldn't generate pairs. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleTermClick(id: string) {
    if (flashWrong || matched.has(id)) return;
    setSelectedTermId(id);
  }

  function handleDefClick(defId: string) {
    if (flashWrong || matched.has(defId) || !selectedTermId) return;

    setAttempts((a) => a + 1);

    if (selectedTermId === defId) {
      // Correct match
      const newMatched = new Set([...matched, defId]);
      setMatched(newMatched);
      setSelectedTermId(null);

      if (newMatched.size === pairs.length) {
        // All matched — stop timer and show results
        if (timerRef.current) clearInterval(timerRef.current);
        const xpEarned = Math.max(10, 60 - Math.floor(elapsed / 10) * 5);
        recordSessionCompleted(user.id, xpEarned);
        earnCoins(user.id, 10);
        setTimeout(() => setScreen("results"), 600);
      }
    } else {
      // Wrong match — flash red
      setFlashWrong([selectedTermId, defId]);
      setTimeout(() => {
        setFlashWrong(null);
        setSelectedTermId(null);
      }, 800);
    }
  }

  // ── Screens ───────────────────────────────────────────────────────────────────

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
              🧩
            </div>
            <h1 className="font-serif text-4xl tracking-tight">Matching</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Match each term to its definition before the clock runs up.
            </p>
          </div>

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
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground">
            {[
              { icon: "🧩", title: "6 pairs", desc: "Match all to win" },
              { icon: "⏱️", title: "Timed", desc: "Faster = more XP" },
              { icon: "💡", title: "No lives", desc: "Unlimited attempts" },
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
            {loading ? "Generating pairs…" : "Start Matching! 🧩"}
          </Button>
        </div>
      </main>
    );
  }

  if (screen === "results") {
    const accuracy = attempts > 0 ? Math.round((pairs.length / attempts) * 100) : 100;
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeStr =
      minutes > 0 ? `${minutes}m ${String(seconds).padStart(2, "0")}s` : `${elapsed}s`;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
        <div className="w-full max-w-md space-y-5">
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center">
            <p className="text-5xl">🎉</p>
            <h2 className="mt-3 font-serif text-3xl font-bold text-foreground">All matched!</h2>
            <p className="mt-1 text-sm text-muted-foreground">{selectedTopic?.name}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Time", value: timeStr },
              { label: "Attempts", value: String(attempts) },
              { label: "Accuracy", value: `${accuracy}%` },
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

          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={() => {
                setScreen("setup");
                setSubjectId("");
                setTopicId("");
              }}
            >
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

  // Playing screen
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              {selectedTopic?.name}
            </p>
            <p className="text-sm font-semibold text-foreground">
              {matched.size}/{pairs.length} matched
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-mono font-bold">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            {formatTime(elapsed)}
          </div>
        </div>

        {/* Progress */}
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(matched.size / Math.max(pairs.length, 1)) * 100}%` }}
          />
        </div>

        {/* Pairs grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Terms column */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Terms
            </p>
            {pairs.map((p) => {
              const isMatched = matched.has(p.id);
              const isSelected = selectedTermId === p.id;
              const isFlash = flashWrong?.[0] === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={isMatched}
                  onClick={() => handleTermClick(p.id)}
                  className={cn(
                    "w-full rounded-xl border p-3 text-left text-sm font-medium transition-all",
                    isMatched &&
                      "border-green-500/30 bg-green-500/10 text-green-700 opacity-70 cursor-default",
                    !isMatched && isFlash && "border-red-500 bg-red-500/10 text-red-700",
                    !isMatched &&
                      !isFlash &&
                      isSelected &&
                      "border-primary bg-primary/10 text-primary shadow-sm",
                    !isMatched &&
                      !isFlash &&
                      !isSelected &&
                      "border-border bg-card hover:border-primary/40 hover:bg-primary/5",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    {p.term}
                    {isMatched && <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Definitions column (shuffled) */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Definitions
            </p>
            {shuffledDefs.map((p) => {
              const isMatched = matched.has(p.id);
              const isFlash = flashWrong?.[1] === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={isMatched || !selectedTermId}
                  onClick={() => handleDefClick(p.id)}
                  className={cn(
                    "w-full rounded-xl border p-3 text-left text-sm transition-all",
                    isMatched &&
                      "border-green-500/30 bg-green-500/10 text-green-700 opacity-70 cursor-default",
                    !isMatched && isFlash && "border-red-500 bg-red-500/10 text-red-700",
                    !isMatched &&
                      !isFlash &&
                      selectedTermId &&
                      "border-border bg-card hover:border-primary/40 hover:bg-primary/5 cursor-pointer",
                    !isMatched &&
                      !isFlash &&
                      !selectedTermId &&
                      "border-border bg-card opacity-50 cursor-not-allowed",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    {p.definition}
                    {isMatched && <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedTermId && (
          <p className="text-center text-xs text-muted-foreground">
            Term selected — now click its matching definition →
          </p>
        )}
      </div>
    </main>
  );
}
