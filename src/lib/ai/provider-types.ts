import type {
  ValidatedQuestion,
  ValidatedConfig,
  ValidatedExplanation,
  ValidatedRemediation,
} from "@/lib/ai/validation";

export type GeneratedQuestion = ValidatedQuestion;
export type StudentConfigBlock = ValidatedConfig;
export type Explanation = ValidatedExplanation;
export type Remediation = ValidatedRemediation;

export type GenerateQuizRequest = {
  studentId: number;
  questionCount?: number;
  isFirstQuiz?: boolean;
  // Manual-builder / targeted overrides. When topicGroupIds is set, generation
  // is restricted to skills in those groups (the 60/25/15 weak/adjacent/other
  // weighting still runs inside the restricted pool). difficultyOverride pins
  // every question to a fixed level instead of the student's adaptive level.
  topicGroupIds?: number[];
  difficultyOverride?: number;
  // Global Daily Challenge: allow generation on topicGroupIds even if the
  // student hasn't enabled them (the caller has already validated they're
  // grade-appropriate, active, and not parental-locked). Lets the challenge be
  // the same across a grade rather than limited to each child's enabled set.
  allowAnyGradeTopic?: boolean;
};

export type GenerateQuizResult = {
  config?: StudentConfigBlock;
  questions: GeneratedQuestion[];
  difficulty: number;
};

export type GenerateExplanationRequest = {
  question_text: string;
  correct_answer: string;
  grade: number;
  difficulty: number;
};

export type GenerateRemediationRequest = {
  studentId: number;
};
