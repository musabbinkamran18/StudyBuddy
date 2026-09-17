import { supabase } from "@/integrations/supabase/client";
import { emptyDraft, type LearningProfileDraft } from "./learning";
import type { Subject, Topic } from "./profile-data";

/**
 * Backend mode detection.
 *
 * Without a connected Supabase project, every network call fails. When the backend
 * is unreachable we switch the whole app into "demo mode": auth and all data
 * live in localStorage and the app is fully usable with zero setup.
 */

export const DEMO_USER_ID = "demo-00000000-0000-4000-8000-000000000001";

export const DEMO_USER = {
  id: DEMO_USER_ID,
  email: "demo@studybuddy.local",
  user_metadata: { full_name: "Demo Student" },
};

let mode: "cloud" | "demo" | null = null;

export function resetBackendMode(): void {
  mode = null;
}

export async function backendMode(): Promise<"cloud" | "demo"> {
  if (mode) return mode;
  try {
    const { error } = await supabase.auth.getSession();
    if (error) {
      mode = "demo";
      return mode;
    }
    // Auth can succeed against a connected project that still has no data
    // tables (migrations not applied yet). In that case every dashboard query
    // 404s, profile fetch errors, and the dashboard dead-ends on a perpetual
    // loading state after sign-in. Detect that and fall back to the fully
    // offline demo mode so the app stays usable. Cached after the first call.
    const probe = await supabase.from("subjects").select("id").limit(1);
    mode = probe.error ? "demo" : "cloud";
  } catch {
    mode = "demo";
  }
  return mode;
}

export async function isDemo(): Promise<boolean> {
  return (await backendMode()) === "demo";
}

/* ---------------------------------------------------------------- subjects */

/** Mirrors the seeded `subjects` table so the app works without a database. */
export const DEMO_SUBJECTS: Subject[] = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    code: "math",
    name: "Mathematics",
    description: "Numbers, algebra, geometry and problem solving",
    icon: "Sigma",
    color: "#2dd4bf",
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    code: "physics",
    name: "Physics",
    description: "Motion, energy, waves and electricity",
    icon: "Atom",
    color: "#60a5fa",
  },
  {
    id: "10000000-0000-4000-8000-000000000003",
    code: "chemistry",
    name: "Chemistry",
    description: "Elements, reactions and the periodic table",
    icon: "FlaskConical",
    color: "#f472b6",
  },
  {
    id: "10000000-0000-4000-8000-000000000004",
    code: "biology",
    name: "Biology",
    description: "Cells, human body, plants and ecosystems",
    icon: "Leaf",
    color: "#4ade80",
  },
  {
    id: "10000000-0000-4000-8000-000000000005",
    code: "english",
    name: "English",
    description: "Grammar, comprehension and writing",
    icon: "BookOpen",
    color: "#fbbf24",
  },
  {
    id: "10000000-0000-4000-8000-000000000006",
    code: "computer",
    name: "Computer Science",
    description: "Programming, logic and digital systems",
    icon: "Cpu",
    color: "#a78bfa",
  },
  {
    id: "10000000-0000-4000-8000-000000000007",
    code: "science",
    name: "General Science",
    description: "Everyday science across disciplines",
    icon: "Microscope",
    color: "#38bdf8",
  },
  {
    id: "10000000-0000-4000-8000-000000000008",
    code: "islamiyat",
    name: "Islamiyat",
    description: "Islamic studies and history",
    icon: "Moon",
    color: "#34d399",
  },
  {
    id: "10000000-0000-4000-8000-000000000009",
    code: "urdu",
    name: "Urdu",
    description: "Urdu language, grammar and literature",
    icon: "Languages",
    color: "#fb923c",
  },
  {
    id: "10000000-0000-4000-8000-000000000010",
    code: "social",
    name: "Social Studies",
    description: "History, geography and civics",
    icon: "Globe",
    color: "#f87171",
  },
];

/* --------------------------------------------------------------- demo topics */

function demoTopics(code: string, names: string[]): Topic[] {
  const subjectIdx = DEMO_SUBJECTS.findIndex((s) => s.code === code);
  return names.map((name, i) => ({
    id: `20000000-0000-4000-8000-${((subjectIdx + 1) * 100 + i).toString().padStart(12, "0")}`,
    subject_id: (DEMO_SUBJECTS.find((s) => s.code === code) ?? DEMO_SUBJECTS[0]!).id,
    name,
    slug: null,
    description: null,
    grade: null,
    difficulty: "medium",
    sort_order: i + 1,
  }));
}

/** Mirrors the topics that ship with the seeded subjects, for demo mode. */
export const DEMO_TOPICS: Record<string, Topic[]> = {
  math: demoTopics("math", [
    "Numbers & Place Value",
    "Fractions, Decimals & Percentages",
    "Algebra",
    "Geometry",
    "Measurement & Units",
    "Statistics & Probability",
  ]),
  physics: demoTopics("physics", [
    "Forces & Motion",
    "Work, Energy & Power",
    "Waves & Sound",
    "Light & Optics",
    "Electricity & Magnetism",
  ]),
  chemistry: demoTopics("chemistry", [
    "States of Matter",
    "Atoms, Elements & Compounds",
    "Periodic Table",
    "Chemical Reactions",
    "Acids, Bases & Salts",
  ]),
  biology: demoTopics("biology", [
    "Cells & the Microscope",
    "The Human Body",
    "Plants & Photosynthesis",
    "Ecosystems & Environment",
    "Genetics & Inheritance",
  ]),
  english: demoTopics("english", [
    "Grammar",
    "Reading Comprehension",
    "Vocabulary & Spelling",
    "Writing & Composition",
    "Poetry & Literature",
  ]),
  computer: demoTopics("computer", [
    "Computers & Devices",
    "Logic & Algorithms",
    "Programming Basics",
    "Data & Spreadsheets",
    "Internet & Online Safety",
  ]),
  science: demoTopics("science", [
    "Living Things",
    "Matter & Materials",
    "Forces in Action",
    "Energy Everywhere",
    "Earth & Space",
  ]),
  islamiyat: demoTopics("islamiyat", [
    "Quranic Studies",
    "Hadith & Seerah",
    "Aqeedah & Beliefs",
    "Worship & Practice",
    "Dua, Ethics & Values",
  ]),
  urdu: demoTopics("urdu", [
    "Urdu Grammar",
    "Reading & Comprehension",
    "Composition & Writing",
    "Vocabulary & Phrases",
    "Poetry",
  ]),
  social: demoTopics("social", [
    "History",
    "Geography",
    "Civics & Citizenship",
    "Economics Basics",
    "Cultures & Traditions",
  ]),
};

/* ----------------------------------------------------------- demo profile */

const PROFILE_KEY = "bb-demo-profile";

export interface DemoProfileState {
  draft: LearningProfileDraft;
  completed: boolean;
}

function defaultDemoState(): DemoProfileState {
  return { draft: { ...emptyDraft }, completed: false };
}

export function loadDemoProfile(): DemoProfileState {
  if (typeof window === "undefined") return defaultDemoState();
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    if (!raw) return defaultDemoState();
    const parsed = JSON.parse(raw) as Partial<DemoProfileState>;
    return {
      draft: { ...emptyDraft, ...(parsed.draft ?? {}) },
      completed: parsed.completed === true,
    };
  } catch {
    return defaultDemoState();
  }
}

export function saveDemoProfile(draft: LearningProfileDraft): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify({ draft, completed: true }));
}

export function clearDemoProfile(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PROFILE_KEY);
}

/* ------------------------------------------------------------ demo accounts */

const ACCOUNTS_KEY = "bb-demo-accounts";
export const DEMO_EMAIL_KEY = "bb-demo-email";

export interface DemoResult {
  ok: boolean;
  error?: string;
}

function loadAccounts(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

/**
 * Simulated email sign-up / sign-in for demo mode. Accounts live in
 * localStorage only — this is a stand-in until a real Supabase backend
 * is connected (passwords are stored in plain text and must never ship).
 */
export function demoSignUp(email: string, password: string): DemoResult {
  const accounts = loadAccounts();
  const normalized = email.trim().toLowerCase();
  if (accounts[normalized]) {
    return { ok: false, error: "An account with this email already exists. Try signing in." };
  }
  accounts[normalized] = password;
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  window.localStorage.setItem(DEMO_EMAIL_KEY, normalized);
  return { ok: true };
}

export function demoSignIn(email: string, password: string): DemoResult {
  const accounts = loadAccounts();
  const normalized = email.trim().toLowerCase();
  if (!accounts[normalized]) {
    return { ok: false, error: "No account found with this email. Create one first." };
  }
  if (accounts[normalized] !== password) {
    return { ok: false, error: "Incorrect password." };
  }
  window.localStorage.setItem(DEMO_EMAIL_KEY, normalized);
  return { ok: true };
}
