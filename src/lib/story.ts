import { createServerFn } from "@tanstack/react-start";

export interface StoryScene {
  text: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export interface GeneratedStory {
  title: string;
  character: string;
  emoji: string;
  topic: string;
  scenes: StoryScene[];
}

interface GenerateStoryInput {
  subject: string;
  topic: string;
  grade: string;
  curriculum: string;
}

function getFallbackStory(subject: string, topic: string): GeneratedStory {
  return {
    title: `The ${topic} Challenge`,
    character: "Omar",
    emoji: "🧒",
    topic,
    scenes: [
      {
        text: `Omar was helping his mother at the market. She asked him to solve a quick ${topic} problem so they could save money on their shopping trip.`,
        question: `Which subject covers ${topic}?`,
        options: [subject, "History", "Geography", "Literature"],
        correct_answer: subject,
        explanation: `${topic} is an important topic in ${subject}.`,
      },
      {
        text: `Back at school, Omar's teacher wrote a ${topic} problem on the board. "Think carefully," she said with a smile.`,
        question: `What is the best way to study ${topic}?`,
        options: ["Practice regularly", "Cram the night before", "Skip it", "Only read once"],
        correct_answer: "Practice regularly",
        explanation: "Regular practice builds deep understanding of any topic.",
      },
      {
        text: `Omar shared what he learned with his younger sister. She was amazed at how useful ${topic} was in everyday life.`,
        question: `Why is ${topic} useful in daily life?`,
        options: [
          "It helps solve real problems",
          "It is only for exams",
          "It has no practical use",
          "It is just for fun",
        ],
        correct_answer: "It helps solve real problems",
        explanation: `${topic} in ${subject} has many real-world applications.`,
      },
      {
        text: `The next day, Omar's class held a competition. The team that solved the most ${topic} problems won extra study points.`,
        question: "What helps most when solving challenging problems?",
        options: ["Breaking them into steps", "Guessing", "Skipping difficult parts", "Rushing"],
        correct_answer: "Breaking them into steps",
        explanation: "Breaking problems into smaller steps makes them easier to solve.",
      },
      {
        text: `At the end of the day, Omar felt proud. He had helped his family, impressed his teacher, and learned that ${topic} was everywhere once you knew how to look.`,
        question: "What is the best attitude toward learning new topics?",
        options: [
          "Stay curious and keep practising",
          "Give up when it gets hard",
          "Only study what is easy",
          "Avoid challenges",
        ],
        correct_answer: "Stay curious and keep practising",
        explanation: "Curiosity and persistence are the keys to mastering any subject.",
      },
    ],
  };
}

export const generateStory = createServerFn({ method: "POST" })
  .validator((input: GenerateStoryInput) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env["DEEPSEEK_API_KEY"];

    if (!apiKey) {
      return { story: getFallbackStory(data.subject, data.topic) };
    }

    const prompt = `Write a 5-scene educational story for grade ${data.grade} students about "${data.topic}" in ${data.subject}${data.curriculum ? ` (${data.curriculum} curriculum)` : ""}.

The story follows ONE character who faces real-life situations that require ${data.topic} knowledge. Each scene builds on the last to form a continuous narrative.

Return ONLY valid JSON (no markdown, no extra text):
{
  "title": "Short catchy title (max 6 words)",
  "character": "A South Asian first name (Omar, Sara, Zara, Ali, Aisha, Bilal, Noor, etc.)",
  "emoji": "One emoji representing the character age/gender",
  "scenes": [
    {
      "text": "3-4 sentences of story narrative that naturally introduces a ${data.topic} problem. Be specific — use numbers, names, and real-world context.",
      "question": "A clear question the character must answer to solve the story problem",
      "options": ["correct answer", "plausible wrong answer", "plausible wrong answer", "plausible wrong answer"],
      "correct_answer": "must match one option exactly (copy-paste it)",
      "explanation": "1-2 sentences explaining why this is correct, referencing the story"
    }
  ]
}

Requirements:
- CRITICAL: vary the correct_answer position across the 5 scenes — distribute it across index 0, 1, 2, and 3. No two consecutive scenes should have the correct answer at the same index.
- Wrong options must be plausible distractors (common mistakes, similar numbers, related but wrong concepts) — NOT obviously wrong
- Questions must be directly answerable from the story numbers/context
- Every question must use a different question format: calculation, fill-in-the-blank, which-of-these, reverse question (what caused X?), comparison
- Setting should feel real and relatable (market, school, kitchen, sports, travel)
- Each scene adds a new situation — don't repeat the same setup
- Difficulty matches grade ${data.grade}`;

    try {
      const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.85,
          max_tokens: 2500,
        }),
      });

      if (!res.ok) return { story: getFallbackStory(data.subject, data.topic) };

      const json = (await res.json()) as { choices: { message: { content: string } }[] };
      const raw = json.choices[0]?.message.content ?? "{}";
      const cleaned = raw
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      const parsed = JSON.parse(cleaned) as GeneratedStory;
      parsed.topic = data.topic;

      // Safety: ensure exactly 5 scenes
      if (!parsed.scenes || parsed.scenes.length < 1) {
        return { story: getFallbackStory(data.subject, data.topic) };
      }

      return { story: parsed };
    } catch {
      return { story: getFallbackStory(data.subject, data.topic) };
    }
  });
