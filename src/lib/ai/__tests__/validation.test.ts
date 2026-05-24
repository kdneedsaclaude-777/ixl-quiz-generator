import { describe, it, expect } from "vitest";
import {
  validateQuizOutput,
  deduplicateQuestions,
  stripMarkdownFences,
  type ValidatedQuestion,
} from "@/lib/ai/validation";

function validQuestion(over: Partial<ValidatedQuestion> = {}): ValidatedQuestion {
  return {
    id: "q1",
    grade: 4,
    subject: "math",
    topic_group_letter: "B",
    topic_group_name: "Multiplication",
    skill_code: "B.1",
    skill_name: "Multiply by 2",
    ixl_skill_ref: "grade4-B-1",
    difficulty: 2,
    question_type: "mcq",
    question_style: "conceptual",
    question_text: "What is 2 x 3?",
    answer_options: { A: "5", B: "6", C: "7", D: "8" },
    correct_answer: "B",
    display_label: "Multiply by 2",
    needs_visual: false,
    visual_note: null,
    visual_svg: null,
    learning_objective: "Multiply single digits",
    concept_tags: ["multiplication"],
    explanation: {
      short: "2 x 3 = 6",
      step_by_step: ["Multiply 2 by 3", "The product is 6"],
      why_wrong: { A: "too low", C: "too high", D: "too high" },
    },
    tone_grade: 4,
    estimated_complexity: "low",
    remediation_flag: false,
    weak_skill_targeted: false,
    ...over,
  };
}

describe("stripMarkdownFences", () => {
  it("removes ```json fences and is idempotent", () => {
    expect(stripMarkdownFences('```json\n{"a":1}\n```')).toBe('{"a":1}');
    expect(stripMarkdownFences('{"a":1}')).toBe('{"a":1}');
  });
});

describe("validateQuizOutput", () => {
  it("accepts a bare array of valid questions", () => {
    const r = validateQuizOutput(JSON.stringify([validQuestion()]));
    expect(r.success).toBe(true);
    expect(r.data?.questions).toHaveLength(1);
  });

  it("extracts a leading config object from the array form", () => {
    const config = {
      config_type: "student_quiz_setup",
      student_grade: 4,
      configured_by: "parent",
      selected_topic_groups: ["B"],
      selected_topic_names: ["Multiplication"],
      tutor_approved: true,
      approval_required_for: ["grade_change"],
      starting_difficulty: 2,
      adaptive_mode: true,
      notes: "ok",
    };
    const r = validateQuizOutput(JSON.stringify([config, validQuestion()]));
    expect(r.success).toBe(true);
    expect(r.data?.config?.config_type).toBe("student_quiz_setup");
    expect(r.data?.questions).toHaveLength(1);
  });

  it("accepts the { questions } object form, fences and all", () => {
    const raw = "```json\n" + JSON.stringify({ questions: [validQuestion()] }) + "\n```";
    expect(validateQuizOutput(raw).success).toBe(true);
  });

  it("rejects an mcq whose correct_answer is not an option", () => {
    const r = validateQuizOutput(
      JSON.stringify([validQuestion({ correct_answer: "Z" })]),
    );
    expect(r.success).toBe(false);
  });

  it("rejects an mcq missing a why_wrong entry", () => {
    const q = validQuestion();
    q.explanation.why_wrong = { A: "only one" };
    const r = validateQuizOutput(JSON.stringify([q]));
    expect(r.success).toBe(false);
  });

  it("rejects non-JSON and wrong top-level types", () => {
    expect(validateQuizOutput("not json").success).toBe(false);
    expect(validateQuizOutput(JSON.stringify(42)).success).toBe(false);
  });
});

describe("deduplicateQuestions", () => {
  it("removes questions with identical text (case/space-insensitive)", () => {
    const a = validQuestion({ id: "a", question_text: "What is 2 x 3?" });
    const b = validQuestion({ id: "b", question_text: "  what is 2 X 3? " });
    const c = validQuestion({ id: "c", question_text: "What is 5 + 5?" });
    const { deduplicated, skipped } = deduplicateQuestions([a, b, c]);
    expect(deduplicated).toHaveLength(2);
    expect(skipped).toBe(1);
  });
});
