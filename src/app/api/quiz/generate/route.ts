import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateQuiz } from "@/lib/ai/provider";
import { getParentForApi } from "@/lib/auth/server";
import { loadPracticeDecision } from "@/lib/parental";
import { enforceRateLimit } from "@/lib/rate-limit";

type Body = { studentId?: number; questionCount?: number };

export async function POST(req: Request): Promise<Response> {
  // Generation is the most expensive endpoint (potential model call).
  const limited = enforceRateLimit(req, "quiz-generate", 20, 60_000);
  if (limited) return limited;

  const auth = await getParentForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await req.json()) as Body;
  const { studentId, questionCount = 10 } = body;
  if (!studentId) {
    return NextResponse.json({ error: "studentId required" }, { status: 400 });
  }

  // Same skill code (e.g. "B.1") exists for every grade, so the lookup must
  // be scoped to the student's grade or we'll bind questions to the wrong
  // grade's TopicGroup row and the dashboard will show wildly wrong topics.
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, grade: true, parentId: true, userId: true },
  });
  // Allowed: the student's own account, their parent, or a superadmin.
  const uid = auth.parent.userId;
  const canAccess =
    student &&
    (student.userId === uid ||
      student.parentId === uid ||
      auth.parent.role === "superadmin");
  if (!canAccess) {
    return NextResponse.json({ error: "student not found" }, { status: 404 });
  }

  // Enforce parental controls (practice window, daily limit). Parents
  // generating quizzes via this API on their own children get the same gate
  // a child would; admins/superadmins skip it.
  if (auth.parent.role !== "superadmin") {
    const decision = await loadPracticeDecision(student.id);
    if (!decision.allowed) {
      return NextResponse.json(
        { error: decision.detail ?? "Practice not allowed right now.", reason: decision.reason },
        { status: 423 },
      );
    }
  }

  // Don't pile up duplicates: if this child already has an UNSTARTED quiz
  // (still "active" and with zero attempts on any question), hand that one
  // back instead of generating another. Makes repeated "New quiz" clicks
  // idempotent until the child actually begins a quiz.
  const existingUnstarted = await prisma.quiz.findFirst({
    where: {
      studentId,
      status: "active",
      questions: { none: { attempts: { some: {} } } },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (existingUnstarted) {
    return NextResponse.json({
      quizId: existingUnstarted.id,
      reused: true,
      isFirstQuiz: false,
      config: null,
    });
  }

  const existingQuizCount = await prisma.quiz.count({ where: { studentId } });
  const isFirstQuiz = existingQuizCount === 0;

  const result = await generateQuiz({ studentId, questionCount, isFirstQuiz });
  // Refuse to persist an empty quiz. This happens when every topic group
  // the parent selected has zero active skills (e.g. admin disabled them
  // all). Without this guard a 0-question quiz is created and the submit
  // route crashes downstream in pickFocalSkill (sorted[0] === undefined).
  if (result.questions.length === 0) {
    return NextResponse.json(
      { error: "No questions could be generated. Check that the student has at least one topic group with active skills enabled." },
      { status: 400 },
    );
  }

  const codes = result.questions.map((q) => q.skill_code);
  const skills = await prisma.skill.findMany({
    where: {
      code: { in: codes },
      topicGroup: { gradeLevel: student.grade },
    },
    include: { topicGroup: true },
  });
  const skillByCode = new Map(skills.map((s) => [s.code, s]));

  const quiz = await prisma.quiz.create({
    data: {
      studentId,
      status: "active",
      difficulty: result.difficulty,
      questions: {
        create: result.questions.map((q, idx) => {
          const skill = skillByCode.get(q.skill_code);
          if (!skill) throw new Error(`Unknown skill code ${q.skill_code}`);
          return {
            skillId: skill.id,
            position: idx,
            difficulty: q.difficulty,
            questionType: q.question_type,
            questionStyle: q.question_style,
            questionText: q.question_text,
            answerOptionsJson: JSON.stringify(q.answer_options),
            correctAnswer: q.correct_answer,
            displayLabel: q.display_label,
            learningObjective: q.learning_objective,
            conceptTagsJson: JSON.stringify(q.concept_tags),
            explanationJson: JSON.stringify(q.explanation),
            needsVisual: q.needs_visual,
            visualNote: q.visual_note,
            visualSvg: q.visual_svg,
            toneGrade: q.tone_grade,
            estimatedComplexity: q.estimated_complexity,
            weakSkillTargeted: q.weak_skill_targeted,
            remediationFlag: q.remediation_flag,
          };
        }),
      },
    },
  });

  return NextResponse.json({
    quizId: quiz.id,
    reused: false,
    isFirstQuiz,
    config: result.config ?? null,
  });
}
