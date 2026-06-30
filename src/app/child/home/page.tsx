import Link from "next/link";
import { resolveActiveStudent } from "@/lib/active-child";
import { prisma } from "@/lib/db";
import { loadChildHomeStats, loadResumableQuiz, loadTopicHub } from "@/lib/gamification";
import { levelTitle } from "@/lib/domain/gamification";
import { loadChildWeeklyLeaderboard, isLeaderboardEnabled } from "@/lib/leaderboard";
import { isStudentPaid } from "@/lib/plan";
import { loadPracticeDecision } from "@/lib/parental";
import { studentEmoji } from "@/lib/student-emoji";
import { parseSkillIds } from "@/lib/domain/homework";
import { BADGE_BY_CODE, BADGE_CATALOG } from "@/lib/domain/badge-catalog";
import { formatClock } from "@/lib/domain/test-mode";
import CMIcon from "@/components/CMIcon";
import StartPracticeButton from "./StartPracticeButton";
import DailyChallengeTile from "./DailyChallengeTile";
import QuickPickRow from "./QuickPickRow";
import LockScreen from "./LockScreen";

export const metadata = { title: "Home — QuizSpark" };

// Student home — the engagement hub (design bundle screens/student.jsx). The
// floating bottom tab bar lives in the child layout. Everything here is real
// data: streak/XP/badges (loadChildHomeStats), resume-in-progress + daily
// challenge + quick-pick (loadResumableQuiz/loadTopicHub), assigned homework
// and real tests, and the last completed quiz.
export default async function ChildHomePage() {
  const { student: child } = await resolveActiveStudent();

  // Access gate: a self-claimed student stays pending until approval.
  const approval = await prisma.student.findUnique({
    where: { id: child.id },
    select: { tutorApproved: true },
  });
  if (approval && !approval.tutorApproved) {
    return (
      <main className="space-y-4 py-16 text-center">
        <div className="text-5xl">⏳</div>
        <h1 className="font-display text-3xl text-amber-900">You&apos;re almost in!</h1>
        <p className="text-sm text-amber-800">
          Your account is linked to your parent. A tutor just needs to approve you before you
          can start practising.
        </p>
      </main>
    );
  }

  const decision = await loadPracticeDecision(child.id);
  if (!decision.allowed) {
    return (
      <LockScreen
        reason={decision.reason!}
        detail={decision.detail}
        windowStart={decision.windowStart}
        windowEnd={decision.windowEnd}
        childName={child.name}
      />
    );
  }

  const [stats, homework, lastQuiz, resumable, hub, activeTest] = await Promise.all([
    loadChildHomeStats(child.id),
    prisma.homeworkAssignment.findMany({
      where: { studentId: child.id, status: "active" },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { tutor: { select: { name: true } } },
    }),
    prisma.quiz.findFirst({
      where: { studentId: child.id, status: "completed" },
      orderBy: { completedAt: "desc" },
      select: { id: true, score: true },
    }),
    loadResumableQuiz(child.id),
    loadTopicHub(child.id),
    prisma.quiz.findFirst({
      where: { studentId: child.id, status: "active", mode: "test" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        timeLimitSec: true,
        questions: { select: { skill: { select: { topicGroup: { select: { name: true } } } } } },
      },
    }),
  ]);

  const xpPct = Math.min(100, Math.round((stats.currentLevelXp / stats.nextLevelXp) * 100));
  const xpToGo = Math.max(0, stats.nextLevelXp - stats.currentLevelXp);
  const emoji = studentEmoji(child.id);
  const recentBadges = stats.badges.slice(0, 4);
  // Badge progress + the next one to chase (catalog order).
  const earnedCodes = new Set(stats.badges.map((b) => b.code));
  const badgeTotal = BADGE_CATALOG.length;
  const badgeEarned = BADGE_CATALOG.filter((b) => earnedCodes.has(b.code)).length;
  const nextBadge = BADGE_CATALOG.find((b) => !earnedCodes.has(b.code)) ?? null;
  const badgePct = Math.round((badgeEarned / badgeTotal) * 100);

  // Weekly-XP leaderboard tile — QuizSpark Plus only (feature-flagged; null when
  // the child has no family/cohort with ≥2 members). Free plans see a locked tile.
  const paid = await isStudentPaid(child.id);
  const leaderboardEnabled = await isLeaderboardEnabled();
  const leaderboard = paid && leaderboardEnabled ? await loadChildWeeklyLeaderboard(child.id) : null;
  const you = leaderboard?.rows.find((r) => r.isYou) ?? null;
  const ahead = you && you.rank > 1 ? leaderboard!.rows.find((r) => r.rank === you.rank - 1) : null;
  const gapToNext = ahead ? Math.max(0, ahead.xpThisWeek - you!.xpThisWeek) : 0;

  // Dominant topic + question count for the assigned-test card.
  const testTopic = (() => {
    if (!activeTest) return null;
    const counts = new Map<string, number>();
    for (const q of activeTest.questions) {
      const n = q.skill.topicGroup.name;
      counts.set(n, (counts.get(n) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Math";
  })();

  return (
    <main className="space-y-5">
      {/* ── Header: avatar + greeting + streak ── */}
      <header className="flex items-center gap-3 pt-2">
        <div
          className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-2xl"
          style={{ border: "2px solid var(--cm-coral)" }}
        >
          {emoji}
        </div>
        <div className="flex-1">
          <div className="text-xs text-slate-500">Hi, {child.name.split(" ")[0]} 👋</div>
          <div className="text-base font-bold text-slate-900">
            Let&apos;s master Grade {child.grade} today
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1.5">
          <CMIcon name="flame" size={16} color="var(--cm-coral)" />
          <span className="text-[13px] font-extrabold text-slate-900">{stats.streak}</span>
        </div>
      </header>

      {/* ── XP card (darkened gradient + pure-white labels for WCAG AA) ── */}
      <section
        className="relative overflow-hidden rounded-[22px] px-[18px] py-4 text-white"
        style={{ background: "linear-gradient(135deg, var(--cm-blue-600) 0%, var(--kid-violet-700) 100%)" }}
      >
        <div
          className="absolute -right-5 -top-5 h-32 w-32 rounded-full"
          style={{ background: "rgba(255,255,255,.12)" }}
        />
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold text-white">
              LEVEL {stats.level} · {levelTitle(stats.level).title.toUpperCase()}
            </div>
            <div className="font-display mt-1 text-4xl leading-none">
              {stats.xp.toLocaleString()} XP
            </div>
          </div>
          <div
            className="grid h-11 w-11 place-items-center rounded-2xl"
            style={{ background: "rgba(255,255,255,.18)" }}
          >
            <CMIcon name="spark" size={22} color="#fff" />
          </div>
        </div>
        <div className="mt-3.5 flex justify-between text-xs font-medium text-white">
          <span>{xpToGo} XP to Level {stats.level + 1}</span>
          <span>{stats.currentLevelXp} / {stats.nextLevelXp}</span>
        </div>
        <div className="mt-1.5 h-2 rounded-full" style={{ background: "rgba(255,255,255,.2)" }}>
          <div className="h-full rounded-full bg-white" style={{ width: `${xpPct}%` }} />
        </div>
      </section>

      {/* ── Weekly leaderboard tile ── */}
      {leaderboard && you && (
        <section className="cm-card flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-cm-blue-50 text-2xl">{emoji}</div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">THIS WEEK</div>
              <div className="text-sm font-bold text-slate-900">
                {you.rank === 1 ? "You're #1 this week 🏆" : `You're #${you.rank} of ${leaderboard.rows.length}`}
              </div>
              <div className="text-xs text-slate-500">
                {you.xpThisWeek === 0
                  ? "No XP yet this week — finish a quiz to climb!"
                  : `${you.xpThisWeek} XP this week${ahead ? ` · ${gapToNext} XP to #${you.rank - 1}` : ""}`}
              </div>
            </div>
          </div>
          <span className="cm-pill indigo">{leaderboard.scopeLabel}</span>
        </section>
      )}

      {/* Locked leaderboard upsell (free plan) */}
      {!paid && leaderboardEnabled && (
        <section className="cm-card flex items-center justify-between p-4" style={{ opacity: 0.92 }}>
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl" style={{ background: "var(--cm-gold-soft)" }}>
              <CMIcon name="lock" size={20} color="var(--cm-gold)" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-500">WEEKLY LEADERBOARD</div>
              <div className="text-sm font-bold text-slate-900">Climb the ranks with QuizSpark Plus</div>
              <div className="text-xs text-slate-500">Ask a grown-up to unlock the leaderboard.</div>
            </div>
          </div>
          <span className="cm-pill amber">Plus</span>
        </section>
      )}

      {/* ── Resume in-progress quiz ── */}
      {resumable && (
        <Link
          href={`/child/quiz/${resumable.id}`}
          aria-label={`Resume your ${resumable.topicName} quiz, ${resumable.answered} of ${resumable.total} done`}
          className="flex items-center gap-3 rounded-[18px] border border-slate-200 bg-white p-3.5 transition-transform active:translate-y-0.5"
        >
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl" style={{ background: "var(--cm-blue-50)" }}>
            <CMIcon name="play" size={20} color="var(--cm-blue)" />
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-bold tracking-wide text-cm-blue">PICK UP WHERE YOU LEFT OFF</div>
            <div className="text-sm font-bold text-slate-900">{resumable.topicName}</div>
            <div className="mt-1 cm-bar">
              <i style={{ width: `${Math.round((resumable.answered / resumable.total) * 100)}%`, background: "var(--cm-blue)" }} />
            </div>
            <div className="mt-0.5 text-[11px] text-slate-500">{resumable.answered} of {resumable.total} answered</div>
          </div>
          <CMIcon name="chevron" size={18} color="#94A3B8" />
        </Link>
      )}

      {/* ── Big coral start button ── */}
      <StartPracticeButton studentId={child.id} hasResumable={Boolean(resumable)} />

      {/* ── Daily challenge (weakest enabled topic) ── */}
      {hub.dailyChallenge && (
        <DailyChallengeTile
          studentId={child.id}
          topicLetter={hub.dailyChallenge.letter}
          topicName={hub.dailyChallenge.name}
          mastery={hub.dailyChallenge.mastery}
        />
      )}

      {/* ── Quick pick: jump back into a topic ── */}
      <QuickPickRow studentId={child.id} topics={hub.recentTopics} />

      {/* ── Assigned real test (proctored) ── */}
      {activeTest && (
        <Link
          href={`/child/test/${activeTest.id}`}
          aria-label={`Start your ${testTopic} test`}
          className="flex items-center gap-3 rounded-[18px] border p-3.5 transition-transform active:translate-y-0.5"
          style={{ background: "var(--cm-red-soft)", borderColor: "rgba(194,95,95,.35)" }}
        >
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white" aria-hidden>
            <CMIcon name="lock" size={20} color="var(--cm-coral)" />
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-bold tracking-wide" style={{ color: "#9F1239" }}>REAL TEST · ASSIGNED</div>
            <div className="text-sm font-bold text-slate-900">{testTopic} test</div>
            <div className="text-xs text-slate-600">
              {activeTest.questions.length} questions
              {activeTest.timeLimitSec ? ` · ${formatClock(activeTest.timeLimitSec)}` : ""}
            </div>
          </div>
          <CMIcon name="chevron" size={18} color="#9F1239" />
        </Link>
      )}

      {/* ── Assigned (real homework) ── */}
      {homework.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700">ASSIGNED</h3>
            <Link href="/child/progress" className="text-xs font-semibold text-cm-blue">See all</Link>
          </div>
          <div className="grid gap-2">
            {homework.map((h) => {
              const skillCount = parseSkillIds(h.assignedSkillIds).length;
              return (
                <div key={h.id} className="cm-card flex items-center gap-3 p-3.5">
                  <div className="self-stretch rounded-full" style={{ width: 8, background: "var(--cm-blue)" }} />
                  <div className="flex-1">
                    <div className="text-[11px] font-semibold text-slate-500">
                      {h.tutor.name.toUpperCase()} · HOMEWORK
                    </div>
                    <div className="text-sm font-bold text-slate-900">{h.title}</div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {skillCount > 0 ? `${skillCount} skill${skillCount === 1 ? "" : "s"}` : "Practice set"}
                      {h.dueAt
                        ? ` · due ${new Date(h.dueAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                        : ""}
                    </div>
                  </div>
                  <CMIcon name="chevron" size={18} color="#94A3B8" />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Last quiz (real) ── */}
      {lastQuiz && typeof lastQuiz.score === "number" && (
        <Link
          href={`/child/quiz/${lastQuiz.id}/results`}
          className="cm-card flex items-center justify-between p-4 transition-transform active:translate-y-0.5"
        >
          <div>
            <div className="text-[11px] font-semibold text-slate-500">LAST QUIZ</div>
            <div className="text-sm font-bold text-slate-900">
              {Math.round(lastQuiz.score) >= 80
                ? "Nice work! 🌟"
                : Math.round(lastQuiz.score) >= 50
                  ? "Good effort 💪"
                  : "Keep going 🚀"}
            </div>
          </div>
          <div
            className="font-display text-3xl"
            style={{ color: Math.round(lastQuiz.score) >= 80 ? "var(--cm-mint)" : "var(--cm-gold)" }}
          >
            {Math.round(lastQuiz.score)}%
          </div>
        </Link>
      )}

      {/* ── Recent badges row ── */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-700">RECENT BADGES</h3>
          <Link href="/child/badges" className="text-xs font-semibold text-cm-blue">All badges</Link>
        </div>
        <div className="mb-2.5 cm-card p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">{badgeEarned} of {badgeTotal} badges</span>
            {nextBadge && (
              <span className="text-slate-500">Next: {nextBadge.icon} {nextBadge.name}</span>
            )}
          </div>
          <div className="cm-bar mt-2"><i style={{ width: `${badgePct}%`, background: "var(--cm-gold)" }} /></div>
        </div>
        {recentBadges.length === 0 ? (
          <p className="cm-card p-4 text-center text-xs text-slate-500">
            No badges yet — finish a quiz to earn your first! 🏅
          </p>
        ) : (
          <div className="flex gap-2.5">
            {recentBadges.map((b) => {
              const def = BADGE_BY_CODE.get(b.code);
              return (
                <div key={b.code} className="flex-1 text-center">
                  <div className="mb-1 grid aspect-square place-items-center rounded-2xl bg-cm-gold-soft text-2xl">
                    {def?.icon ?? b.icon}
                  </div>
                  <div className="text-[10px] font-semibold leading-tight text-slate-700">{def?.name ?? b.name}</div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
