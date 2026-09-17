import { createServerFn } from "@tanstack/react-start";

export interface DailyTask {
  id: string;
  subject: string;
  emoji: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface GenerateTasksInput {
  grade: string;
  curriculum: string;
  subjects: string[];
  difficulty: string;
  studentName: string;
  weakTopics?: string[];
}

interface TasksCache {
  date: string;
  tasks: DailyTask[];
  completedIds: string[];
}

function getTodayKey(): string {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
}

const CACHE_KEY = (userId: string) => `daily-tasks:${userId}`;

export function loadDailyTasksCache(userId: string): TasksCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TasksCache;
    if (parsed.date !== getTodayKey()) return null; // stale — new day
    return parsed;
  } catch {
    return null;
  }
}

export function saveDailyTasksCache(userId: string, tasks: DailyTask[]): TasksCache {
  const cache: TasksCache = { date: getTodayKey(), tasks, completedIds: [] };
  try {
    localStorage.setItem(CACHE_KEY(userId), JSON.stringify(cache));
  } catch {}
  return cache;
}

export function toggleTaskComplete(userId: string, taskId: string): string[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY(userId));
    if (!raw) return [];
    const cache = JSON.parse(raw) as TasksCache;
    const already = cache.completedIds.includes(taskId);
    cache.completedIds = already
      ? cache.completedIds.filter((id) => id !== taskId)
      : [...cache.completedIds, taskId];
    localStorage.setItem(CACHE_KEY(userId), JSON.stringify(cache));
    return cache.completedIds;
  } catch {
    return [];
  }
}

export function clearDailyTasksCache(userId: string): void {
  try {
    localStorage.removeItem(CACHE_KEY(userId));
  } catch {}
}

export const generateDailyTasks = createServerFn({ method: "POST" })
  .validator((input: GenerateTasksInput) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env["DEEPSEEK_API_KEY"];
    if (!apiKey) {
      return { tasks: getFallbackTasks(data.subjects) };
    }

    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    const weakTopicClause =
      data.weakTopics && data.weakTopics.length > 0
        ? `- Weak areas to prioritise: ${data.weakTopics.join(", ")} (at least 2 tasks must target these)\n`
        : "";

    const prompt = `You are a daily study task generator for a student learning app.

Today is ${today}.

Student profile:
- Name: ${data.studentName}
- Grade: ${data.grade}
- Curriculum: ${data.curriculum}
- Enrolled subjects: ${data.subjects.join(", ")}
- Difficulty preference: ${data.difficulty}
${weakTopicClause}
Generate exactly 4 specific daily study tasks for today. Rules:
1. Each task must be specific and actionable — NOT vague (e.g. NOT "study math", YES "Solve 5 fraction problems where the denominators are different")
2. Each task should take 10–20 minutes
3. Use the student's enrolled subjects — vary across them if possible
4. Match the difficulty preference
5. Pick a relevant emoji for each task's subject

Return ONLY a valid JSON array. No markdown. No explanation. Just the raw array:
[
  {
    "id": "1",
    "subject": "Mathematics",
    "emoji": "🔢",
    "title": "Solve 5 quadratic equations using the quadratic formula",
    "difficulty": "medium"
  }
]`;

    try {
      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 600,
          temperature: 0.8,
          stream: false,
        }),
      });

      if (!res.ok) throw new Error(`DeepSeek ${res.status}`);

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const raw = json.choices?.[0]?.message?.content?.trim() ?? "";

      // Strip markdown code fences if present
      const cleaned = raw
        .replace(/^```(?:json)?\n?/, "")
        .replace(/\n?```$/, "")
        .trim();
      const tasks = JSON.parse(cleaned) as DailyTask[];
      if (!Array.isArray(tasks) || tasks.length === 0) throw new Error("bad shape");

      return { tasks: tasks.slice(0, 4) };
    } catch (err) {
      console.error("[daily-tasks] generation failed:", err);
      return { tasks: getFallbackTasks(data.subjects) };
    }
  });

function getFallbackTasks(subjects: string[]): DailyTask[] {
  const pool: DailyTask[] = [
    {
      id: "f1",
      subject: subjects[0] ?? "Mathematics",
      emoji: "🔢",
      title: "Solve 5 practice problems from your last topic",
      difficulty: "medium",
    },
    {
      id: "f2",
      subject: subjects[1] ?? "English",
      emoji: "📝",
      title: "Write a short paragraph summarising what you learned yesterday",
      difficulty: "easy",
    },
    {
      id: "f3",
      subject: subjects[2] ?? subjects[0] ?? "Science",
      emoji: "🔬",
      title: "Review your notes and write 3 key facts from memory",
      difficulty: "easy",
    },
    {
      id: "f4",
      subject: subjects[0] ?? "Mathematics",
      emoji: "🧩",
      title: "Attempt one challenging past-paper question",
      difficulty: "hard",
    },
  ];
  return pool;
}
