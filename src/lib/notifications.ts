import { prisma } from "@/lib/db";
import { sendEmail, buildAppUrl } from "@/lib/email";
import { renderEmail, type EmailPayload } from "@/lib/emailTemplate";
import { streakAtRisk, calculateStreak } from "@/lib/domain/gamification";
import { sendPushToUser } from "@/lib/push";

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

// Send once per (user, type, ref) from a structured EmailPayload. Returns
// true if the mail was sent, false if it was a duplicate or email is
// globally disabled. Never throws. Renders both HTML and text from the
// same payload so they always stay in sync — clients that block HTML
// still get the readable text part.
async function sendOnce(args: {
  userId: string;
  to: string;
  type: string;
  refKey: string;
  subject: string;
  payload: EmailPayload;
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
  const { html, text } = renderEmail(args.payload);
  await sendEmail({ to: args.to, subject: args.subject, text, html });
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
    const body: string[] = [
      `Aloha ${args.name},`,
      `Welcome to QuizSpark! Your ${niceRole} account is ready to use.`,
    ];
    if (args.loginNote) body.push(args.loginNote);
    await sendOnce({
      userId: args.userId,
      to: args.to,
      type: "welcome",
      refKey: "once", // one welcome per user, ever
      subject: `Welcome to QuizSpark, ${args.name}!`,
      payload: {
        preheader: `Your ${niceRole} account is ready — log in to get started.`,
        heading: `Aloha, ${args.name}! 🌺`,
        body,
        cta: { label: "Log in", url: loginUrl },
        footnote: "If this wasn't you, reply to this email and we'll sort it out.",
      },
    });
  } catch (err) {
    console.error("[notifications] notifyWelcome failed", err);
  }
}

// QuizSpark Plus welcome — fired when a parent's first payment lands. Deduped per
// subscription (refKey = subscription id) so a re-subscribe after a lapse
// welcomes again, but a renewal of the same subscription does not.
export async function notifyPlusWelcome(args: {
  userId: string;
  to: string;
  name: string;
  refKey: string;
}): Promise<void> {
  try {
    const dashUrl = buildAppUrl("/parent/dashboard");
    await sendOnce({
      userId: args.userId,
      to: args.to,
      type: "plus_welcome",
      refKey: args.refKey,
      subject: `Welcome to QuizSpark Plus, ${args.name}! 🎉`,
      payload: {
        preheader: "Your upgrade is live — here's everything you just unlocked.",
        heading: `You're on QuizSpark Plus, ${args.name}! 🌟`,
        body: [
          "Thank you for upgrading — your payment went through and your whole family now has the full QuizSpark experience.",
          "Here's everything that's now unlocked:",
        ],
        items: [
          "Unlimited quizzes — the daily limit is gone",
          "Real Tests — timed, proctored, answers revealed only at the end",
          "The weekly leaderboard for some friendly family competition",
          "Full progress charts, topic mastery & complete quiz history",
          "Add as many children as you like",
        ],
        cta: { label: "Open QuizSpark", url: dashUrl },
        footnote: "Manage or cancel anytime under QuizSpark Plus in your dashboard. Questions? Just reply to this email.",
      },
    });
  } catch (err) {
    console.error("[notifications] notifyPlusWelcome failed", err);
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
        payload: {
          preheader: `${student.name} (Grade ${student.grade}) is now on your roster.`,
          heading: `New student assigned: ${student.name}`,
          body: [
            `You've been assigned as the tutor for ${student.name} (Grade ${student.grade}).`,
            `You'll get an email each time they finish a quiz.`,
          ],
          cta: { label: "Open their dashboard", url: dashboardUrl },
        },
      });
      // Notify the parent that their child now has a tutor.
      if (student.parent?.email) {
        await sendOnce({
          userId: student.parent.id,
          to: student.parent.email,
          type: "child_tutor_assigned",
          refKey: `${student.id}-${a.tutor.id}-${bucket}`,
          subject: `${student.name} now has a tutor`,
          payload: {
            preheader: `${a.tutor.name} is ${student.name}'s tutor.`,
            heading: `${student.name} now has a tutor`,
            body: `${student.name} has been assigned to ${a.tutor.name} as their tutor.`,
            cta: {
              label: `View ${student.name}'s page`,
              url: buildAppUrl(`/parent/child/${student.id}`),
            },
          },
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
  payload: EmailPayload;
}): Promise<void> {
  try {
    if (!(await emailNotificationsEnabled())) return;
    const { html, text } = renderEmail(args.payload);
    await sendEmail({ to: args.to, subject: args.subject, text, html });
  } catch (err) {
    console.error("[notifications] notifySecurity failed", err);
  }
}

export async function notifyAccountSuspended(args: {
  to: string;
  name: string;
  reason?: string;
}): Promise<void> {
  const body: string[] = [
    `Aloha ${args.name},`,
    `Your QuizSpark account has been suspended by an administrator.`,
  ];
  if (args.reason) body.push(`Reason: ${args.reason}`);
  body.push("You will not be able to log in until an admin reinstates it.");
  await notifySecurity({
    to: args.to,
    subject: "Your QuizSpark account has been suspended",
    payload: {
      preheader: "Your account is temporarily locked.",
      heading: "Your account has been suspended",
      body,
      footnote: "If you believe this is a mistake, reply to this email.",
    },
  });
}

export async function notifyAccountReinstated(args: {
  to: string;
  name: string;
}): Promise<void> {
  await notifySecurity({
    to: args.to,
    subject: "Your QuizSpark account has been reinstated",
    payload: {
      preheader: "Your account is active again.",
      heading: "Your account has been reinstated",
      body: [
        `Aloha ${args.name},`,
        `Your QuizSpark account is active again — you can log in as before.`,
      ],
      cta: { label: "Log in", url: buildAppUrl("/auth/login") },
    },
  });
}

export async function notifyPasswordChanged(args: {
  to: string;
  name: string;
}): Promise<void> {
  await notifySecurity({
    to: args.to,
    subject: "Your QuizSpark password was changed",
    payload: {
      preheader: "If this wasn't you, reset your password now.",
      heading: "Your password was changed",
      body: [
        `Aloha ${args.name},`,
        `Your password was just changed. If this was you, you can safely ignore this email.`,
        `If it wasn't you, reset your password right away using the button below.`,
      ],
      cta: {
        label: "Reset password",
        url: buildAppUrl("/auth/forgot-password"),
      },
    },
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
    subject: "Your QuizSpark login email was changed",
    payload: {
      preheader: `Login email changed to ${args.newEmail}.`,
      heading: "Your login email was changed",
      body: [
        `Aloha ${args.name},`,
        `The login email on your QuizSpark account was changed from ${args.oldEmail} to ${args.newEmail}.`,
      ],
      footnote:
        "If this wasn't you, reply to this email immediately — we can restore access.",
    },
  });
}

// Profile-lock PIN — emailed to the parent when they set or resend it. Never
// deduped (a resend must always deliver). The PIN is in clear here because it
// goes to the parent's inbox, not the shared device.
export async function notifyProfilePin(args: {
  to: string;
  name: string;
  pin: string;
}): Promise<void> {
  await notifySecurity({
    to: args.to,
    subject: "Your QuizSpark profile PIN",
    payload: {
      preheader: "Use this PIN to switch profiles or return to the parent app.",
      heading: "Your profile lock PIN",
      body: [
        `Aloha ${args.name},`,
        `Here's your QuizSpark profile-lock PIN. Enter it to switch a child's profile or return to the parent app on a shared device.`,
      ],
      items: [`PIN: ${args.pin}`],
      footnote:
        "Keep this private — anyone with the PIN can leave a child's profile. You can change or remove it anytime in your account settings.",
    },
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
        payload: {
          preheader: `You scored ${score}% on Quiz #${quiz.id}.`,
          heading: `Nice work, ${studentName}!`,
          body: `You scored ${score}% on Quiz #${quiz.id}. Tap below to see every question and the explanations.`,
          cta: { label: "See your results", url: resultsUrl },
        },
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
        payload: {
          preheader: `${studentName} scored ${score}% on Quiz #${quiz.id}.`,
          heading: `${studentName} finished a quiz`,
          body: `Your student ${studentName} completed Quiz #${quiz.id} with a score of ${score}%.`,
          cta: { label: "Review the quiz", url: resultsUrl },
        },
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
        payload: {
          preheader: `${studentName} scored ${score}% on Quiz #${quiz.id}.`,
          heading: `${studentName} finished a quiz`,
          body: `${studentName} completed Quiz #${quiz.id} with a score of ${score}%.`,
          cta: { label: "View results", url: resultsUrl },
        },
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
        payload: {
          preheader: `Below your alert threshold — a short follow-up could help.`,
          heading: `Heads up about ${studentName}`,
          body: [
            `${studentName} scored ${score}% on Quiz #${quiz.id}, which is below your alert threshold.`,
            `A little extra practice on the weak topics might help.`,
          ],
          cta: { label: "View results", url: resultsUrl },
        },
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
): Promise<{ digests: number; inactivity: number; streaks: number; tutorDigests: number }> {
  let digests = 0;
  let inactivity = 0;
  let streaks = 0;
  let tutorDigests = 0;
  if (!(await emailNotificationsEnabled())) return { digests, inactivity, streaks, tutorDigests };

  // Streaks shorter than this aren't worth a nudge. Tunable via env; default 1
  // (any live streak that breaks at midnight tonight earns one reminder).
  const streakMinDays = (() => {
    const n = parseInt(process.env.STREAK_REMINDER_MIN_DAYS ?? "", 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  })();

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
      const items = p.students.map((stu) => {
        const wk = stu.quizzes.filter(
          (q) => q.completedAt && q.completedAt >= since,
        );
        const avg = wk.length
          ? Math.round(wk.reduce((a, q) => a + (q.score ?? 0), 0) / wk.length)
          : null;
        const streak = calculateStreak(
          stu.quizzes.map((q) => q.completedAt).filter((d): d is Date => d != null),
          now,
        );
        if (wk.length === 0) {
          return `${stu.name}: no practice this week — a quick session keeps the habit going.`;
        }
        const streakBit = streak > 0 ? ` · 🔥 ${streak}-day streak` : "";
        return `${stu.name}: ${wk.length} quiz${wk.length === 1 ? "" : "zes"} this week${
          avg !== null ? `, avg ${avg}%` : ""
        }${streakBit}`;
      });
      const noun = p.students.length === 1 ? "child" : "children";
      const sent = await sendOnce({
        userId: p.id,
        to: p.email,
        type: "weekly_digest",
        refKey: weekRef,
        subject: "Your weekly practice digest",
        payload: {
          preheader: `This week's snapshot for your ${noun}.`,
          heading: "Your weekly practice digest",
          body: `Here's how your ${noun} did this week:`,
          items,
          cta: { label: "Open your dashboard", url: buildAppUrl("/parent/dashboard") },
        },
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
            payload: {
              preheader: `${stu.name} hasn't completed a quiz in ${s.alertNoPracticeDays}+ days.`,
              heading: `${stu.name} hasn't practised recently`,
              body: `${stu.name} hasn't completed a quiz in at least ${s.alertNoPracticeDays} day(s). A short session keeps the streak alive!`,
              cta: { label: "Open your dashboard", url: buildAppUrl("/parent/dashboard") },
            },
          });
          if (sent) inactivity++;
        }
      }
    }

    // Streak-risk reminder — the student has a live streak they haven't extended
    // today, so it breaks at midnight unless they practise. One nudge per child
    // per day. Opt-out via NotificationSettings.streakReminder.
    if (s.streakReminder) {
      for (const stu of p.students) {
        const dates = stu.quizzes
          .map((q) => q.completedAt)
          .filter((d): d is Date => d != null);
        const atRisk = streakAtRisk(dates, now, streakMinDays);
        if (atRisk > 0) {
          const dayBucket = now.toISOString().slice(0, 10);
          const sent = await sendOnce({
            userId: p.id,
            to: p.email,
            type: "streak_reminder",
            refKey: `${stu.id}-${dayBucket}`,
            subject: `🔥 Keep ${stu.name}'s ${atRisk}-day streak alive`,
            payload: {
              preheader: `${stu.name} hasn't practised yet today — one quiz keeps the ${atRisk}-day streak going.`,
              heading: `Don't break the streak, ${stu.name}! 🔥`,
              body: [
                `${stu.name} is on a ${atRisk}-day practice streak — but it ends at midnight unless they finish a quiz today.`,
                `Just one quick session keeps it going.`,
              ],
              cta: { label: "Practise now", url: buildAppUrl("/parent/dashboard") },
              footnote: "You can turn streak reminders off anytime in your notification settings.",
            },
          });
          if (sent) {
            streaks++;
            void sendPushToUser(p.id, {
              title: `🔥 Keep ${stu.name}'s ${atRisk}-day streak`,
              body: `${stu.name} hasn't practised yet today — one quiz keeps it going.`,
              url: "/parent/dashboard",
            });
          }
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
    const items = t.tutorAssignments.map(({ student }) => {
      const wk = student.quizzes.filter(
        (q) => q.completedAt && q.completedAt >= since,
      );
      const avg = wk.length
        ? Math.round(wk.reduce((a, q) => a + (q.score ?? 0), 0) / wk.length)
        : null;
      return `${student.name} (G${student.grade}): ${wk.length} quiz(zes) this week${
        avg !== null ? `, avg ${avg}%` : ""
      }`;
    });
    const noun = t.tutorAssignments.length === 1 ? "student" : "students";
    const sent = await sendOnce({
      userId: t.id,
      to: t.email,
      type: "tutor_weekly_digest",
      refKey: weekRef,
      subject: "Your tutor digest — this week's cohort",
      payload: {
        preheader: `This week's snapshot for your cohort.`,
        heading: "This week's cohort snapshot",
        body: `Here's how your ${noun} did this week:`,
        items,
        cta: { label: "Open your cohort", url: buildAppUrl("/tutor/dashboard") },
      },
    });
    if (sent) tutorDigests++;
  }

  return { digests, inactivity, streaks, tutorDigests };
}
