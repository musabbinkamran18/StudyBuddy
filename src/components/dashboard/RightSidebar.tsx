import { useState } from "react";
import { Check, Target, Flame, Star, Brain, Zap, ArrowRight } from "lucide-react";
import { PieChart, Pie, Cell } from "recharts";
import {
  goalsFor,
  achievementsFor,
  loadRewards,
  type RewardsStats,
} from "@/lib/rewards";

interface RightSidebarProps {
  userId: string;
  progress: ProgressSlice[];
}

export interface ProgressSlice {
  name: string;
  value: number;
  color: string;
}

const FALLBACK_PROGRESS: ProgressSlice[] = [
  { name: "Maths", value: 38, color: "#c85a37" },
  { name: "Science", value: 58, color: "#7a9e7e" },
  { name: "English", value: 42, color: "#d6a23f" },
  { name: "Urdu", value: 31, color: "#5f8fc4" },
];

export function RightSidebar({ userId, progress }: RightSidebarProps) {
  const stats: RewardsStats = loadRewards(userId);
  const badges = achievementsFor(stats);
  const goals = goalsFor(stats) ?? [];

  /* local-only visual toggle for goals a student is working on today */
  const [toggled, setToggled] = useState<string[]>([]);
  const toggleGoal = (id: string) =>
    setToggled((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));

  const slices = progress.length > 0 ? progress : FALLBACK_PROGRESS;
  const overall =
    slices.length > 0 ? Math.round(slices.reduce((sum, s) => sum + s.value, 0) / slices.length) : 0;

  return (
    <aside className="w-full shrink-0 space-y-5 lg:w-[300px]">
      {/* Today's Goals — derived from real rewards stats */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <h3 className="text-lg font-semibold tracking-tight text-foreground">Today's Goals</h3>
        </div>

        <div className="mt-3 space-y-1">
          {goals.map((goal) => (
            <button
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors ${
                goal.earned ? "" : "hover:bg-muted/60"
              }`}
            >
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  goal.earned ? "border-primary bg-primary" : "border-muted-foreground/40"
                }`}
              >
                {goal.earned && <Check className="h-3 w-3 text-primary-foreground" />}
              </div>
              <span
                className={`text-sm ${
                  goal.earned ? "text-muted-foreground line-through" : "text-foreground"
                }`}
              >
                {goal.text}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Your Progress */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-tight text-foreground">Your Progress</h3>
          <button className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary">
            View details
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="relative h-[112px] w-[112px] shrink-0">
            <PieChart width={112} height={112}>
              <Pie
                data={slices}
                cx={56}
                cy={56}
                innerRadius={38}
                outerRadius={54}
                paddingAngle={4}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                strokeWidth={0}
                isAnimationActive={false}
              >
                {slices.map((slice) => (
                  <Cell key={slice.name} fill={slice.color} />
                ))}
              </Pie>
            </PieChart>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold text-foreground">{overall}%</span>
              <span className="text-[11px] text-muted-foreground">Overall</span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            {slices.map((slice, i) => (
              <div
                key={slice.name}
                className={`flex items-center justify-between py-2 ${
                  i < slices.length - 1 ? "border-b border-border/60" : ""
                }`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="truncate text-xs text-muted-foreground">{slice.name}</span>
                </span>
                <span className="shrink-0 text-xs font-medium text-foreground">{slice.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold tracking-tight text-foreground">Achievements</h3>
          <button className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary">
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {badges.map((badge) => (
            <div key={badge.id} className="flex flex-col items-center gap-2">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-full ring-1 ${badge.tile}`}
              >
                <badge.icon className={`h-5 w-5 ${badge.tint}`} />
              </div>
              <span className="text-center text-[10px] leading-tight text-muted-foreground">
                {badge.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
