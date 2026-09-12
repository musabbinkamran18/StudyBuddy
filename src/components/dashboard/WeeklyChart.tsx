import { useMemo } from "react";
import { getWeeklyStats } from "@/lib/study-log";
import { cn } from "@/lib/utils";

interface WeeklyChartProps {
  userId: string;
}

export function WeeklyChart({ userId }: WeeklyChartProps) {
  const days = useMemo(() => getWeeklyStats(userId), [userId]);

  const maxXp = Math.max(...days.map((d) => d.xp), 1);
  const totalXp = days.reduce((s, d) => s + d.xp, 0);
  const totalSessions = days.reduce((s, d) => s + d.sessions, 0);
  const activeDays = days.filter((d) => d.xp > 0).length;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">This Week</p>
          <p className="text-xs text-muted-foreground">Daily XP activity</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-primary">{totalXp.toLocaleString()} XP</p>
          <p className="text-xs text-muted-foreground">
            {activeDays} active {activeDays === 1 ? "day" : "days"}
          </p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-1.5 h-24">
        {days.map((day) => {
          const heightPct = maxXp > 0 ? (day.xp / maxXp) * 100 : 0;
          return (
            <div key={day.date} className="group flex flex-1 flex-col items-center gap-1">
              {/* Tooltip */}
              <div className="relative flex-1 w-full flex items-end">
                {day.xp > 0 && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                    {day.xp} XP
                  </div>
                )}
                <div className="w-full overflow-hidden rounded-t-md bg-muted" style={{ height: "100%" }}>
                  <div
                    className={cn(
                      "w-full rounded-t-md transition-all duration-500",
                      day.isToday ? "bg-primary" : "bg-primary/40",
                    )}
                    style={{ height: `${Math.max(heightPct, day.xp > 0 ? 4 : 0)}%` }}
                  />
                </div>
              </div>
              <p
                className={cn(
                  "text-[10px] font-medium",
                  day.isToday ? "text-primary" : "text-muted-foreground",
                )}
              >
                {day.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Stats row */}
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4">
        {[
          { label: "Total XP", value: totalXp.toLocaleString() },
          { label: "Sessions", value: totalSessions.toString() },
          { label: "Active Days", value: `${activeDays}/7` },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <p className="text-sm font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
