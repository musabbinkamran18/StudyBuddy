# Smart Study Engine (StudyBuddy)

Phrase 1: Data Model & Backend Architecture

Define schema for Users and Student Profiles (Name, Age, Grade, Curriculum, Subjects, Seriousness Level, Study Goals).

Define schema for Subjects, Topics, and Question Engine (Question types: MCQ, Fill-in-blank, True/False, Match, Find mistake, Scenario, Timed).

Define schema for Practice Attempts, Mistakes, and Adaptive Learning Metrics (Accuracy, Speed, Attempts, Difficulty Level).

Define schema for Chat History, Gamification (XP, Levels, Badges, Streaks), and AI Recommendations.

## Development

You need Node.js (or bun) — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

By default the app has no Supabase project connected, so it runs in a fully
offline "demo mode" backed by `localStorage` — see `src/lib/backend.ts`. To
connect a real backend, set `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`
(client) and `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
(server) in your environment and apply the migrations under `supabase/migrations/`.
