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
  learningStyle?: "visual" | "reading" | "practical" | "mixed";
}

/** Fisher-Yates shuffle — returns a new array, never mutates. */
export function shuffleArray<T>(arr: readonly T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = copy[i];
    const b = copy[j];
    if (a !== undefined && b !== undefined) {
      copy[i] = b;
      copy[j] = a;
    }
  }
  return copy;
}

/**
 * Shuffles the options array of every question so the correct answer
 * lands in a random position on every render. Safe because correct_answer
 * is always matched by string equality, not index.
 */
export function shuffleQuestionOptions(questions: PracticeQuestion[]): PracticeQuestion[] {
  return questions.map((q) => ({ ...q, options: shuffleArray(q.options) }));
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

    const styleClause = data.learningStyle
      ? `\nLearning style: ${buildStyleInstruction(data.learningStyle)}\n`
      : "";

    const prompt = `Generate exactly ${count} multiple-choice questions for a student.

Subject: ${data.subject}
Topic: ${data.topic}
Grade: ${data.grade}
Difficulty: ${data.difficulty}
Curriculum: ${data.curriculum}
${styleClause}
Rules:
1. Each question has exactly 4 answer options (short, max 10 words each)
2. The correct_answer field must be the FULL TEXT of one of the options (not A/B/C/D)
3. Include a short explanation for the correct answer (1–2 sentences max)
4. Questions must specifically test knowledge of "${data.topic}" in ${data.subject}
5. Vary question formats across the set: direct recall, calculation, word problem, conceptual understanding, reverse question (what causes X?), comparison, fill-in-the-blank, application to a new scenario
6. Wrong options must be plausible distractors — common misconceptions, off-by-one errors, similar-sounding terms — NOT obviously wrong
7. All facts must be 100% correct
8. CRITICAL — vary the position of the correct answer: spread it across index 0, 1, 2, and 3 across the question set. Do NOT place it at index 0 more than twice in a row. A uniform distribution across all four positions is required.
9. Every question in the set must be unique — no two questions should test the same sub-concept or use the same sentence structure

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
      const cleaned = raw
        .replace(/^```(?:json)?\n?/, "")
        .replace(/\n?```$/, "")
        .trim();
      const questions = JSON.parse(cleaned) as PracticeQuestion[];

      if (!Array.isArray(questions) || questions.length === 0) throw new Error("empty");
      return { questions: questions.slice(0, count) };
    } catch (err) {
      console.error("[practice] generation failed:", err);
      return { questions: getFallbackQuestions(data.topic, data.difficulty, count) };
    }
  });

function buildStyleInstruction(style: "visual" | "reading" | "practical" | "mixed"): string {
  const map: Record<typeof style, string> = {
    visual:
      "VISUAL learner — frame questions using spatial, geometric, or diagram-described scenarios. Describe shapes, positions, directions, or graphs in the question text.",
    reading:
      "READING/WRITING learner — include a 2–3 sentence context paragraph before each question. Use precise vocabulary, definitions, and structured problem setups.",
    practical:
      "PRACTICAL learner — embed every question as a real-world word problem (cooking, shopping, sports, travel, construction, etc.). Numbers and scenarios must be concrete.",
    mixed:
      "MIXED learner — vary question framing: alternate between abstract/conceptual, diagram-described, text-heavy, and real-world word problem styles across the set.",
  };
  return map[style];
}

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
