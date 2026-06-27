import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireParentSession } from "@/lib/auth/server";
import { loadLockedTopicGroupIds } from "@/lib/parental";
import { xpToLevel } from "@/lib/domain/gamification";
import { previewDistribution } from "@/lib/ai/preview";
import type { SkillRecord } from "@/lib/ai/mock";
import QuizBuilder from "./QuizBuilder";

export default async function NewQuizPage({
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
    select: {
      id: true,
      name: true,
      grade: true,
      currentDifficulty: true,
      xp: true,
      parentId: true,
      userId: true,
      topicSelections: { select: { topicGroupId: true } },
      conceptMastery: {
        select: { skillId: true, remediationFlag: true, totalAttempts: true, totalCorrect: true },
      },
    },
  });
  if (!student) notFound();
  if (student.parentId !== parent.userId && parent.role !== "superadmin") notFound();

  const allGroupsForGrade = await prisma.topicGroup.findMany({
    where: { gradeLevel: student.grade, active: true },
    orderBy: { letter: "asc" },
    select: { id: true, letter: true, name: true },
  });

  // Weak-skill set — must match the generator's filter exactly (mock.ts).
  const weakSkillIds = new Set(
    student.conceptMastery
      .filter(
        (p) =>
          p.remediationFlag ||
          (p.totalAttempts >= 2 && p.totalCorrect / p.totalAttempts < 0.5),
      )
      .map((p) => p.skillId),
  );

  // Real per-group skill + weak counts so the topic tiles aren't placeholders.
  const groupIds = allGroupsForGrade.map((g) => g.id);
  const activeSkills =
    groupIds.length === 0
      ? []
      : await prisma.skill.findMany({
          where: { topicGroupId: { in: groupIds }, active: true, topicGroup: { active: true } },
          select: {
            id: true,
            code: true,
            number: true,
            name: true,
            topicGroupId: true,
            topicGroup: { select: { letter: true, name: true, gradeLevel: true } },
          },
        });

  const skillCountByGroup = new Map<number, number>();
  const weakCountByGroup = new Map<number, number>();
  for (const s of activeSkills) {
    skillCountByGroup.set(s.topicGroupId, (skillCountByGroup.get(s.topicGroupId) ?? 0) + 1);
    if (weakSkillIds.has(s.id)) {
      weakCountByGroup.set(s.topicGroupId, (weakCountByGroup.get(s.topicGroupId) ?? 0) + 1);
    }
  }

  const lockedIds = new Set(await loadLockedTopicGroupIds(student.id));

  const groups = allGroupsForGrade.map((g) => ({
    id: g.id,
    letter: g.letter,
    name: g.name,
    skillCount: skillCountByGroup.get(g.id) ?? 0,
    weakCount: weakCountByGroup.get(g.id) ?? 0,
    locked: lockedIds.has(g.id),
  }));

  const defaultSelectedIds = student.topicSelections
    .map((s) => s.topicGroupId)
    .filter((id) => !lockedIds.has(id));

  // Server-side first paint of the live preview, scoped to the default
  // selection, so the rail isn't empty before the first client fetch.
  const initialSelectedSet = new Set(defaultSelectedIds);
  const skillsByGroup = new Map<string, SkillRecord[]>();
  for (const s of activeSkills) {
    if (!initialSelectedSet.has(s.topicGroupId)) continue;
    const record: SkillRecord = {
      id: s.id,
      code: s.code,
      number: s.number,
      name: s.name,
      topicGroup: {
        letter: s.topicGroup.letter,
        name: s.topicGroup.name,
        gradeLevel: s.topicGroup.gradeLevel,
      },
    };
    const arr = skillsByGroup.get(s.topicGroup.letter) ?? [];
    arr.push(record);
    skillsByGroup.set(s.topicGroup.letter, arr);
  }
  const initialPreview = {
    ...previewDistribution({ skillsByGroup, weakSkillIds, totalQuestions: 10 }),
    adaptive: true,
  };

  const level = xpToLevel(student.xp).level;

  return (
    <QuizBuilder
      student={{
        id: student.id,
        name: student.name,
        grade: student.grade,
        currentDifficulty: student.currentDifficulty,
      }}
      groups={groups}
      defaultSelectedIds={defaultSelectedIds}
      defaultDifficulty={student.currentDifficulty}
      level={level}
      initialPreview={initialPreview}
    />
  );
}
