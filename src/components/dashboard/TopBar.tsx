import { Flame, Bell } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

interface TopBarProps {
  userName: string;
  streak?: number;
  coins?: number;
  avatar?: string;
}

export function TopBar({ userName, streak = 0, coins, avatar }: TopBarProps) {
  const greeting = getGreeting();
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 px-8 py-5 backdrop-blur-md">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">
            {greeting}, {userName.split(" ")[0]}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {streak > 0 ? "Keep your streak alive — one session at a time." : "Start today's streak — one question at a time."}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {coins !== undefined && (
            <div className="flex items-center gap-1.5 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3.5 py-1.5">
              <span className="text-sm">💎</span>
              <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">{coins}</span>
            </div>
          )}

          {streak > 0 && (
            <div className="flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-500/10 px-3.5 py-1.5">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-semibold text-orange-600">{streak} day streak</span>
            </div>
          )}

          <button className="relative flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground">
            <Bell className="h-4 w-4" />
          </button>

          <Avatar className="h-9 w-9 border border-border">
            <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
              {avatar || initials || "?"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
