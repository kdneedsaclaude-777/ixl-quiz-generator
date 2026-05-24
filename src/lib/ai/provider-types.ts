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
