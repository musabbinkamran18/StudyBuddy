import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { fetchMyProfile } from "@/lib/profile-data";
import {
  loadCoinState,
  buyItem,
  SHOP_ITEMS,
  LOGIN_REWARDS,
  type CoinState,
} from "@/lib/coins";
import { updateExtendedStats } from "@/lib/extended-stats";
import { checkAndUnlockAchievements, markNotified } from "@/lib/achievements";
import { loadRewards } from "@/lib/rewards";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/shop")({
  head: () => ({
    meta: [{ title: "Shop — Study Buddy" }],
  }),
  component: ShopPage,
});

function ShopPage() {
  const { user } = Route.useRouteContext();

  const profileQuery = useQuery({
    queryKey: ["my-profile", user.id],
    queryFn: () => fetchMyProfile(user.id),
  });

  const [coinState, setCoinState] = useState<CoinState>(() => loadCoinState(user.id));
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleBuy(itemId: "xpBoost" | "streakFreeze") {
    const result = buyItem(user.id, itemId);
    if (result.success) {
      setCoinState(result.state);
      setFlash(itemId);
      setError(null);
      setTimeout(() => setFlash(null), 1500);
      // Track purchase in extended stats and check achievements
      const updated = updateExtendedStats(user.id, { purchasesMade: 1 });
      const rewards = loadRewards(user.id);
      const newAchievements = checkAndUnlockAchievements(user.id, rewards, updated, result.state);
      newAchievements.forEach((a) =>
        toast.success(`${a.emoji} ${a.label}`, { description: a.description }),
      );
      if (newAchievements.length > 0)
        markNotified(user.id, newAchievements.map((a) => a.id));
    } else {
      setError(result.error ?? "Purchase failed");
      setTimeout(() => setError(null), 3000);
    }
  }

  const userName = profileQuery.data?.draft.full_name || "Student";

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <div className="flex min-h-screen flex-col lg:pl-[240px]">
        <TopBar userName={userName} />
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-2xl">
            <Link
              to="/dashboard"
              className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back to dashboard
            </Link>

            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Shop</h1>
                  <p className="text-sm text-muted-foreground">Spend your coins on power-ups</p>
                </div>
              </div>

              {/* Coin balance */}
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5">
                <span className="text-xl">💎</span>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">{coinState.balance}</p>
                  <p className="text-[10px] text-muted-foreground">coins</p>
                </div>
              </div>
            </div>

            {/* Error toast */}
            {error && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Inventory */}
            <div className="mb-8 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-card p-4 text-center">
                <p className="text-3xl font-bold text-foreground">{coinState.xpBoosts}</p>
                <p className="mt-1 text-sm text-muted-foreground">⚡ XP Boosts</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 text-center">
                <p className="text-3xl font-bold text-foreground">{coinState.streakFreezes}</p>
                <p className="mt-1 text-sm text-muted-foreground">🧊 Streak Freezes</p>
              </div>
            </div>

            {/* Shop items */}
            <h2 className="mb-4 text-lg font-semibold text-foreground">Available Items</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {SHOP_ITEMS.map((item) => {
                const owned = coinState[item.inventoryKey] as number;
                const canAfford = coinState.balance >= item.price;
                const justBought = flash === item.id;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-2xl border p-5 transition-all",
                      justBought ? "border-green-500/40 bg-green-500/5" : "border-border bg-card",
                    )}
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                        {item.emoji}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg">💎</span>
                        <span className="text-lg font-bold text-foreground">{item.price}</span>
                        <span className="text-xs text-muted-foreground">
                          · {owned} owned
                        </span>
                      </div>

                      <Button
                        size="sm"
                        variant={canAfford ? "default" : "outline"}
                        disabled={!canAfford}
                        className="rounded-full"
                        onClick={() => handleBuy(item.id)}
                      >
                        {justBought ? "✓ Bought!" : canAfford ? "Buy" : "Need coins"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* How to earn coins */}
            <div className="mt-8 rounded-2xl border border-border bg-card p-5">
              <h3 className="mb-3 font-semibold text-foreground">How to Earn Coins 💎</h3>
              <div className="grid gap-2 text-sm">
                {[
                  { label: "Complete a lesson", amount: "+10" },
                  { label: "Perfect lesson (no mistakes)", amount: "+20" },
                  { label: "Complete a practice session", amount: "+15" },
                  { label: "Defeat a Boss Battle", amount: "+25" },
                  { label: "Complete daily missions", amount: "+10–40" },
                  { label: "Daily login reward", amount: "+10–50" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-semibold text-foreground">{row.amount} 💎</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Login reward cycle preview */}
            <div className="mt-4 rounded-2xl border border-border bg-card p-5">
              <h3 className="mb-3 font-semibold text-foreground">Daily Login Rewards 🎁</h3>
              <div className="grid grid-cols-7 gap-1.5">
                {LOGIN_REWARDS.map((r) => (
                  <div key={r.day} className="flex flex-col items-center gap-1 text-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-lg">
                      {r.emoji}
                    </div>
                    <p className="text-[9px] text-muted-foreground leading-tight">{r.label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Log in every day to cycle through rewards. Resets after Day 7.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
