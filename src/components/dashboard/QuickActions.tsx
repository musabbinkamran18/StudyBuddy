import { Link } from "@tanstack/react-router";
import { Bot, Target, Flame, BookMarked } from "lucide-react";

const actions = [
  {
    title: "Ask AI Tutor",
    description: "Get help, explanations, or hints",
    icon: Bot,
    tint: "text-primary",
    to: "/tutor",
  },
  {
    title: "Start Practice",
    description: "Sharpen your skills with MCQs",
    icon: Target,
    tint: "text-chart-2",
    to: "/practice",
  },
  {
    title: "Blitz Mode ⚡",
    description: "60s speed round — build combos",
    icon: Flame,
    tint: "text-amber-500",
    to: "/blitz",
  },
  {
    title: "Story Mode 📖",
    description: "Learn through AI-crafted adventures",
    icon: BookMarked,
    tint: "text-chart-3",
    to: "/story",
  },
];

/** Inset panel rendered inside HeroBanner. */
export function QuickActions() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/85 p-4 backdrop-blur-md">
      <h3 className="px-1 pb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Quick Actions
      </h3>

      <div className="space-y-2">
        {actions.map((action) => (
          <Link
            key={action.title}
            to={action.to}
            className="group flex items-center gap-3 rounded-xl border border-transparent p-2.5 transition-colors hover:border-border hover:bg-muted/50"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <action.icon className={`h-[18px] w-[18px] ${action.tint}`} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{action.title}</p>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {action.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
