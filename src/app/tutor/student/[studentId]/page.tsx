import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTutorSession } from "@/lib/auth/server";
import { tutorOwnsStudent } from "@/lib/tutor";
import { prisma } from "@/lib/db";
import { studentEmoji } from "@/lib/student-emoji";
import { xpToLevel, levelTitle } from "@/lib/domain/gamification";
import CMIcon from "@/components/CMIcon";
import TopicChip, { type TopicStrength } from "@/app/dashboard/TopicChip";
import DifficultyBadge from "@/app/dashboard/DifficultyBadge";
import QuizHistory, { type HistoryRow } from "@/app/dashboard/QuizHistory";
import WeakTopicsPanel from "@/app/parent/child/[childId]/WeakTopicsPanel";
import SessionLog, { type SessionRow } from "@/components/tutor/SessionLog";
import HomeworkManager, { type HomeworkRow } from "@/components/tutor/HomeworkManager";
import { parseSkillIds } from "@/lib/domain/homework";
import ApproveStudentButton from "@/components/tutor/ApproveStudentButton";

export const metadata = { title: "Student progress — Tutor" };

export default async function TutorStudentPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const tutor = await requireTutorSession();
  const { studentId: idParam } = await params;
  const studentId = parseInt(idParam, 10);
  if (!Number.isFinite(studentId)) notFound();

  const owns = await tutorOwnsStudent(tutor.userId, studentId);
  if (!owns) notFound();

  const student = await prisma.student.findUnique({
    where: { id: studentId },
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
    },
  });
  if (!student) notFound();

  const [sessionRows, homeworkRows, skills] = await Promise.all([
    prisma.tutorSession.findMany({ where: { studentId }, orderBy: { scheduledAt: "desc" } }),
    prisma.homeworkAssignment.findMany({ where: { studentId }, orderBy: { createdAt: "desc" } }),
    prisma.skill.findMany({
      where: { active: true, topicGroup: { gradeLevel: student.grade, active: true } },
      select: { id: true, code: true, name: true },
      orderBy: [{ topicGroupId: "asc" }, { number: "asc" }],
    }),
  ]);
  const sessions: SessionRow[] = sessionRows.map((s) => ({
    id: s.id, status: s.status, scheduledAt: s.scheduledAt.toISOString(),
    durationMin: s.durationMin, focus: s.focus, notes: s.notes,
  }));
  const homework: HomeworkRow[] = homeworkRows.map((h) => ({
    id: h.id, title: h.title, instructions: h.instructions,
    assignedSkillIds: parseSkillIds(h.assignedSkillIds),
    dueAt: h.dueAt?.toISOString() ?? null, status: h.status, createdAt: h.createdAt.toISOString(),
  }));

  const strengthByLetter = new Map<string, TopicStrength>();
  for (const sel of student.topicSelections) {
    strengthByLetter.set(sel.topicGroup.letter, {
      letter: sel.topicGroup.letter, name: sel.topicGroup.name, attempts: 0, correct: 0,
    });
  }
  for (const m of student.conceptMastery) {
    const e = strengthByLetter.get(m.skill.topicGroup.letter);
    if (!e) continue;
    e.attempts += m.totalAttempts;
    e.correct += m.totalCorrect;
  }
  const topicStrengths = [...strengthByLetter.values()].sort((a, b) => a.letter.localeCompare(b.letter));

  const historyRows: HistoryRow[] = student.quizzes.map((q) => {
    const tm = new Map<string, { letter: string; name: string }>();
    for (const qq of q.questions) tm.set(qq.skill.topicGroup.letter, { letter: qq.skill.topicGroup.letter, name: qq.skill.topicGroup.name });
    return {
      id: q.id, status: q.status, score: q.score, difficulty: q.difficulty,
      completedAt: q.completedAt ? q.completedAt.toISOString() : null,
      topics: [...tm.values()].sort((a, b) => a.letter.localeCompare(b.letter)),
      hasAnswers: q.questions.some((qq) => qq.attempts.length > 0),
    };
  });

  // ── Profile-header rollups (read-only, derived from the loaded data) ──────
  const level = xpToLevel(student.xp).level;
  const rank = levelTitle(level);
  const completed = student.quizzes.filter(
    (q) => q.status === "completed" && typeof q.score === "number",
  );
  const avgScore = completed.length
    ? Math.round(completed.reduce((acc, q) => acc + (q.score as number), 0) / completed.length)
    : null;

  return (
    <main className="space-y-5">
      {/* breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px] text-slate-500">
        <Link href="/tutor/students" className="hover:text-slate-700">My students</Link>
        <CMIcon name="chevron" size={14} color="var(--slate-400)" />
        <span className="font-semibold text-slate-900">{student.name}</span>
      </div>

      {/* mint profile header */}
      <header
        className="cm-card overflow-hidden p-0"
        style={{ borderColor: "var(--cm-mint)" }}
      >
        <div className="px-5 py-5" style={{ background: "var(--cm-mint-soft)" }}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div
              className="grid h-[72px] w-[72px] shrink-0 place-items-center rounded-[22px] bg-white text-[40px]"
              style={{ border: "2px solid var(--cm-mint)" }}
            >
              {studentEmoji(student.id)}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-[34px] leading-none text-slate-900">{student.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-slate-600">
                <span className="cm-pill mint" style={{ height: 22, fontSize: 11 }}>
                  Lv {level} · {rank.title}
                </span>
                <span>Grade {student.grade}</span>
                <span aria-hidden>·</span>
                <DifficultyBadge level={student.currentDifficulty} />
                <span aria-hidden>·</span>
                <span className="text-slate-500">read-only tutor view</span>
              </div>
            </div>
            <div className="shrink-0">
              <ApproveStudentButton studentId={student.id} approved={student.tutorApproved} />
            </div>
          </div>
        </div>

        {/* quick stat rail */}
        <div className="grid grid-cols-3 divide-x bg-white" style={{ borderColor: "var(--slate-100)" }}>
          <div className="px-5 py-3.5">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Avg score</div>
            <div className="font-display mt-0.5 text-2xl leading-none" style={{ color: "var(--cm-mint)" }}>
              {avgScore !== null ? `${avgScore}%` : "—"}
            </div>
          </div>
          <div className="px-5 py-3.5">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Quizzes done</div>
            <div className="font-display mt-0.5 text-2xl leading-none text-slate-900">{completed.length}</div>
          </div>
          <div className="px-5 py-3.5">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Topics</div>
            <div className="font-display mt-0.5 text-2xl leading-none text-slate-900">{topicStrengths.length}</div>
          </div>
        </div>
      </header>

      {/* progress + topics row */}
      <div className="grid gap-3.5 lg:grid-cols-[1fr_1fr]">
        <section className="cm-card p-[18px]">
          <div className="mb-3 flex items-center gap-2">
            <CMIcon name="target" size={16} color="var(--cm-mint)" />
            <h2 className="text-[15px] font-bold text-slate-900">Focus areas</h2>
          </div>
          <WeakTopicsPanel mastery={student.conceptMastery.map((m) => ({
            topicLetter: m.skill.topicGroup.letter,
            topicName: m.skill.topicGroup.name,
            skillCode: m.skill.code,
            skillName: m.skill.name,
            totalAttempts: m.totalAttempts,
            totalCorrect: m.totalCorrect,
          }))} />
        </section>

        <section className="cm-card p-[18px]">
          <div className="mb-3 flex items-center gap-2">
            <CMIcon name="layers" size={16} color="var(--cm-mint)" />
            <h2 className="text-[15px] font-bold text-slate-900">Topics in practice</h2>
          </div>
          {topicStrengths.length === 0 ? (
            <p className="text-sm text-slate-500">No topic groups selected yet.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {topicStrengths.map((t) => <li key={t.letter}><TopicChip topic={t} /></li>)}
            </ul>
          )}
        </section>
      </div>

      {/* quiz history */}
      <section className="cm-card p-[18px]">
        <div className="mb-3 flex items-center gap-2">
          <CMIcon name="chart" size={16} color="var(--cm-mint)" />
          <h2 className="text-[15px] font-bold text-slate-900">Quiz history</h2>
        </div>
        <QuizHistory studentId={student.id} quizzes={historyRows} />
      </section>

      <HomeworkManager studentId={student.id} initialHomework={homework} skills={skills} />

      <SessionLog studentId={student.id} initialSessions={sessions} />
    </main>
  );
}
