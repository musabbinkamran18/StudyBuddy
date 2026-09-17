# 🎓 StudyBuddy — Full Product Specification

> Duolingo-style adaptive learning app with AI-powered question generation, gamification, and a Socratic AI tutor.

---

## 📋 Build Status

| Phase         | Feature                                                                | Status  |
| ------------- | ---------------------------------------------------------------------- | ------- |
| ✅ Foundation | Auth (Supabase + demo mode)                                            | Done    |
| ✅ Foundation | Student onboarding (name, grade, curriculum, subjects, difficulty)     | Done    |
| ✅ Foundation | Dashboard (hero, subject cards, progress sidebar)                      | Done    |
| ✅ Foundation | AI Tutor chat (DeepSeek, Socratic, personality/style/language)         | Done    |
| ✅ Foundation | Daily AI tasks (resets at midnight, checkbox completion)               | Done    |
| ✅ Foundation | XP + streak skeleton (`rewards.ts`)                                    | Done    |
| ✅ Foundation | 4 achievements (7-day streak, first topic, problem solver, perfect 10) | Done    |
| ✅ Phase 1    | AI question generator (MCQ, fill-blank, true/false)                    | Done    |
| ✅ Phase 1    | Practice mode UI (`/practice`)                                         | Done    |
| ✅ Phase 1    | Hearts / lives system (5 lives per session)                            | Done    |
| ✅ Phase 1    | XP per answer (easy +5, medium +10, hard +15)                          | Done    |
| ✅ Phase 1    | Session summary screen                                                 | Done    |
| ✅ Phase 2    | Learning path UI (locked/unlocked topic tree)                          | Done    |
| ✅ Phase 2    | Lesson structure (Lesson 1→2→3→Practice→Boss Quiz)                     | Done    |
| ✅ Phase 2    | Boss Battles (10 hard questions per topic)                             | Done    |
| ✅ Phase 2    | Adaptive difficulty (auto-adjust based on performance)                 | Done    |
| ✅ Phase 2    | Mistake system (save wrong answers, AI review)                         | Done    |
| ✅ Phase 2    | Topic mastery % (0→25→50→75→100%)                                      | Done    |
| ✅ Phase 3    | Coins system (earn + spend)                                            | Done    |
| ✅ Phase 3    | Weekly leaderboard + leagues (Bronze→Diamond)                          | Done    |
| ✅ Phase 3    | Streak freeze item (buy with coins, protects streak)                   | Done    |
| ✅ Phase 3    | XP Boost item (2× XP next session)                                     | Done    |
| ✅ Phase 3    | Daily login rewards (7-day cycle, auto-claimed on first visit)         | Done    |
| 🟡 Phase 3    | Spaced repetition                                                      | Planned |
| 🟡 Phase 3    | Intelligent randomization (more Qs on weak topics)                     | Planned |
| ✅ Phase 3    | Daily missions (3 per day, progress tracking, claim rewards)           | Done    |
| 🟢 Phase 4    | Friends + weekly challenges                                            | Planned |
| 🟢 Phase 4    | Avatar / cosmetics / shop                                              | Planned |
| 🟢 Phase 4    | Achievements (full list — 20+)                                         | Planned |
| 🟢 Phase 5    | Teacher mode + class dashboard                                         | Planned |
| 🟢 Phase 5    | AI teacher insights                                                    | Planned |
| 🟢 Phase 5    | Voice mode                                                             | Planned |

---

## 1. 🎯 Core Loop

```
Choose subject → Learn → Practice → Earn XP → Level up → Review mistakes → Maintain streak
```

---

## 2. 📚 Subjects

| Emoji | Subject          |
| ----- | ---------------- |
| ➗    | Mathematics      |
| 🔬    | Science          |
| 📖    | English          |
| 🌍    | Geography        |
| 🏛️    | History          |
| 💻    | Computer Science |
| 🧪    | Chemistry        |
| ⚛️    | Physics          |
| 🧬    | Biology          |

---

## 3. 🗺️ Learning Path

Each subject has a linear path of topics. Example for Maths:

```
Numbers → Factors & Multiples → Fractions → Decimals →
Percentages → Algebra → Geometry → Statistics
```

Each topic contains:

```
Topic
 ├── Lesson 1
 ├── Lesson 2
 ├── Lesson 3
 ├── Practice
 └── Boss Quiz 👹
```

Visual representation: locked nodes (🔒) unlock as the student progresses. Completed = green (🟢), in-progress = blue (🔵), locked = grey (🔒).

---

## 4. 🤖 AI Question Generator

### Input

```json
{
  "subject": "Maths",
  "grade": 7,
  "topic": "Fractions",
  "difficulty": "medium",
  "question_type": "multiple_choice",
  "number_of_questions": 10
}
```

### Output (per question)

```json
{
  "question": "What is 3/4 + 1/8?",
  "options": ["5/8", "7/8", "1", "3/8"],
  "correct_answer": "7/8",
  "explanation": "Convert 3/4 to 6/8, then add 1/8.",
  "difficulty": "medium",
  "topic": "Fractions"
}
```

### Quality checks before sending to student

```
Generate → Check format → Check answer → Check difficulty →
Check curriculum/topic → Check for duplicates → Send
```

---

## 5. 🎲 Intelligent Randomization

AI randomizes: question wording, numbers, answer choices, examples, problem situations.

But it follows student progress:

```
Fractions:    ⭐⭐⭐⭐⭐  → fewer questions
Algebra:      ⭐⭐⭐      → normal
Percentages:  ⭐⭐        → MORE questions
```

Formula: **Random + Personalized = Smart Randomization 🧠**

---

## 6. 🧠 Adaptive Difficulty

```
Correct → Correct → Correct  →  Difficulty ↑
Wrong → Wrong                →  Difficulty ↓ → Review question
```

Levels: Easy → Medium → Hard → Expert

---

## 7. ❤️ Hearts / Lives

- Each session starts with ❤️❤️❤️❤️❤️ (5 hearts)
- Wrong answer → lose 1 heart
- 0 hearts → "Review your mistakes to earn another ❤️"

---

## 8. ⭐ XP System

| Action                       | XP        |
| ---------------------------- | --------- |
| Easy question correct        | +5        |
| Medium question correct      | +10       |
| Hard question correct        | +15       |
| Lesson completed             | +25       |
| Perfect lesson (no mistakes) | +20 bonus |
| Boss defeated                | +50       |
| Daily goal met               | +30       |
| Review mistakes              | +10       |

---

## 9. 🔥 Streak

- Track consecutive study days
- Daily XP goal (configurable: 10–120 min worth)
- Display: 🔥 14 Day Streak

---

## 10. 🧊 Streak Freeze

- Consumable item (earned or bought with coins)
- Protects streak on a missed day: 🧊 Streak Freeze ×2

---

## 11. 💎 Coins

Earned by:

- Lesson completed → +10 💎
- Perfect lesson → +20 💎
- Daily goal → +30 💎

Spend on:

- ❤️ Hearts refill
- 🧊 Streak Freeze
- ⚡ XP Boost
- 🎨 Themes
- 🐲 Character items

---

## 12. 🏆 Leaderboards

Weekly league with top students ranked by XP:

```
🥇 Alex       1,240 XP
🥈 Odyssey    1,180 XP
🥉 Ahmed        970 XP
```

Leagues: Bronze → Silver → Gold → Platinum → Diamond

---

## 13. 🏅 Achievements (full list)

| Badge                 | Condition                          |
| --------------------- | ---------------------------------- |
| 🔥 7-Day Streak       | 7 consecutive days                 |
| 🔥 30-Day Streak      | 30 consecutive days                |
| 🧠 100 Questions      | Answer 100 questions total         |
| 💯 Perfect Lesson     | Complete a lesson with no mistakes |
| ➗ Math Master        | 100% mastery in Mathematics        |
| 🔬 Science Master     | 100% mastery in Science            |
| 👑 10 Bosses Defeated | Beat 10 boss battles               |
| ⚡ 1,000 XP           | Reach 1,000 total XP               |
| 🏆 Top of the League  | #1 on weekly leaderboard           |
| 🚀 First Lesson       | Complete first lesson              |
| 🎯 Daily Goal         | Hit daily goal for first time      |

---

## 14. 👹 Boss Battles

At the end of each topic — 10 harder questions under time pressure:

```
👹 ALGEBRA BOSS

Question 3/10
Solve: 3x + 5 = 20

A) 3    B) 5    C) 7    D) 15
```

Complete → Topic Mastered 🏆 + 50 XP

---

## 15. ❌ Mistake System

Every wrong answer is saved. AI generates a targeted review session:

```
You struggled with:
• Fractions
• Percentages
• Negative numbers
```

Reviewing mistakes = +10 XP per question

---

## 16. 🤖 AI Tutor

Student can ask "Why is my answer wrong?" after any question.
AI explains step-by-step using Socratic method — guides, doesn't just hand over the answer.

---

## 17. 💬 AI Chat

Full conversational tutor at `/tutor`. Personality, style, and language are customizable.
Chat history persists across sessions. Subject-aware quick prompts.

---

## 18. 🗣️ Voice Mode _(Phase 5)_

Student speaks a question, AI responds with voice. Uses Web Speech API + TTS.

---

## 19. 📝 Question Types

| Type              | Example                                                   |
| ----------------- | --------------------------------------------------------- |
| Multiple choice   | What is 7 × 8? → A) 54 B) 56 ✅ C) 64 D) 48               |
| Fill in the blank | 7 × ___ = 56                                              |
| True / False      | The Earth revolves around the Sun. True / False           |
| Matching          | Mitosis ↔ Cell division, Photosynthesis ↔ Food production |
| Ordering          | Put events in chronological order                         |
| Short answer      | What is the capital of Pakistan?                          |
| Problem solving   | Ali has 250 rupees…                                       |

---

## 20. 📊 Progress System

Per-topic mastery %:

```
FRACTIONS
████████░░ 80%

Vocabulary     ██████████ 100%
Calculations   ███████░░░  70%
Word Problems  ██████░░░░  60%
```

Mastery levels: 0% → 25% → 50% → 75% → 100% ⭐

---

## 21. 🔄 Spaced Repetition

AI schedules reviews:

- Learn Monday → Review Wednesday → Review Saturday → Review next week
- Forgetting curve algorithm determines review timing

---

## 22. 🎯 Daily Missions

Examples:

- 🎯 Complete 2 lessons
- ⭐ Earn 100 XP
- 🧠 Answer 20 questions correctly
- 🔄 Review 5 mistakes

Complete missions → coins + XP rewards

---

## 23. 🎁 Daily Login Rewards

| Day   | Reward           |
| ----- | ---------------- |
| Day 1 | 💎 10 coins      |
| Day 2 | 💎 15 coins      |
| Day 3 | ⚡ XP Boost      |
| Day 4 | 💎 20 coins      |
| Day 5 | 🧊 Streak Freeze |
| Day 6 | 💎 30 coins      |
| Day 7 | 🎁 Big Reward    |

---

## 24. 👤 Student Profile

Displays:

- Name + avatar
- 🔥 X day streak
- ⭐ Level N
- 🏆 X total XP
- 💎 X coins
- Per-subject mastery bars
- Achievements earned

---

## 25. 🎨 Customization _(Phase 4)_

Unlock with coins:

- Avatar + clothing
- Background themes
- Profile frames
- Badges

---

## 26. 🧑‍🤝‍🧑 Friends _(Phase 4)_

- Add friends by username
- Compare XP on a private leaderboard
- Send weekly challenges
- No public messaging

---

## 27. 🛡️ Safety

- No unrestricted public chat
- AI stays educational, never personal data
- Filter inappropriate AI output
- Parent/teacher controls (Phase 5)

---

## 28. 🧑‍🏫 Teacher Mode _(Phase 5)_

- Create a class, add students
- View class average per subject/topic
- See weakest topics + most improved students
- Assign specific lessons

---

## 29. 🧠 AI Teacher Dashboard _(Phase 5)_

- "63% of students are struggling with multiplying fractions"
- Auto-recommends: 📚 Fractions Review Lesson

---

## 30. 🏗️ Architecture

```
         STUDENT
            ↓
      ┌─────────────┐
      │   FRONTEND  │
      │ TanStack    │
      └──────┬──────┘
             ↓
         BACKEND
     (TanStack Start)
             ↓
   ┌─────────┴─────────┐
   ↓                   ↓
AI QUESTION          DATABASE
 GENERATOR          (Supabase)
(DeepSeek)             ↓
   ↓              Progress / XP
Questions         Streak / Coins
   ↓              Mistakes / History
   └───────┬───────────┘
           ↓
       STUDENT
```

---

## Phase Roadmap

### ✅ Phase 0 — Foundation (Done)

Auth, onboarding, dashboard, AI tutor chat, daily tasks, XP/streak skeleton

### ✅ Phase 1 — The Practice Loop (Done)

AI question generator, practice mode UI, hearts, XP per question, session summary, "Start Practice" quick action

### ✅ Phase 2 — The Learning Path (Done)

Topic tree UI (locked/unlocked), lesson structure (L1→L2→L3→Practice→Boss), boss battles (+50 XP), adaptive difficulty indicator, mistake tracking (localStorage), topic mastery % (0→20→40→60→80→100%)

### ✅ Phase 3 — Gamification Layer (Done)

Coins (💎 earn/spend), Shop (/shop), XP Boost (2× XP consumable), Streak Freeze, daily login rewards (7-day cycle), 3 daily missions with progress tracking + coin rewards, league system (Bronze→Diamond based on total XP), demo weekly leaderboard, coin balance in TopBar

### 🟢 Phase 4 — Social + Customization

Friends, challenges, avatar shop, achievements (full list)

### 🟢 Phase 5 — Teacher Mode + Advanced AI

Class dashboard, AI teacher insights, voice mode, parent controls
