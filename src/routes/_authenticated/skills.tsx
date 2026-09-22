import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Zap, X } from "lucide-react";
import { fetchMyProfile, fetchSubjects, fetchTopics } from "@/lib/profile-data";
import {
  loadSubjectProgress,
  calculateMastery,
  isTopicUnlocked,
  getDefaultTopicProgress,
  type TopicProgress,
} from "@/lib/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/skills")({
  head: () => ({ meta: [{ title: "Skill Tree — Study Buddy" }] }),
  component: SkillsPage,
});

type MasteryTier = "locked" | "none" | "learning" | "practiced" | "mastered";

function getTier(locked: boolean, pct: number): MasteryTier {
  if (locked) return "locked";
  if (pct === 0) return "none";
  if (pct < 80) return "learning";
  if (pct < 100) return "practiced";
  return "mastered";
}

const TIER_CONFIG: Record<
  MasteryTier,
  { bg: string; border: string; ringColor: string; icon: string }
> = {
  locked: {
    bg: "bg-muted",
    border: "border-muted-foreground/30",
    ringColor: "#94a3b8",
    icon: "🔒",
  },
  none: {
    bg: "bg-card",
    border: "border-primary",
    ringColor: "#6366f1",
    icon: "📚",
  },
  learning: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-400",
    ringColor: "#f59e0b",
    icon: "⚡",
  },
  practiced: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    border: "border-blue-400",
    ringColor: "#3b82f6",
    icon: "⭐",
  },
  mastered: {
    bg: "bg-green-50 dark:bg-green-950/40",
    border: "border-green-400",
    ringColor: "#22c55e",
    icon: "🏆",
  },
};

// SVG circle circumference for r=30
const RING_CIRC = 2 * Math.PI * 30;

interface SkillNodeProps {
  name: string;
  tier: MasteryTier;
  mastery: number;
  selected: boolean;
  onClick: () => void;
}

function SkillNode({ name, tier, mastery, selected, onClick }: SkillNodeProps) {
  const cfg = TIER_CONFIG[tier];
  const dash = (mastery / 100) * RING_CIRC;

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={tier === "locked"}
        className={cn(
          "relative flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 transition-all",
          cfg.bg,
          cfg.border,
          selected && "scale-110 shadow-lg ring-2 ring-primary/40",
          tier === "locked"
            ? "cursor-not-allowed opacity-50"
            : "hover:scale-105 hover:shadow-md active:scale-95",
          tier === "mastered" && "shadow-md shadow-green-200 dark:shadow-green-900/50",
        )}
        aria-label={name}
      >
        {mastery > 0 && tier !== "locked" && (
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 72 72">
            <circle
              cx="36"
              cy="36"
              r="30"
              fill="none"
              stroke={cfg.ringColor}
              strokeWidth="4"
              strokeDasharray={`${dash.toFixed(1)} ${RING_CIRC.toFixed(1)}`}
              strokeLinecap="round"
              opacity="0.85"
            />
          </svg>
        )}
        {tier === "mastered" && (
          <div className="absolute inset-0 animate-pulse rounded-full bg-green-400/20" />
        )}
        <span className="z-10 text-2xl">{cfg.icon}</span>
      </button>

      <p
        className={cn(
          "max-w-[90px] text-center text-[11px] font-medium leading-tight",
          tier === "locked" ? "text-muted-foreground/50" : "text-foreground/80",
        )}
      >
        {name}
      </p>
    </div>
  );
}

function SkillsPage() {
  const { user } = Route.useRouteContext();

  const profileQuery = useQuery({
    queryKey: ["my-profile", user.id],
    queryFn: () => fetchMyProfile(user.id),
  });
  const subjectsQuery = useQuery({ queryKey: ["subjects"], queryFn: fetchSubjects });

  const draft = profileQuery.data?.draft;
  const allSubjects = subjectsQuery.data ?? [];
  const mySubjects = allSubjects.filter((s) => draft?.subjectIds.includes(s.id));
  const displaySubjects = mySubjects.length > 0 ? mySubjects : allSubjects;

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const effectiveSubjectId = selectedSubjectId ?? displaySubjects[0]?.id ?? null;

  const grade = draft?.grade;
  const curriculum = draft?.curriculum;

  const topicsQuery = useQuery({
    queryKey: ["topics", effectiveSubjectId, grade, curriculum],
    queryFn: () => fetchTopics(effectiveSubjectId!, grade, curriculum),
    enabled: !!effectiveSubjectId,
  });

  const topics = topicsQuery.data ?? [];
  const topicIds = topics.map((t) => t.id);
  const progress: Record<string, TopicProgress> = effectiveSubjectId
    ? loadSubjectProgress(user.id, effectiveSubjectId)
    : {};

  // Stats
  const stats = topics.reduce(
    (acc, t) => {
      const p = progress[t.id] ?? getDefaultTopicProgress();
      const pct = calculateMastery(p);
      if (pct === 100) acc.mastered++;
      else if (pct > 0) acc.inProgress++;
      acc.totalPct += pct;
      return acc;
    },
    { mastered: 0, inProgress: 0, totalPct: 0 },
  );
  const avgPct = topics.length > 0 ? Math.round(stats.totalPct / topics.length) : 0;

  // Bottom sheet state
  const [sheetTopicId, setSheetTopicId] = useState<string | null>(null);
  const sheetTopic = topics.find((t) => t.id === sheetTopicId) ?? null;
  const sheetIndex = sheetTopic ? topics.findIndex((t) => t.id === sheetTopicId) : -1;
  const sheetProgress = sheetTopicId ? (progress[sheetTopicId] ?? getDefaultTopicProgress()) : null;
  const sheetMastery = sheetProgress ? calculateMastery(sheetProgress) : 0;
  const sheetLocked = sheetIndex >= 0 ? !isTopicUnlocked(sheetIndex, topicIds, progress) : false;

  function toggleSheet(topicId: string) {
    const idx = topics.findIndex((t) => t.id === topicId);
    if (idx < 0) return;
    const locked = !isTopicUnlocked(idx, topicIds, progress);
    if (locked) return;
    setSheetTopicId((prev) => (prev === topicId ? null : topicId));
  }

  // Snake pattern: center → right → center → left
  const OFFSETS = ["translate-x-0", "translate-x-16", "translate-x-0", "-translate-x-16"] as const;

  return (
    <div className="min-h-screen pb-40">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <Link
            to="/dashboard"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold">Skill Tree 🗺️</h1>
            <p className="truncate text-xs text-muted-foreground">
              {stats.mastered}/{topics.length} mastered · {avgPct}% average
            </p>
          </div>
        </div>

        {/* Subject tabs */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none]">
          {displaySubjects.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setSelectedSubjectId(s.id);
                setSheetTopicId(null);
              }}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                effectiveSubjectId === s.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:border-primary/50 hover:bg-muted",
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tree content */}
      <div className="mx-auto max-w-xs px-4 py-8">
        {/* Stats row */}
        <div className="mb-10 flex items-center justify-around rounded-2xl border bg-card p-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-500">{stats.mastered}</p>
            <p className="text-[11px] text-muted-foreground">mastered</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-2xl font-bold text-amber-500">{stats.inProgress}</p>
            <p className="text-[11px] text-muted-foreground">in progress</p>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-2xl font-bold text-primary">{avgPct}%</p>
            <p className="text-[11px] text-muted-foreground">avg mastery</p>
          </div>
        </div>

        {/* Nodes */}
        {topicsQuery.isLoading ? (
          <div className="flex flex-col items-center gap-6">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                {i > 0 && <div className="h-8 w-0.5 animate-pulse rounded bg-muted" />}
                <div className="h-[72px] w-[72px] animate-pulse rounded-full bg-muted" />
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : topics.length === 0 ? (
          <div className="py-16 text-center">
            <p className="mb-2 text-4xl">📭</p>
            <p className="text-sm text-muted-foreground">No topics found for this subject.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {topics.map((topic, i) => {
              const p = progress[topic.id] ?? getDefaultTopicProgress();
              const mastery = calculateMastery(p);
              const locked = !isTopicUnlocked(i, topicIds, progress);
              const tier = getTier(locked, mastery);
              const offsetClass = OFFSETS[i % OFFSETS.length] ?? "translate-x-0";

              return (
                <div key={topic.id} className="flex flex-col items-center">
                  {i > 0 && (
                    <div className="h-8 w-0.5 border-l-2 border-dashed border-muted-foreground/25" />
                  )}
                  <div className={cn("flex flex-col items-center", offsetClass)}>
                    <SkillNode
                      name={topic.name}
                      tier={tier}
                      mastery={mastery}
                      selected={sheetTopicId === topic.id}
                      onClick={() => toggleSheet(topic.id)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mx-auto max-w-xs px-4 pb-4">
        <div className="rounded-2xl border bg-card/60 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Legend
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {(
              [
                ["🔒", "Locked", "Complete previous topic"],
                ["📚", "Not started", "Ready to begin"],
                ["⚡", "Learning", "1–79% mastery"],
                ["⭐", "Practiced", "80–99% mastery"],
                ["🏆", "Mastered", "100% — complete!"],
              ] as const
            ).map(([icon, label, desc]) => (
              <div key={label} className="flex items-start gap-2">
                <span className="text-base leading-none">{icon}</span>
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom sheet overlay */}
      {sheetTopic && sheetProgress && !sheetLocked && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setSheetTopicId(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom-4 rounded-t-2xl border-t bg-card shadow-xl duration-200">
            <div className="mx-auto max-w-sm space-y-4 p-5">
              {/* Handle */}
              <div className="mx-auto h-1 w-10 rounded-full bg-muted-foreground/25" />

              {/* Topic info */}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold">{sheetTopic.name}</h2>
                  <p className="text-sm text-muted-foreground">{sheetMastery}% mastery</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSheetTopicId(null)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Mastery progress bar */}
              <div className="space-y-1">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      sheetMastery === 100
                        ? "bg-green-500"
                        : sheetMastery >= 80
                          ? "bg-blue-500"
                          : "bg-amber-500",
                    )}
                    style={{ width: `${sheetMastery}%` }}
                  />
                </div>
              </div>

              {/* Lesson checkpoints */}
              <div className="grid grid-cols-5 gap-2 text-center text-[11px]">
                {[1, 2, 3].map((n) => {
                  const done = sheetProgress.lessonsCompleted.includes(n);
                  return (
                    <div
                      key={n}
                      className={cn(
                        "col-span-1 rounded-xl border py-2",
                        done
                          ? "border-green-400 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300"
                          : "border-border text-muted-foreground",
                      )}
                    >
                      <p className="text-base">{done ? "✅" : "📖"}</p>
                      <p className="font-medium">L{n}</p>
                    </div>
                  );
                })}
                <div
                  className={cn(
                    "col-span-1 rounded-xl border py-2",
                    sheetProgress.practiceCompleted
                      ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300"
                      : "border-border text-muted-foreground",
                  )}
                >
                  <p className="text-base">{sheetProgress.practiceCompleted ? "✅" : "⚡"}</p>
                  <p className="font-medium">Quiz</p>
                </div>
                <div
                  className={cn(
                    "col-span-1 rounded-xl border py-2",
                    sheetProgress.bossDone
                      ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300"
                      : "border-border text-muted-foreground",
                  )}
                >
                  <p className="text-base">{sheetProgress.bossDone ? "🏆" : "👑"}</p>
                  <p className="font-medium">Boss</p>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex gap-2">
                <Button className="flex-1 gap-1.5" asChild>
                  <Link to="/practice">
                    <Zap className="h-4 w-4" />
                    Practice
                  </Link>
                </Button>
                <Button variant="outline" className="gap-1.5" asChild>
                  <Link to="/flashcards">
                    <BookOpen className="h-4 w-4" />
                    Cards
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/story">📖 Story</Link>
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
