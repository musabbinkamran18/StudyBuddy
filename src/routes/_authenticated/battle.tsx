import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { createBattleRoom, fetchBattleRoom } from "@/lib/battle";
import { loadAvatar } from "@/lib/avatar";
import { fetchMyProfile } from "@/lib/profile-data";
import { isDemo } from "@/lib/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Swords, Users, ArrowLeft, Copy, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/battle")({
  head: () => ({ meta: [{ title: "Battle — Study Buddy" }] }),
  component: BattleLobby,
});

function BattleLobby() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [demoMode, setDemoMode] = useState<boolean | null>(null);

  const profileQuery = useQuery({
    queryKey: ["my-profile", user.id],
    queryFn: async () => {
      const profile = await fetchMyProfile(user.id);
      const demo = await isDemo();
      setDemoMode(demo);
      return profile;
    },
  });

  const playerName = profileQuery.data?.draft.full_name || "Student";
  const avatar = loadAvatar(user.id);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const room = await createBattleRoom(user.id, playerName, avatar);
      await navigate({ to: "/battle/$code", params: { code: room.code } });
    } catch (err) {
      toast.error("Couldn't create battle room. Please try again.");
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 6) {
      toast.error("Enter a 6-character room code.");
      return;
    }
    setJoining(true);
    try {
      const room = await fetchBattleRoom(code);
      if (!room) {
        toast.error("Room not found. Check the code and try again.");
        return;
      }
      if (room.status !== "waiting") {
        toast.error("That battle has already started or finished.");
        return;
      }
      if (room.hostId === user.id) {
        // They own this room — just navigate
        await navigate({ to: "/battle/$code", params: { code } });
        return;
      }
      await navigate({ to: "/battle/$code", params: { code } });
    } catch (err) {
      toast.error("Couldn't join room. Please try again.");
      console.error(err);
    } finally {
      setJoining(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto w-full max-w-2xl">
        <Link
          to="/dashboard"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>

        <div className="mt-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-4xl">
            ⚔️
          </div>
          <h1 className="font-serif text-4xl tracking-tight">Battle Mode</h1>
          <p className="mt-2 text-muted-foreground">
            {demoMode
              ? "Challenge StudyBot — answer questions faster and smarter."
              : "Challenge a friend to a real-time quiz duel."}
          </p>
        </div>

        {demoMode && (
          <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-700 dark:text-amber-400">
            Demo mode — you'll battle against <strong>StudyBot 🤖</strong>. Connect Supabase for
            real multiplayer.
          </div>
        )}

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {/* Create */}
          <Card className="flex flex-col">
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-xl">
                <Swords className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>Create Battle</CardTitle>
              <CardDescription>
                {demoMode
                  ? "Start a bot battle instantly."
                  : "Get a room code and share it with a friend."}
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button className="w-full" onClick={handleCreate} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create Battle"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Join */}
          <Card className={`flex flex-col ${demoMode ? "opacity-50 pointer-events-none" : ""}`}>
            <CardHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-xl">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <CardTitle>Join Battle</CardTitle>
              <CardDescription>Enter a code your friend shared with you.</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto space-y-3">
              <Input
                placeholder="Enter 6-char code (e.g. ABC123)"
                value={joinCode}
                maxLength={8}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && void handleJoin()}
                className="font-mono tracking-widest uppercase"
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => void handleJoin()}
                disabled={joining || joinCode.trim().length < 6}
              >
                {joining ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Joining…
                  </>
                ) : (
                  "Join Battle"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* How it works */}
        <div className="mt-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            How it works
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: "1️⃣",
                title: "Create a room",
                desc: "Pick your subject, topic and difficulty.",
              },
              {
                icon: "2️⃣",
                title: "Share the code",
                desc: "Your friend enters it to join the lobby.",
              },
              {
                icon: "3️⃣",
                title: "First to finish wins",
                desc: "XP goes to whoever scores highest.",
              },
            ].map((step) => (
              <div
                key={step.title}
                className="rounded-xl border border-border bg-card px-4 py-3 text-center"
              >
                <p className="text-2xl">{step.icon}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{step.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          <Copy className="h-3.5 w-3.5 shrink-0" />
          Tip: the winner earns bonus XP and a{" "}
          <span className="font-medium text-foreground">Battle Victor</span> achievement.
        </div>
      </div>
    </main>
  );
}
