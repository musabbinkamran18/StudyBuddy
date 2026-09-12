import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { DEMO_USER_ID } from "@/lib/backend";

// Timestamp (ms) of the last successful flush to Supabase.
// Used to decide whether remote data is newer than our local session.
function syncTsKey(userId: string) {
  return `game-sync-ts:${userId}`;
}

function getLastSyncTs(userId: string): number {
  return Number(localStorage.getItem(syncTsKey(userId)) ?? 0);
}

function setLastSyncTs(userId: string): void {
  localStorage.setItem(syncTsKey(userId), String(Date.now()));
}

// Safely read a JSON value from localStorage.
function ls(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null");
  } catch {
    return null;
  }
}

// Safely write a JSON value to localStorage.
function lsSet(key: string, value: unknown): void {
  if (value !== null && value !== undefined) {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

export interface GameStateSnapshot {
  coins: unknown;
  rewards: unknown;
  extended_stats: unknown;
  achievements: unknown;
  subject_progress: Record<string, unknown>;
  mistakes: unknown;
  study_log: unknown;
  avatar: string;
}

// Reads all game state from localStorage into a snapshot object.
export function buildSnapshot(userId: string): GameStateSnapshot {
  const subject_progress: Record<string, unknown> = {};
  const prefix = `progress:${userId}:`;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(prefix)) {
      const subjectId = key.slice(prefix.length);
      subject_progress[subjectId] = ls(key);
    }
  }
  return {
    coins: ls(`coins:${userId}`),
    rewards: ls(`rewards:${userId}`),
    extended_stats: ls(`ext-stats:${userId}`),
    achievements: ls(`achievements:${userId}`),
    subject_progress,
    mistakes: ls(`mistakes:${userId}`),
    study_log: ls(`study-log:${userId}`),
    avatar: (ls(`avatar:${userId}`) as string | null) ?? "⭐",
  };
}

// Writes a snapshot (from Supabase) back into localStorage.
export function hydrateSnapshot(userId: string, snapshot: GameStateSnapshot): void {
  if (snapshot.coins) lsSet(`coins:${userId}`, snapshot.coins);
  if (snapshot.rewards) lsSet(`rewards:${userId}`, snapshot.rewards);
  if (snapshot.extended_stats) lsSet(`ext-stats:${userId}`, snapshot.extended_stats);
  if (snapshot.achievements) lsSet(`achievements:${userId}`, snapshot.achievements);
  for (const [subjectId, progress] of Object.entries(snapshot.subject_progress)) {
    if (progress) lsSet(`progress:${userId}:${subjectId}`, progress);
  }
  if (snapshot.mistakes) lsSet(`mistakes:${userId}`, snapshot.mistakes);
  if (snapshot.study_log) lsSet(`study-log:${userId}`, snapshot.study_log);
  // avatar is stored as a plain string, not JSON
  if (snapshot.avatar && snapshot.avatar !== "⭐") {
    localStorage.setItem(`avatar:${userId}`, JSON.stringify(snapshot.avatar));
  }
}

// Fetches game state from Supabase and hydrates localStorage.
// Only overwrites localStorage if the remote row is newer than our last flush
// (meaning another device or session has written more recent data).
export async function pullGameState(userId: string): Promise<void> {
  if (userId === DEMO_USER_ID) return;
  try {
    const { data, error } = await supabase
      .from("game_state")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !data) return;

    const remoteTs = new Date(data.updated_at).getTime();
    const lastFlushTs = getLastSyncTs(userId);

    // Pull if we have never flushed (new device) OR remote is fresher
    if (lastFlushTs === 0 || remoteTs > lastFlushTs) {
      hydrateSnapshot(userId, {
        coins: data.coins,
        rewards: data.rewards,
        extended_stats: data.extended_stats,
        achievements: data.achievements,
        subject_progress: (data.subject_progress as Record<string, unknown>) ?? {},
        mistakes: data.mistakes,
        study_log: data.study_log,
        avatar: (data.avatar as string) ?? "⭐",
      });
    }
  } catch {
    // Supabase unreachable → stay on localStorage-only mode
  }
}

// Reads all game state from localStorage and upserts it to Supabase.
export async function pushGameState(userId: string): Promise<void> {
  if (userId === DEMO_USER_ID) return;
  try {
    const snapshot = buildSnapshot(userId);
    const { error } = await supabase.from("game_state").upsert({
      user_id: userId,
      coins: snapshot.coins as Json,
      rewards: snapshot.rewards as Json,
      extended_stats: snapshot.extended_stats as Json,
      achievements: snapshot.achievements as Json,
      subject_progress: snapshot.subject_progress as Json,
      mistakes: snapshot.mistakes as Json,
      study_log: snapshot.study_log as Json,
      avatar: snapshot.avatar,
      updated_at: new Date().toISOString(),
    });
    if (!error) setLastSyncTs(userId);
  } catch {
    // Supabase unreachable → data stays safely in localStorage
  }
}
