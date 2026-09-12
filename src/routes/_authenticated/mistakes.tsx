import { useState, useEffect, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronLeft, ChevronRight, Trash2, CheckCircle2, RefreshCw, Clock } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { fetchMyProfile } from "@/lib/profile-data";
import {
  loadMistakes,
  advanceMistake,
  resetMistakeInterval,
  clearMistakes,
  type MistakeEntry,
} from "@/lib/progress";
import { loadCoinState } from "@/lib/coins";
import { loadAvatar } from "@/lib/avatar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/mistakes")({
  head: () => ({
    meta: [{ title: "Mistake Log — Study Buddy" }],
  }),
  component: MistakesPage,
});

type ViewMode = "list" | "flashcard";

function isDue(m: MistakeEntry) {
  return (m.nextReview ?? 0) <= Date.now();
}

function sortedMistakes(list: MistakeEntry[]): MistakeEntry[] {
  return [...list].sort((a, b) => {
    const aDue = isDue(a);
    const bDue = isDue(b);
    if (aDue && !bDue) return -1;
    if (!aDue && bDue) return 1;
    return (a.nextReview ?? 0) - (b.nextReview ?? 0);
  });
}

function MistakesPage() {
  const { user } = Route.useRouteContext();

  const profileQuery = useQuery({
    queryKey: ["my-profile", user.id],
    queryFn: () => fetchMyProfile(user.id),
  });

  const [mistakes, setMistakes] = useState<MistakeEntry[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [mode, setMode] = useState<ViewMode>("list");
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const reload = useCallback(() => {
    setMistakes(sortedMistakes(loadMistakes(user.id)));
  }, [user.id]);

  useEffect(() => {
    reload();
  }, [reload]);

  const userName = profileQuery.data?.draft.full_name || "Student";
  const coins = loadCoinState(user.id).balance;
  const avatar = loadAvatar(user.id);

  const subjects = Array.from(new Set(mistakes.map((m) => m.subject))).sort();

  const filtered =
    filter === "all" ? mistakes : mistakes.filter((m) => m.subject === filter);

  const dueCount = filtered.filter(isDue).length;

  function handleAdvance(id: string) {
    advanceMistake(user.id, id);
    reload();
    setCardIndex((i) => Math.max(0, Math.min(i, filtered.length - 2)));
    setFlipped(false);
  }

  function handleReset(id: string) {
    resetMistakeInterval(user.id, id);
    reload();
    setCardIndex((i) => Math.min(i + 1, Math.max(0, filtered.length - 2)));
    setFlipped(false);
  }

  function handleClearAll() {
    clearMistakes(user.id);
    reload();
    setCardIndex(0);
    setFlipped(false);
  }

  const currentCard = filtered[cardIndex];

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex min-h-screen flex-col lg:pl-[240px]">
        <TopBar userName={userName} coins={coins} avatar={avatar} />
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-3xl">
            <Link
              to="/dashboard"
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back to dashboard
            </Link>

            {/* Header */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Mistake Log</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {mistakes.length === 0
                    ? "No mistakes saved yet."
                    : dueCount > 0
                      ? `${dueCount} due for review · ${mistakes.length} total`
                      : `${mistakes.length} saved · none due right now`}
                </p>
              </div>

              {mistakes.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex rounded-xl border border-border p-0.5">
                    <button
                      onClick={() => { setMode("list"); setFlipped(false); }}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                        mode === "list"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      List
                    </button>
                    <button
                      onClick={() => { setMode("flashcard"); setCardIndex(0); setFlipped(false); }}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                        mode === "flashcard"
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      Flashcards
                    </button>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                    onClick={handleClearAll}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear all
                  </Button>
                </div>
              )}
            </div>

            {mistakes.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-20 text-center">
                <div className="mb-4 text-6xl">🎉</div>
                <h2 className="text-xl font-bold text-foreground">All clear!</h2>
                <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                  No mistakes saved. Keep practising to see areas where you can improve.
                </p>
                <Link to="/practice" className="mt-6">
                  <Button>Start Practising</Button>
                </Link>
              </div>
            ) : (
              <>
                {/* Subject filter */}
                {subjects.length > 1 && (
                  <div className="mb-5 flex flex-wrap gap-2">
                    <button
                      onClick={() => setFilter("all")}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                        filter === "all"
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      )}
                    >
                      All ({mistakes.length})
                    </button>
                    {subjects.map((s) => {
                      const count = mistakes.filter((m) => m.subject === s).length;
                      const due = mistakes.filter((m) => m.subject === s && isDue(m)).length;
                      return (
                        <button
                          key={s}
                          onClick={() => { setFilter(s); setCardIndex(0); setFlipped(false); }}
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                            filter === s
                              ? "bg-primary text-primary-foreground"
                              : "border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                          )}
                        >
                          {s} ({count}){due > 0 && ` · ${due} due`}
                        </button>
                      );
                    })}
                  </div>
                )}

                {filtered.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No mistakes for this subject.
                  </p>
                ) : mode === "list" ? (
                  <div className="space-y-3">
                    {filtered.map((m) => (
                      <MistakeCard
                        key={m.id}
                        mistake={m}
                        onAdvance={() => handleAdvance(m.id)}
                        onReset={() => handleReset(m.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <FlashcardView
                    mistakes={filtered}
                    cardIndex={cardIndex}
                    flipped={flipped}
                    setFlipped={setFlipped}
                    onPrev={() => { setCardIndex((i) => i - 1); setFlipped(false); }}
                    onNext={() => { setCardIndex((i) => i + 1); setFlipped(false); }}
                    onAdvance={() => currentCard && handleAdvance(currentCard.id)}
                    onReset={() => currentCard && handleReset(currentCard.id)}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ─── Mistake Card (list view) ─────────────────────────────────────────────────

interface MistakeCardProps {
  mistake: MistakeEntry;
  onAdvance: () => void;
  onReset: () => void;
}

function MistakeCard({ mistake, onAdvance, onReset }: MistakeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const due = isDue(mistake);
  const date = new Date(mistake.timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const nextReviewDate = new Date(mistake.nextReview ?? Date.now()).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className={cn(
      "rounded-2xl border overflow-hidden transition-colors",
      due ? "border-amber-500/30 bg-amber-500/5" : "border-border bg-card",
    )}>
      <button onClick={() => setExpanded((v) => !v)} className="w-full p-4 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                {mistake.subject}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                {mistake.topic}
              </span>
              {due ? (
                <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  <Clock className="h-2.5 w-2.5" /> Due
                </span>
              ) : (
                <span className="text-[10px] text-muted-foreground">Review {nextReviewDate}</span>
              )}
              <span className="ml-auto text-[10px] text-muted-foreground">{date}</span>
            </div>
            <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">
              {mistake.question}
            </p>
          </div>
          <RefreshCw className={cn(
            "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            expanded && "rotate-180",
          )} />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-red-500/10 p-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-red-500">Your answer</p>
              <p className="text-xs text-foreground">{mistake.user_answer}</p>
            </div>
            <div className="rounded-xl bg-green-500/10 p-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-green-600">Correct answer</p>
              <p className="text-xs font-medium text-foreground">{mistake.correct_answer}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1.5 border-green-500/30 text-green-600 hover:bg-green-500/10"
              onClick={onAdvance}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Got it
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 gap-1.5 text-muted-foreground hover:bg-muted"
              onClick={onReset}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Still struggling
            </Button>
          </div>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            Interval: every {mistake.interval ?? 1} day{(mistake.interval ?? 1) !== 1 ? "s" : ""} · {mistake.repetitions ?? 0} correct recalls
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Flashcard View ───────────────────────────────────────────────────────────

interface FlashcardViewProps {
  mistakes: MistakeEntry[];
  cardIndex: number;
  flipped: boolean;
  setFlipped: (v: boolean) => void;
  onPrev: () => void;
  onNext: () => void;
  onAdvance: () => void;
  onReset: () => void;
}

function FlashcardView({
  mistakes,
  cardIndex,
  flipped,
  setFlipped,
  onPrev,
  onNext,
  onAdvance,
  onReset,
}: FlashcardViewProps) {
  const card = mistakes[cardIndex];
  if (!card) return null;

  const total = mistakes.length;
  const due = isDue(card);

  return (
    <div className="flex flex-col items-center">
      <p className="mb-2 text-sm font-medium text-muted-foreground">
        {cardIndex + 1} / {total}
      </p>
      {due && (
        <span className="mb-3 flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <Clock className="h-3 w-3" /> Due for review
        </span>
      )}

      {/* 3D flip card */}
      <div
        className="relative w-full max-w-lg cursor-pointer"
        style={{ perspective: "1000px", height: 260 }}
        onClick={() => setFlipped(!flipped)}
      >
        <div
          className="absolute inset-0 transition-transform duration-500"
          style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-border bg-card p-8 text-center"
            style={{ backfaceVisibility: "hidden" }}
          >
            <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {card.subject}
              </span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                {card.topic}
              </span>
            </div>
            <p className="text-base font-semibold leading-relaxed text-foreground">{card.question}</p>
            <p className="mt-6 text-xs text-muted-foreground">Tap to reveal answer</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-green-500/30 bg-green-500/5 p-8 text-center"
            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-green-600">Correct Answer</p>
            <p className="text-lg font-bold text-foreground">{card.correct_answer}</p>
            {card.user_answer && (
              <p className="mt-3 text-xs text-muted-foreground">
                You answered: <span className="font-medium text-red-500">{card.user_answer}</span>
              </p>
            )}
            <p className="mt-6 text-xs text-muted-foreground">Tap to flip back</p>
          </div>
        </div>
      </div>

      {/* Navigation + response buttons */}
      <div className="mt-6 flex items-center gap-3">
        <Button size="icon" variant="outline" disabled={cardIndex === 0} onClick={onPrev} className="h-10 w-10 rounded-xl">
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          className="gap-2 border-green-500/30 text-green-600 hover:bg-green-500/10 hover:border-green-500/50"
          onClick={onAdvance}
        >
          <CheckCircle2 className="h-4 w-4" />
          Got it!
        </Button>

        <Button
          variant="outline"
          className="gap-2 text-muted-foreground hover:bg-muted"
          onClick={onReset}
        >
          <RefreshCw className="h-4 w-4" />
          Still struggling
        </Button>

        <Button size="icon" variant="outline" disabled={cardIndex === total - 1} onClick={onNext} className="h-10 w-10 rounded-xl">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        "Got it!" schedules next review in {Math.min((card.interval ?? 1) * 2, 30)} days ·
        "Still struggling" resets to tomorrow
      </p>
    </div>
  );
}
