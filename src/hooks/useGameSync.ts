import { useEffect } from "react";
import { pullGameState, pushGameState } from "@/lib/game-sync";

// Syncs game state (XP, coins, achievements, progress, etc.) between
// localStorage and Supabase. localStorage is the fast in-session store;
// Supabase is the durable backing store for cross-device persistence.
//
// On mount: pulls from Supabase if remote data is newer (new device / fresh browser).
// Every 60s: flushes localStorage → Supabase.
// On page unload: final flush before the tab closes.
export function useGameSync(userId: string): void {
  useEffect(() => {
    void pullGameState(userId);

    const interval = setInterval(() => {
      void pushGameState(userId);
    }, 60_000);

    function handleUnload() {
      void pushGameState(userId);
    }
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [userId]);
}
