import { useEffect, useState } from "react";
import { toast } from "sonner";
import { generatePracticeQuestions, shuffleQuestionOptions } from "@/lib/practice";
import {
  loadDailyChallenge,
  saveDailyChallenge,
  DAILY_XP,
  DAILY_COINS,
  type DailyChallenge,
} from "@/lib/daily-challenge";
import { earnCoins } from "@/lib/coins";
import { recordSessionCompleted } from "@/lib/rewards";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface DailyChallengeCardProps {
  userId: string;
  subjects: string[]; // enrolled subject names
  grade: string;
  curriculum: string;
}

// Pick today's subject deterministically so all users on the same subjects get the same challenge topic
function pickTodaySubject(subjects: string[]): string {
  if (subjects.length === 0) return "Mathematics";
  const today = new Date().toISOString().slice(0, 10);
  const seed = today.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return subjects[seed % subjects.length] ?? subjects[0] ?? "Mathematics";
}

export function DailyChallengeCard({
  userId,
  subjects,
  grade,
  curriculum,
}: DailyChallengeCardProps) {
  const [challenge, setChallenge] = useState<DailyChallenge | null | "loading">("loading");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const existing = loadDailyChallenge(userId);
    if (existing) {
      setChallenge(existing);
      if (existing.answered) setSelected(existing.userAnswer);
      return;
    }

    const subject = pickTodaySubject(subjects);
    const today = new Date().toISOString().slice(0, 10);

    generatePracticeQuestions({
      data: { subject, topic: "General", grade, difficulty: "hard", curriculum, count: 1 },
    })
      .then(({ questions }) => {
        const shuffled = shuffleQuestionOptions(questions);
        const q = shuffled[0];
        if (!q) {
          setChallenge(null);
          return;
        }
        const c: DailyChallenge = {
          date: today,
          subject,
          topic: q.topic || "General",
          question: q,
          answered: false,
          correct: null,
          userAnswer: null,
        };
        saveDailyChallenge(userId, c);
        setChallenge(c);
      })
      .catch(() => setChallenge(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  function handleAnswer(option: string) {
    if (
      !(challenge instanceof Object) ||
      challenge === null ||
      (challenge as DailyChallenge).answered
    )
      return;
    const c = challenge as DailyChallenge;
    if (c.answered) return;

    const isCorrect = option === c.question.correct_answer;
    const updated: DailyChallenge = {
      ...c,
      answered: true,
      correct: isCorrect,
      userAnswer: option,
    };
    saveDailyChallenge(userId, updated);
    setChallenge(updated);
    setSelected(option);

    if (isCorrect) {
      recordSessionCompleted(userId, DAILY_XP);
      earnCoins(userId, DAILY_COINS);
      toast.success(`🎯 Correct! +${DAILY_XP} XP & +${DAILY_COINS} coins`);
    } else {
      toast(`❌ Not quite — the answer was: ${c.question.correct_answer}`);
    }
  }

  if (challenge === "loading") {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      </div>
    );
  }

  if (!challenge) return null;

  const c = challenge as DailyChallenge;
  const answered = c.answered;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Daily Challenge 🎯
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {c.subject} · Hard · Resets at midnight
          </p>
        </div>
        {answered && (
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold",
              c.correct ? "bg-green-500/10 text-green-700" : "bg-red-500/10 text-red-600",
            )}
          >
            {c.correct ? "✅ Correct" : "❌ Missed"}
          </span>
        )}
        {!answered && (
          <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600">
            +{DAILY_XP} XP · +{DAILY_COINS} 💎
          </span>
        )}
      </div>

      <p className="text-sm font-semibold leading-snug text-foreground">{c.question.question}</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {c.question.options.map((opt) => {
          const isSelected = selected === opt;
          const isCorrect = opt === c.question.correct_answer;
          return (
            <button
              key={opt}
              type="button"
              disabled={answered}
              onClick={() => handleAnswer(opt)}
              className={cn(
                "rounded-xl border p-3 text-left text-xs font-medium transition-all",
                !answered &&
                  "border-border bg-background hover:border-primary/60 hover:bg-primary/5",
                answered && isCorrect && "border-green-500 bg-green-500/10 text-green-700",
                answered && isSelected && !isCorrect && "border-red-500 bg-red-500/10 text-red-700",
                answered && !isSelected && !isCorrect && "border-border bg-background opacity-50",
                !answered && "cursor-pointer",
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {answered && c.correct && (
        <p className="mt-3 text-xs text-muted-foreground">{c.question.explanation}</p>
      )}
    </div>
  );
}
