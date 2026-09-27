import type { PracticeQuestion } from "./practice";

/**
 * Post-generation guard rails for AI-written questions.
 *
 * Every rule here exists because the model produced that exact defect at least
 * once: broken grammar, duplicated words, an option that bundles two claims into
 * one sentence (comparative questions were the worst offender), or a stem that
 * quietly hands the student the answer.
 */

const MAX_STEM_CHARS = 600;
const MAX_OPTION_CHARS = 180;
const MIN_OPTIONS = 3;
const MAX_OPTIONS = 6;

const DIFFICULTIES = new Set(["easy", "medium", "hard"]);

/** Words that may legitimately appear twice in a row. */
const ALLOWED_REPEATS = new Set([
  "had",
  "that",
  "no",
  "hey",
  "ha",
  "ah",
  "oh",
  "oo",
  "mm",
  "hmm",
  "mhm",
  "bye",
  "boo",
  "shh",
]);

/** Abbreviations that end in a period, so no space is inserted after them. */
const ABBREVIATIONS = new Set([
  "mr",
  "mrs",
  "ms",
  "dr",
  "prof",
  "sr",
  "jr",
  "st",
  "vs",
  "etc",
  "eg",
  "ie",
  "approx",
  "fig",
  "min",
  "max",
  "sq",
  "cm",
  "km",
  "kg",
  "ml",
]);

/** Words that start with a vowel letter but have a consonant sound — keep "a". */
const A_BEFORE_VOWEL_SOUND = new Set([
  "uniform", "unit", "union", "unique", "university", "universal", "universe",
  "unity", "utility", "user", "usage", "usual", "usually", "useful",
  "euro", "european", "ewe", "once", "one",
]);

/** Words that start with a consonant letter but have a vowel sound — keep "an". */
const AN_BEFORE_CONSONANT_SOUND = new Set([
  "hour", "hourly", "hours", "honest", "honestly", "honesty", "honor",
  "honorary", "heir", "heiress", "herb",
]);

/** Uncontracted forms the model sometimes produces — maps to the correct form. */
const BROKEN_CONTRACTIONS: Readonly<Record<string, string>> = {
  dont: "don't",
  doesnt: "doesn't",
  cant: "can't",
  wont: "won't",
  isnt: "isn't",
  arent: "aren't",
  wasnt: "wasn't",
  werent: "weren't",
  hasnt: "hasn't",
  havent: "haven't",
  hadnt: "hadn't",
  didnt: "didn't",
  wouldnt: "wouldn't",
  couldnt: "couldn't",
  shouldnt: "shouldn't",
};

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "these",
  "those",
  "from",
  "into",
  "than",
  "then",
  "there",
  "their",
  "they",
  "them",
  "have",
  "has",
  "had",
  "was",
  "were",
  "are",
  "been",
  "being",
  "does",
  "did",
  "not",
  "but",
  "its",
  "his",
  "her",
  "our",
  "your",
  "which",
  "what",
  "when",
  "where",
  "who",
  "whom",
  "whose",
  "will",
  "would",
  "can",
  "could",
  "should",
  "may",
  "might",
  "must",
  "shall",
  "you",
  "any",
  "all",
  "one",
  "two",
  "out",
  "about",
  "also",
  "only",
  "such",
  "some",
  "each",
  "other",
  "over",
  "under",
  "between",
  "during",
  "through",
  "because",
  "while",
  "answer",
  "option",
  "options",
  "true",
  "false",
  "correct",
]);

const COPULA_RE = /\b(?:is|are|was|were|means|refers to|describes|involves|consists of|equals)\b/i;

const COMPARATIVE_STEM_RE =
  /\b(?:difference|differences|compare|comparing|comparison|compared|distinguish|distinguishing|versus|vs\.?)\b/i;

const BLANK_RE = /_{2,}|\bblank\b|\(\d+\s*(?:marks?|points?)\)/i;

const LABEL_PREFIX_RE =
  /^\s*(?:[A-Ha-h][).:]\s*|\(?\d{1,2}[).:]\s*|[ivxIVX]{1,4}[).]\s*|[-*\u2022]\s*)/;

export interface QuestionRejection {
  question: string;
  reason: string;
}

/**
 * Prompt block shared by every generator that writes multiple-choice questions.
 * The numbered rules continue from the caller's own list.
 */
export const QUESTION_QUALITY_RULES = `GRAMMAR AND STYLE (checked automatically — a question is discarded if it fails):
- Write flawless English: correct subject-verb agreement, correct articles (a / an / the), correct plural forms, correct prepositions, and correct apostrophes in contractions like "doesn't".
- No duplicated words ("the the", "is is"), no missing spaces after a comma, no run-on sentences, no sentence fragments.
- Spell every word correctly, including subject vocabulary and proper nouns.
- Start every question and every option with a capital letter. Do not end options with a full stop.
- End the question with a question mark, or with a blank like "______" for a fill-in-the-blank question.
- Keep sentences under 20 words and use the same register (formal, classroom English) everywhere.

NEVER GIVE AWAY THE ANSWER:
- The question text must never contain or hint at the correct answer. Do not repeat the correct option's wording in the question.
- Do not add hints such as "choose the best answer", "as taught in class", or "according to the passage".
- For a fill-in-the-blank, the missing word must not already appear somewhere else in the question.

ONE CLAIM PER OPTION (non-comparison questions only):
- For questions that are NOT comparisons: every option must make exactly ONE claim about exactly ONE thing.
- FORBIDDEN in non-comparison questions: joining two claims with a semicolon or "and", e.g. "X does this; Y does that."

COMPARISON QUESTIONS — MANDATORY FORMAT:
- When asking about the difference between X and Y, EVERY option MUST describe BOTH X and Y, joined by a semicolon.
- The CORRECT option gives the accurate description of both X and Y.
- Each WRONG option must contain at least one inaccuracy — wrong description of X, wrong description of Y, or the two descriptions swapped.
  CORRECT FORMAT:
    Q: "What is the difference between a right and a responsibility?"
    A) "A right is an entitlement; a responsibility is an obligation." ← CORRECT (both accurate)
    B) "A right is a duty; a responsibility is a freedom." ← wrong (both inaccurate)
    C) "A right is a privilege; a responsibility is an entitlement." ← wrong (inaccurate or swapped)
    D) "A right is an obligation; a responsibility is a choice." ← wrong (both inaccurate)
  FORBIDDEN: options that describe only one of the two terms, or that mix the format.
- Exactly one option is fully correct; all others are wrong in at least one half.

FINAL CHECK — before you answer, silently re-read every question and option and fix: any grammar error, any duplicated word, any option that states two claims, and any question that gives away its own answer.`;

export interface SanitizeResult {
  accepted: PracticeQuestion[];
  rejected: QuestionRejection[];
}

export interface SanitizeContext {
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  max?: number;
}

// ── text normalisation ────────────────────────────────────────────────────────

function dedupeRepeatedWords(text: string): string {
  return text.replace(/\b([A-Za-z]+)(\s+)\1\b/gi, (match, word: string) => {
    if (ALLOWED_REPEATS.has(word.toLowerCase())) return match;
    return word;
  });
}

function fixMissingSpaces(text: string): string {
  const out = text.replace(/([,;:])(?=[A-Za-z])/g, "$1 ").replace(/([?!])(?=[A-Za-z])/g, "$1 ");
  return out.replace(/\.(?=[A-Z])/g, (match, offset: number) => {
    const bare = (/([A-Za-z]+)$/.exec(out.slice(0, offset))?.[1] ?? "").toLowerCase();
    if (!bare || ABBREVIATIONS.has(bare) || bare.length <= 2) return match;
    return ". ";
  });
}

function fixArticles(text: string): string {
  let out = text.replace(
    /\b(a|A)\s+([a-zA-Z]{3,})/g,
    (match, article: string, word: string) => {
      const lower = word.toLowerCase();
      if (!/^[aeiou]/.test(lower)) return match;
      if (A_BEFORE_VOWEL_SOUND.has(lower)) return match;
      return `${article === "A" ? "An" : "an"} ${word}`;
    },
  );
  out = out.replace(
    /\b(an|An)\s+([a-zA-Z]{2,})/g,
    (match, article: string, word: string) => {
      const lower = word.toLowerCase();
      if (/^[aeiou]/.test(lower)) return match;
      if (AN_BEFORE_CONSONANT_SOUND.has(lower)) return match;
      return `${article === "An" ? "A" : "a"} ${word}`;
    },
  );
  return out;
}

function fixContractions(text: string): string {
  return text.replace(
    /\b(dont|doesnt|cant|wont|isnt|arent|wasnt|werent|hasnt|havent|hadnt|didnt|wouldnt|couldnt|shouldnt)\b/gi,
    (match) => {
      const fixed = BROKEN_CONTRACTIONS[match.toLowerCase()];
      if (!fixed) return match;
      return /^[A-Z]/.test(match) ? fixed.charAt(0).toUpperCase() + fixed.slice(1) : fixed;
    },
  );
}

/** Collapses whitespace and smart punctuation, and fixes doubled words and spacing. */
export function normalizeText(raw: string): string {
  let text = dedupeRepeatedWords(
    raw
      .replace(/\u00a0/g, " ")
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/\s+/g, " ")
      .trim(),
  );
  text = fixMissingSpaces(text);
  text = fixArticles(text);
  text = fixContractions(text);
  return text
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\.{2,}/g, ".")
    .replace(/([!?])\1+/g, "$1")
    .replace(/,(\s*,)+/g, ",")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function stripLabelPrefix(raw: string): string {
  const stripped = raw.trim().replace(LABEL_PREFIX_RE, "").trim();
  return stripped || raw.trim();
}

/** Short openers that still deserve a capital; units like "km" or "Rs" do not. */
const CAPITALIZE_SHORT = new Set([
  "a",
  "an",
  "the",
  "of",
  "in",
  "on",
  "at",
  "to",
  "it",
  "is",
  "as",
  "by",
  "or",
  "and",
  "if",
  "we",
  "he",
  "do",
  "no",
  "so",
]);

function capitalizeFirst(raw: string): string {
  const index = raw.search(/[A-Za-z]/);
  if (index < 0) return raw;
  const word = /^[A-Za-z]+/.exec(raw.slice(index))?.[0] ?? "";
  if (word.length < 3 && !CAPITALIZE_SHORT.has(word.toLowerCase())) return raw;
  if (index > 0 && /\d/.test(raw.slice(0, index))) return raw;
  const char = raw[index];
  if (char === undefined) return raw;
  return raw.slice(0, index) + char.toUpperCase() + raw.slice(index + 1);
}

/** Trailing punctuation on an option is noise — the UI renders it verbatim. */
function trimOptionPunctuation(raw: string): string {
  return raw.replace(/[.,;:!?]+$/, "").trim();
}

// ── cheap grammar lint ────────────────────────────────────────────────────────

function countMatches(text: string, pattern: string): number {
  const matches = text.match(new RegExp(pattern, "g"));
  return matches ? matches.length : 0;
}

function isBalanced(text: string): boolean {
  const pairs: Array<[string, string]> = [
    ["\\(", "\\)"],
    ["\\[", "\\]"],
    ["\\{", "\\}"],
  ];
  return pairs.every(([open, close]) => countMatches(text, open) === countMatches(text, close));
}

/** Returns a human-readable reason when the text is obviously malformed. */
export function findGrammarIssue(raw: string, kind: "stem" | "option"): string | null {
  const text = raw.trim();
  if (!text) return "empty text";
  if (!isBalanced(text)) return "unbalanced brackets or quotes";

  const doubled = /\b([A-Za-z]{2,})\s+\1\b/i.exec(text)?.[1];
  if (doubled && !ALLOWED_REPEATS.has(doubled.toLowerCase())) return `duplicated word "${doubled}"`;

  if (
    /\b(is|are|was|were|has|have|do|does|did)\s+(is|are|was|were|has|have|do|does|did)\b/i.test(
      text,
    )
  ) {
    return "duplicated verb";
  }
  if (/([?!])\1+/.test(text) || /,\s*,/.test(text)) return "repeated punctuation";
  if (text.length > (kind === "stem" ? MAX_STEM_CHARS : MAX_OPTION_CHARS)) {
    return kind === "stem" ? "question is too long" : "option is too long";
  }

  if (kind === "stem") {
    if (/[,;:]\s*$/.test(text)) return "question ends with a dangling comma or colon";
    if (!/[?!._]$/.test(text) && !BLANK_RE.test(text)) return "question has no ending punctuation";
    if (/\b(choose|select|pick|tick)\s+the\s+(best|correct|right|most\s+accurate)\b/i.test(text)) {
      return "question tells the student which option to pick";
    }
    return null;
  }

  if (text.length < 2 && !isNumeric(text)) return "option is too short";
  if (BLANK_RE.test(text)) return "option contains a blank";
  return null;
}

// ── answer-leak detection ─────────────────────────────────────────────────────

function words(raw: string): string[] {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0);
}

function contentWords(raw: string): string[] {
  return words(raw).filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

function squash(raw: string): string {
  return words(raw).join(" ");
}

/** True when the stem already contains the correct option, or most of its words. */
export function stemLeaksAnswer(stem: string, correctAnswer: string): boolean {
  const squashedStem = squash(stem);
  const squashedAnswer = squash(correctAnswer);
  if (squashedAnswer.length < 12) return false;
  if (squashedStem.includes(squashedAnswer)) return true;

  const stemWords = new Set(words(stem));
  const answerWords = contentWords(correctAnswer);
  if (answerWords.length < 3) return false;
  const shared = answerWords.filter((word) => stemWords.has(word)).length;
  return shared / answerWords.length >= 0.8;
}

/** A fill-in-the-blank whose answer is still fully present in the stem. */
export function blankRevealsAnswer(stem: string, correctAnswer: string): boolean {
  if (!BLANK_RE.test(stem)) return false;
  const stemWords = new Set(words(stem));
  const answerWords = contentWords(correctAnswer);
  if (answerWords.length < 2) return false;
  return answerWords.every((word) => stemWords.has(word));
}

// ── comparison-question rules ─────────────────────────────────────────────────

/** Pulls the two things being compared out of a comparison stem. */
export function extractComparedTerms(stem: string): [string, string] | null {
  const between =
    /\bbetween\s+((?:[A-Za-z][A-Za-z'-]*\s+){0,5}?)\band\s+((?:[A-Za-z][A-Za-z'-]*\s+){0,4}[A-Za-z][A-Za-z'-]*)(?=[?.!,]|$)/i.exec(
      stem,
    );
  if (between?.[1] && between?.[2]) return asTermPair(between[1], between[2]);

  const either =
    /\b(?:correct|true|right)\b[,:]?\s+((?:[A-Za-z][A-Za-z'-]*\s+){0,5}?)\bor\s+((?:[A-Za-z][A-Za-z'-]*\s+){0,4}[A-Za-z][A-Za-z'-]*)(?=[?.!,]|$)/i.exec(
      stem,
    );
  if (either?.[1] && either?.[2]) return asTermPair(either[1], either[2]);

  return null;
}

function asTermPair(first: string, second: string): [string, string] | null {
  const a = first.trim();
  const b = second.trim();
  if (!a || !b) return null;
  if (a.split(/\s+/).length > 5 || b.split(/\s+/).length > 5) return null;
  return [a, b];
}

function headNoun(term: string): string {
  const parts = words(term).filter(
    (word) => !["a", "an", "the", "of", "some", "any"].includes(word),
  );
  const last = parts[parts.length - 1] ?? term;
  return last.replace(/(?:ies|es|s)$/i, "").replace(/i$/, "y");
}

function mentionsTerm(option: string, term: string): boolean {
  const noun = headNoun(term);
  if (noun.length < 3) return false;
  const stem = noun.slice(0, Math.max(3, noun.length - 1));
  return new RegExp(`\\b${stem}\\w{0,3}\\b`, "i").test(option);
}

/** True when one option asserts something about BOTH compared terms. */
export function optionBundlesBothTerms(option: string, terms: [string, string]): boolean {
  return mentionsTerm(option, terms[0]) && mentionsTerm(option, terms[1]);
}

/** An option that reads as two independent claims glued together. */
export function optionBundlesTwoClaims(option: string): boolean {
  const parts = option
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  if (parts.length < 2) return false;
  return parts.filter((part) => COPULA_RE.test(part)).length >= 2;
}

function isComparativeStem(stem: string): boolean {
  return COMPARATIVE_STEM_RE.test(stem);
}

function isNumeric(raw: string): boolean {
  return /^[\d\s.,:/%+\-()]+$/.test(raw);
}

// ── validation ────────────────────────────────────────────────────────────────

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function uniqueByText(items: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = squash(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

interface CleanResult {
  question?: PracticeQuestion;
  reason: string;
}

/** Repairs what can be repaired and reports everything still wrong. */
function cleanQuestion(raw: unknown, context: SanitizeContext): CleanResult {
  const record = asRecord(raw);
  if (!record) return { reason: "not a question object" };

  const stem = capitalizeFirst(normalizeText(stripLabelPrefix(asString(record["question"]))));
  if (!stem) return { reason: "missing question text" };
  const stemIssue = findGrammarIssue(stem, "stem");
  if (stemIssue) return { reason: `grammar: ${stemIssue}` };

  const options = uniqueByText(
    asStringArray(record["options"]).map((option) =>
      trimOptionPunctuation(capitalizeFirst(normalizeText(stripLabelPrefix(option)))),
    ),
  );
  if (options.length < MIN_OPTIONS) return { reason: `only ${options.length} usable options` };
  if (options.length > MAX_OPTIONS) return { reason: `too many options (${options.length})` };
  if (options.every((option) => option.length <= 2) && !options.every(isNumeric)) {
    return { reason: "options carry no content" };
  }
  const isComparison = isComparativeStem(stem);
  for (const option of options) {
    const issue = findGrammarIssue(option, "option");
    if (issue) return { reason: `option grammar: ${issue}` };
    if (!isComparison && optionBundlesTwoClaims(option))
      return { reason: "an option states two claims joined together" };
  }
  if (squash(stem) === squash(options[0] ?? ""))
    return { reason: "an option repeats the question" };

  const correctRaw = normalizeText(asString(record["correct_answer"]));
  const canonical = options.find((option) => squash(option) === squash(correctRaw));
  if (!canonical) return { reason: "correct_answer does not match any option" };
  if (stemLeaksAnswer(stem, canonical))
    return { reason: "the question text gives away the answer" };
  if (blankRevealsAnswer(stem, canonical))
    return { reason: "the blank in the question reveals the answer" };

  const difficultyRaw = asString(record["difficulty"]).toLowerCase();
  const difficulty = DIFFICULTIES.has(difficultyRaw)
    ? (difficultyRaw as PracticeQuestion["difficulty"])
    : context.difficulty;
  const topic = normalizeText(asString(record["topic"])) || context.topic;
  const explanation = normalizeText(asString(record["explanation"]));

  return {
    reason: "",
    question: {
      id: "",
      question: stem,
      options,
      correct_answer: canonical,
      explanation: explanation || `The correct answer is "${canonical}".`,
      difficulty,
      topic,
    },
  };
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}\u2026`;
}

/**
 * Cleans a raw model response into questions that are safe to show, dropping
 * anything with a grammar error, a bundled option or a leaked answer.
 */
export function sanitizeQuestions(raw: unknown, context: SanitizeContext): SanitizeResult {
  const accepted: PracticeQuestion[] = [];
  const rejected: QuestionRejection[] = [];
  const list = Array.isArray(raw) ? raw : [];
  const max = context.max ?? Number.POSITIVE_INFINITY;
  const seenStems = new Set<string>();

  for (const entry of list) {
    if (accepted.length >= max) break;
    const cleaned = cleanQuestion(entry, context);
    if (!cleaned.question) {
      rejected.push({
        question: truncate(normalizeText(asString(asRecord(entry)?.["question"])), 90),
        reason: cleaned.reason,
      });
      continue;
    }
    const key = squash(cleaned.question.question);
    if (seenStems.has(key)) {
      rejected.push({
        question: truncate(cleaned.question.question, 90),
        reason: "duplicate question",
      });
      continue;
    }
    seenStems.add(key);
    accepted.push({ ...cleaned.question, id: String(accepted.length + 1) });
  }

  return { accepted, rejected };
}

/** One line per rejected question, for the repair prompt. */
export function describeRejections(rejected: readonly QuestionRejection[], limit = 12): string {
  return rejected
    .slice(0, limit)
    .map((item, index) => `${index + 1}. "${item.question}" \u2014 problem: ${item.reason}`)
    .join("\n");
}
