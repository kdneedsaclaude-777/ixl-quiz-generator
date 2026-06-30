import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireParentSession } from "@/lib/auth/server";
import { studentEmoji } from "@/lib/student-emoji";
import { calculateStreak, xpToLevel, levelTitle, LEVEL_TIER_PILL } from "@/lib/domain/gamification";
import Spark from "@/components/Spark";
import CMIcon from "@/components/CMIcon";
import GenerateQuizButton from "@/app/dashboard/GenerateQuizButton";
import EditTopics, { type TopicGroup } from "@/app/dashboard/EditTopics";
import ParentalControlsForm from "./ParentalControlsForm";
import QuizHistory from "./QuizHistory";
import { parseLockedTopicGroupIds } from "@/lib/domain/parental-controls";
import TutorActivityPanel from "@/components/student/TutorActivityPanel";
import InviteStudent from "@/components/parent/InviteStudent";
import ApproveStudentButton from "@/components/tutor/ApproveStudentButton";

export default async function ChildDetailPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const parent = await requireParentSession();
  const { childId: childIdParam } = await params;
  const childId = parseInt(childIdParam, 10);
  if (!Number.isFinite(childId)) notFound();

  const student = await prisma.student.findUnique({
    where: { id: childId },
    include: {
      topicSelections: { include: { topicGroup: true } },
      quizzes: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          questions: {
            include: {
              skill: { include: { topicGroup: true } },
              attempts: { take: 1, select: { id: true } },
            },
          },
        },
      },
      conceptMastery: { include: { skill: { include: { topicGroup: true } } } },
      parentalSettings: true,
    },
  });
  if (!student) notFound();
  if (student.parentId !== parent.userId && parent.role !== "superadmin") notFound();

  const allGroupsForGrade: TopicGroup[] = await prisma.topicGroup.findMany({
    where: { gradeLevel: student.grade, active: true },
    orderBy: { letter: "asc" },
    select: { id: true, letter: true, name: true },
  });

  // ── Real KPI math ─────────────────────────────────────────────────────
  const completed = student.quizzes
    .filter((q) => q.status === "completed" && typeof q.score === "number" && q.completedAt)
    .sort((a, b) => a.completedAt!.getTime() - b.completedAt!.getTime());
  const last10 = completed.slice(-10);
  const sparkScores = last10.map((q) => Math.round(q.score as number));
  // Most recent completed quiz score (shown instead of the running average).
  const lastScore = completed.length
    ? Math.round(completed[completed.length - 1].score as number)
    : null;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);
  const quizzesThisWeek = completed.filter((q) => q.completedAt! >= weekAgo).length;

  const streak = calculateStreak(completed.map((q) => q.completedAt as Date), new Date());

  // Mastered = a practised skill at ≥80% over ≥3 attempts. Denominator = all
  // skills in the grade's active topic groups.
  const masteredCount = student.conceptMastery.filter(
    (m) => m.totalAttempts >= 3 && m.totalCorrect / m.totalAttempts >= 0.8,
  ).length;
  const totalSkills = await prisma.skill.count({
    where: { topicGroup: { gradeLevel: student.grade, active: true }, active: true },
  });

  const level = xpToLevel(student.xp).level;
  const rank = levelTitle(level);

  // ── Weak topics (lowest-accuracy practised skills) ────────────────────
  const weak = student.conceptMastery
    .filter((m) => m.totalAttempts >= 1)
    .map((m) => ({
      code: m.skill.code,
      name: m.skill.name,
      pct: Math.round((m.totalCorrect / m.totalAttempts) * 100),
      flag: m.remediationFlag,
    }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 4);

  // ── Quiz history (compact rows, design-matched) ───────────────────────
  const fmtDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const diffLabel = (d: number) => (d <= 2 ? "Easy" : d <= 4 ? "Medium" : "Hard");
  const historyView = student.quizzes.slice(0, 40).map((q) => {
    // Title from the dominant topic group across the quiz's questions.
    const counts = new Map<string, number>();
    for (const qq of q.questions) {
      const n = qq.skill.topicGroup.name;
      counts.set(n, (counts.get(n) ?? 0) + 1);
    }
    const topTopic = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    return {
      id: q.id,
      date: fmtDate(q.completedAt ?? q.createdAt),
      topic: topTopic ?? "Practice",
      title: topTopic ? `${topTopic} quiz` : "Practice quiz",
      questionCount: q.questions.length,
      difficultyLabel: diffLabel(q.difficulty),
      status: q.status,
      score: typeof q.score === "number" ? Math.round(q.score) : null,
    };
  });

  const lockedTopicGroupIds = parseLockedTopicGroupIds(student.parentalSettings?.lockedTopicGroupIds);
  const parentalSettings = {
    maxQuizzesPerDay: student.parentalSettings?.maxQuizzesPerDay ?? null,
    windowStart: student.parentalSettings?.windowStart ?? "",
    windowEnd: student.parentalSettings?.windowEnd ?? "",
    lockedTopicGroupIds,
  };

  const kpis = [
    { l: "Last quiz score", v: lastScore === null ? "—" : `${lastScore}%`, c: "var(--cm-mint)" },
    { l: "Quizzes this week", v: String(quizzesThisWeek), c: "var(--cm-blue)" },
    { l: "Current streak", v: streak === 1 ? "1 day" : `${streak} days`, c: "var(--cm-coral)" },
    { l: "Skills mastered", v: `${masteredCount} / ${totalSkills}`, c: "var(--cm-gold)" },
  ];

  return (
    <div className="space-y-4">
      {/* breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px] text-slate-500">
        <Link href="/parent/children" className="hover:text-slate-700">Children</Link>
        <CMIcon name="chevron" size={14} color="var(--slate-400)" />
        <span className="font-semibold text-slate-900">{student.name}</span>
      </div>

      {/* header */}
      <div className="flex flex-wrap items-center gap-4">
        <div
          className="grid h-[72px] w-[72px] place-items-center rounded-[22px] bg-white text-[40px]"
          style={{ border: "2px solid var(--cm-coral)" }}
        >
          {studentEmoji(student.id)}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[34px] leading-none text-slate-900">{student.name}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px] text-slate-500">
            <span>Grade {student.grade}</span>
            <span aria-hidden>·</span>
            <span className={`cm-pill ${LEVEL_TIER_PILL[rank.tier]}`} style={{ height: 20, fontSize: 11 }}>
              Lv {level} · {rank.title}
            </span>
            <span aria-hidden>·</span>
            <span>Difficulty: {student.currentDifficulty <= 2 ? "Easy" : student.currentDifficulty <= 4 ? "Medium" : "Hard"}</span>
            <span aria-hidden>·</span>
            <span>{student.topicSelections.length} topic group{student.topicSelections.length === 1 ? "" : "s"}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/parent/child/${student.id}/quiz/new`} className="cm-btn ghost">
            Build a quiz
          </Link>
          <GenerateQuizButton studentId={student.id} />
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <div key={i} className="cm-card p-4">
            <div className="text-xs font-semibold text-slate-500">{k.l}</div>
            <div className="font-display mt-1 text-[30px] leading-none" style={{ color: k.c }}>{k.v}</div>
          </div>
        ))}
      </div>

      {/* trend + weak topics */}
      <div className="grid gap-3.5 lg:grid-cols-[1.6fr_1fr]">
        <div className="cm-card p-[18px]">
          <h3 className="text-[15px] font-bold text-slate-900">Score trend · last {last10.length} quiz{last10.length === 1 ? "" : "zes"}</h3>
          <div className="mt-3">
            {sparkScores.length >= 2 ? (
              <Spark points={sparkScores} w={620} h={150} />
            ) : (
              <p className="py-10 text-center text-sm text-slate-400">Not enough completed quizzes yet to chart a trend.</p>
            )}
          </div>
        </div>

        <div className="cm-card p-[18px]">
          <h3 className="mb-3 text-[15px] font-bold text-slate-900">Weak topics</h3>
          {weak.length === 0 ? (
            <p className="text-sm text-slate-400">No practised skills yet.</p>
          ) : (
            <div className="grid gap-3">
              {weak.map((t) => (
                <div key={t.code}>
                  <div className="mb-1 flex justify-between text-[13px]">
                    <span className="font-semibold text-slate-700">
                      {t.code} {t.name}{" "}
                      {t.flag && <span className="font-bold" style={{ color: "var(--cm-coral)" }}>⚑</span>}
                    </span>
                    <span className="font-mono text-slate-500">{t.pct}%</span>
                  </div>
                  <div className="cm-bar">
                    <i style={{ width: `${t.pct}%`, background: t.pct < 60 ? "var(--cm-coral)" : "var(--cm-gold)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* quiz history + parental controls */}
      <div className="grid gap-3.5 lg:grid-cols-[1.6fr_1fr]">
        <QuizHistory rows={historyView} studentId={student.id} />

        <ParentalControlsForm
          studentId={student.id}
          initial={parentalSettings}
          topicGroups={student.topicSelections.map((s) => ({ id: s.topicGroupId, letter: s.topicGroup.letter, name: s.topicGroup.name }))}
        />
      </div>

      {/* topics in practice */}
      <div className="cm-card p-[18px]">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-slate-900">Topics in practice</h3>
          <EditTopics
            studentId={student.id}
            allGroups={allGroupsForGrade}
            selectedIds={student.topicSelections.map((s) => s.topicGroupId)}
          />
        </div>
        {student.topicSelections.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No topic groups selected yet.</p>
        ) : (
          <ul className="mt-3 flex flex-wrap gap-2">
            {[...student.topicSelections]
              .sort((a, b) => a.topicGroup.letter.localeCompare(b.topicGroup.letter))
              .map((s) => (
                <li key={s.topicGroupId} className="cm-pill indigo">
                  {s.topicGroup.letter} · {s.topicGroup.name}
                </li>
              ))}
          </ul>
        )}
      </div>

      <InviteStudent childId={student.id} hasLogin={Boolean(student.userId)} />

      {parent.role === "superadmin" && (
        <div className={`cm-card p-[18px] ${student.tutorApproved ? "" : "border-amber-300 bg-amber-50"}`}>
          <h3 className="mb-1 text-[15px] font-bold text-slate-900">Access approval</h3>
          <p className="mb-3 text-sm text-slate-500">
            {student.tutorApproved
              ? "This student is approved and can access material."
              : "This student self-registered and is waiting for approval before they can practise."}
          </p>
          <ApproveStudentButton studentId={student.id} approved={student.tutorApproved} />
        </div>
      )}

      <TutorActivityPanel studentId={student.id} />
    </div>
  );
}
