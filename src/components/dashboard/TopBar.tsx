import { Link } from "@tanstack/react-router";
import { Flame } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

interface TopBarProps {
  userName: string;
  streak?: number;
  coins?: number;
  avatar?: string;
}

export function TopBar({ userName, streak = 0, coins, avatar }: TopBarProps) {
  const greeting = getGreeting();
  const firstName = userName.split(" ")[0] ?? userName;
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-md sm:px-8 sm:py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-tight text-foreground sm:text-2xl">
            {greeting}, {firstName} 👋
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {coins !== undefined && (
            <div className="flex items-center gap-1 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-1 sm:px-3.5 sm:py-1.5">
              <span className="text-sm">💎</span>
              <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                {coins}
              </span>
            </div>
          )}

          {streak > 0 && (
            <div className="flex items-center gap-1 rounded-full border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 sm:px-3.5 sm:py-1.5">
              <Flame className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-xs font-semibold text-orange-600">
                {streak}
                <span className="hidden sm:inline"> day streak</span>
              </span>
            </div>
          )}

          <Link to="/profile">
            <Avatar className="h-8 w-8 cursor-pointer border border-border transition-all hover:ring-2 hover:ring-primary/40 sm:h-9 sm:w-9">
              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                {avatar || initials || "?"}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}
