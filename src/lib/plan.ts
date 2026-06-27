import { prisma } from "@/lib/db";

// Freemium plan logic for QuizSpark. The consumer plan lives on the PARENT
// account; gating is enforced for parent-owned students only (tutor/admin/org-
// managed students are internal and ungated). Stripe is the source of truth —
// the webhook keeps User.plan in sync. We gate on the `plan` flag.

export const FREE_PLAN = "free";
export const PAID_PLAN = "paid";
export const FREE_DAILY_QUIZ_LIMIT = 1; // free = 1 quiz per day
export const FREE_CHILD_LIMIT = 1; // free = 1 child profile
export const PAID_PRICE_LABEL = "$5/mo";

// ── MASTER BILLING SWITCH ──────────────────────────────────────────────────
// When billing is DISABLED, QuizSpark runs in "free-for-everyone" mode: every
// paid feature is unlocked and all paywalls / upgrade prompts disappear. This is
// how we ship the initial FREE build for team testing. NOTHING in this file (or
// the Stripe code) is deleted — flip the switch back on to restore the exact
// $5/mo paid model.
//
//   Free build  →  NEXT_PUBLIC_BILLING_ENABLED=false
//   Paid build  →  NEXT_PUBLIC_BILLING_ENABLED=true   (or unset — paid is default)
//
// It's enforced at isPaid() on purpose: every gate (canGenerateQuiz,
// canAddChild) and every UI paywall funnels through isPaid()/isStudentPaid()/
// planFeatures(), so one switch here cleanly unlocks the whole app.
export function billingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_BILLING_ENABLED !== "false";
}

export function isPaid(plan: string | null | undefined): boolean {
  if (!billingEnabled()) return true; // free-for-all: treat everyone as unlocked
  return plan === PAID_PLAN;
}

// Append-only funnel analytics. Fire-and-forget — never blocks or throws.
export async function logPaywallEvent(userId: string | null, reason: string): Promise<void> {
  try {
    await prisma.paywallEvent.create({ data: { userId: userId ?? undefined, reason } });
  } catch {
    /* analytics must never break a request */
  }
}

// Capability matrix derived from plan (client-safe; no DB).
export type PlanFeatures = {
  paid: boolean;
  unlimitedQuizzes: boolean;
  testMode: boolean;
  leaderboard: boolean;
  fullProgress: boolean;
  multipleChildren: boolean;
};

export function planFeatures(plan: string | null | undefined): PlanFeatures {
  const paid = isPaid(plan);
  return {
    paid,
    unlimitedQuizzes: paid,
    testMode: paid,
    leaderboard: paid,
    fullProgress: paid,
    multipleChildren: paid,
  };
}

function startOfToday(now: Date = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

// The plan governing a student = their parent's plan. No parent (admin/tutor-
// managed) → treated as paid (internal, ungated).
export async function studentPlan(studentId: number): Promise<string> {
  const s = await prisma.student.findUnique({
    where: { id: studentId },
    select: { parent: { select: { plan: true } } },
  });
  return s?.parent?.plan ?? PAID_PLAN;
}

export async function isStudentPaid(studentId: number): Promise<boolean> {
  return isPaid(await studentPlan(studentId));
}

export async function getUserPlan(userId: string): Promise<string> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
  return u?.plan ?? FREE_PLAN;
}

// Quizzes the parent's children created today (free daily cap).
export async function quizzesCreatedTodayForParent(parentUserId: string, now: Date = new Date()): Promise<number> {
  return prisma.quiz.count({
    where: { student: { parentId: parentUserId }, createdAt: { gte: startOfToday(now) } },
  });
}

export type GateDecision =
  | { allowed: true }
  | { allowed: false; status: number; error: string; reason: string };

// Decision for CREATING a new quiz for a student (call after the unstarted-quiz
// reuse path, so reusing today's quiz is never blocked).
export async function canGenerateQuiz(args: {
  studentId: number;
  mode: "practice" | "test";
  isSuperadmin?: boolean;
}): Promise<GateDecision> {
  if (args.isSuperadmin) return { allowed: true };
  const s = await prisma.student.findUnique({
    where: { id: args.studentId },
    select: { parentId: true, parent: { select: { plan: true } } },
  });
  const parentId = s?.parentId;
  if (!parentId) return { allowed: true }; // internal / ungated
  if (isPaid(s?.parent?.plan)) return { allowed: true };

  // Free plan from here on.
  if (args.mode === "test") {
    return {
      allowed: false,
      status: 402,
      error: "Real Tests are a QuizSpark Plus feature. Upgrade to create timed tests.",
      reason: "paid_feature_test",
    };
  }
  const usedToday = await quizzesCreatedTodayForParent(parentId);
  if (usedToday >= FREE_DAILY_QUIZ_LIMIT) {
    return {
      allowed: false,
      status: 402,
      error: "You've used your free quiz for today. Upgrade to QuizSpark Plus for unlimited quizzes.",
      reason: "free_daily_limit",
    };
  }
  return { allowed: true };
}

// Decision for adding another child profile.
export async function canAddChild(parentUserId: string, parentPlan: string): Promise<GateDecision> {
  if (isPaid(parentPlan)) return { allowed: true };
  const count = await prisma.student.count({ where: { parentId: parentUserId } });
  if (count >= FREE_CHILD_LIMIT) {
    return {
      allowed: false,
      status: 402,
      error: "Free plan includes 1 child. Upgrade to QuizSpark Plus to add more.",
      reason: "paid_feature_children",
    };
  }
  return { allowed: true };
}
