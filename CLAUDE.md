# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

StudyBuddy ("brainy-bloom") — a Duolingo-style adaptive learning app with AI-generated questions,
gamification (XP, streaks, coins, leagues, missions), and a Socratic AI tutor chat. A standalone
TanStack Start app (no Lovable dependency). See `STUDYBUDDY_SPEC.md` for the full product spec
and phase roadmap.

## Commands

Package manager is **bun** (see `bun.lock`, `bunfig.toml`), though npm also works per the README.

- `bun run dev` / `npm run dev` — start the Vite dev server
- `bun run build` — production build
- `bun run build:dev` — development-mode build
- `bun run preview` — preview a production build
- `bun run lint` — ESLint over the whole repo
- `bun run format` — Prettier write (100 print width, double quotes off i.e. `"singleQuote": false`, trailing commas)

There is no test suite configured in `package.json`.

## Architecture

**Stack:** TanStack Start (file-based SSR React framework) + TanStack Router + TanStack Query,
Supabase (Postgres + Auth), Tailwind v4, shadcn/ui (`new-york` style, see `components.json`).

**Vite config** (`vite.config.ts`) is a plain config: `tanstackStart` (TanStack Start plugin,
routed to `src/server.ts` as the server entry), `viteReact`, `@tailwindcss/vite`,
`vite-tsconfig-paths`, and `nitro/vite` (cloudflare-module preset by default, build only). The
`@` path alias and React dedupe are set explicitly in `resolve`. Don't add duplicate copies of
these plugins.

**Routing** (`src/routes/`): file-based via TanStack Router. `routeTree.gen.ts` is
auto-generated — never hand-edit it. See `src/routes/README.md` for file→URL conventions
(`$id` dynamic segments, `{-$category}` optional, `$.tsx` splat, `_layout.tsx`, `__root.tsx`
shell). All authenticated pages live under `src/routes/_authenticated/`, gated by
`_authenticated/route.tsx`'s `beforeLoad`, which resolves the backend mode and either returns
the demo user or calls `supabase.auth.getUser()`, redirecting to `/auth` on failure. That layout
also calls `useGameSync(user.id)` to sync gamification state on every authenticated page.

**Demo mode (important, non-obvious):** `src/lib/backend.ts` detects whether a real Supabase
project is connected. Without `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` configured,
every network call fails and the app runs entirely in **demo mode** — auth, profile, subjects,
topics, and progress all live in `localStorage`, with `DEMO_SUBJECTS`/`DEMO_TOPICS` mirroring
the seeded DB tables. `backendMode()` probes `supabase.from("subjects").select(...)` and caches
the result as `"cloud"` or `"demo"` for the session. When adding a feature that reads/writes
data, always check whether it needs a demo-mode fallback (see the `is Demo()` / `DEMO_*` pattern
in `backend.ts`) or the feature will silently break for anyone without a connected Supabase
project.

**Supabase client** (`src/integrations/supabase/client.ts`) lazily constructs the client behind
a `Proxy`, reads `VITE_SUPABASE_URL` /
`VITE_SUPABASE_PUBLISHABLE_KEY` (client) or `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` (SSR),
and strips the `Authorization` header for new-style opaque `sb_publishable_`/`sb_secret_` keys.
`src/integrations/supabase/types.ts` holds generated DB types; migrations live under
`supabase/migrations/` and a full schema rebuild script is at
`supabase/bootstrap/schema_rebuild.sql`.

**Server entry / error handling:** `src/start.ts` defines the TanStack Start instance
(`createStart`) with a CSRF middleware (`createCsrfMiddleware`) and an error-catching request
middleware — re-adding `src/start.ts` is required to keep CSRF protection on, since Start only
auto-installs it when the file is absent. `src/server.ts` wraps the generated SSR handler to also
catch the case where h3 swallows an in-handler throw into a bare `{"unhandled":true}` 500 JSON
response, rendering `renderErrorPage()` (`src/lib/error-page.ts`) instead. Client-side runtime
errors are captured via `src/lib/error-capture.ts` and reported through
`src/lib/error-reporting.ts`.

**AI tutor** (`src/lib/tutor.ts`): a TanStack Start server function (`createServerFn`) builds a
system prompt from tutor preferences — personality (chill/funny/strict/motivational/genius),
explanation style (short/detailed/stepbystep/examples/analogy), and language
(english/urdu/simple/mixed) — defined in `src/lib/tutor-prefs.ts`, then calls out to an LLM for
the Socratic tutoring chat.

**Gamification domain logic** lives in flat modules under `src/lib/`: `rewards.ts` (XP/streaks),
`coins.ts`, `achievements.ts`, `missions.ts`, `daily-tasks.ts`, `leaderboard.ts`, `progress.ts`
(topic mastery %), `practice.ts` (question sessions, hearts/lives), `learning.ts` (onboarding
profile draft), `study-log.ts`, `extended-stats.ts`. `src/hooks/useGameSync.ts` is the hook that
keeps this state in sync with the backend (or localStorage in demo mode).

**Path alias:** `@/*` → `src/*` (see `tsconfig.json` and `components.json` aliases).

## Conventions

- TypeScript strict mode is on with several extra strict flags: `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`. Write
  code that satisfies these (e.g. guard array/index access, don't rely on optional-property
  widening).
- Avoid rewriting published git history (force-push, rebase/amend/squash of pushed commits)
  unless explicitly asked.
