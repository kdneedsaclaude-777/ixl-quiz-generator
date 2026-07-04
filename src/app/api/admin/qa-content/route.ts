import { prisma } from "@/lib/db";
import { getAdminForApi } from "@/lib/auth/admin";
import { pickTemplate, type SkillRecord } from "@/lib/ai/mock";

// QA harness (Claude-as-QA): generates a sample question for every active skill
// at low/medium/high difficulty via the real template engine, validates each,
// and returns a CSV of functional test cases (open in Excel).
//
// Checks per generated question:
//   STRUCTURE — non-empty text, exactly 4 options A–D, correct_answer is a real
//               option key.
//   TOPIC     — the question actually matches the skill's operation (this is the
//               "wrong questions for place value" class of bug).

function expectedCategory(skillName: string, groupName: string): string {
  const n = skillName.toLowerCase();
  const g = groupName.toLowerCase();
  if (/word problem/.test(n)) return "word";
  if (/perimeter/.test(n)) return "perimeter";
  if (/area/.test(n)) return "area";
  if (/multiplication|multiply|product|factor/.test(n)) return "multiply";
  if (/divis|divide|quotient|remainder/.test(n)) return "divide";
  if (/addition|\badd\b|sum/.test(n)) return "add";
  if (/subtract|difference/.test(n)) return "subtract";
  if (/fraction|mixed number|denominator|numerator/.test(n)) return "fraction";
  if (/integer|negative|absolute/.test(n)) return "integer";
  if (/percent/.test(n)) return "percent";
  if (/place value|value of (a |the )?digit|expanded form|standard form|word form|\brounding?\b|compare (whole )?numbers?|greater than|less than|order(ing)? numbers?|number sense|digit value/.test(n))
    return "place_value";
  if (/place value|number sense/.test(g)) return "place_value";
  return "arithmetic";
}

// Does the generated question look like its expected category?
function topicMatch(category: string, text: string): boolean {
  const t = text.toLowerCase();
  switch (category) {
    case "multiply":
      return t.includes("×");
    case "divide":
      return t.includes("÷");
    case "add":
      return t.includes("+");
    case "subtract":
      return t.includes("−") || /\d\s*-\s*\d/.test(t);
    case "fraction":
      return t.includes("/") || t.includes("fraction");
    case "percent":
      return t.includes("%") || t.includes("percent");
    case "perimeter":
      return t.includes("perimeter");
    case "area":
      return t.includes("area");
    case "integer":
      return /-?\d/.test(t);
    case "place_value":
      return /place|value of the digit|which digit|round|greatest|greater|expanded/.test(t);
    case "word":
      return t.split(" ").length >= 6; // reads like a sentence
    default:
      return true; // generic arithmetic — accept any computation
  }
}

function csvCell(s: string): string {
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(): Promise<Response> {
  const auth = await getAdminForApi();
  if (!auth.ok) return new Response(auth.error, { status: auth.status });

  const skills = await prisma.skill.findMany({
    where: { active: true, topicGroup: { active: true } },
    include: { topicGroup: true },
    orderBy: [{ topicGroup: { gradeLevel: "asc" } }, { topicGroupId: "asc" }, { number: "asc" }],
  });

  const header = [
    "Grade",
    "Topic Group",
    "Skill Code",
    "Skill Name",
    "Difficulty",
    "Question",
    "Correct",
    "Options",
    "Expected",
    "Topic PASS",
    "Structure PASS",
    "Notes",
  ];
  const rows: string[] = [header.map(csvCell).join(",")];
  let total = 0;
  let topicFail = 0;
  let structFail = 0;

  for (const s of skills) {
    const rec: SkillRecord = {
      id: s.id,
      code: s.code,
      number: s.number,
      name: s.name,
      topicGroup: { letter: s.topicGroup.letter, name: s.topicGroup.name, gradeLevel: s.topicGroup.gradeLevel },
    };
    const category = expectedCategory(s.name, s.topicGroup.name);
    const tpl = pickTemplate(rec);
    for (const difficulty of [1, 3, 5]) {
      total += 1;
      let q;
      try {
        q = tpl(rec, difficulty, difficulty);
      } catch (e) {
        structFail += 1;
        rows.push(
          [s.topicGroup.gradeLevel, s.topicGroup.name, s.code, s.name, difficulty, "", "", "", category, "", "FAIL", `threw: ${(e as Error).message}`]
            .map((c) => csvCell(String(c)))
            .join(","),
        );
        continue;
      }
      const opts = q.answer_options as Record<string, string>;
      const keys = Object.keys(opts);
      const structOk =
        Boolean(q.question_text) && keys.length === 4 && keys.includes(q.correct_answer) && Boolean(opts[q.correct_answer]);
      const topicOk = topicMatch(category, q.question_text);
      if (!structOk) structFail += 1;
      if (!topicOk) topicFail += 1;
      const optStr = keys.map((k) => `${k}) ${opts[k]}`).join(" | ");
      const notes = [!structOk ? "bad structure" : "", !topicOk ? `does not look like ${category}` : ""].filter(Boolean).join("; ");
      rows.push(
        [
          s.topicGroup.gradeLevel,
          s.topicGroup.name,
          s.code,
          s.name,
          difficulty,
          q.question_text,
          `${q.correct_answer}) ${opts[q.correct_answer] ?? "?"}`,
          optStr,
          category,
          topicOk ? "PASS" : "FAIL",
          structOk ? "PASS" : "FAIL",
          notes,
        ]
          .map((c) => csvCell(String(c)))
          .join(","),
      );
    }
  }

  // Summary as a trailing comment row.
  rows.push("");
  rows.push([`SUMMARY: ${total} cases`, `topic FAIL: ${topicFail}`, `structure FAIL: ${structFail}`].map(csvCell).join(","));

  return new Response(rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="content-qa.csv"',
      "Cache-Control": "no-store",
    },
  });
}
