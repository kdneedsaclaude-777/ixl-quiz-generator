import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import { buildGenerateQuizPrompt } from "@/lib/ai/prompts/generateQuiz";
import { buildGenerateExplanationPrompt } from "@/lib/ai/prompts/generateExplanation";
import { buildGenerateRemediationPrompt } from "@/lib/ai/prompts/generateRemediation";
import {
  validateQuizOutput,
  deduplicateQuestions,
  validateExplanation,
  validateRemediation,
  type ValidatedExplanation,
  type ValidatedRemediation,
} from "@/lib/ai/validation";
import {
  mockGenerateQuiz,
  mockGenerateExplanation,
  mockGenerateRemediation,
} from "@/lib/ai/mock";
import { aiProviderMode } from "@/lib/ai/mode";
import type {
  GenerateQuizRequest,
  GenerateQuizResult,
  GenerateExplanationRequest,
  GenerateRemediationRequest,
} from "@/lib/ai/provider-types";

const MODEL = process.env.CLAUDE_MODEL ?? "claude-opus-4-7";
const MAX_TOKENS = 16_000;

let cachedClient: Anthropic | null = null;
function getClient(): Anthropic | null {
  // Mock stays the default even when a key is present — live calls require
  // an explicit AI_PROVIDER=claude opt-in (see src/lib/ai/mode.ts).
  if (aiProviderMode() !== "claude") return null;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  if (!cachedClient) cachedClient = new Anthropic({ apiKey });
  return cachedClient;
}

async function callClaude(args: { system: string; user: string }): Promise<string | null> {
  const client = getClient();
  if (!client) return null;
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: [
        { type: "text", text: args.system, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: args.user }],
    });
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      console.warn("[ai] response had no text block:", JSON.stringify(response.content));
      return null;
    }
    return textBlock.text;
  } catch (err) {
    console.warn("[ai] Claude call failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

async function loadQuizContext(req: GenerateQuizRequest): Promise<{
  grade: number;
  topicGroupLetter: string;
  skillCodes: string[];
  difficulty: number;
  weakSkillCodes: string[];
}> {
  const student = await prisma.student.findUniqueOrThrow({
    where: { id: req.studentId },
    include: {
      topicSelections: { include: { topicGroup: { include: { skills: true } } } },
      conceptMastery: { include: { skill: true } },
    },
  });
  if (student.topicSelections.length === 0) {
    throw new Error("Student has no topic groups selected.");
  }

  // Manual builder / targeted tiles restrict generation to a subset of the
  // enabled groups; intersect so the pool can never widen past the parent's
  // pick. If a requested filter matches none of the enabled groups, throw
  // (caller falls back to the mock, which produces a clean empty-pool 400)
  // rather than silently widening to the full set.
  const selections =
    req.topicGroupIds && req.topicGroupIds.length > 0
      ? student.topicSelections.filter((sel) => req.topicGroupIds!.includes(sel.topicGroupId))
      : student.topicSelections;
  if (selections.length === 0) {
    throw new Error("No enabled topic groups match the requested filter.");
  }

  const allSelectedSkills = selections.flatMap((sel) => sel.topicGroup.skills);
  const skillCodes = allSelectedSkills.map((s) => s.code);

  const weakSkillCodes = student.conceptMastery
    .filter(
      (p) =>
        p.remediationFlag ||
        (p.totalAttempts >= 2 && p.totalCorrect / p.totalAttempts < 0.5),
    )
    .map((p) => p.skill.code);

  const focalLetter = selections[0].topicGroup.letter;

  return {
    grade: student.grade,
    topicGroupLetter: focalLetter,
    skillCodes,
    difficulty: req.difficultyOverride ?? student.currentDifficulty,
    weakSkillCodes,
  };
}

export async function generateQuiz(req: GenerateQuizRequest): Promise<GenerateQuizResult> {
  let ctx;
  try {
    ctx = await loadQuizContext(req);
  } catch (err) {
    console.warn("[ai] generateQuiz: context load failed, falling back:", err);
    return mockGenerateQuiz(req);
  }

  const { system, user } = buildGenerateQuizPrompt({
    grade: ctx.grade,
    topic_group_letter: ctx.topicGroupLetter,
    skill_codes: ctx.skillCodes,
    difficulty: ctx.difficulty,
    question_count: req.questionCount ?? 10,
    weak_skill_codes: ctx.weakSkillCodes,
  });

  const raw = await callClaude({ system, user });
  if (!raw || raw.trim().length === 0) {
    console.warn("[ai] generateQuiz: empty/null response, falling back to mock");
    return mockGenerateQuiz(req);
  }

  const validation = validateQuizOutput(raw);
  if (!validation.success || !validation.data) {
    console.warn("[ai] generateQuiz: validation failed, falling back to mock", {
      errors: validation.errors,
      raw,
    });
    return mockGenerateQuiz(req);
  }

  const dedup = deduplicateQuestions(validation.data.questions);
  if (dedup.skipped > 0) {
    console.warn(`[ai] generateQuiz: removed ${dedup.skipped} duplicate question(s)`);
  }

  if (dedup.deduplicated.length === 0) {
    console.warn("[ai] generateQuiz: no questions left after dedup, falling back to mock");
    return mockGenerateQuiz(req);
  }

  return {
    config: validation.data.config,
    questions: dedup.deduplicated,
    difficulty: ctx.difficulty,
  };
}

export async function generateExplanation(
  req: GenerateExplanationRequest,
): Promise<ValidatedExplanation> {
  const { system, user } = buildGenerateExplanationPrompt(req);
  const raw = await callClaude({ system, user });
  if (!raw || raw.trim().length === 0) {
    console.warn("[ai] generateExplanation: empty/null response, falling back to mock");
    return mockGenerateExplanation();
  }
  const validation = validateExplanation(raw);
  if (!validation.success || !validation.data) {
    console.warn("[ai] generateExplanation: validation failed, falling back to mock", {
      errors: validation.errors,
      raw,
    });
    return mockGenerateExplanation();
  }
  return validation.data;
}

export async function generateRemediation(
  req: GenerateRemediationRequest,
): Promise<ValidatedRemediation> {
  const student = await prisma.student.findUniqueOrThrow({
    where: { id: req.studentId },
    include: {
      conceptMastery: { include: { skill: true } },
      quizzes: {
        where: { status: "completed" },
        orderBy: { completedAt: "desc" },
        take: 5,
      },
    },
  });

  const weakSkillCodes = student.conceptMastery
    .filter(
      (p) =>
        p.remediationFlag ||
        (p.totalAttempts >= 2 && p.totalCorrect / p.totalAttempts < 0.5),
    )
    .map((p) => p.skill.code);

  const recentScores = student.quizzes
    .map((q) => q.score)
    .filter((s): s is number => typeof s === "number");

  const { system, user } = buildGenerateRemediationPrompt({
    student_name: student.name,
    grade: student.grade,
    weak_skill_codes: weakSkillCodes,
    recent_scores: recentScores,
  });

  const raw = await callClaude({ system, user });
  if (!raw || raw.trim().length === 0) {
    console.warn("[ai] generateRemediation: empty/null response, falling back to mock");
    return mockGenerateRemediation({ studentName: student.name, weakSkillCodes });
  }
  const validation = validateRemediation(raw);
  if (!validation.success || !validation.data) {
    console.warn("[ai] generateRemediation: validation failed, falling back to mock", {
      errors: validation.errors,
      raw,
    });
    return mockGenerateRemediation({ studentName: student.name, weakSkillCodes });
  }
  return validation.data;
}

export type {
  GenerateQuizRequest,
  GenerateQuizResult,
  GenerateExplanationRequest,
  GenerateRemediationRequest,
} from "@/lib/ai/provider-types";
