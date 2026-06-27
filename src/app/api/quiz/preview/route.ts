import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getParentForApi } from "@/lib/auth/server";
import { loadLockedTopicGroupIds } from "@/lib/parental";
import { enforceRateLimit } from "@/lib/rate-limit";
import { previewDistribution } from "@/lib/ai/preview";
import type { SkillRecord } from "@/lib/ai/mock";

type Body = {
  studentId?: number;
  topicGroupIds?: number[];
  questionCount?: number;
  difficulty?: number;
};

export async function POST(req: Request): Promise<Response> {
  // Preview is called on every builder keystroke (debounced); keep the bucket
  // generous but bounded.
  const limited = enforceRateLimit(req, "quiz-preview", 120, 60_000);
  if (limited) return limited;

  const auth = await getParentForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await req.json()) as Body;
  const studentId = body.studentId;
  if (!studentId) {
    return NextResponse.json({ error: "studentId required" }, { status: 400 });
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, grade: true, parentId: true, userId: true, currentDifficulty: true },
  });
  // Same ownership rule as /api/quiz/generate: own account, parent, or admin.
  const uid = auth.parent.userId;
  const canAccess =
    student &&
    (student.userId === uid ||
      student.parentId === uid ||
      auth.parent.role === "superadmin");
  if (!canAccess) {
    return NextResponse.json({ error: "student not found" }, { status: 404 });
  }

  // Validate the requested groups belong to this student's grade, are active,
  // and aren't parental-locked. Never trust the client to widen the pool.
  const requestedIds = Array.isArray(body.topicGroupIds)
    ? body.topicGroupIds.filter((n) => Number.isFinite(n))
    : [];
  if (requestedIds.length === 0) {
    return NextResponse.json({
      rows: [],
      weighting: { weak: 60, adjacent: 25, other: 15 },
      adaptive: false,
    });
  }

  const locked = new Set(await loadLockedTopicGroupIds(student.id));
  const validGroups = await prisma.topicGroup.findMany({
    where: { id: { in: requestedIds }, gradeLevel: student.grade, active: true },
    select: { id: true },
  });
  const selectedGroupIds = validGroups.map((g) => g.id).filter((id) => !locked.has(id));

  // Mirror mockGenerateQuiz's skill query: active skills inside active groups.
  const skills =
    selectedGroupIds.length === 0
      ? []
      : await prisma.skill.findMany({
          where: {
            topicGroupId: { in: selectedGroupIds },
            active: true,
            topicGroup: { active: true },
          },
          include: { topicGroup: true },
        });

  const skillsByGroup = new Map<string, SkillRecord[]>();
  for (const s of skills) {
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

  // Weak-skill filter must match the generator exactly (mock.ts).
  const mastery = await prisma.conceptMastery.findMany({
    where: { studentId: student.id },
    select: { skillId: true, remediationFlag: true, totalAttempts: true, totalCorrect: true },
  });
  const weakSkillIds = new Set(
    mastery
      .filter(
        (p) =>
          p.remediationFlag ||
          (p.totalAttempts >= 2 && p.totalCorrect / p.totalAttempts < 0.5),
      )
      .map((p) => p.skillId),
  );

  const rawCount = body.questionCount;
  const totalQuestions =
    typeof rawCount === "number" && Number.isFinite(rawCount)
      ? Math.min(25, Math.max(5, Math.round(rawCount)))
      : 10;

  const { rows, weighting } = previewDistribution({
    skillsByGroup,
    weakSkillIds,
    totalQuestions,
  });

  const requestedDifficulty =
    typeof body.difficulty === "number" && Number.isFinite(body.difficulty)
      ? Math.min(5, Math.max(1, Math.round(body.difficulty)))
      : student.currentDifficulty;

  return NextResponse.json({
    rows,
    weighting,
    adaptive: requestedDifficulty === student.currentDifficulty,
  });
}
