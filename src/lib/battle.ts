import { supabase } from "@/integrations/supabase/client";
import { isDemo } from "./backend";
import type { PracticeQuestion } from "./practice";

export type BattleStatus = "waiting" | "ready" | "countdown" | "playing" | "finished";

export interface BattleRoom {
  id: string;
  code: string;
  hostId: string;
  guestId: string | null;
  hostName: string;
  guestName: string | null;
  hostAvatar: string;
  guestAvatar: string | null;
  subject: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  status: BattleStatus;
  questions: PracticeQuestion[];
  hostScore: number;
  guestScore: number;
  hostCorrect: number;
  guestCorrect: number;
  hostFinished: boolean;
  guestFinished: boolean;
  winnerId: string | null;
  createdAt: string;
}

export const BOT_ID = "bot-opponent";
export const BOT_NAME = "StudyBot";
export const BOT_AVATAR = "🤖";
export const BOT_ACCURACY = 0.62;

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)] ?? "A",
  ).join("");
}

type DbRow = Record<string, unknown>;

function mapRow(row: DbRow): BattleRoom {
  return {
    id: String(row["id"] ?? ""),
    code: String(row["code"] ?? ""),
    hostId: String(row["host_id"] ?? ""),
    guestId: (row["guest_id"] as string | null) ?? null,
    hostName: String(row["host_name"] ?? "Player"),
    guestName: (row["guest_name"] as string | null) ?? null,
    hostAvatar: String(row["host_avatar"] ?? "⭐"),
    guestAvatar: (row["guest_avatar"] as string | null) ?? null,
    subject: String(row["subject"] ?? ""),
    topic: String(row["topic"] ?? ""),
    difficulty: String(row["difficulty"] ?? "medium") as "easy" | "medium" | "hard",
    status: String(row["status"] ?? "waiting") as BattleStatus,
    questions: (row["questions"] as PracticeQuestion[]) ?? [],
    hostScore: Number(row["host_score"] ?? 0),
    guestScore: Number(row["guest_score"] ?? 0),
    hostCorrect: Number(row["host_correct"] ?? 0),
    guestCorrect: Number(row["guest_correct"] ?? 0),
    hostFinished: Boolean(row["host_finished"] ?? false),
    guestFinished: Boolean(row["guest_finished"] ?? false),
    winnerId: (row["winner_id"] as string | null) ?? null,
    createdAt: String(row["created_at"] ?? new Date().toISOString()),
  };
}

// ── Demo-mode storage ─────────────────────────────────────────────────────────

const DEMO_KEY = "battle-rooms-v1";

function loadDemoRooms(): Record<string, BattleRoom> {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    return raw ? (JSON.parse(raw) as Record<string, BattleRoom>) : {};
  } catch {
    return {};
  }
}

function saveDemoRoom(room: BattleRoom): void {
  try {
    const rooms = loadDemoRooms();
    rooms[room.code] = room;
    localStorage.setItem(DEMO_KEY, JSON.stringify(rooms));
  } catch {
    // localStorage unavailable
  }
}

function emptyRoom(userId: string, playerName: string, avatar: string): BattleRoom {
  return {
    id: crypto.randomUUID(),
    code: generateCode(),
    hostId: userId,
    guestId: null,
    hostName: playerName,
    guestName: null,
    hostAvatar: avatar,
    guestAvatar: null,
    subject: "",
    topic: "",
    difficulty: "medium",
    status: "waiting",
    questions: [],
    hostScore: 0,
    guestScore: 0,
    hostCorrect: 0,
    guestCorrect: 0,
    hostFinished: false,
    guestFinished: false,
    winnerId: null,
    createdAt: new Date().toISOString(),
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function createBattleRoom(
  userId: string,
  playerName: string,
  avatar: string,
): Promise<BattleRoom> {
  if (await isDemo()) {
    const room: BattleRoom = {
      ...emptyRoom(userId, playerName, avatar),
      // In demo mode the bot joins immediately
      guestId: BOT_ID,
      guestName: BOT_NAME,
      guestAvatar: BOT_AVATAR,
      status: "ready",
    };
    saveDemoRoom(room);
    return room;
  }

  const code = generateCode();
  const { data, error } = await supabase
    .from("battle_rooms")
    .insert({ code, host_id: userId, host_name: playerName, host_avatar: avatar })
    .select()
    .single();

  if (error) throw error;
  return mapRow(data as DbRow);
}

export async function fetchBattleRoom(code: string): Promise<BattleRoom | null> {
  if (await isDemo()) {
    return loadDemoRooms()[code] ?? null;
  }

  const { data, error } = await supabase
    .from("battle_rooms")
    .select("*")
    .eq("code", code.toUpperCase())
    .maybeSingle();

  if (error) throw error;
  return data ? mapRow(data as DbRow) : null;
}

export async function joinBattleRoom(
  code: string,
  userId: string,
  playerName: string,
  avatar: string,
): Promise<BattleRoom> {
  if (await isDemo()) {
    const rooms = loadDemoRooms();
    const room = rooms[code];
    if (!room) throw new Error("Room not found");
    const updated: BattleRoom = {
      ...room,
      guestId: userId,
      guestName: playerName,
      guestAvatar: avatar,
      status: "ready",
    };
    saveDemoRoom(updated);
    return updated;
  }

  const { data, error } = await supabase
    .from("battle_rooms")
    .update({ guest_id: userId, guest_name: playerName, guest_avatar: avatar, status: "ready" })
    .eq("code", code.toUpperCase())
    .eq("status", "waiting")
    .select()
    .single();

  if (error) throw error;
  return mapRow(data as DbRow);
}

export async function updateBattleConfig(
  code: string,
  subject: string,
  topic: string,
  difficulty: "easy" | "medium" | "hard",
): Promise<void> {
  if (await isDemo()) {
    const rooms = loadDemoRooms();
    const room = rooms[code];
    if (room) saveDemoRoom({ ...room, subject, topic, difficulty });
    return;
  }

  await supabase.from("battle_rooms").update({ subject, topic, difficulty }).eq("code", code);
}

export async function startBattleWithQuestions(
  code: string,
  questions: PracticeQuestion[],
): Promise<void> {
  if (await isDemo()) {
    const rooms = loadDemoRooms();
    const room = rooms[code];
    if (room) saveDemoRoom({ ...room, questions, status: "playing" });
    return;
  }

  await supabase
    .from("battle_rooms")
    .update({ questions: questions as unknown as object, status: "playing" })
    .eq("code", code);
}

export async function recordBattleAnswer(
  code: string,
  isHost: boolean,
  scoreToAdd: number,
  correct: boolean,
  finished: boolean,
): Promise<void> {
  if (await isDemo()) {
    const rooms = loadDemoRooms();
    const room = rooms[code];
    if (!room) return;
    const patch: Partial<BattleRoom> = isHost
      ? {
          hostScore: room.hostScore + scoreToAdd,
          hostCorrect: room.hostCorrect + (correct ? 1 : 0),
          hostFinished: finished,
        }
      : {
          guestScore: room.guestScore + scoreToAdd,
          guestCorrect: room.guestCorrect + (correct ? 1 : 0),
          guestFinished: finished,
        };
    saveDemoRoom({ ...room, ...patch });
    return;
  }

  const field = isHost
    ? {
        host_score: scoreToAdd,
        host_correct: correct ? 1 : 0,
        ...(finished ? { host_finished: true } : {}),
      }
    : {
        guest_score: scoreToAdd,
        guest_correct: correct ? 1 : 0,
        ...(finished ? { guest_finished: true } : {}),
      };

  // Use RPC to increment atomically; fall back to raw update for now
  const room = await fetchBattleRoom(code);
  if (!room) return;

  const update = isHost
    ? {
        host_score: room.hostScore + scoreToAdd,
        host_correct: room.hostCorrect + (correct ? 1 : 0),
        ...(finished ? { host_finished: true } : {}),
      }
    : {
        guest_score: room.guestScore + scoreToAdd,
        guest_correct: room.guestCorrect + (correct ? 1 : 0),
        ...(finished ? { guest_finished: true } : {}),
      };

  void field; // suppress unused warning
  await supabase.from("battle_rooms").update(update).eq("code", code);
}

export async function finalizeBattle(code: string, winnerId: string | null): Promise<void> {
  if (await isDemo()) {
    const rooms = loadDemoRooms();
    const room = rooms[code];
    if (room) saveDemoRoom({ ...room, winnerId, status: "finished" });
    return;
  }

  await supabase
    .from("battle_rooms")
    .update({ winner_id: winnerId, status: "finished" })
    .eq("code", code);
}

// ── Realtime subscription (cloud mode only) ───────────────────────────────────

type RoomCallback = (room: BattleRoom) => void;

export function subscribeToBattleRoom(code: string, onUpdate: RoomCallback): () => void {
  const channel = supabase
    .channel(`battle-room:${code}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "battle_rooms", filter: `code=eq.${code}` },
      (payload) => {
        onUpdate(mapRow(payload.new as DbRow));
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
