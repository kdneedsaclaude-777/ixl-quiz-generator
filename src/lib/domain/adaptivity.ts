// Pure adaptive engine. No DB calls, no AI, no I/O.
// Implements the rules from SKILL.md §Adaptive engine rules.

export type AdaptivityInput = {
  currentDifficulty: number;
  currentSkillCode: string;
  quizScore: number;
  consecutiveCorrect: number;
  recentScores: number[];
};

export type AdaptivityOutput = {
  newDifficulty: number;
  newSkillCode: string;
  remediationFlag: boolean;
  progressionNote: string;
};

const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 5;
const ADVANCE_THRESHOLD = 80;
const HOLD_LOWER = 50;
const MASTERY_STREAK = 3;
const REMEDIATION_FAILURES = 2;

function shiftSkillCode(code: string, delta: number): string {
  const match = /^([A-Z]+)\.(\d+)$/.exec(code);
  if (!match) return code;
  const [, letter, num] = match;
  const next = Math.max(1, parseInt(num, 10) + delta);
  return `${letter}.${next}`;
}

export function applyAdaptivity(input: AdaptivityInput): AdaptivityOutput {
  const { currentDifficulty, currentSkillCode, quizScore, consecutiveCorrect, recentScores } =
    input;

  let newDifficulty = currentDifficulty;
  let newSkillCode = currentSkillCode;
  let progressionNote = "Holding position to consolidate.";

  if (quizScore >= ADVANCE_THRESHOLD && consecutiveCorrect >= MASTERY_STREAK) {
    newSkillCode = shiftSkillCode(currentSkillCode, 1);
    newDifficulty = Math.min(MAX_DIFFICULTY, currentDifficulty + 1);
    progressionNote = `Mastery streak — advanced to ${newSkillCode} at difficulty ${newDifficulty}.`;
  } else if (quizScore >= ADVANCE_THRESHOLD) {
    newDifficulty = Math.min(MAX_DIFFICULTY, currentDifficulty + 1);
    progressionNote =
      newDifficulty > currentDifficulty
        ? `Strong score — difficulty raised to ${newDifficulty}.`
        : `Strong score — already at maximum difficulty (${MAX_DIFFICULTY}).`;
  } else if (quizScore >= HOLD_LOWER) {
    progressionNote = "Hold — staying on the same skills and difficulty.";
  } else {
    newDifficulty = Math.max(MIN_DIFFICULTY, currentDifficulty - 1);
    newSkillCode = shiftSkillCode(currentSkillCode, -1);
    progressionNote = `Below ${HOLD_LOWER}% — stepping back to ${newSkillCode} at difficulty ${newDifficulty}.`;
  }

  const failuresOnSkill = recentScores.filter((s) => s < HOLD_LOWER).length;
  const remediationFlag = failuresOnSkill >= REMEDIATION_FAILURES;
  if (remediationFlag) {
    progressionNote += ` Remediation flagged after ${failuresOnSkill} sub-50% quiz(es).`;
  }

  return { newDifficulty, newSkillCode, remediationFlag, progressionNote };
}

// Weighted rolling average. Higher weight = more influence.
// Caller chooses weighting (e.g. exponential decay [1, 0.7, 0.49, ...]) so this
// stays a pure utility.
export function calculateMastery(attempts: number[], weights: number[]): number {
  if (attempts.length === 0) return 0;
  if (attempts.length !== weights.length) {
    throw new Error(
      `calculateMastery: attempts (${attempts.length}) and weights (${weights.length}) must have the same length`,
    );
  }
  let weightedSum = 0;
  let weightTotal = 0;
  for (let i = 0; i < attempts.length; i++) {
    weightedSum += attempts[i] * weights[i];
    weightTotal += weights[i];
  }
  return weightTotal === 0 ? 0 : weightedSum / weightTotal;
}
