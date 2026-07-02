# Quiz App — Project Guide

**QuizSpark** (built for Concept Mastery) — an adaptive math quiz platform for Grades 1–8, aligned to the IXL Ontario skill taxonomy. Core loop: parent onboarding → adaptive quiz generation → student takes quiz → adaptive engine updates skill progress.

> **Current phase:** deployed **live** on Vercel + Supabase (Postgres) at `https://quizspark-cm.vercel.app` as a **free build**. `NEXT_PUBLIC_BILLING_ENABLED=false` unlocks every feature and hides all paywalls (the paid $5/mo Stripe model is muted, not deleted). The app HAS authentication (NextAuth v4 + role middleware: parent / student / tutor / org-admin / super-admin), email (Gmail Workspace SMTP; verification via a 6-digit code), tutor & admin panels, and gamification. AI question generation runs on the deterministic **mock** by default; real Claude is one env flip away (`AI_PROVIDER=claude` + `ANTHROPIC_API_KEY`). The "Phase 1 / no-auth / no-payments" framing below is historical — treat this banner as the source of truth for scope.

## Stack

- **Next.js 15** App Router, TypeScript, Tailwind CSS
- **Prisma** ORM — SQLite (`prisma/dev.db`) locally, **Postgres (Supabase) in production**. The datasource provider flips at build time via `npm run db:use-postgres` (Vercel build command); `npm run db:use-sqlite` to go back locally. Schema is provider-agnostic (JSON stored as TEXT).
- **Mock AI service** at `src/lib/ai/mockGenerator.ts` — same shape as the real AI will return (matches `SKILL.md` JSON contract). Phase 2 swaps in a real LLM call behind the same interface.

## Source of truth: the skill

The project root holds the curriculum contract.
- `SKILL.md` — adaptive engine rules, question schema, quiz distribution rules, validation checklist. The runtime code must match this spec.
- `references/grade{1..8}.md` — IXL skill taxonomy. Seeded into the DB by `prisma/seed.ts`. **Don't edit these by hand.** If the curriculum changes, edit the markdown and re-run the seed.

When implementing logic, the `SKILL.md` file is canonical:
- Adaptive engine rules (advance/hold/step-back thresholds) live in `src/lib/adaptive.ts`
- Question shape (skill_code, ixl_skill_ref, explanation.why_wrong, etc.) lives in `src/lib/types.ts`
- Distribution weighting (60% weak / 25% adjacent / 15% other) lives in the mock generator

## Data model (key tables)

- `Student` — grade, currentDifficulty, tutorApproved
- `TopicGroup` — letter (S, BB, etc.), name, gradeLevel — seeded from references
- `Skill` — code, number, name, belongs to a TopicGroup — seeded from references
- `StudentTopicSelection` — which topic groups the parent enabled for this student
- `Quiz` — has many Questions, has a status + score
- `Question` — full payload from the AI (question_text, options JSON, explanation JSON, etc.)
- `Attempt` — student's answer per question
- `SkillProgress` — per-student per-skill mastery state (consecutiveCorrect, failedQuizzes, remediationFlag)

## Quiz flow (the golden path)

1. **`/onboarding`** — parent picks grade + topic groups → POST `/api/onboarding` creates Student, StudentTopicSelection rows. `tutorApproved = false` (Phase 1: we just override this to true so the flow works without a tutor UI).
2. **`/dashboard?studentId=X`** — list past quizzes + "Generate new quiz" button → POST `/api/quiz/generate`.
3. **`/api/quiz/generate`** — calls `mockGenerator` with student state (grade, selected topic groups, weak skills, current difficulty) → returns array of question objects → persists Quiz + Questions → returns quizId.
4. **`/quiz/[id]`** — renders MCQ form, captures answers in local state, POST `/api/quiz/[id]/submit` on finish.
5. **`/api/quiz/[id]/submit`** — saves Attempts, computes score, runs adaptive engine to update SkillProgress + Student.currentDifficulty → returns score and updates.
6. **`/quiz/[id]/results`** — shows score, per-question explanations, what changed adaptively.

## Conventions

- **Auth exists — use it.** NextAuth v4 (JWT credentials) + role-aware middleware are in place. Route through the existing session/role helpers; don't rip auth out or reintroduce query-string `studentId` as an auth substitute.
- **Billing exists but is muted.** The Stripe freemium ($5/mo) lives behind `billingEnabled()` in `src/lib/plan.ts`; the free build sets `NEXT_PUBLIC_BILLING_ENABLED=false` so every gate opens and paywalls hide. Re-enabling is a flag flip — **don't delete** the Stripe/paywall code.
- **Email is configurable.** `src/lib/email.ts` switches provider via `EMAIL_PROVIDER` (`smtp`/`gmail` mutes Resend). Verification is a **6-digit code** (`src/lib/email-verification.ts`), not a magic link.
- **Server-only DB access.** Prisma client is in `src/lib/db.ts`. Pages import server components; mutations go through `/api/*` route handlers.
- **JSON columns** are SQLite TEXT — use Prisma's `Json` field type and parse on read.
- **The adaptive engine is pure.** `src/lib/adaptive.ts` takes inputs, returns updates. No DB access inside — caller writes the result.
- **The AI service is an interface.** Build against the `QuizGenerator` interface in `src/lib/ai/types.ts`. Phase 2 plug-in only swaps the implementation.

## Running

```bash
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

Visit http://localhost:3000 → redirects to `/auth/login` (auth is live).

## Current state / what's deferred

Shipped since the original Phase 1: authentication + roles (parent / student / tutor / org-admin / super-admin), tutor & admin panels, tutor approval + homework + session log, email lifecycle (Gmail SMTP; 6-digit code verification), gamification (XP, levels, 15 badges, streaks, leaderboard), avatars, daily goal, topic-mastery heatmap, Web Push + notification bell, parental PIN lock, live Kahoot-style quizzes, and Stripe freemium (currently muted for the free build).

Deferred / intentionally off right now:
- **Paid billing** — muted behind `NEXT_PUBLIC_BILLING_ENABLED=false` (free build). Re-enable when the client is ready.
- **Real LLM generation** — mock generator is the default; flip `AI_PROVIDER=claude` + set `ANTHROPIC_API_KEY` to use Claude.
- **SVG/visual rendering** — questions still flag `needs_visual` but we don't render them.
- **Resend email** — muted in favor of Gmail Workspace SMTP (reversible via `EMAIL_PROVIDER`).
