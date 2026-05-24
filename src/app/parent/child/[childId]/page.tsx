import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireParentSession } from "@/lib/auth/server";
import GenerateQuizButton from "@/app/dashboard/GenerateQuizButton";
import TopicChip, { type TopicStrength } from "@/app/dashboard/TopicChip";
import DifficultyBadge from "@/app/dashboard/DifficultyBadge";
import EditTopics, { type TopicGroup } from "@/app/dashboard/EditTopics";
import QuizHistory, { type HistoryRow } from "@/app/dashboard/QuizHistory";
import WeakTopicsPanel from "./WeakTopicsPanel";
import DataExportMenu from "@/components/DataExportMenu";
import ParentalControlsForm from "./ParentalControlsForm";
import { parseLockedTopicGroupIds } from "@/lib/domain/parental-controls";

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

  // Aggregate per-topic-group accuracy from ConceptMastery.
  const strengthByLetter = new Map<string, TopicStrength>();
  for (const sel of student.topicSelections) {
    strengthByLetter.set(sel.topicGroup.letter, {
      letter: sel.topicGroup.letter,
      name: sel.topicGroup.name,
      attempts: 0,
      correct: 0,
    });
  }
  for (const m of student.conceptMastery) {
    const entry = strengthByLetter.get(m.skill.topicGroup.letter);
    if (!entry) continue;
    entry.attempts += m.totalAttempts;
    entry.correct += m.totalCorrect;
  }
  const topicStrengths = [...strengthByLetter.values()].sort((a, b) => a.letter.localeCompare(b.letter));

  const historyRows: HistoryRow[] = student.quizzes.map((q) => {
    const topicMap = new Map<string, { letter: string; name: string }>();
    for (const qq of q.questions) topicMap.set(qq.skill.topicGroup.letter, { letter: qq.skill.topicGroup.letter, name: qq.skill.topicGroup.name });
    const hasAnswers = q.questions.some((qq) => qq.attempts.length > 0);
    return {
      id: q.id,
      status: q.status,
      score: q.score,
      difficulty: q.difficulty,
      completedAt: q.completedAt ? q.completedAt.toISOString() : null,
      topics: [...topicMap.values()].sort((a, b) => a.letter.localeCompare(b.letter)),
      hasAnswers,
    };
  });

  const lockedTopicGroupIds = parseLockedTopicGroupIds(student.parentalSettings?.lockedTopicGroupIds);
  const parentalSettings = {
    maxQuizzesPerDay: student.parentalSettings?.maxQuizzesPerDay ?? null,
    windowStart: student.parentalSettings?.windowStart ?? "",
    windowEnd: student.parentalSettings?.windowEnd ?? "",
    lockedTopicGroupIds,
  };

  return (
    <main className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{student.name}</h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span>Grade {student.grade}</span>
            <span aria-hidden>·</span>
            <DifficultyBadge level={student.currentDifficulty} />
            <span aria-hidden>·</span>
            <span>{student.topicSelections.length} topic group{student.topicSelections.length === 1 ? "" : "s"}</span>
          </div>
        </div>
        <Link href="/parent/dashboard" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
          ← Dashboard
        </Link>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100">Generate a quiz</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">Adaptive: 60% weak · 25% adjacent · 15% other.</p>
          </div>
          <GenerateQuizButton studentId={student.id} />
        </div>
      </section>

      <WeakTopicsPanel mastery={student.conceptMastery.map((m) => ({
        topicLetter: m.skill.topicGroup.letter,
        topicName: m.skill.topicGroup.name,
        skillCode: m.skill.code,
        skillName: m.skill.name,
        totalAttempts: m.totalAttempts,
        totalCorrect: m.totalCorrect,
      }))} />

      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Topics in practice</h2>
          <EditTopics
            studentId={student.id}
            allGroups={allGroupsForGrade}
            selectedIds={student.topicSelections.map((s) => s.topicGroupId)}
          />
        </div>
        {topicStrengths.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No topic groups selected yet.</p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {topicStrengths.map((t) => (
              <li key={t.letter}><TopicChip topic={t} /></li>
            ))}
          </ul>
        )}
      </section>

      <ParentalControlsForm
        studentId={student.id}
        initial={parentalSettings}
        topicGroups={student.topicSelections.map((s) => ({ id: s.topicGroupId, letter: s.topicGroup.letter, name: s.topicGroup.name }))}
      />

      <section>
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">Quiz history</h2>
        <div className="mt-3">
          <QuizHistory studentId={student.id} quizzes={historyRows} />
        </div>
      </section>

      <section className="border-t border-slate-200 pt-4 dark:border-slate-700">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">Data portability</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Download {student.name}&apos;s complete progress record.
        </p>
        <div className="mt-3">
          <DataExportMenu studentId={student.id} />
        </div>
      </section>
    </main>
  );
}
