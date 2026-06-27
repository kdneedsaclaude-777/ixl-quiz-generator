// Pure helpers for proctored "test" mode quizzes. No DB access (matches the
// codebase convention that domain modules are pure and unit-testable). The
// flagged-question ids are stored as a JSON TEXT column on Quiz, same pattern
// as HomeworkAssignment.assignedSkillIds.

export const DEFAULT_TEST_TIME_LIMIT_SEC = 1200; // 20 minutes
export const TEST_TIMER_DANGER_SEC = 120; // turn the timer red at ≤ 2:00 left

export function isTestMode(mode: string | null | undefined): boolean {
  return mode === "test";
}

// Tolerant parse of the JSON int[] stored in Quiz.flaggedQuestionIds.
export function parseFlaggedIds(raw: string | null | undefined): number[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((n): n is number => typeof n === "number" && Number.isFinite(n));
  } catch {
    return [];
  }
}

export function serializeFlaggedIds(ids: Iterable<number>): string {
  return JSON.stringify([...new Set([...ids].filter((n) => Number.isFinite(n)))]);
}

// Clamp a requested time limit to a sane band (1 min – 1 hour).
export function clampTimeLimit(sec: number | null | undefined): number {
  if (typeof sec !== "number" || !Number.isFinite(sec)) return DEFAULT_TEST_TIME_LIMIT_SEC;
  return Math.min(3600, Math.max(60, Math.round(sec)));
}

// "mm:ss" for the intake/runner/result clocks.
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}
