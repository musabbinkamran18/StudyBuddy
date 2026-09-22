import { BottomNav } from "@/components/dashboard/BottomNav";
import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueries } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, Sparkles, Trophy, RefreshCw, ChevronRight } from "lucide-react";
import { generateStory, type GeneratedStory } from "@/lib/story";
import { shuffleArray } from "@/lib/practice";
import { fetchMyProfile, fetchSubjects, fetchTopics } from "@/lib/profile-data";
import { toast } from "sonner";
import { recordSessionCompleted } from "@/lib/rewards";
import { earnCoins } from "@/lib/coins";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/story")({
  head: () => ({ meta: [{ title: "Story Mode — Study Buddy" }] }),
  component: StoryPage,
});

type Screen = "setup" | "loading" | "intro" | "reading" | "results";
type AnswerState = "idle" | "correct" | "wrong";

const XP_PER_CORRECT = 10;
const BONUS_XP_COMPLETE = 20;
const COINS_COMPLETE = 15;

const CORRECT_MESSAGES = [
  "Excellent! 🎉",
  "That's right! ⭐",
  "Brilliant! 💡",
  "Perfect! 🏆",
  "Nailed it! 🔥",
];
const WRONG_MESSAGES = ["Not quite...", "Close, but no...", "Hmm, let's think..."];

function StoryPage() {
  const { user } = Route.useRouteContext();

  const profileQuery = useQuery({
    queryKey: ["my-profile", user.id],
    queryFn: () => fetchMyProfile(user.id),
  });
  const subjectsQuery = useQuery({ queryKey: ["subjects"], queryFn: fetchSubjects });

  const draft = profileQuery.data?.draft;
  const allSubjects = subjectsQuery.data ?? [];
  const mySubjects = allSubjects.filter((s) => draft?.subjectIds.includes(s.id));
  const displaySubjects = mySubjects.length > 0 ? mySubjects : allSubjects;

  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const selectedSubject = displaySubjects.find((s) => s.id === selectedSubjectId) ?? null;

  const topicQueries = useQueries({
    queries: displaySubjects.map((s) => ({
      queryKey: ["topics", s.id],
      queryFn: () => fetchTopics(s.id),
    })),
  });

  const topicsBySubject: Record<string, { id: string; name: string }[]> = {};
  displaySubjects.forEach((s, i) => {
    topicsBySubject[s.id] = topicQueries[i]?.data ?? [];
  });

  const selectedTopics = selectedSubjectId ? (topicsBySubject[selectedSubjectId] ?? []) : [];
  const selectedTopic = selectedTopics.find((t) => t.id === selectedTopicId) ?? null;

  // ── Game state ──
  const [screen, setScreen] = useState<Screen>("setup");
  const [story, setStory] = useState<GeneratedStory | null>(null);
  const [currentScene, setCurrentScene] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [selected, setSelected] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [characterReaction, setCharacterReaction] = useState("");

  // Reset character emoji when scene advances
  useEffect(() => {
    if (story) setCharacterReaction(story.emoji);
  }, [currentScene, story]);

  // Award XP + coins when results screen is reached
  useEffect(() => {
    if (screen !== "results" || !story) return;
    const perfectScore = correctCount === story.scenes.length;
    // minutes * 2 = correctCount * XP_PER_CORRECT + bonus → minutes = correctCount * 5 + 10
    recordSessionCompleted(user.id, correctCount * 5 + (perfectScore ? 10 : 0));
    earnCoins(user.id, COINS_COMPLETE);
  }, [screen]); // eslint-disable-line react-hooks/exhaustive-deps

  const storyMutation = useMutation({
    mutationFn: (input: { subject: string; topic: string; grade: string; curriculum: string }) =>
      generateStory({ data: input }),
    onSuccess: (result) => {
      // Shuffle each scene's options client-side for guaranteed randomness
      const story: GeneratedStory = {
        ...result.story,
        scenes: result.story.scenes.map((scene) => ({
          ...scene,
          options: shuffleArray(scene.options),
        })),
      };
      setStory(story);
      setCurrentScene(0);
      setCorrectCount(0);
      setCharacterReaction(result.story.emoji);
      setScreen("intro");
    },
    onError: () => {
      toast.error("Failed to generate story. Please try again.");
      setScreen("setup");
    },
  });

  function startStory() {
    setScreen("loading");
    storyMutation.mutate({
      subject: selectedSubject?.name ?? "",
      topic: selectedTopic?.name ?? "",
      grade: draft?.grade ?? "9",
      curriculum: draft?.curriculum ?? "",
    });
  }

  function handleAnswer(option: string) {
    if (answerState !== "idle" || !story) return;
    const scene = story.scenes[currentScene];
    if (!scene) return;
    setSelected(option);
    const isCorrect = option === scene.correct_answer;
    setAnswerState(isCorrect ? "correct" : "wrong");
    setCharacterReaction(isCorrect ? "😄" : "😕");
    if (isCorrect) setCorrectCount((c) => c + 1);
    // Auto-advance after 1.5 s on correct; wrong waits for user to tap Continue
    if (isCorrect) setTimeout(() => advanceScene(), 1500);
  }

  function advanceScene() {
    if (!story) return;
    const isLast = currentScene >= story.scenes.length - 1;
    setTransitioning(true);
    setTimeout(() => {
      if (isLast) {
        setScreen("results");
      } else {
        setCurrentScene((s) => s + 1);
        setSelected(null);
        setAnswerState("idle");
      }
      setTransitioning(false);
    }, 300);
  }

  function restart() {
    setScreen("setup");
    setStory(null);
    setCurrentScene(0);
    setCorrectCount(0);
    setSelected(null);
    setAnswerState("idle");
    setCharacterReaction("");
  }

  // ────────────────────────────────── SETUP ──
  if (screen === "setup") {
    const ready = selectedSubjectId && selectedTopicId;
    return (
      <div className="mx-auto max-w-lg space-y-6 px-4 pb-24 pt-8 lg:pb-8">
        <BottomNav />
        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold">Story Mode 📖</h1>
            <p className="text-sm text-muted-foreground">Learn through AI-generated adventures</p>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-6 text-center">
          <div className="mb-3 text-5xl">📖</div>
          <h2 className="mb-1 text-lg font-bold">Pick Your Story</h2>
          <p className="text-sm text-muted-foreground">
            An AI will craft a 5-scene story around your topic. Help the character solve each
            challenge to unlock the next chapter!
          </p>
        </div>

        <div className="space-y-5 rounded-2xl border bg-card p-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Subject</label>
            <div className="flex flex-wrap gap-2">
              {displaySubjects.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelectedSubjectId(s.id);
                    setSelectedTopicId(null);
                  }}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                    selectedSubjectId === s.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:border-primary/50 hover:bg-muted",
                  )}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {selectedSubjectId && selectedTopics.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-semibold">Topic</label>
              <div className="flex flex-wrap gap-2">
                {selectedTopics.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTopicId(t.id)}
                    className={cn(
                      "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                      selectedTopicId === t.id
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:border-primary/50 hover:bg-muted",
                    )}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <Button className="w-full gap-2" size="lg" disabled={!ready} onClick={startStory}>
          <Sparkles className="h-4 w-4" />
          Generate Story ✨
        </Button>
      </div>
    );
  }

  // ────────────────────────────────── LOADING ──
  if (screen === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
        <div className="animate-bounce text-6xl">📖</div>
        <div className="text-center">
          <h2 className="text-xl font-bold">Crafting your story...</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Writing a {selectedTopic?.name ?? "topic"} adventure just for you
          </p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full bg-primary"
              style={{ animation: `bounce 1s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ────────────────────────────────── INTRO ──
  if (screen === "intro" && story) {
    return (
      <div className="mx-auto max-w-lg space-y-6 px-4 pb-24 pt-8 lg:pb-8">
        <BottomNav />
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </Link>

        <div className="space-y-5 rounded-2xl border bg-card p-8 text-center">
          <div className="text-7xl">{story.emoji}</div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {story.topic} · {story.scenes.length} scenes
            </p>
            <h1 className="mt-1 text-2xl font-bold">{story.title}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Follow <strong>{story.character}</strong> through real-life challenges. Answer each
            question to help them succeed!
          </p>
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span>📝 {story.scenes.length} questions</span>
            <span>⭐ {story.scenes.length * XP_PER_CORRECT + BONUS_XP_COMPLETE} XP max</span>
            <span>💎 {COINS_COMPLETE} coins</span>
          </div>
        </div>

        <Button className="w-full gap-2" size="lg" onClick={() => setScreen("reading")}>
          <BookOpen className="h-4 w-4" />
          Begin Story
        </Button>
      </div>
    );
  }

  // ────────────────────────────────── READING ──
  if (screen === "reading" && story) {
    const scene = story.scenes[currentScene];
    if (!scene) return null;
    const total = story.scenes.length;
    const correctMsg = CORRECT_MESSAGES[currentScene % CORRECT_MESSAGES.length] ?? "Correct! 🎉";
    const wrongMsg = WRONG_MESSAGES[currentScene % WRONG_MESSAGES.length] ?? "Not quite...";

    return (
      <div className="mx-auto max-w-lg space-y-5 px-4 py-6">
        {/* Progress header */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={restart}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Exit story"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex gap-1.5">
            {Array.from({ length: total }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i < currentScene
                    ? "w-5 bg-primary"
                    : i === currentScene
                      ? "w-5 bg-primary/80 ring-2 ring-primary/30"
                      : "w-2 bg-muted-foreground/25",
                )}
              />
            ))}
          </div>

          <span className="min-w-[36px] text-right text-xs font-medium text-muted-foreground">
            {currentScene + 1}/{total}
          </span>
        </div>

        {/* Story card */}
        <div
          className={cn(
            "rounded-2xl border bg-card p-5 transition-opacity duration-300",
            transitioning ? "opacity-0" : "opacity-100",
          )}
        >
          <div className="mb-3 flex items-center gap-2.5">
            <span className="text-3xl transition-all duration-300">
              {characterReaction || story.emoji}
            </span>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {story.character}&rsquo;s Story
            </p>
          </div>
          <p className="text-[15px] leading-relaxed text-foreground">{scene.text}</p>
        </div>

        {/* Question */}
        <div
          className={cn(
            "rounded-2xl border border-primary/20 bg-primary/5 p-4 transition-opacity duration-300",
            transitioning ? "opacity-0" : "opacity-100",
          )}
        >
          <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-primary/70">
            Help {story.character}:
          </p>
          <p className="text-[15px] font-semibold text-foreground">{scene.question}</p>
        </div>

        {/* Answer options */}
        <div
          className={cn(
            "grid grid-cols-1 gap-2.5 sm:grid-cols-2 transition-opacity duration-300",
            transitioning ? "opacity-0" : "opacity-100",
          )}
        >
          {scene.options.map((opt) => {
            const isSelected = selected === opt;
            const isCorrect = opt === scene.correct_answer;
            let variantClass =
              "border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5 cursor-pointer";
            if (answerState !== "idle") {
              if (isCorrect)
                variantClass =
                  "border-green-500 bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 cursor-default";
              else if (isSelected)
                variantClass =
                  "border-red-400 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 cursor-default";
              else variantClass = "border-border bg-card text-foreground/40 cursor-default";
            }
            return (
              <button
                key={opt}
                type="button"
                disabled={answerState !== "idle"}
                onClick={() => handleAnswer(opt)}
                className={cn(
                  "rounded-xl border p-3.5 text-left text-sm font-medium transition-all",
                  variantClass,
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {/* Feedback banner */}
        {answerState !== "idle" && (
          <div
            className={cn(
              "rounded-xl border p-4 transition-all",
              answerState === "correct"
                ? "border-green-400 bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200"
                : "border-red-400 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200",
            )}
          >
            <p className="mb-0.5 text-sm font-bold">
              {answerState === "correct" ? correctMsg : wrongMsg}
            </p>
            <p className="text-sm opacity-90">{scene.explanation}</p>
            {answerState === "wrong" && (
              <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={advanceScene}>
                Continue <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ────────────────────────────────── RESULTS ──
  if (screen === "results" && story) {
    const total = story.scenes.length;
    const perfectScore = correctCount === total;
    const xpEarned = correctCount * XP_PER_CORRECT + (perfectScore ? BONUS_XP_COMPLETE : 0);
    const pct = Math.round((correctCount / total) * 100);
    const resultEmoji = perfectScore ? "🏆" : correctCount >= Math.ceil(total / 2) ? "⭐" : "📖";

    return (
      <div className="mx-auto max-w-lg space-y-5 px-4 py-8">
        <div className="rounded-2xl border bg-card p-8 text-center space-y-5">
          <div className="text-6xl">{resultEmoji}</div>
          <div>
            <h1 className="text-2xl font-bold">{perfectScore ? "Perfect Story!" : "The End"}</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">{story.title}</p>
          </div>

          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-3xl font-bold text-primary">
                {correctCount}/{total}
              </p>
              <p className="text-xs text-muted-foreground">correct</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-amber-500">{pct}%</p>
              <p className="text-xs text-muted-foreground">accuracy</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-500">+{xpEarned}</p>
              <p className="text-xs text-muted-foreground">XP earned</p>
            </div>
          </div>

          {perfectScore && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              🎉 Bonus +{BONUS_XP_COMPLETE} XP for a perfect story! You also earned {COINS_COMPLETE}{" "}
              💎 coins.
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 gap-2" onClick={restart}>
            <RefreshCw className="h-4 w-4" />
            New Story
          </Button>
          <Button className="flex-1 gap-2" asChild>
            <Link to="/dashboard">
              <Trophy className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
