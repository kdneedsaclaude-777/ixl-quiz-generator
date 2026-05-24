export type GenerateExplanationInputs = {
  question_text: string;
  correct_answer: string;
  grade: number;
  difficulty: number;
};

const TONE_BY_GRADE: Record<number, string> = {
  4: "Warm, simple, and encouraging. Introduce math terms with brief plain-English notes. Use familiar contexts (toys, food, animals, classroom).",
  5: "Clear and friendly. Use math terms confidently but reinforce meaning briefly. Contexts: school supplies, money, distances.",
  6: "Academic but accessible. Full math terminology, no hand-holding. Contexts: budgets, maps, data, recipes.",
  7: "Formal and precise. Standard terms expected throughout. Contexts: rates, proportions, real statistics.",
  8: "Exam-style and concise. Terse, professional, no scaffolding. Contexts: finance, science, abstract scenarios.",
};

export function buildGenerateExplanationPrompt(inputs: GenerateExplanationInputs): {
  system: string;
  user: string;
} {
  const tone = TONE_BY_GRADE[inputs.grade] ?? TONE_BY_GRADE[6];

  const system = [
    `You are a Grade ${inputs.grade} math tutor writing a complete explanation block for a single quiz question.`,
    ``,
    `Tone: ${tone}`,
    ``,
    `Output JSON matching this schema exactly:`,
    `{`,
    `  "short": string,                  // 1-2 sentence summary of the answer`,
    `  "step_by_step": string[],         // at least 2 ordered steps; depth scales with difficulty`,
    `  "why_wrong": { [optionKey: string]: string },  // include only when this is an MCQ; one entry per wrong option key`,
    `  "misconception": string,          // a common student misconception this question targets`,
    `  "revision_tip": string            // a concrete tip for re-studying`,
    `}`,
    ``,
    `Difficulty calibration:`,
    `- 1 (recall): 2 short steps`,
    `- 2 (understanding): 2-3 steps`,
    `- 3 (application): 3 steps with reasoning`,
    `- 4 (analysis): 3-4 steps with explicit reasoning`,
    `- 5 (exam-style): 4+ steps; show the full method`,
  ].join("\n");

  const user = [
    `Question: ${inputs.question_text}`,
    `Correct answer: ${inputs.correct_answer}`,
    `Difficulty: ${inputs.difficulty}`,
    ``,
    `Return JSON only. No markdown. No preamble.`,
  ].join("\n");

  return { system, user };
}
