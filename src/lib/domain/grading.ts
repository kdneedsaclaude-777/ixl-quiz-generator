// Single source of truth for "is this answer correct?", shared by the submit
// endpoint (authoritative) and both quiz runners (immediate feedback) so the
// client preview and the server score can never disagree.
//
// - mcq: exact option-key match ("B" === "B").
// - true_false: case-insensitive ("True" === "true").
// - fill_in_the_blank: numeric-only by product decision — "5", " 5.0 ",
//   "+5", "1,000" all normalize and compare numerically.
// - short_answer: numeric when both sides are numeric, otherwise a trimmed
//   case-insensitive text match.

export type GradeableType =
  | "mcq"
  | "true_false"
  | "fill_in_the_blank"
  | "short_answer";

export function normalizeNumeric(input: string): number | null {
  const cleaned = (input ?? "")
    .trim()
    .replace(/[,\s]/g, "")
    .replace(/^\+/, "")
    .replace(/−/g, "-"); // unicode minus → ASCII
  if (cleaned === "" || !/^-?(?:\d+\.?\d*|\.\d+)$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function gradeAnswer(
  questionType: string,
  submitted: string,
  correct: string,
): boolean {
  const s = (submitted ?? "").trim();
  const c = (correct ?? "").trim();
  if (s === "") return false;

  if (questionType === "fill_in_the_blank") {
    const a = normalizeNumeric(s);
    const b = normalizeNumeric(c);
    return a !== null && b !== null && a === b;
  }

  if (questionType === "short_answer") {
    const a = normalizeNumeric(s);
    const b = normalizeNumeric(c);
    if (a !== null && b !== null) return a === b;
    return s.toLowerCase() === c.toLowerCase();
  }

  if (questionType === "true_false") {
    return s.toLowerCase() === c.toLowerCase();
  }

  // mcq (and any unknown type) → exact key match.
  return s === c;
}

// Types where the learner types a free-form answer rather than picking an
// option — used by the runners to decide input vs. radio rendering.
export function isFreeInputType(questionType: string): boolean {
  return (
    questionType === "fill_in_the_blank" || questionType === "short_answer"
  );
}
