import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTutorSession } from "@/lib/auth/server";
import { tutorOwnsStudent } from "@/lib/tutor";
import { prisma } from "@/lib/db";
import TopicChip, { type TopicStrength } from "@/app/dashboard/TopicChip";
import DifficultyBadge from "@/app/dashboard/DifficultyBadge";
import QuizHistory, { type HistoryRow } from "@/app/dashboard/QuizHistory";
import WeakTopicsPanel from "@/app/parent/child/[childId]/WeakTopicsPanel";
import DataExportMenu from "@/components/DataExportMenu";

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

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{student.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span>Grade {student.grade}</span>
            <span aria-hidden>·</span>
            <DifficultyBadge level={student.currentDifficulty} />
            <span aria-hidden>·</span>
            <span>read-only tutor view</span>
          </div>
        </div>
        <Link href="/tutor/students" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
          ← My students
        </Link>
      </header>

      <WeakTopicsPanel mastery={student.conceptMastery.map((m) => ({
        topicLetter: m.skill.topicGroup.letter,
        topicName: m.skill.topicGroup.name,
        skillCode: m.skill.code,
        skillName: m.skill.name,
        totalAttempts: m.totalAttempts,
        totalCorrect: m.totalCorrect,
      }))} />

      <section>
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">Topics in practice</h2>
        {topicStrengths.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No topic groups selected yet.</p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {topicStrengths.map((t) => <li key={t.letter}><TopicChip topic={t} /></li>)}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">Quiz history</h2>
        <div className="mt-3"><QuizHistory studentId={student.id} quizzes={historyRows} /></div>
      </section>

      <section className="border-t border-slate-200 pt-4 dark:border-slate-700">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">Data portability</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Download {student.name}&apos;s complete progress record.
        </p>
        <div className="mt-3"><DataExportMenu studentId={student.id} /></div>
      </section>
    </main>
  );
}
