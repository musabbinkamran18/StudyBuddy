import { useState, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { RefreshCw, CheckCircle2, Circle, Sparkles } from "lucide-react";
import {
  generateDailyTasks,
  loadDailyTasksCache,
  saveDailyTasksCache,
  toggleTaskComplete,
  clearDailyTasksCache,
  type DailyTask,
  type GenerateTasksInput,
} from "@/lib/daily-tasks";
import { cn } from "@/lib/utils";

interface DailyTasksProps {
  userId: string;
  profile: GenerateTasksInput;
}

const DIFFICULTY_STYLES = {
  easy: "bg-green-500/10 text-green-700 dark:text-green-400",
  medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  hard: "bg-red-500/10 text-red-600 dark:text-red-400",
};

export function DailyTasks({ userId, profile }: DailyTasksProps) {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  const generate = useMutation({
    mutationFn: () => generateDailyTasks({ data: profile }),
    onSuccess: ({ tasks: newTasks }) => {
      const cache = saveDailyTasksCache(userId, newTasks);
      setTasks(cache.tasks);
      setCompletedIds(cache.completedIds);
    },
  });

  // On mount: load from cache or generate
  useEffect(() => {
    const cache = loadDailyTasksCache(userId);
    if (cache) {
      setTasks(cache.tasks);
      setCompletedIds(cache.completedIds);
      setReady(true);
    } else {
      generate.mutate(undefined, { onSettled: () => setReady(true) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleToggle = useCallback(
    (taskId: string) => {
      const updated = toggleTaskComplete(userId, taskId);
      setCompletedIds(updated);
    },
    [userId],
  );

  function handleRefresh() {
    clearDailyTasksCache(userId);
    setTasks([]);
    setCompletedIds([]);
    generate.mutate(undefined, { onSettled: () => setReady(true) });
  }

  const isLoading = !ready || generate.isPending;
  const completed = completedIds.length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Today's AI Challenges</p>
            <p className="text-[11px] text-muted-foreground">{today}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {total > 0 && (
            <span className="text-xs font-medium text-muted-foreground">
              {completed}/{total} done
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            title="Regenerate today's tasks"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {/* Task list */}
      <div className="space-y-2">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-border/50 p-3"
              >
                <div className="h-5 w-5 shrink-0 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-2.5 w-1/3 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))
          : tasks.map((task) => {
              const done = completedIds.includes(task.id);
              return (
                <button
                  key={task.id}
                  onClick={() => handleToggle(task.id)}
                  className={cn(
                    "group flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all",
                    done
                      ? "border-primary/20 bg-primary/5"
                      : "border-border/60 hover:border-border hover:bg-muted/30",
                  )}
                >
                  <div className="mt-0.5 shrink-0 text-primary">
                    {done ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/50 group-hover:text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm font-medium leading-snug",
                        done ? "text-muted-foreground line-through" : "text-foreground",
                      )}
                    >
                      {task.emoji} {task.title}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="truncate text-[11px] text-muted-foreground">
                        {task.subject}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize",
                          DIFFICULTY_STYLES[task.difficulty],
                        )}
                      >
                        {task.difficulty}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
      </div>

      {completed === total && total > 0 && (
        <p className="mt-4 text-center text-xs font-medium text-primary">
          🎉 All done for today — great work!
        </p>
      )}
    </div>
  );
}
