export type GenerateRemediationInputs = {
  student_name: string;
  grade: number;
  weak_skill_codes: string[];
  recent_scores: number[];
};

export function buildGenerateRemediationPrompt(inputs: GenerateRemediationInputs): {
  system: string;
  user: string;
} {
  const system = [
    `You are an education advisor writing a brief, parent-friendly progress summary for a Grade ${inputs.grade} math student.`,
    ``,
    `Rules:`,
    `- Plain language only. No IXL skill codes (e.g. "S.1", "BB.7"). Translate codes into the topic name a parent would recognize.`,
    `- Be specific but encouraging. Two to three sentences for the summary.`,
    `- focus_skills: 3 friendly skill names a parent would recognize (e.g. "adding fractions", "reading bar graphs"), never the IXL codes.`,
    `- encouragement: 1-2 warm, age-appropriate sentences addressed to the student.`,
    ``,
    `Output JSON matching this schema exactly:`,
    `{`,
    `  "summary": string,         // 2-3 sentence parent-facing overview`,
    `  "focus_skills": string[],  // 3 friendly skill names`,
    `  "encouragement": string    // 1-2 warm sentences for the student`,
    `}`,
  ].join("\n");

  const weakLine =
    inputs.weak_skill_codes.length > 0
      ? inputs.weak_skill_codes.join(", ")
      : "no weak skills flagged yet";

  const scoresLine =
    inputs.recent_scores.length > 0
      ? inputs.recent_scores.map((s) => `${Math.round(s)}%`).join(", ")
      : "no quiz scores recorded yet";

  const user = [
    `Student: ${inputs.student_name}`,
    `Grade: ${inputs.grade}`,
    `Weak skill codes: ${weakLine}`,
    `Recent quiz scores (newest first): ${scoresLine}`,
    ``,
    `Return JSON only. No markdown. No preamble.`,
  ].join("\n");

  return { system, user };
}
