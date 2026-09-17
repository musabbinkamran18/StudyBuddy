import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchSubjects, fetchTopics, fetchMyProfile } from "@/lib/profile-data";
import { generatePracticeQuestions } from "@/lib/practice";
import {
  loadFlashcardDeck,
  saveFlashcardDeck,
  createDeck,
  getDueCards,
  getDueCount,
  markKnown,
  markHard,
  type FlashcardRecord,
} from "@/lib/flashcards";
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
import { ArrowLeft, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/flashcards")({
  head: () => ({ meta: [{ title: "Flashcards — Study Buddy" }] }),
  component: FlashcardsPage,
});

type Screen = "setup" | "studying" | "results";

// Per-session retry count so we don't loop "hard" cards forever
type SessionCard = { card: FlashcardRecord; hardCount: number };

function FlashcardsPage() {
  const { user } = Route.useRouteContext();

  const [screen, setScreen] = useState<Screen>("setup");
  const [queue, setQueue] = useState<SessionCard[]>([]);
  const [knownIds, setKnownIds] = useState<Set<string>>(new Set());
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);

  const [subjectId, setSubjectId] = useState("");
  const [topicId, setTopicId] = useState("");

  // Store updated deck cards to save at session end
  const updatedCardsRef = useRef<Map<string, FlashcardRecord>>(new Map());

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

  const existingDeck =
    selectedSubject && selectedTopic
      ? loadFlashcardDeck(user.id, selectedSubject.name, selectedTopic.name)
      : [];
  const dueCount = getDueCount(existingDeck);

  async function handleStart(mode: "due" | "all") {
    if (!selectedSubject || !selectedTopic || loading) return;
    setLoading(true);
    updatedCardsRef.current = new Map();

    try {
      let deck = loadFlashcardDeck(user.id, selectedSubject.name, selectedTopic.name);

      // Generate a new deck if none exists
      if (deck.length === 0) {
        const draft = profileQuery.data?.draft;
        const { questions } = await generatePracticeQuestions({
          data: {
            subject: selectedSubject.name,
            topic: selectedTopic.name,
            grade: draft?.grade ?? "9",
            difficulty: "medium",
            curriculum: draft?.curriculum ?? "",
            count: 15,
          },
        });
        deck = createDeck(questions);
        saveFlashcardDeck(user.id, selectedSubject.name, selectedTopic.name, deck);
      }

      const cards = mode === "due" ? getDueCards(deck) : deck;
      if (cards.length === 0) {
        toast("No cards to review right now — come back tomorrow!");
        return;
      }

      setQueue(cards.map((card) => ({ card, hardCount: 0 })));
      setKnownIds(new Set());
      setIsFlipped(false);
      setScreen("studying");
    } catch {
      toast.error("Couldn't load flashcards. Try again.");
    } finally {
      setLoading(false);
    }
  }

  // Save deck + award XP when session ends
  useEffect(() => {
    if (screen !== "results" || !selectedSubject || !selectedTopic) return;
    const deck = loadFlashcardDeck(user.id, selectedSubject.name, selectedTopic.name);
    const updated = deck.map((c) => updatedCardsRef.current.get(c.id) ?? c);
    saveFlashcardDeck(user.id, selectedSubject.name, selectedTopic.name, updated);
    recordSessionCompleted(user.id, knownIds.size * 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  function currentSessionCard(): SessionCard | undefined {
    return queue[0];
  }

  function handleFlip() {
    setIsFlipped((f) => !f);
  }

  function handleRate(rating: "known" | "hard") {
    const sc = currentSessionCard();
    if (!sc) return;

    const updatedCard = rating === "known" ? markKnown(sc.card) : markHard(sc.card);
    updatedCardsRef.current.set(sc.card.id, updatedCard);

    if (rating === "known") {
      setKnownIds((prev) => new Set([...prev, sc.card.id]));
      setQueue((q) => q.slice(1));
    } else {
      // Put card back if it hasn't been retried twice yet
      const hardCount = sc.hardCount + 1;
      setQueue((q) => {
        const rest = q.slice(1);
        if (hardCount < 2) {
          // Reinsert 3 cards from now (or at end if shorter)
          const pos = Math.min(3, rest.length);
          return [...rest.slice(0, pos), { card: updatedCard, hardCount }, ...rest.slice(pos)];
        }
        return rest;
      });
    }

    setIsFlipped(false);
  }

  // Auto-end session when queue empties
  useEffect(() => {
    if (screen === "studying" && queue.length === 0 && knownIds.size > 0) {
      setScreen("results");
    }
  }, [queue, screen, knownIds.size]);

  // ── Screens ───────────────────────────────────────────────────────────────────

  if (screen === "setup") {
    return (
      <main className="min-h-screen bg-background px-4 py-12">
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
              🃏
            </div>
            <h1 className="font-serif text-4xl tracking-tight">Flashcards</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Tap to flip. Rate yourself. Cards you struggle with come back sooner.
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

          {/* Due cards info */}
          {topicId && existingDeck.length > 0 && (
            <div
              className={cn(
                "rounded-xl border px-4 py-3 text-sm",
                dueCount > 0
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  : "border-green-500/30 bg-green-500/10 text-green-700",
              )}
            >
              {dueCount > 0 ? (
                <>
                  📅 <strong>{dueCount}</strong> card{dueCount !== 1 ? "s" : ""} due for review
                  today
                </>
              ) : (
                <>✅ All caught up! No cards due today.</>
              )}
            </div>
          )}

          <div className="space-y-2">
            {topicId && existingDeck.length > 0 && dueCount > 0 && (
              <Button
                size="lg"
                className="w-full"
                disabled={loading}
                onClick={() => void handleStart("due")}
              >
                {loading ? "Loading…" : `Review ${dueCount} due card${dueCount !== 1 ? "s" : ""}`}
              </Button>
            )}
            <Button
              size="lg"
              variant={topicId && existingDeck.length > 0 && dueCount > 0 ? "outline" : "default"}
              className="w-full"
              disabled={!topicId || loading}
              onClick={() => void handleStart("all")}
            >
              {loading
                ? "Loading…"
                : existingDeck.length === 0
                  ? "Generate & Study 🃏"
                  : `Study all ${existingDeck.length} cards`}
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground">
            {[
              { icon: "🃏", title: "Tap to flip", desc: "See the answer" },
              { icon: "✅", title: "Got it", desc: "Longer interval" },
              { icon: "🔄", title: "Hard", desc: "Review sooner" },
            ].map((r) => (
              <div key={r.title} className="rounded-xl border border-border bg-card p-3">
                <p className="text-xl">{r.icon}</p>
                <p className="mt-1 font-semibold text-foreground">{r.title}</p>
                <p className="mt-0.5">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (screen === "results") {
    const total = knownIds.size + (queue.length > 0 ? queue.length : 0);
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
        <div className="w-full max-w-md space-y-5">
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center">
            <p className="text-5xl">🃏</p>
            <h2 className="mt-3 font-serif text-3xl font-bold text-foreground">
              Session complete!
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {selectedTopic?.name} · {knownIds.size} mastered
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Cards reviewed", value: String(total) },
              { label: "Mastered", value: `${knownIds.size} ✅` },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-border bg-card p-4 text-center"
              >
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Hard cards will reappear tomorrow. Mastered cards come back in{" "}
            {existingDeck.length > 0
              ? `${Math.min(...existingDeck.map((c) => c.interval)) * 2} days`
              : "a few days"}
            .
          </p>

          <div className="flex gap-3">
            <Button
              className="flex-1"
              onClick={() => {
                setScreen("setup");
                setIsFlipped(false);
              }}
            >
              Study again
            </Button>
            <Button variant="outline" className="flex-1" asChild>
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── Studying screen ───────────────────────────────────────────────────────────

  const sc = currentSessionCard();
  if (!sc) return null;
  const { card } = sc;
  const remaining = queue.length;
  const total = knownIds.size + remaining;
  const progress = total > 0 ? (knownIds.size / total) * 100 : 0;

  return (
    <main className="flex min-h-screen flex-col bg-background px-4 py-8">
      <div className="mx-auto w-full max-w-xl space-y-6">
        {/* Progress header */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {knownIds.size}/{total} mastered
          </span>
          <span className="font-medium text-foreground">{selectedTopic?.name}</span>
          <span>{remaining} left</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Flip card */}
        <div
          style={{ perspective: "1200px" }}
          className="cursor-pointer select-none"
          onClick={handleFlip}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === " " && handleFlip()}
          aria-label={isFlipped ? "Card back — click to flip to front" : "Click to reveal answer"}
        >
          <div
            style={{
              transformStyle: "preserve-3d",
              transition: "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
              position: "relative",
              height: "260px",
            }}
          >
            {/* Front */}
            <div
              style={{ backfaceVisibility: "hidden", position: "absolute", inset: 0 }}
              className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-8 py-10 text-center"
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {card.topic}
              </p>
              <p className="text-lg font-semibold leading-snug text-foreground">{card.front}</p>
              <p className="mt-4 text-xs text-muted-foreground">Tap to reveal answer</p>
            </div>

            {/* Back */}
            <div
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                position: "absolute",
                inset: 0,
              }}
              className="flex flex-col items-center justify-center rounded-2xl border border-primary/30 bg-primary/5 px-8 py-10 text-center"
            >
              <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary/60">
                Answer
              </p>
              <p className="text-2xl font-bold text-foreground">{card.answer}</p>
              {card.explanation && (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {card.explanation}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Hint when not flipped */}
        {!isFlipped && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <RotateCcw className="h-3.5 w-3.5" />
            Tap card or press Space to flip
          </div>
        )}

        {/* Rating buttons — only shown after flip */}
        {isFlipped && (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleRate("hard")}
              className="rounded-2xl border-2 border-red-500/30 bg-red-500/10 px-4 py-4 text-center transition-all hover:bg-red-500/20 active:scale-95"
            >
              <p className="text-2xl">🔄</p>
              <p className="mt-1 font-semibold text-red-600">Hard</p>
              <p className="text-xs text-red-500/70">Review again soon</p>
            </button>
            <button
              type="button"
              onClick={() => handleRate("known")}
              className="rounded-2xl border-2 border-green-500/30 bg-green-500/10 px-4 py-4 text-center transition-all hover:bg-green-500/20 active:scale-95"
            >
              <p className="text-2xl">✅</p>
              <p className="mt-1 font-semibold text-green-700">Got it!</p>
              <p className="text-xs text-green-600/70">Come back in {card.interval * 2}d</p>
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
