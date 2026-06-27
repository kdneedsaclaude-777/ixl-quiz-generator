import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getParentForApi } from "@/lib/auth/server";
import { enforceRateLimit } from "@/lib/rate-limit";

// Imports questions produced by the external PDF Question Generator (a Claude
// artifact that dispatches a `cmQuestionsReady` event / postMessage). Maps that
// generator's shape onto the app's Question model and persists a real,
// playable practice quiz. The questions are off the IXL skill taxonomy, so they
// are attached to a representative enabled skill and tagged generatedBy:
// "imported" — they grade + render through the normal runner/submit pipeline.

type GenQuestion = {
  type?: string; // "mcq" | "true_false" | "fill_in_blank"
  text?: string;
  options?: string[];
  correct?: number; // index
  answer?: string; // fill-in-blank
  concept?: string;
  explanation?: string;
};

type Body = { studentId?: number; questions?: GenQuestion[]; title?: string };

const MAX_QUESTIONS = 50;

function letter(i: number): string {
  return String.fromCharCode(65 + i);
}

export async function POST(req: Request): Promise<Response> {
  const limited = enforceRateLimit(req, "quiz-import", 20, 60_000);
  if (limited) return limited;

  const auth = await getParentForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  const { studentId } = body;
  if (!studentId) return NextResponse.json({ error: "studentId required" }, { status: 400 });
  if (!Array.isArray(body.questions) || body.questions.length === 0) {
    return NextResponse.json({ error: "No questions to import." }, { status: 400 });
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, grade: true, parentId: true, userId: true, currentDifficulty: true },
  });
  const uid = auth.parent.userId;
  const canAccess =
    student &&
    (student.userId === uid || student.parentId === uid || auth.parent.role === "superadmin");
  if (!canAccess) return NextResponse.json({ error: "student not found" }, { status: 404 });

  // Representative skill: the first active skill in one of the student's enabled
  // topic groups; fall back to any active skill in the student's grade.
  const sel = await prisma.studentTopicSelection.findFirst({
    where: { studentId, topicGroup: { active: true } },
    include: { topicGroup: { include: { skills: { where: { active: true }, take: 1, orderBy: { number: "asc" } } } } },
    orderBy: { topicGroupId: "asc" },
  });
  let skillId = sel?.topicGroup.skills[0]?.id;
  if (!skillId) {
    const anySkill = await prisma.skill.findFirst({
      where: { active: true, topicGroup: { gradeLevel: student.grade, active: true } },
      select: { id: true },
      orderBy: { id: "asc" },
    });
    skillId = anySkill?.id;
  }
  if (!skillId) {
    return NextResponse.json(
      { error: "This student has no active topics to attach imported questions to. Add a topic group first." },
      { status: 400 },
    );
  }

  // Map generator questions → Question rows. Skip malformed ones.
  const difficulty = student.currentDifficulty;
  const created = body.questions
    .slice(0, MAX_QUESTIONS)
    .map((q, index) => {
      const text = (q.text ?? "").trim();
      if (!text) return null;
      const type = q.type ?? "mcq";

      let questionType: string;
      let answerOptions: Record<string, string>;
      let correctAnswer: string;

      if (type === "fill_in_blank") {
        // Generator fill-in answers are usually words → short_answer (text match),
        // not the numeric-only fill_in_the_blank.
        questionType = "short_answer";
        answerOptions = {};
        correctAnswer = (q.answer ?? "").trim();
        if (!correctAnswer) return null;
      } else if (type === "true_false") {
        // Render as a 2-option MCQ so the key-match grader works cleanly.
        questionType = "mcq";
        answerOptions = { A: "True", B: "False" };
        correctAnswer = q.correct === 1 ? "B" : "A";
      } else {
        // mcq (default)
        const opts = Array.isArray(q.options) ? q.options : [];
        if (opts.length < 2) return null;
        answerOptions = {};
        opts.forEach((o, i) => { answerOptions[letter(i)] = String(o); });
        const idx = typeof q.correct === "number" && q.correct >= 0 && q.correct < opts.length ? q.correct : 0;
        questionType = "mcq";
        correctAnswer = letter(idx);
      }

      const concept = (q.concept ?? "").trim() || "Imported";
      const explanation = (q.explanation ?? "").trim();
      return {
        skillId: skillId!,
        position: index,
        difficulty,
        questionType,
        questionStyle: "conceptual",
        questionText: text,
        answerOptionsJson: JSON.stringify(answerOptions),
        correctAnswer,
        displayLabel: concept,
        learningObjective: concept,
        conceptTagsJson: JSON.stringify(concept === "Imported" ? [] : [concept]),
        explanationJson: JSON.stringify({
          short: explanation || "Review the source material for this concept.",
          step_by_step: [
            explanation || "Revisit the relevant section of the document.",
            "Compare your answer with the source material.",
          ],
        }),
        needsVisual: false,
        toneGrade: student.grade,
        estimatedComplexity: "medium",
        weakSkillTargeted: false,
        remediationFlag: false,
      };
    })
    .filter((q): q is NonNullable<typeof q> => q !== null);

  if (created.length === 0) {
    return NextResponse.json({ error: "None of the questions were in a usable format." }, { status: 400 });
  }

  const quiz = await prisma.quiz.create({
    data: {
      studentId,
      status: "active",
      difficulty,
      mode: "practice",
      generatedBy: "imported",
      paramsJson: JSON.stringify({ source: "pdf-generator", title: body.title ?? null, count: created.length }),
      questions: { create: created },
    },
    select: { id: true },
  });

  return NextResponse.json({ quizId: quiz.id, count: created.length });
}
