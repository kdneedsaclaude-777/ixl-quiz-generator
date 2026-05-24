# Quiz App — Project Guide

Adaptive math quiz platform for Grades 4–8, aligned to the IXL Ontario skill taxonomy. Phase 1 scope: parent onboarding → adaptive quiz generation → student takes quiz → adaptive engine updates skill progress. **No auth, no payments.**

## Stack

- **Next.js 15** App Router, TypeScript, Tailwind CSS
- **Prisma** ORM with SQLite (`prisma/dev.db`) for Phase 1 — swap to Postgres later
- **Mock AI service** at `src/lib/ai/mockGenerator.ts` — same shape as the real AI will return (matches `SKILL.md` JSON contract). Phase 2 swaps in a real LLM call behind the same interface.

## Source of truth: the skill

The project root holds the curriculum contract.
- `SKILL.md` — adaptive engine rules, question schema, quiz distribution rules, validation checklist. The runtime code must match this spec.
- `references/grade{4..8}.md` — IXL skill taxonomy. Seeded into the DB by `prisma/seed.ts`. **Don't edit these by hand.** If the curriculum changes, edit the markdown and re-run the seed.

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

- **Don't add auth.** No `next-auth`, no session middleware. Pass `studentId` via query string for Phase 1.
- **Don't add payments.** No Stripe, no plan gating.
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

Visit http://localhost:3000 → redirects to `/onboarding`.

## What's intentionally NOT here in Phase 1

- Tutor approval UI (we auto-approve)
- Email/onboarding flow (parent just fills the form directly)
- SVG/visual rendering (questions still flag `needs_visual` but we don't render them)
- Real LLM integration (mock service only)
- Authentication, accounts, multi-tenancy
- Payment / billing
