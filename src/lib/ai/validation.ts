import { z } from "zod";

export const ExplanationSchema = z.object({
  short: z.string().min(1),
  step_by_step: z.array(z.string()).min(2),
  why_wrong: z.record(z.string(), z.string()).optional(),
  misconception: z.string().optional(),
  revision_tip: z.string().optional(),
});

export const QuestionSchema = z.object({
  id: z.string(),
  grade: z.number().int(),
  subject: z.literal("math"),
  topic_group_letter: z.string(),
  topic_group_name: z.string(),
  skill_code: z.string(),
  skill_name: z.string(),
  ixl_skill_ref: z.string(),
  difficulty: z.number().int().min(1).max(5),
  question_type: z.enum(["mcq", "true_false", "fill_in_the_blank", "short_answer"]),
  question_style: z.enum(["conceptual", "word_problem"]),
  question_text: z.string().min(1),
  answer_options: z.record(z.string(), z.string()),
  correct_answer: z.string(),
  display_label: z.string(),
  needs_visual: z.boolean(),
  visual_note: z.string().nullable(),
  visual_svg: z.string().nullable(),
  learning_objective: z.string(),
  concept_tags: z.array(z.string()),
  explanation: ExplanationSchema,
  tone_grade: z.number().int(),
  estimated_complexity: z.enum(["low", "medium", "high"]),
  remediation_flag: z.boolean(),
  weak_skill_targeted: z.boolean(),
});

export const StudentConfigSchema = z.object({
  config_type: z.literal("student_quiz_setup"),
  student_grade: z.number().int(),
  configured_by: z.literal("parent"),
  selected_topic_groups: z.array(z.string()),
  selected_topic_names: z.array(z.string()),
  tutor_approved: z.boolean(),
  approval_required_for: z.array(z.string()),
  starting_difficulty: z.number().int(),
  adaptive_mode: z.boolean(),
  notes: z.string(),
});

export const RemediationSchema = z.object({
  summary: z.string().min(1),
  focus_skills: z.array(z.string()),
  encouragement: z.string().min(1),
});

export type ValidatedQuestion = z.infer<typeof QuestionSchema>;
export type ValidatedConfig = z.infer<typeof StudentConfigSchema>;
export type ValidatedExplanation = z.infer<typeof ExplanationSchema>;
export type ValidatedRemediation = z.infer<typeof RemediationSchema>;

export type QuizOutput = {
  config?: ValidatedConfig;
  questions: ValidatedQuestion[];
};

export type ValidationResult<T> = {
  success: boolean;
  data?: T;
  errors: string[];
};

// Strip ```json ... ``` or ``` ... ``` wrappers Claude sometimes adds, even when
// asked not to. Idempotent on already-clean input.
export function stripMarkdownFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json|javascript)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
}

function safeJsonParse(input: unknown): { ok: true; value: unknown } | { ok: false; error: string } {
  if (typeof input !== "string") return { ok: true, value: input };
  const cleaned = stripMarkdownFences(input);
  if (cleaned.length === 0) return { ok: false, error: "Empty response after stripping fences" };
  try {
    return { ok: true, value: JSON.parse(cleaned) };
  } catch (e) {
    return { ok: false, error: `JSON parse failed: ${(e as Error).message}` };
  }
}

// SKILL.md spec: returning student → [question, ...]; new student → [config, question, ...].
// We accept either array form, plus our internal { config?, questions } object form.
export function validateQuizOutput(raw: unknown): ValidationResult<QuizOutput> {
  const parsed = safeJsonParse(raw);
  if (!parsed.ok) return { success: false, errors: [parsed.error] };

  const value = parsed.value;
  let config: ValidatedConfig | undefined;
  let questionCandidates: unknown[];

  if (Array.isArray(value)) {
    if (value.length > 0 && (value[0] as { config_type?: string }).config_type === "student_quiz_setup") {
      const cfg = StudentConfigSchema.safeParse(value[0]);
      if (!cfg.success) {
        return { success: false, errors: cfg.error.issues.map((i) => `config: ${i.path.join(".")}: ${i.message}`) };
      }
      config = cfg.data;
      questionCandidates = value.slice(1);
    } else {
      questionCandidates = value;
    }
  } else if (value && typeof value === "object") {
    const obj = value as { config?: unknown; questions?: unknown };
    if (obj.config !== undefined && obj.config !== null) {
      const cfg = StudentConfigSchema.safeParse(obj.config);
      if (!cfg.success) {
        return { success: false, errors: cfg.error.issues.map((i) => `config: ${i.path.join(".")}: ${i.message}`) };
      }
      config = cfg.data;
    }
    if (!Array.isArray(obj.questions)) {
      return { success: false, errors: ["Object form requires a 'questions' array"] };
    }
    questionCandidates = obj.questions;
  } else {
    return { success: false, errors: [`Top-level value must be array or object, got ${typeof value}`] };
  }

  const questions: ValidatedQuestion[] = [];
  const errors: string[] = [];
  for (let i = 0; i < questionCandidates.length; i++) {
    const result = QuestionSchema.safeParse(questionCandidates[i]);
    if (!result.success) {
      errors.push(`question[${i}]: ${result.error.issues.map((iss) => `${iss.path.join(".")}: ${iss.message}`).join("; ")}`);
      continue;
    }
    const q = result.data;
    if (q.question_type === "mcq") {
      if (!Object.keys(q.answer_options).includes(q.correct_answer)) {
        errors.push(`question[${i}] (${q.skill_code}): correct_answer "${q.correct_answer}" not in answer_options`);
        continue;
      }
      const wrongKeys = Object.keys(q.answer_options).filter((k) => k !== q.correct_answer);
      const whyWrong = q.explanation.why_wrong ?? {};
      const missing = wrongKeys.filter((k) => !(k in whyWrong));
      if (missing.length > 0) {
        errors.push(`question[${i}] (${q.skill_code}): why_wrong missing keys: ${missing.join(", ")}`);
        continue;
      }
    }
    questions.push(q);
  }

  if (questions.length === 0) {
    return { success: false, errors: errors.length > 0 ? errors : ["No valid questions in output"] };
  }

  return { success: true, data: { config, questions }, errors };
}

export function deduplicateQuestions(questions: ValidatedQuestion[]): {
  deduplicated: ValidatedQuestion[];
  skipped: number;
} {
  const seen = new Set<string>();
  const deduplicated: ValidatedQuestion[] = [];
  for (const q of questions) {
    const key = q.question_text.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduplicated.push(q);
  }
  return { deduplicated, skipped: questions.length - deduplicated.length };
}

export function validateExplanation(raw: unknown): ValidationResult<ValidatedExplanation> {
  const parsed = safeJsonParse(raw);
  if (!parsed.ok) return { success: false, errors: [parsed.error] };
  const result = ExplanationSchema.safeParse(parsed.value);
  if (!result.success) {
    return { success: false, errors: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) };
  }
  return { success: true, data: result.data, errors: [] };
}

export function validateRemediation(raw: unknown): ValidationResult<ValidatedRemediation> {
  const parsed = safeJsonParse(raw);
  if (!parsed.ok) return { success: false, errors: [parsed.error] };
  const result = RemediationSchema.safeParse(parsed.value);
  if (!result.success) {
    return { success: false, errors: result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`) };
  }
  return { success: true, data: result.data, errors: [] };
}
