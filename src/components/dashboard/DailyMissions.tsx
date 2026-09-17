import { useState, useEffect } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadDailyMissions, syncMissionProgress, claimMission, type Mission } from "@/lib/missions";
import { earnCoins } from "@/lib/coins";
import { loadRewards, saveRewards } from "@/lib/rewards";
import { cn } from "@/lib/utils";

interface DailyMissionsProps {
  userId: string;
}

export function DailyMissions({ userId }: DailyMissionsProps) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [claimedAnim, setClaimedAnim] = useState<string | null>(null);

  useEffect(() => {
    setMissions(syncMissionProgress(userId));
  }, [userId]);

  function handleClaim(missionId: string) {
    const reward = claimMission(userId, missionId);
    if (!reward) return;
    earnCoins(userId, reward.coins);
    if (reward.xp > 0) {
      const stats = loadRewards(userId);
      saveRewards(userId, { ...stats, xp: stats.xp + reward.xp });
    }
    setClaimedAnim(missionId);
    setMissions(syncMissionProgress(userId));
    setTimeout(() => setClaimedAnim(null), 1500);
  }

  if (missions.length === 0) return null;

  const completedCount = missions.filter((m) => m.progress >= m.target).length;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Daily Missions</h3>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
          {completedCount}/{missions.length} done
        </span>
      </div>

      <div className="space-y-3">
        {missions.map((m) => {
          const pct = Math.min(100, Math.round((m.progress / m.target) * 100));
          const complete = m.progress >= m.target;
          const justClaimed = claimedAnim === m.id;

          return (
            <div
              key={m.id}
              className={cn(
                "rounded-xl border p-3 transition-all",
                m.claimed
                  ? "border-muted/50 bg-muted/20 opacity-60"
                  : complete
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-border bg-background",
              )}
            >
              <div className="flex items-center gap-3">
                <span className="shrink-0 text-xl">{m.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium leading-tight",
                      m.claimed ? "line-through text-muted-foreground" : "text-foreground",
                    )}
                  >
                    {m.title}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          complete ? "bg-green-500" : "bg-primary",
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {m.progress}/{m.target}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-1">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <span>+{m.rewardCoins}💎</span>
                    <span>+{m.rewardXp}⭐</span>
                  </div>
                  {complete && !m.claimed && (
                    <Button
                      size="sm"
                      className="h-6 rounded-full px-2.5 text-[11px] bg-green-500 hover:bg-green-600 text-white"
                      onClick={() => handleClaim(m.id)}
                    >
                      {justClaimed ? "✓" : "Claim"}
                    </Button>
                  )}
                  {m.claimed && (
                    <span className="text-[10px] font-medium text-green-600 dark:text-green-400">
                      Claimed ✓
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
