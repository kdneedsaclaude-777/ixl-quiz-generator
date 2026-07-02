import { prisma } from "@/lib/db";
import { generateQuiz } from "@/lib/ai/provider";

// Shared generate-and-persist core for quizzes. Pure of auth/billing/parental
// gates — callers (the parent route, the tutor route) enforce their own access
// rules, then call this to actually build + store the quiz. Keeping it in one
// place means both paths produce identical Quiz/Question rows.

const DEFAULT_TEST_TIME_LIMIT_SEC = 1200; // 20 minutes

export type CreateQuizArgs = {
  studentId: number;
  grade: number;
  questionCount: number;
  topicGroupIds?: number[];
  difficultyOverride?: number;
  mode: "practice" | "test";
  isDailyChallenge?: boolean;
  timeLimitSec?: number;
  // Set by the tutor "Assign a quiz" flow — tags the quiz so the child home can
  // surface it as tutor-assigned work (generatedBy="tutor").
  assignedByTutor?: boolean;
};

export type CreateQuizResult =
  | { ok: true; quizId: number; isFirstQuiz: boolean; config: unknown }
  | { ok: false; status: number; error: string };

export async function createQuizForStudent(args: CreateQuizArgs): Promise<CreateQuizResult> {
  const { studentId, grade, questionCount, topicGroupIds, difficultyOverride, mode } = args;
  const isDailyChallenge = args.isDailyChallenge === true;
  const assignedByTutor = args.assignedByTutor === true;
  const hasOverrides =
    Boolean(topicGroupIds) || difficultyOverride !== undefined || mode === "test" || isDailyChallenge;

  const existingQuizCount = await prisma.quiz.count({ where: { studentId } });
  const isFirstQuiz = existingQuizCount === 0;

  const result = await generateQuiz({
    studentId,
    questionCount,
    isFirstQuiz,
    topicGroupIds,
    difficultyOverride,
    // A daily challenge is a global, grade-wide topic that the child may not have
    // enabled — let generation build on it (route already validated it).
    allowAnyGradeTopic: isDailyChallenge,
  });
  if (result.questions.length === 0) {
    return {
      ok: false,
      status: 400,
      error:
        "No questions could be generated. Check that the student has at least one topic group with active skills enabled.",
    };
  }

  const codes = result.questions.map((q) => q.skill_code);
  const skills = await prisma.skill.findMany({
    where: { code: { in: codes }, topicGroup: { gradeLevel: grade } },
    include: { topicGroup: true },
  });
  const skillByCode = new Map(skills.map((s) => [s.code, s]));

  const quiz = await prisma.quiz.create({
    data: {
      studentId,
      status: "active",
      difficulty: result.difficulty,
      mode,
      isDailyChallenge,
      generatedBy: assignedByTutor ? "tutor" : hasOverrides ? "manual" : "adaptive",
      timeLimitSec:
        mode === "test"
          ? typeof args.timeLimitSec === "number" && Number.isFinite(args.timeLimitSec)
            ? Math.min(3600, Math.max(60, Math.round(args.timeLimitSec)))
            : DEFAULT_TEST_TIME_LIMIT_SEC
          : null,
      paramsJson: hasOverrides
        ? JSON.stringify({
            topicGroupIds: topicGroupIds ?? null,
            difficulty: difficultyOverride ?? null,
            questionCount,
            mode,
          })
        : null,
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

  return { ok: true, quizId: quiz.id, isFirstQuiz, config: result.config ?? null };
}
