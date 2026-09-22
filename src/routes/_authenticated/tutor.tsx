import { useState, useRef, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Send, Sparkles, Bot, User, Settings, Trash2 } from "lucide-react";
import { askTutor, type TutorMessage } from "@/lib/tutor";
import { recordAiQuestion } from "@/lib/rewards";
import { fetchMyProfile, fetchSubjects } from "@/lib/profile-data";
import {
  loadTutorPrefs,
  saveTutorPrefs,
  loadChatHistory,
  saveChatHistory,
  clearChatHistory,
  DEFAULT_PREFS,
  PERSONALITY_LABELS,
  STYLE_LABELS,
  LANGUAGE_LABELS,
  type TutorPrefs,
  type TutorPersonality,
  type ExplanationStyle,
  type TutorLanguage,
} from "@/lib/tutor-prefs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DashboardSidebar } from "@/components/dashboard/Sidebar";
import { TopBar } from "@/components/dashboard/TopBar";

export const Route = createFileRoute("/_authenticated/tutor")({
  head: () => ({
    meta: [{ title: "AI Tutor â€” Study Buddy" }],
  }),
  component: TutorPage,
});

const WELCOME_MESSAGE: TutorMessage = {
  role: "assistant",
  content:
    "Hey! I'm Study Buddy, your personal AI tutor ðŸ‘‹\n\nI won't just give you the answers â€” I'll guide you through the thinking so you actually understand. Ask me anything about your subjects, or pick one below!",
};

function TutorPage() {
  const { user } = Route.useRouteContext();
  const userName = (user.user_metadata?.["full_name"] as string | undefined) ?? "Student";
  const xp = Number(user.user_metadata?.["xp"] ?? 0);

  // Student profile for subject-aware prompts and personalization
  const profileQuery = useQuery({
    queryKey: ["my-profile", user.id],
    queryFn: () => fetchMyProfile(user.id),
  });
  const subjectsQuery = useQuery({
    queryKey: ["subjects"],
    queryFn: fetchSubjects,
  });

  const draft = profileQuery.data?.draft;
  const allSubjects = subjectsQuery.data ?? [];
  const enrolledSubjects = allSubjects.filter((s) => draft?.subjectIds.includes(s.id));
  const enrolledSubjectNames = enrolledSubjects.map((s) => s.name);

  // Prefs (localStorage)
  const [prefs, setPrefsState] = useState<TutorPrefs>(() => loadTutorPrefs(user.id));

  function updatePrefs(patch: Partial<TutorPrefs>) {
    const next = { ...prefs, ...patch };
    setPrefsState(next);
    saveTutorPrefs(user.id, next);
  }

  // Chat history (localStorage)
  const [messages, setMessages] = useState<TutorMessage[]>(() => {
    const saved = loadChatHistory(user.id);
    return saved.length > 0 ? saved : [WELCOME_MESSAGE];
  });
  const [input, setInput] = useState("");
  const [xpEarned, setXpEarned] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const ask = useMutation({
    mutationFn: () =>
      askTutor({
        data: {
          history: messages.filter((m) => m !== WELCOME_MESSAGE),
          progressXp: xp,
          ...(draft?.full_name != null && { studentName: draft.full_name }),
          ...(draft?.grade != null && { grade: draft.grade }),
          ...(draft?.curriculum != null && { curriculum: draft.curriculum }),
          ...(enrolledSubjectNames.length > 0 && { subjects: enrolledSubjectNames }),
          ...(draft?.difficulty != null && { difficulty: draft.difficulty }),
          ...(user.user_metadata?.["current_topic"] != null && {
            topic: user.user_metadata["current_topic"] as string,
          }),
          personality: prefs.personality,
          style: prefs.style,
          language: prefs.language,
        },
      }),
    onSuccess: (res) => {
      setMessages((prev) => {
        const next = [...prev, { role: "assistant" as const, content: res.reply }];
        saveChatHistory(user.id, next);
        return next;
      });
      if (!xpEarned) {
        recordAiQuestion(user.id);
        setXpEarned(true);
      }
    },
  });

  function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || ask.isPending) return;
    setMessages((prev) => {
      const next = [...prev, { role: "user" as const, content: msg }];
      saveChatHistory(user.id, next);
      return next;
    });
    setInput("");
    textareaRef.current?.focus();
    ask.mutate();
  }

  function handleClear() {
    clearChatHistory(user.id);
    setMessages([WELCOME_MESSAGE]);
    setXpEarned(false);
  }

  const showPrompts = messages.length === 1 && !ask.isPending;
  const quickPrompts =
    enrolledSubjects.length > 0
      ? enrolledSubjects.map((s) => `Help me with ${s.name}`)
      : [
          "Help me understand fractions",
          "Explain photosynthesis",
          "What is Newton's first law?",
          "Help me with essay writing",
        ];

  const activePersonality = PERSONALITY_LABELS[prefs.personality];
  const activeStyle = STYLE_LABELS[prefs.style];
  const activeLanguage = LANGUAGE_LABELS[prefs.language];

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <div className="flex min-h-screen flex-col lg:pl-[240px]">
        <TopBar userName={userName} />

        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 sm:px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">Study Buddy</p>
              <p className="truncate text-xs text-muted-foreground">
                {activePersonality.emoji} {activePersonality.label} Â· {activeStyle.emoji}{" "}
                {activeStyle.label} Â· {activeLanguage.emoji} {activeLanguage.label}
              </p>
            </div>

            {xpEarned && (
              <span className="hidden rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:inline">
                +5 XP earned
              </span>
            )}

            {/* Settings popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <Settings className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Tutor Settings</h3>

                  {/* Personality */}
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Personality
                    </p>
                    <div className="grid grid-cols-1 gap-1">
                      {(
                        Object.entries(PERSONALITY_LABELS) as [
                          TutorPersonality,
                          (typeof PERSONALITY_LABELS)[TutorPersonality],
                        ][]
                      ).map(([key, { emoji, label }]) => (
                        <button
                          key={key}
                          onClick={() => updatePrefs({ personality: key })}
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                            prefs.personality === key
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:bg-muted",
                          )}
                        >
                          <span>{emoji}</span>
                          <span>{label}</span>
                          {prefs.personality === key && (
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Explanation style */}
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Explanation Style
                    </p>
                    <div className="grid grid-cols-1 gap-1">
                      {(
                        Object.entries(STYLE_LABELS) as [
                          ExplanationStyle,
                          (typeof STYLE_LABELS)[ExplanationStyle],
                        ][]
                      ).map(([key, { emoji, label }]) => (
                        <button
                          key={key}
                          onClick={() => updatePrefs({ style: key })}
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                            prefs.style === key
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:bg-muted",
                          )}
                        >
                          <span>{emoji}</span>
                          <span>{label}</span>
                          {prefs.style === key && (
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language */}
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Language
                    </p>
                    <div className="grid grid-cols-1 gap-1">
                      {(
                        Object.entries(LANGUAGE_LABELS) as [
                          TutorLanguage,
                          (typeof LANGUAGE_LABELS)[TutorLanguage],
                        ][]
                      ).map(([key, { emoji, label }]) => (
                        <button
                          key={key}
                          onClick={() => updatePrefs({ language: key })}
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                            prefs.language === key
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:bg-muted",
                          )}
                        >
                          <span>{emoji}</span>
                          <span>{label}</span>
                          {prefs.language === key && (
                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Clear conversation */}
                  <div className="border-t border-border pt-3">
                    <button
                      onClick={handleClear}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Clear conversation
                    </button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            <div className="mx-auto max-w-3xl space-y-6">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-end gap-2",
                    m.role === "user" ? "flex-row-reverse" : "flex-row",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div
                    className={cn(
                      "max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                      m.role === "user"
                        ? "rounded-br-sm bg-primary text-primary-foreground"
                        : "rounded-bl-sm border border-border bg-card text-foreground",
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {ask.isPending && (
                <div className="flex items-end gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Bot className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-3 shadow-sm">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50" />
                  </div>
                </div>
              )}

              {/* Subject-aware quick prompts */}
              {showPrompts && (
                <div className="pt-2">
                  <p className="mb-3 text-center text-xs text-muted-foreground">
                    {enrolledSubjects.length > 0 ? "Your subjects:" : "Try asking aboutâ€¦"}
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {quickPrompts.map((p) => (
                      <button
                        key={p}
                        onClick={() => send(p)}
                        className="rounded-full border border-border bg-card px-4 py-2 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input bar */}
          <div className="border-t border-border bg-card/80 px-4 py-4 pb-safe-bottom backdrop-blur-sm sm:px-6 lg:pb-4">
            <div className="mx-auto flex max-w-3xl items-end gap-3">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Ask me anything about your subjectsâ€¦"
                className="max-h-36 min-h-[48px] flex-1 resize-none rounded-2xl border-border bg-background text-sm"
                rows={1}
              />
              <Button
                onClick={() => send()}
                disabled={!input.trim() || ask.isPending}
                size="icon"
                className="h-12 w-12 shrink-0 rounded-2xl"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground/60">
              Enter to send Â· Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
