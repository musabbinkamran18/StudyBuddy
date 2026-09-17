import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { X, ChevronRight } from "lucide-react";
import {
  loadSubjectProgress,
  calculateMastery,
  getDefaultTopicProgress,
  loadMistakes,
} from "@/lib/progress";
import { daysUntilExam } from "@/lib/user-prefs";
import { cn } from "@/lib/utils";

interface SmartInsightsProps {
  userId: string;
  enrolledSubjects: { id: string; name: string }[];
  topicsBySubject: Record<string, { id: string; name: string }[]>;
  examDate: string | null;
  examLabel: string;
  currentDifficulty: string;
}

function getWeekKey(): string {
  const d = new Date();
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86_400_000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

export function SmartInsights({
  userId,
  enrolledSubjects,
  topicsBySubject,
  examDate,
  examLabel,
  currentDifficulty,
}: SmartInsightsProps) {
  const tipKey = `difficulty-tip-dismissed:${userId}:${getWeekKey()}`;
  const [tipDismissed, setTipDismissed] = useState(
    () => typeof localStorage !== "undefined" && localStorage.getItem(tipKey) === "1",
  );

  function dismissTip() {
    try {
      localStorage.setItem(tipKey, "1");
    } catch {}
    setTipDismissed(true);
  }

  // Compute weakest topic and avg mastery from all enrolled subjects
  const { weakest, avgMastery } = useMemo(() => {
    type Candidate = { topicName: string; subjectName: string; mastery: number };
    const candidates: Candidate[] = [];
    let totalPct = 0;
    let totalCount = 0;

    enrolledSubjects.forEach((s) => {
      const topics = topicsBySubject[s.id] ?? [];
      const prog = loadSubjectProgress(userId, s.id);
      topics.forEach((t) => {
        const p = prog[t.id] ?? getDefaultTopicProgress();
        const pct = calculateMastery(p);
        candidates.push({ topicName: t.name, subjectName: s.name, mastery: pct });
        totalPct += pct;
        totalCount += 1;
      });
    });

    candidates.sort((a, b) => a.mastery - b.mastery);
    return {
      weakest: candidates[0] ?? null,
      avgMastery: totalCount > 0 ? Math.round(totalPct / totalCount) : 0,
    };
  }, [userId, enrolledSubjects, topicsBySubject]);

  // SRS due count
  const srsDueCount = useMemo(() => {
    const now = Date.now();
    return loadMistakes(userId).filter((m) => (m.nextReview ?? 0) <= now).length;
  }, [userId]);

  // Exam info
  const examDaysLeft = daysUntilExam(examDate);
  const hasExam = examDaysLeft !== null && examDaysLeft >= 0;

  // Difficulty tip
  const showTip =
    !tipDismissed && enrolledSubjects.length > 0 && (avgMastery > 75 || avgMastery < 40);
  const tipDirection = avgMastery > 75 ? "up" : "down";

  // Don't render if there's nothing useful to show
  const hasContent = weakest !== null || srsDueCount > 0 || hasExam || showTip;
  if (!hasContent) return null;

  return (
    <div className="rounded-2xl border bg-card p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Today&rsquo;s Focus 🎯
      </h3>

      <div className="space-y-1.5">
        {/* Weakest topic */}
        {weakest !== null && (
          <Link
            to="/practice"
            className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/60"
          >
            <span className="text-lg">📉</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                {weakest.topicName}
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  ({weakest.mastery === 0 ? "not started" : `${weakest.mastery}% mastery`})
                </span>
              </p>
              <p className="text-xs text-muted-foreground">{weakest.subjectName} · weakest topic</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}

        {/* SRS due */}
        {srsDueCount > 0 && (
          <Link
            to="/mistakes"
            className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/60"
          >
            <span className="text-lg">📋</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                {srsDueCount} mistake{srsDueCount !== 1 ? "s" : ""} due for review
              </p>
              <p className="text-xs text-muted-foreground">Spaced repetition — due today</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}

        {/* Exam countdown */}
        {hasExam && examDaysLeft !== null && (
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
            <span className="text-lg">📅</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                {examDaysLeft === 0
                  ? "Exam is today!"
                  : `${examDaysLeft} day${examDaysLeft !== 1 ? "s" : ""} to${examLabel ? ` ${examLabel}` : " your exam"}`}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      avgMastery >= 70
                        ? "bg-green-500"
                        : avgMastery >= 40
                          ? "bg-amber-500"
                          : "bg-red-400",
                    )}
                    style={{ width: `${avgMastery}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{avgMastery}% ready</span>
              </div>
            </div>
          </div>
        )}

        {/* Difficulty tip */}
        {showTip && (
          <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5">
            <span className="mt-0.5 text-lg">{tipDirection === "up" ? "🚀" : "💪"}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">
                {tipDirection === "up"
                  ? "You're excelling — try a harder difficulty!"
                  : "Struggling? Try an easier difficulty to build confidence."}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Current difficulty: <span className="font-medium">{currentDifficulty}</span>
                {" · "}
                <Link
                  to="/profile"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  Update in Profile
                </Link>
              </p>
            </div>
            <button
              type="button"
              onClick={dismissTip}
              className="mt-0.5 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Dismiss tip"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
