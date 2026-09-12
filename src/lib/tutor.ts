import { createServerFn } from "@tanstack/react-start";
import type { TutorPersonality, ExplanationStyle, TutorLanguage } from "./tutor-prefs";

export interface TutorMessage {
  role: "user" | "assistant";
  content: string;
}

export interface TutorChatInput {
  history: TutorMessage[];
  progressXp: number;
  topic?: string;
  grade?: string;
  studentName?: string;
  curriculum?: string;
  subjects?: string[];
  difficulty?: string;
  personality: TutorPersonality;
  style: ExplanationStyle;
  language: TutorLanguage;
}

function buildSystemPrompt(data: TutorChatInput): string {
  const personalityInstructions: Record<TutorPersonality, string> = {
    chill:
      "Your tone is warm, casual, and encouraging — like a patient older sibling helping out. Use friendly language and celebrate small wins.",
    funny:
      "Use light humor and fun analogies to make learning enjoyable. Crack the occasional joke. Make the student smile while they learn.",
    strict:
      "Be firm, precise, and hold high standards. Correct mistakes directly. Don't let the student skip steps or take shortcuts.",
    motivational:
      "You're a high-energy coach. Celebrate every effort enthusiastically. Push the student to go further with phrases like 'you've got this!' and 'one more step!'",
    genius:
      "Speak like a subject expert. Use precise terminology but always explain it clearly. Treat the student as capable of advanced thinking.",
  };

  const styleInstructions: Record<ExplanationStyle, string> = {
    short:      "Keep every reply to 1–2 sentences maximum. Be very concise.",
    detailed:   "Give thorough explanations with background context where it helps understanding.",
    stepbystep: "Always break things into clear numbered steps.",
    examples:   "Always start with a concrete real-world example before explaining the concept.",
    analogy:    "Use real-world analogies and visual descriptions to explain every concept.",
  };

  const languageInstructions: Record<TutorLanguage, string> = {
    english: "Respond in clear, standard English.",
    urdu:    "Respond entirely in Urdu script (اردو). Do not use Roman Urdu.",
    simple:  "Respond in very simple, basic English. Avoid long or complex words.",
    mixed:   "Respond in a natural mix of Urdu and English — use Urdu for explanations and English for technical terms.",
  };

  const subjectList = data.subjects && data.subjects.length > 0
    ? data.subjects.join(", ")
    : null;

  const studentCtx = [
    data.studentName ? `Name: ${data.studentName}` : null,
    data.grade ? `Grade: ${data.grade}` : null,
    data.curriculum ? `Curriculum: ${data.curriculum}` : null,
    data.difficulty ? `Preferred difficulty: ${data.difficulty}` : null,
    `XP: ${data.progressXp}`,
    data.topic ? `Current topic: ${data.topic}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  return `You are "Study Buddy", an AI tutor inside Brainy Bloom — a study app for students.

STUDENT PROFILE: ${studentCtx}

PERSONALITY: ${personalityInstructions[data.personality]}

EXPLANATION STYLE: ${styleInstructions[data.style]}

LANGUAGE: ${languageInstructions[data.language]}

TEACHING RULES:
- Never give the answer directly. Guide the student to it with one clear leading question at a time.
- Match the student's grade level and keep replies brief: max 3 short sentences + one question.
- If the student is stuck, break the problem into smaller steps.
${subjectList ? `- IMPORTANT: Only help with the student's enrolled subjects: ${subjectList}. If asked about another topic, politely say you're their tutor for those subjects only.` : ""}
- Keep the conversation encouraging and age-appropriate.`;
}

export const askTutor = createServerFn({
  method: "POST",
})
  .validator((input: TutorChatInput) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env["DEEPSEEK_API_KEY"];
    if (!apiKey) {
      return {
        reply:
          "I'm not connected yet — the tutor needs a DEEPSEEK_API_KEY in the server environment.",
      };
    }

    const messages = [
      { role: "system" as const, content: buildSystemPrompt(data) },
      ...data.history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
    ];

    try {
      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages,
          max_tokens: 320,
          temperature: 0.7,
          stream: false,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`DeepSeek API ${res.status}: ${body.slice(0, 200)}`);
      }

      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };

      const reply = json.choices?.[0]?.message?.content?.trim();
      if (!reply) throw new Error("DeepSeek returned an empty reply");

      return { reply };
    } catch (err) {
      console.error("[tutor] DeepSeek call failed:", err);
      return {
        reply: "The tutor hiccuped on my side. Give it another try in a moment — your streak and XP are safe!",
      };
    }
  });
