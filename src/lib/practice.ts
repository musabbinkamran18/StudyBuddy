import { createServerFn } from "@tanstack/react-start";

export interface PracticeQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  topic: string;
}

export interface GeneratePracticeInput {
  subject: string;
  topic: string;
  grade: string;
  difficulty: "easy" | "medium" | "hard";
  curriculum: string;
  count?: number;
}

export const XP_PER_DIFFICULTY: Record<"easy" | "medium" | "hard", number> = {
  easy: 5,
  medium: 10,
  hard: 15,
};

export const HEARTS_PER_SESSION = 5;

export const generatePracticeQuestions = createServerFn({ method: "POST" })
  .validator((input: GeneratePracticeInput) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env["DEEPSEEK_API_KEY"];
    const count = data.count ?? 10;

    if (!apiKey) {
      return { questions: getFallbackQuestions(data.topic, data.difficulty, count) };
    }

    const prompt = `Generate exactly ${count} multiple-choice questions for a student.

Subject: ${data.subject}
Topic: ${data.topic}
Grade: ${data.grade}
Difficulty: ${data.difficulty}
Curriculum: ${data.curriculum}

Rules:
1. Each question has exactly 4 answer options (short, max 10 words each)
2. The correct_answer field must be the FULL TEXT of one of the options (not A/B/C/D)
3. Include a short explanation for the correct answer (1–2 sentences max)
4. Questions must specifically test knowledge of "${data.topic}" in ${data.subject}
5. Vary styles: direct calculation, word problem, conceptual, fill-in-the-idea
6. Wrong options must be plausible but clearly wrong on reflection
7. All facts must be 100% correct

Return ONLY a valid JSON array. No markdown fences, no extra text:
[
  {
    "id": "1",
    "question": "...",
    "options": ["Option text A", "Option text B", "Option text C", "Option text D"],
    "correct_answer": "Option text B",
    "explanation": "Short explanation here.",
    "difficulty": "${data.difficulty}",
    "topic": "${data.topic}"
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
          max_tokens: 2500,
          temperature: 0.75,
          stream: false,
        }),
      });

      if (!res.ok) throw new Error(`DeepSeek ${res.status}`);

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const raw = json.choices?.[0]?.message?.content?.trim() ?? "";
      const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
      const questions = JSON.parse(cleaned) as PracticeQuestion[];

      if (!Array.isArray(questions) || questions.length === 0) throw new Error("empty");
      return { questions: questions.slice(0, count) };
    } catch (err) {
      console.error("[practice] generation failed:", err);
      return { questions: getFallbackQuestions(data.topic, data.difficulty, count) };
    }
  });

function getFallbackQuestions(
  topic: string,
  difficulty: "easy" | "medium" | "hard",
  count: number,
): PracticeQuestion[] {
  return Array.from({ length: Math.min(count, 3) }, (_, i) => ({
    id: String(i + 1),
    question: `Sample question ${i + 1} about ${topic} (AI not connected).`,
    options: ["First option", "Second option", "Third option", "Fourth option"],
    correct_answer: "First option",
    explanation: "This is a fallback question. Add DEEPSEEK_API_KEY to get real questions.",
    difficulty,
    topic,
  }));
}
