import { readFileSync } from "node:fs";
import { join } from "node:path";

export type GenerateQuizInputs = {
  grade: number;
  topic_group_letter: string;
  skill_codes: string[];
  difficulty: number;
  question_count: number;
  weak_skill_codes: string[];
};

let cachedSkillMd: string | null = null;
const cachedGradeRefs = new Map<number, string>();

function loadSkillMd(): string {
  if (cachedSkillMd) return cachedSkillMd;
  cachedSkillMd = readFileSync(join(process.cwd(), "SKILL.md"), "utf8");
  return cachedSkillMd;
}

function loadGradeRef(grade: number): string {
  const cached = cachedGradeRefs.get(grade);
  if (cached) return cached;
  const content = readFileSync(
    join(process.cwd(), "references", `grade${grade}.md`),
    "utf8",
  );
  cachedGradeRefs.set(grade, content);
  return content;
}

export function buildGenerateQuizPrompt(inputs: GenerateQuizInputs): {
  system: string;
  user: string;
} {
  const skillMd = loadSkillMd();
  const gradeRef = loadGradeRef(inputs.grade);

  const system = `${skillMd}\n\n---\n\n# Grade ${inputs.grade} Skill Reference\n\n${gradeRef}`;

  const weakLine =
    inputs.weak_skill_codes.length > 0
      ? `Weak skill codes (weight 60% of questions toward these, 25% toward adjacent skills, 15% toward others): ${inputs.weak_skill_codes.join(", ")}`
      : "No weak skill data — distribute evenly across the listed skill codes, lower-numbered (more foundational) skills first.";

  const user = [
    `Generate an adaptive quiz with these parameters:`,
    ``,
    `- Grade: ${inputs.grade}`,
    `- Topic group letter: ${inputs.topic_group_letter}`,
    `- Skill codes available: ${inputs.skill_codes.join(", ")}`,
    `- Difficulty level: ${inputs.difficulty} (1=recall, 2=understanding, 3=application, 4=analysis, 5=exam-style)`,
    `- Question count: ${inputs.question_count}`,
    `- ${weakLine}`,
    ``,
    `Follow the IXL Quiz Generator skill spec exactly:`,
    `- Question type by difficulty (Step 3 of the spec)`,
    `- Minimum 2 questions per skill code`,
    `- For every MCQ, include why_wrong covering all wrong options`,
    `- Every skill_code must exist in the Grade ${inputs.grade} reference above`,
    `- ixl_skill_ref format: grade${inputs.grade}-{letter}-{number}`,
    ``,
    `Output: a JSON array of question objects matching the schema in the SKILL spec exactly.`,
    ``,
    `Return JSON only. No markdown. No preamble.`,
  ].join("\n");

  return { system, user };
}
