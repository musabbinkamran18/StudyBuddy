import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { checkAndClaimLoginReward, LOGIN_REWARDS, type LoginReward } from "@/lib/coins";
import { cn } from "@/lib/utils";

interface LoginRewardBannerProps {
  userId: string;
}

export function LoginRewardBanner({ userId }: LoginRewardBannerProps) {
  const [reward, setReward] = useState<LoginReward | null>(null);
  const [nextDay, setNextDay] = useState(1);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const result = checkAndClaimLoginReward(userId);
    if (result.claimed && result.reward) {
      setReward(result.reward);
      setNextDay(result.nextDay);
    }
  }, [userId]);

  if (!reward || dismissed) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-4">
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-3 rounded-lg p-1 text-muted-foreground hover:bg-muted"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-yellow-500/15 text-3xl">
          {reward.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-yellow-600 dark:text-yellow-400">
            Day {reward.day} Login Reward
          </p>
          <p className="mt-0.5 text-lg font-bold text-foreground">{reward.label} claimed!</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Come back tomorrow for Day {nextDay} reward
          </p>
        </div>
      </div>

      {/* 7-day cycle dots */}
      <div className="mt-3 flex items-center gap-1.5">
        {LOGIN_REWARDS.map((r) => (
          <div
            key={r.day}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-xs",
              r.day === reward.day
                ? "bg-yellow-500 text-white font-bold"
                : r.day < reward.day
                  ? "bg-yellow-500/30 text-yellow-600"
                  : "bg-muted text-muted-foreground",
            )}
            title={`Day ${r.day}: ${r.label}`}
          >
            {r.day === reward.day ? "✓" : r.emoji}
          </div>
        ))}
      </div>
    </div>
  );
}
