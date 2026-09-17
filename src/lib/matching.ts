import { createServerFn } from "@tanstack/react-start";

export interface MatchingPair {
  id: string;
  term: string;
  definition: string;
}

interface GenerateMatchingInput {
  subject: string;
  topic: string;
  grade: string;
  curriculum: string;
  count?: number;
}

function getFallbackPairs(topic: string, count: number): MatchingPair[] {
  const base = [
    { term: "Definition", definition: "The meaning of a concept or term" },
    { term: "Formula", definition: "A rule expressed using symbols" },
    { term: "Hypothesis", definition: "A testable prediction or idea" },
    { term: "Variable", definition: "A value that can change" },
    { term: "Equation", definition: "A statement that shows equality" },
    { term: "Theory", definition: "An explanation backed by evidence" },
  ];
  return base.slice(0, Math.min(count, 6)).map((p, i) => ({
    id: String(i),
    term: `${p.term} (${topic})`,
    definition: p.definition,
  }));
}

export const generateMatchingPairs = createServerFn({ method: "POST" })
  .validator((input: GenerateMatchingInput) => input)
  .handler(async ({ data }) => {
    const apiKey = process.env["DEEPSEEK_API_KEY"];
    const count = data.count ?? 6;

    if (!apiKey) {
      return { pairs: getFallbackPairs(data.topic, count) };
    }

    const prompt = `Generate exactly ${count} term-definition pairs about "${data.topic}" for grade ${data.grade} students studying ${data.subject}${data.curriculum ? ` (${data.curriculum} curriculum)` : ""}.

Return ONLY a valid JSON array. No markdown, no explanation:
[{"term":"short term (1-4 words)","definition":"brief definition (4-8 words)"},...]

Rules:
- Terms must be distinct key concepts from ${data.topic}
- Definitions must be very concise (4-8 words max)
- Use age-appropriate language for grade ${data.grade}`;

    try {
      const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 600,
        }),
      });

      if (!res.ok) return { pairs: getFallbackPairs(data.topic, count) };

      const json = (await res.json()) as { choices: { message: { content: string } }[] };
      const raw = json.choices[0]?.message.content ?? "[]";
      const cleaned = raw
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      const parsed = JSON.parse(cleaned) as { term: string; definition: string }[];
      const pairs: MatchingPair[] = parsed
        .slice(0, count)
        .map((p, i) => ({ id: String(i), term: p.term, definition: p.definition }));
      return { pairs };
    } catch {
      return { pairs: getFallbackPairs(data.topic, count) };
    }
  });
