import { prisma } from "@/lib/db";
import { sendEmail, buildAppUrl } from "@/lib/email";

// ---------------------------------------------------------------------------
// Pure decision helpers (unit-tested in isolation — no DB, no mail).
// ---------------------------------------------------------------------------

export function isLowScore(
  score: number,
  threshold: number | null | undefined,
): boolean {
  return typeof threshold === "number" && score < threshold;
}

export function isInactive(
  lastCompletedAt: Date | null,
  days: number | null | undefined,
  now: Date,
): boolean {
  if (typeof days !== "number" || days <= 0) return false;
  if (!lastCompletedAt) return true; // never practised → inactive
  const elapsedDays = (now.getTime() - lastCompletedAt.getTime()) / 86_400_000;
  return elapsedDays >= days;
}

export function isDigestDue(lastDigestAt: Date | null, now: Date): boolean {
  if (!lastDigestAt) return true;
  const elapsedDays = (now.getTime() - lastDigestAt.getTime()) / 86_400_000;
  return elapsedDays >= 7;
}

// ISO-8601 week key, e.g. "2026-W21". Used to dedupe weekly digests.
export function isoWeekKey(d: Date): string {
  // All-UTC so the key never depends on the server's timezone.
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Global kill switch — "sending emails should be a configurable option".
// Cached briefly like the maintenance flag.
// ---------------------------------------------------------------------------

let flagCache: { value: boolean; expiresAt: number } | null = null;

export async function emailNotificationsEnabled(): Promise<boolean> {
  const now = Date.now();
  if (flagCache && flagCache.expiresAt > now) return flagCache.value;
  const flag = await prisma.featureFlag.findUnique({
    where: { key: "email_notifications" },
  });
  // Default ON when the flag row is absent.
  const value = flag ? Boolean(flag.enabled) : true;
  flagCache = { value, expiresAt: now + 5_000 };
  return value;
}

export function clearEmailFlagCache(): void {
  flagCache = null;
}

// Send once per (user, type, ref). Returns true if the mail was sent, false
// if it was a duplicate or email is globally disabled. Never throws.
async function sendOnce(args: {
  userId: string;
  to: string;
  type: string;
  refKey: string;
  subject: string;
  text: string;
}): Promise<boolean> {
  try {
    if (!(await emailNotificationsEnabled())) return false;
    await prisma.notificationLog.create({
      data: { userId: args.userId, type: args.type, refKey: args.refKey },
    });
  } catch {
    // Unique-constraint violation → already sent this one. Anything else we
    // also treat as "skip" so we never double-send or crash the caller.
    return false;
  }
  await sendEmail({ to: args.to, subject: args.subject, text: args.text });
  return true;
}

// ---------------------------------------------------------------------------
// Lifecycle emails — all best-effort: caught + logged, never thrown.
// Welcome / assignment notices dedupe via NotificationLog. Security notices
// (password change, email change, suspend, unsuspend) do NOT dedupe — they
// must fire every time so the user can react to a real breach.
// ---------------------------------------------------------------------------

// Welcome — fired once per user, ever. Used by both the verify-email flow
// (organic signup) and admin-provisioned account creation. `loginNote` lets
// the admin path include "your password has been set by an admin" framing
// without forking the function.
export async function notifyWelcome(args: {
  userId: string;
  to: string;
  name: string;
  role: string; // 'parent' | 'tutor' | 'student' | 'orgadmin' | 'superadmin'
  loginNote?: string;
}): Promise<void> {
  try {
    const loginUrl = buildAppUrl("/auth/login");
    const niceRole = roleLabel(args.role);
    const text =
      `Hi ${args.name},\n\n` +
      `Welcome to IXL Quiz! Your ${niceRole} account is ready to use.\n\n` +
      (args.loginNote ? `${args.loginNote}\n\n` : "") +
      `Log in here: ${loginUrl}\n\n` +
      `If this wasn't you, reply to this email and we'll sort it out.`;
    await sendOnce({
      userId: args.userId,
      to: args.to,
      type: "welcome",
      refKey: "once", // one welcome per user, ever
      subject: `Welcome to IXL Quiz, ${args.name}!`,
      text,
    });
  } catch (err) {
    console.error("[notifications] notifyWelcome failed", err);
  }
}

// Tutor assignment — fires both directions when an admin links/unlinks a
// tutor to a student. Dedup key includes the date bucket so re-linking the
// same pair on a different day still notifies (rare in practice but useful
// if the admin briefly swapped tutors).
export async function notifyTutorAssigned(args: {
  studentId: number;
}): Promise<void> {
  try {
    const student = await prisma.student.findUnique({
      where: { id: args.studentId },
      include: {
        parent: { select: { id: true, email: true, name: true } },
        tutorAssignments: {
          include: { tutor: { select: { id: true, email: true, name: true } } },
        },
      },
    });
    if (!student) return;
    const bucket = new Date().toISOString().slice(0, 10);

    for (const a of student.tutorAssignments) {
      if (!a.tutor?.email) continue;
      const dashboardUrl = buildAppUrl(`/tutor/student/${student.id}`);
      await sendOnce({
        userId: a.tutor.id,
        to: a.tutor.email,
        type: "assigned_as_tutor",
        refKey: `${student.id}-${bucket}`,
        subject: `New student assigned: ${student.name}`,
        text:
          `You've been assigned as the tutor for ${student.name} (Grade ${student.grade}).\n\n` +
          `Open their dashboard: ${dashboardUrl}\n\n` +
          `You'll get an email each time they finish a quiz.`,
      });
      // Notify the parent that their child now has a tutor.
      if (student.parent?.email) {
        await sendOnce({
          userId: student.parent.id,
          to: student.parent.email,
          type: "child_tutor_assigned",
          refKey: `${student.id}-${a.tutor.id}-${bucket}`,
          subject: `${student.name} now has a tutor`,
          text:
            `${student.name} has been assigned to ${a.tutor.name} as their tutor.\n\n` +
            `View ${student.name}'s page: ${buildAppUrl(`/parent/child/${student.id}`)}`,
        });
      }
    }
  } catch (err) {
    console.error("[notifications] notifyTutorAssigned failed", err);
  }
}

// Security notice — always sends if the flag is on; never dedupes. Used for
// suspend/unsuspend/password-change/email-change so the user can react to
// account takeover or admin action without us swallowing the second alert.
export async function notifySecurity(args: {
  to: string;
  subject: string;
  text: string;
}): Promise<void> {
  try {
    if (!(await emailNotificationsEnabled())) return;
    await sendEmail({ to: args.to, subject: args.subject, text: args.text });
  } catch (err) {
    console.error("[notifications] notifySecurity failed", err);
  }
}

export async function notifyAccountSuspended(args: {
  to: string;
  name: string;
  reason?: string;
}): Promise<void> {
  await notifySecurity({
    to: args.to,
    subject: "Your IXL Quiz account has been suspended",
    text:
      `Hi ${args.name},\n\n` +
      `Your IXL Quiz account has been suspended by an administrator.\n` +
      (args.reason ? `Reason: ${args.reason}\n` : "") +
      `You will not be able to log in until an admin reinstates it.\n\n` +
      `If you believe this is a mistake, reply to this email.`,
  });
}

export async function notifyAccountReinstated(args: {
  to: string;
  name: string;
}): Promise<void> {
  await notifySecurity({
    to: args.to,
    subject: "Your IXL Quiz account has been reinstated",
    text:
      `Hi ${args.name},\n\n` +
      `Your IXL Quiz account is active again. Log in: ${buildAppUrl("/auth/login")}`,
  });
}

export async function notifyPasswordChanged(args: {
  to: string;
  name: string;
}): Promise<void> {
  await notifySecurity({
    to: args.to,
    subject: "Your IXL Quiz password was changed",
    text:
      `Hi ${args.name},\n\n` +
      `Your password was just changed. If this was you, you can ignore this email.\n\n` +
      `If it wasn't you, reset your password right away: ${buildAppUrl("/auth/forgot-password")}`,
  });
}

// Sent to the OLD email when a user changes their email — that address is
// the only one a thief who already changed it wouldn't control. The new
// address still gets a verification link separately.
export async function notifyEmailChanged(args: {
  oldEmail: string;
  newEmail: string;
  name: string;
}): Promise<void> {
  await notifySecurity({
    to: args.oldEmail,
    subject: "Your IXL Quiz login email was changed",
    text:
      `Hi ${args.name},\n\n` +
      `The login email on your IXL Quiz account was changed from ${args.oldEmail} to ${args.newEmail}.\n\n` +
      `If this wasn't you, reply to this email immediately — we can restore access.`,
  });
}

function roleLabel(role: string): string {
  switch (role) {
    case "parent": return "parent";
    case "tutor": return "tutor";
    case "student": return "student";
    case "orgadmin": return "organization admin";
    case "superadmin": return "super admin";
    default: return role;
  }
}

// ---------------------------------------------------------------------------
// Quiz completion — student + assigned tutor(s) always; parent if opted in;
// plus a parent low-score alert. Best-effort: logs, never throws.
// ---------------------------------------------------------------------------

export async function notifyQuizCompleted(quizId: number): Promise<void> {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        student: {
          include: {
            account: { select: { id: true, email: true, name: true } },
            parent: {
              select: {
                id: true,
                email: true,
                name: true,
                notificationSettings: true,
              },
            },
            tutorAssignments: {
              include: { tutor: { select: { id: true, email: true, name: true } } },
            },
          },
        },
      },
    });
    if (!quiz || quiz.status !== "completed") return;

    const score = Math.round(quiz.score ?? 0);
    const studentName = quiz.student.name;
    const resultsUrl = buildAppUrl(`/quiz/${quiz.id}/results`);
    const ref = String(quiz.id);

    // Student (own account).
    if (quiz.student.account?.email) {
      await sendOnce({
        userId: quiz.student.account.id,
        to: quiz.student.account.email,
        type: "quiz_completed",
        refKey: ref,
        subject: `You finished Quiz #${quiz.id} — ${score}%`,
        text: `Great work, ${studentName}! You scored ${score}% on Quiz #${quiz.id}.\n\nSee your results: ${resultsUrl}`,
      });
    }

    // Assigned tutor(s) — always notified on completion.
    for (const a of quiz.student.tutorAssignments) {
      if (!a.tutor?.email) continue;
      await sendOnce({
        userId: a.tutor.id,
        to: a.tutor.email,
        type: "quiz_completed",
        refKey: ref,
        subject: `${studentName} finished Quiz #${quiz.id} — ${score}%`,
        text: `Your student ${studentName} completed Quiz #${quiz.id} with a score of ${score}%.\n\nReview: ${resultsUrl}`,
      });
    }

    // Parent — only if opted in to every-quiz emails.
    const parent = quiz.student.parent;
    if (parent?.email && parent.notificationSettings?.emailEveryQuiz) {
      await sendOnce({
        userId: parent.id,
        to: parent.email,
        type: "quiz_completed",
        refKey: ref,
        subject: `${studentName} finished Quiz #${quiz.id} — ${score}%`,
        text: `${studentName} completed Quiz #${quiz.id} with a score of ${score}%.\n\nView results: ${resultsUrl}`,
      });
    }

    // Parent low-score alert (separate from the every-quiz email).
    if (
      parent?.email &&
      isLowScore(score, parent.notificationSettings?.alertBelowScorePct)
    ) {
      await sendOnce({
        userId: parent.id,
        to: parent.email,
        type: "low_score",
        refKey: ref,
        subject: `Heads up: ${studentName} scored ${score}% on Quiz #${quiz.id}`,
        text: `${studentName} scored ${score}% on Quiz #${quiz.id}, which is below your alert threshold.\n\nA little extra practice might help. Results: ${resultsUrl}`,
      });
    }
  } catch (err) {
    console.error("[notifications] notifyQuizCompleted failed", err);
  }
}

// ---------------------------------------------------------------------------
// Scheduled run — weekly digests + inactivity alerts for parents. Idempotent
// via NotificationLog. Returns a small summary for the caller/route.
// ---------------------------------------------------------------------------

export async function runScheduledNotifications(
  now: Date = new Date(),
): Promise<{ digests: number; inactivity: number; tutorDigests: number }> {
  let digests = 0;
  let inactivity = 0;
  let tutorDigests = 0;
  if (!(await emailNotificationsEnabled())) return { digests, inactivity, tutorDigests };

  const parents = await prisma.user.findMany({
    where: { role: "parent", deletedAt: null, notificationSettings: { isNot: null } },
    include: {
      notificationSettings: true,
      students: {
        include: {
          quizzes: {
            where: { status: "completed" },
            orderBy: { completedAt: "desc" },
          },
        },
      },
    },
  });

  const weekRef = isoWeekKey(now);
  const since = new Date(now.getTime() - 7 * 86_400_000);

  for (const p of parents) {
    const s = p.notificationSettings;
    if (!s || !p.email || p.students.length === 0) continue;

    if (s.weeklyDigest) {
      const lines = p.students.map((stu) => {
        const wk = stu.quizzes.filter(
          (q) => q.completedAt && q.completedAt >= since,
        );
        const avg = wk.length
          ? Math.round(wk.reduce((a, q) => a + (q.score ?? 0), 0) / wk.length)
          : null;
        return `• ${stu.name}: ${wk.length} quiz(zes) this week${
          avg !== null ? `, avg ${avg}%` : ""
        }`;
      });
      const sent = await sendOnce({
        userId: p.id,
        to: p.email,
        type: "weekly_digest",
        refKey: weekRef,
        subject: "Your weekly practice digest",
        text: `Here's how your ${p.students.length === 1 ? "child" : "children"} did this week:\n\n${lines.join("\n")}\n\n${buildAppUrl("/parent/dashboard")}`,
      });
      if (sent) digests++;
    }

    if (typeof s.alertNoPracticeDays === "number") {
      for (const stu of p.students) {
        const last = stu.quizzes[0]?.completedAt ?? null;
        if (isInactive(last, s.alertNoPracticeDays, now)) {
          const dayBucket = now.toISOString().slice(0, 10);
          const sent = await sendOnce({
            userId: p.id,
            to: p.email,
            type: "inactivity",
            refKey: `${stu.id}-${dayBucket}`,
            subject: `${stu.name} hasn't practised recently`,
            text: `${stu.name} hasn't completed a quiz in at least ${s.alertNoPracticeDays} day(s). A short session keeps the streak alive!\n\n${buildAppUrl("/parent/dashboard")}`,
          });
          if (sent) inactivity++;
        }
      }
    }
  }

  // ---------- Tutor weekly digest ----------
  // Tutors get a once-per-week summary of how their assigned students did.
  // Same dedupe key (isoWeekKey) so a tutor doesn't get two digests in one
  // week even if cron fires twice. Uses tutor's own NotificationSettings
  // (weeklyDigest) when present; otherwise defaults to ON.
  const tutors = await prisma.user.findMany({
    where: { role: "tutor", deletedAt: null, suspendedAt: null },
    include: {
      notificationSettings: true,
      tutorAssignments: {
        include: {
          student: {
            include: {
              quizzes: {
                where: { status: "completed" },
                orderBy: { completedAt: "desc" },
              },
            },
          },
        },
      },
    },
  });
  for (const t of tutors) {
    if (!t.email || t.tutorAssignments.length === 0) continue;
    const wantsDigest = t.notificationSettings?.weeklyDigest ?? true;
    if (!wantsDigest) continue;
    const lines = t.tutorAssignments.map(({ student }) => {
      const wk = student.quizzes.filter(
        (q) => q.completedAt && q.completedAt >= since,
      );
      const avg = wk.length
        ? Math.round(wk.reduce((a, q) => a + (q.score ?? 0), 0) / wk.length)
        : null;
      return `• ${student.name} (G${student.grade}): ${wk.length} quiz(zes) this week${
        avg !== null ? `, avg ${avg}%` : ""
      }`;
    });
    const sent = await sendOnce({
      userId: t.id,
      to: t.email,
      type: "tutor_weekly_digest",
      refKey: weekRef,
      subject: "Your tutor digest — this week's cohort",
      text:
        `Here's how your ${t.tutorAssignments.length === 1 ? "student" : "students"} did this week:\n\n` +
        `${lines.join("\n")}\n\n` +
        `Open your cohort: ${buildAppUrl("/tutor/dashboard")}`,
    });
    if (sent) tutorDigests++;
  }

  return { digests, inactivity, tutorDigests };
}
