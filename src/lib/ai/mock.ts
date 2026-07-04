import { prisma } from "@/lib/db";
import type {
  GenerateQuizRequest,
  GenerateQuizResult,
  GeneratedQuestion,
  StudentConfigBlock,
} from "@/lib/ai/provider-types";
import type { ValidatedExplanation, ValidatedRemediation } from "@/lib/ai/validation";

// Deterministic templates so the dev experience stays predictable when the
// real AI is unreachable. Mirrors the JSON contract in SKILL.md.

function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return () => {
    h = (h * 1664525 + 1013904223) | 0;
    return ((h >>> 0) % 100000) / 100000;
  };
}

export type SkillRecord = {
  id: number;
  code: string;
  number: number;
  name: string;
  topicGroup: { letter: string; name: string; gradeLevel: number };
};

export type Bucket = { skill: SkillRecord; count: number; weakTargeted: boolean };

// Exported for unit testing the 60/25/15 distribution weighting.
export function buildBuckets(args: {
  skillsByGroup: Map<string, SkillRecord[]>;
  weakSkillIds: Set<number>;
  totalQuestions: number;
}): Bucket[] {
  const { skillsByGroup, weakSkillIds, totalQuestions } = args;
  const allSkills = [...skillsByGroup.values()].flat();
  // No skills in the requested pool → no buckets. Return empty instead of
  // dividing by zero below (buckets[i % 0]) and crashing the whole request.
  if (allSkills.length === 0) return [];
  const weakSkills = allSkills.filter((s) => weakSkillIds.has(s.id));

  if (weakSkills.length === 0) {
    const sorted = allSkills.slice().sort((a, b) => a.number - b.number);
    const target = Math.min(Math.max(2, Math.ceil(totalQuestions / 2)), sorted.length);
    const picks = sorted.slice(0, target);
    const buckets: Bucket[] = picks.map((skill) => ({ skill, count: 0, weakTargeted: false }));
    let remaining = totalQuestions;
    let i = 0;
    while (remaining > 0) {
      buckets[i % buckets.length].count += 1;
      remaining -= 1;
      i += 1;
    }
    return buckets.filter((b) => b.count > 0);
  }

  const adjacentIds = new Set<number>();
  for (const ws of weakSkills) {
    const sameGroup = skillsByGroup.get(ws.topicGroup.letter) ?? [];
    for (const s of sameGroup) {
      if (Math.abs(s.number - ws.number) === 1) adjacentIds.add(s.id);
    }
  }
  for (const id of weakSkillIds) adjacentIds.delete(id);

  const otherSkills = allSkills.filter(
    (s) => !weakSkillIds.has(s.id) && !adjacentIds.has(s.id),
  );

  const weakCount = Math.max(weakSkills.length * 2, Math.round(totalQuestions * 0.6));
  const adjacentCount = Math.round(totalQuestions * 0.25);
  const otherCount = Math.max(0, totalQuestions - weakCount - adjacentCount);

  const buckets: Bucket[] = [];
  distribute(weakSkills, weakCount, true, buckets);
  distribute(allSkills.filter((s) => adjacentIds.has(s.id)), adjacentCount, false, buckets);
  distribute(otherSkills, otherCount, false, buckets);
  return buckets.filter((b) => b.count > 0);
}

function distribute(pool: SkillRecord[], total: number, weak: boolean, out: Bucket[]): void {
  if (pool.length === 0 || total <= 0) return;
  const buckets: Bucket[] = pool.map((skill) => ({ skill, count: 0, weakTargeted: weak }));
  let remaining = total;
  for (const b of buckets) {
    const give = Math.min(2, remaining);
    b.count += give;
    remaining -= give;
    if (remaining <= 0) break;
  }
  let i = 0;
  while (remaining > 0) {
    buckets[i % buckets.length].count += 1;
    remaining -= 1;
    i += 1;
  }
  for (const b of buckets) if (b.count > 0) out.push(b);
}

type Template = (skill: SkillRecord, difficulty: number, variant: number) => GeneratedQuestion;

export function pickTemplate(skill: SkillRecord): Template {
  const name = skill.name.toLowerCase();
  const groupName = skill.topicGroup.name.toLowerCase();
  // Word-problem skills must read like a story, not a bare computation —
  // checked before the operation keywords so it isn't shadowed by "fraction"
  // etc. in the same skill name.
  if (/word problem/.test(name)) return wordProblemTemplate;
  if (/perimeter/.test(name)) return perimeterTemplate;
  if (/area/.test(name)) return areaTemplate;
  if (/multiplication|multiply|product|factor/.test(name)) return multiplicationTemplate;
  if (/divis|divide|quotient|remainder/.test(name)) return divisionTemplate;
  if (/addition|\badd\b|sum/.test(name)) return additionTemplate;
  if (/subtract|difference/.test(name)) return subtractionTemplate;
  if (/fraction|mixed number|denominator|numerator/.test(name)) return fractionTemplate;
  if (/integer|negative|absolute/.test(name)) return integerTemplate;
  if (/percent/.test(name)) return percentTemplate;
  // Place value / number sense: value of a digit, which digit is in a place,
  // rounding, comparing/ordering numbers, expanded/standard/word form. Checked
  // after the operation keywords (so "compare fractions" still → fractions).
  if (
    /place value|value of (a |the )?digit|expanded form|standard form|word form|\brounding?\b|compare (whole )?numbers?|greater than|less than|order(ing)? numbers?|number sense|digit value/.test(
      name,
    )
  ) {
    return placeValueTemplate;
  }
  // Fall back to topic-group hints so unmatched skill names still produce
  // natural, grade-appropriate phrasing instead of generic placeholders.
  if (/multiplication|multiply/.test(groupName)) return multiplicationTemplate;
  if (/divis/.test(groupName)) return divisionTemplate;
  if (/addition|subtraction/.test(groupName)) return additionTemplate;
  if (/fraction/.test(groupName)) return fractionTemplate;
  if (/integer/.test(groupName)) return integerTemplate;
  if (/percent/.test(groupName)) return percentTemplate;
  if (/place value|number sense/.test(groupName)) return placeValueTemplate;
  if (/measurement|geometry/.test(groupName)) return areaTemplate;
  return naturalArithmeticTemplate;
}

// Map an IXL skill name to a plausible operand range so questions stay
// inside the curriculum's intended scope. "Addition facts up to 20" must
// produce single-digit operands; "three-digit numbers" must produce 100–999;
// "1-digit by 2-digit" gives a mixed mul/div range. Difficulty acts as a
// soft scaler when the name doesn't constrain the digits explicitly.
type Range = { min: number; max: number };
type OperandSpec = { a: Range; b: Range };

function rangeForDigits(d: number): Range {
  if (d <= 1) return { min: 1, max: 9 };
  if (d === 2) return { min: 10, max: 99 };
  if (d === 3) return { min: 100, max: 999 };
  if (d === 4) return { min: 1000, max: 9999 };
  return { min: 10000, max: 99999 };
}

function digitsFromName(name: string): { a: number | null; b: number | null } {
  const lower = name.toLowerCase();
  // Patterns like "1-digit numbers by 2-digit numbers" or "3-digit numbers by 2-digit numbers"
  const pair = /(\d+)-digit\s+numbers?\s+by\s+(\d+)-digit/.exec(lower);
  if (pair) return { a: parseInt(pair[1], 10), b: parseInt(pair[2], 10) };
  const byLarger = /(\d+)-digit\s+numbers?\s+by\s+(?:larger|multi-?digit)/.exec(lower);
  if (byLarger) return { a: parseInt(byLarger[1], 10), b: 3 };
  // Single phrase like "two-digit numbers" / "2-digit"
  const word = /(two|three|four|five)-digit/.exec(lower);
  const wordMap: Record<string, number> = { two: 2, three: 3, four: 4, five: 5 };
  if (word) return { a: wordMap[word[1]], b: wordMap[word[1]] };
  const single = /(\d+)-digit/.exec(lower);
  if (single) {
    const d = parseInt(single[1], 10);
    return { a: d, b: d };
  }
  return { a: null, b: null };
}

function operandSpec(skill: SkillRecord, difficulty: number, op: "+" | "-" | "*" | "/"): OperandSpec {
  const lower = skill.name.toLowerCase();
  // "Facts up to 20" / "facts up to 18" / "facts up to N" → single digits.
  const factsCap = /facts?\s+up\s+to\s+(\d+)/.exec(lower);
  if (factsCap) {
    const cap = Math.min(parseInt(factsCap[1], 10), 20);
    const half = Math.max(1, Math.floor(cap / 2));
    return { a: { min: 1, max: half }, b: { min: 1, max: half } };
  }
  if (/facts?\s+to\s+(10|12)/.test(lower)) {
    return { a: { min: 1, max: 9 }, b: { min: 1, max: 9 } };
  }
  const digits = digitsFromName(lower);
  if (digits.a !== null && digits.b !== null) {
    return { a: rangeForDigits(digits.a), b: rangeForDigits(digits.b) };
  }
  // Fallback: scale by difficulty. Level 1 ≤ single digit, Level 5 ≤ 4-digit.
  const cap = Math.min(1 + difficulty, 5);
  if (op === "*" || op === "/") {
    return { a: rangeForDigits(Math.min(cap, 2)), b: rangeForDigits(1) };
  }
  return { a: rangeForDigits(cap), b: rangeForDigits(cap) };
}

function pick(rng: () => number, range: Range): number {
  return range.min + Math.floor(rng() * (range.max - range.min + 1));
}

function nextDistractor(correct: number, used: Set<number>, rng: () => number): number {
  for (let attempt = 0; attempt < 50; attempt++) {
    const offset =
      Math.max(1, Math.round(correct * 0.15) + Math.floor(rng() * 5)) * (rng() > 0.5 ? 1 : -1);
    const candidate = correct + offset;
    if (candidate !== correct && !used.has(candidate) && candidate >= 0) {
      used.add(candidate);
      return candidate;
    }
  }
  let fallback = correct + used.size + 1;
  while (used.has(fallback)) fallback += 1;
  used.add(fallback);
  return fallback;
}

function mcqOptions(
  correct: number,
  rng: () => number,
  unit = "",
): { options: Record<string, string>; correctKey: string } {
  const used = new Set<number>([correct]);
  const distractors = [
    nextDistractor(correct, used, rng),
    nextDistractor(correct, used, rng),
    nextDistractor(correct, used, rng),
  ];
  const all = [correct, ...distractors];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  const keys = ["A", "B", "C", "D"];
  const options: Record<string, string> = {};
  let correctKey = "A";
  all.forEach((value, idx) => {
    options[keys[idx]] = unit ? `${value} ${unit}` : `${value}`;
    if (value === correct) correctKey = keys[idx];
  });
  return { options, correctKey };
}

// ── Place value / number sense ─────────────────────────────────────────────
const PV_PLACES: { name: string; val: number }[] = [
  { name: "ones", val: 1 },
  { name: "tens", val: 10 },
  { name: "hundreds", val: 100 },
  { name: "thousands", val: 1000 },
  { name: "ten thousands", val: 10000 },
  { name: "hundred thousands", val: 100000 },
];

// Options builder that accepts pedagogically-chosen distractors (unlike the
// numeric-noise mcqOptions), dedupes, pads to 4, shuffles, formats with commas.
function pvOptions(
  correct: number,
  distractors: number[],
  rng: () => number,
): { options: Record<string, string>; correctKey: string } {
  const used = new Set<number>([correct]);
  const chosen: number[] = [];
  for (const d of distractors) {
    if (chosen.length >= 3) break;
    if (Number.isFinite(d) && d >= 0 && !used.has(d)) {
      used.add(d);
      chosen.push(d);
    }
  }
  let pad = correct + 1;
  while (chosen.length < 3) {
    if (!used.has(pad)) {
      used.add(pad);
      chosen.push(pad);
    }
    pad += 1;
  }
  const all = [correct, ...chosen];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  const keys = ["A", "B", "C", "D"];
  const options: Record<string, string> = {};
  let correctKey = "A";
  all.forEach((v, idx) => {
    options[keys[idx]] = v.toLocaleString("en-US");
    if (v === correct) correctKey = keys[idx];
  });
  return { options, correctKey };
}

function placeLabel(name: string): string {
  if (name === "ten thousands") return "ten thousand";
  if (name === "hundred thousands") return "hundred thousand";
  return name.replace(/s$/, "");
}

const placeValueTemplate: Template = (skill, difficulty, variant) => {
  const rng = seededRandom(`${skill.code}-place-${difficulty}-${variant}`);
  // Digit count scales with difficulty: 3 (d1) … 6 (d4+).
  const digits = Math.min(6, Math.max(3, 2 + difficulty));
  const most = digits - 1; // highest available place index (0 = ones)
  const ds: number[] = [1 + Math.floor(rng() * 9)]; // leading digit 1–9
  for (let i = 1; i < digits; i++) ds.push(Math.floor(rng() * 10));
  const N = Number(ds.join(""));
  const Nfmt = N.toLocaleString("en-US");
  const digitAt = (placeIdx: number) => ds[digits - 1 - placeIdx]; // placeIdx 0 = ones
  const base = {
    ...buildBase(skill, difficulty),
    learning_objective: "Understand place value and number sense",
    concept_tags: ["place value", "number sense"],
  };
  const sub = variant % 4;

  if (sub === 0) {
    // Value of a digit at a chosen (non-ones) place.
    const placeIdx = 1 + Math.floor(rng() * most);
    const place = PV_PLACES[placeIdx];
    const d = digitAt(placeIdx);
    const correct = d * place.val;
    const { options, correctKey } = pvOptions(
      correct,
      [d, d * place.val * 10, Math.floor((d * place.val) / 10), (d + 1) * place.val],
      rng,
    );
    return {
      ...base,
      question_text: `In the number ${Nfmt}, what is the value of the digit ${d} (in the ${place.name} place)?`,
      answer_options: options,
      correct_answer: correctKey,
      explanation: {
        short: `The digit ${d} is in the ${place.name} place, so its value is ${d} × ${place.val.toLocaleString("en-US")} = ${correct.toLocaleString("en-US")}.`,
        step_by_step: [
          `The digit ${d} sits in the ${place.name} place, which is worth ${place.val.toLocaleString("en-US")}.`,
          `Value = digit × place value = ${d} × ${place.val.toLocaleString("en-US")} = ${correct.toLocaleString("en-US")}.`,
        ],
        why_wrong: Object.fromEntries(
          Object.entries(options)
            .filter(([k]) => k !== correctKey)
            .map(([k, v]) => [k, `${v} is not ${d} × ${place.val.toLocaleString("en-US")}.`]),
        ),
        revision_tip: "A digit's value = the digit × the value of its place.",
      },
    };
  }

  if (sub === 1) {
    // Which digit is in a given place?
    const placeIdx = Math.floor(rng() * digits);
    const place = PV_PLACES[placeIdx];
    const correct = digitAt(placeIdx);
    const { options, correctKey } = pvOptions(
      correct,
      [digitAt((placeIdx + 1) % digits), digitAt((placeIdx + 2) % digits), (correct + 4) % 10],
      rng,
    );
    return {
      ...base,
      question_text: `Which digit is in the ${place.name} place of ${Nfmt}?`,
      answer_options: options,
      correct_answer: correctKey,
      explanation: {
        short: `Reading ${Nfmt} by place, the ${place.name} place holds ${correct}.`,
        step_by_step: [
          `Places from the right: ones, tens, hundreds, thousands, …`,
          `The ${place.name} place of ${Nfmt} is ${correct}.`,
        ],
        why_wrong: Object.fromEntries(
          Object.entries(options)
            .filter(([k]) => k !== correctKey)
            .map(([k, v]) => [k, `${v} is not the digit in the ${place.name} place.`]),
        ),
        revision_tip: "Count places from the right: ones, tens, hundreds, …",
      },
    };
  }

  if (sub === 2) {
    // Round to the nearest ten / hundred / thousand (a place below the top one).
    const placeIdx = 1 + Math.floor(rng() * Math.max(1, most - 1));
    const place = PV_PLACES[placeIdx];
    const correct = Math.round(N / place.val) * place.val;
    const { options, correctKey } = pvOptions(
      correct,
      [Math.floor(N / place.val) * place.val, Math.ceil(N / place.val) * place.val + place.val, N],
      rng,
    );
    return {
      ...base,
      question_text: `Round ${Nfmt} to the nearest ${placeLabel(place.name)}.`,
      answer_options: options,
      correct_answer: correctKey,
      explanation: {
        short: `${Nfmt} rounded to the nearest ${placeLabel(place.name)} is ${correct.toLocaleString("en-US")}.`,
        step_by_step: [
          `Look at the digit just to the right of the ${place.name} place.`,
          `If it is 5 or more, round up; otherwise round down → ${correct.toLocaleString("en-US")}.`,
        ],
        why_wrong: Object.fromEntries(
          Object.entries(options)
            .filter(([k]) => k !== correctKey)
            .map(([k, v]) => [k, `${v} is not ${Nfmt} rounded to the nearest ${placeLabel(place.name)}.`]),
        ),
        revision_tip: "Check the digit immediately to the right of the rounding place.",
      },
    };
  }

  // sub === 3 → compare: which number is the greatest?
  const nums = new Set<number>([N]);
  const step = PV_PLACES[Math.min(most, 2)].val;
  while (nums.size < 4) {
    const delta = (1 + Math.floor(rng() * 9)) * step * (rng() < 0.5 ? -1 : 1);
    nums.add(Math.max(0, N + delta));
  }
  const arr = [...nums];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const maxV = Math.max(...arr);
  const keys = ["A", "B", "C", "D"];
  const options: Record<string, string> = {};
  let correctKey = "A";
  arr.forEach((v, idx) => {
    options[keys[idx]] = v.toLocaleString("en-US");
    if (v === maxV) correctKey = keys[idx];
  });
  return {
    ...base,
    question_text: "Which of these numbers is the greatest?",
    answer_options: options,
    correct_answer: correctKey,
    explanation: {
      short: `${maxV.toLocaleString("en-US")} is the greatest.`,
      step_by_step: [
        "Compare the numbers starting from the highest place value.",
        `The largest is ${maxV.toLocaleString("en-US")}.`,
      ],
      why_wrong: Object.fromEntries(
        Object.entries(options)
          .filter(([k]) => k !== correctKey)
          .map(([k, v]) => [k, `${v} is not the greatest of the four.`]),
      ),
      revision_tip: "Compare digits from the leftmost (highest) place first.",
    },
  };
};

function buildBase(
  skill: SkillRecord,
  difficulty: number,
): Omit<
  GeneratedQuestion,
  | "question_text"
  | "answer_options"
  | "correct_answer"
  | "explanation"
  | "concept_tags"
  | "learning_objective"
> {
  return {
    id: `${skill.code}-${difficulty}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    grade: skill.topicGroup.gradeLevel,
    subject: "math",
    topic_group_letter: skill.topicGroup.letter,
    topic_group_name: skill.topicGroup.name,
    skill_code: skill.code,
    skill_name: skill.name,
    ixl_skill_ref: `grade${skill.topicGroup.gradeLevel}-${skill.topicGroup.letter}-${skill.number}`,
    difficulty,
    question_type: "mcq",
    question_style: difficulty >= 3 ? "word_problem" : "conceptual",
    display_label: skill.name,
    needs_visual: false,
    visual_note: null,
    visual_svg: null,
    tone_grade: skill.topicGroup.gradeLevel,
    estimated_complexity: difficulty <= 2 ? "low" : difficulty <= 4 ? "medium" : "high",
    remediation_flag: false,
    weak_skill_targeted: false,
  };
}

// A rectangle diagram with the *actual* dimensions labelled on it, scaled to
// keep the proportions readable. Only allowlisted SVG elements/attrs are used
// so it survives sanitizeSvg unchanged.
function rectangleSvg(length: number, width: number, unit = "cm"): string {
  const MAX = 150;
  const MIN = 46;
  const scale = MAX / Math.max(length, width);
  const w = Math.max(MIN, Math.round(length * scale)); // length → horizontal
  const h = Math.max(MIN, Math.round(width * scale)); // width → vertical
  const padX = 64;
  const padY = 42;
  const x = padX;
  const y = padY;
  const vbW = w + padX * 2;
  const vbH = h + padY * 2;
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    `<svg viewBox="0 0 ${vbW} ${vbH}" xmlns="http://www.w3.org/2000/svg">` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#eef2ff" stroke="#6366f1" stroke-width="3"/>` +
    `<text x="${cx}" y="${y - 14}" font-size="16" text-anchor="middle" fill="#475569">${length} ${unit}</text>` +
    `<text x="${x - 16}" y="${cy}" font-size="16" text-anchor="middle" fill="#475569" transform="rotate(-90 ${x - 16} ${cy})">${width} ${unit}</text>` +
    `</svg>`
  );
}

const perimeterTemplate: Template = (skill, difficulty, variant) => {
  const rng = seededRandom(`${skill.code}-perimeter-${difficulty}-${variant}`);
  const length = 4 + Math.floor(rng() * (6 + difficulty * 2));
  const width = 3 + Math.floor(rng() * (5 + difficulty));
  const correct = 2 * (length + width);
  const { options, correctKey } = mcqOptions(correct, rng, "cm");
  return {
    ...buildBase(skill, difficulty),
    needs_visual: true,
    visual_note: `A rectangle with length ${length} cm and width ${width} cm.`,
    visual_svg: rectangleSvg(length, width),
    question_text: `A rectangle has a length of ${length} cm and a width of ${width} cm. What is its perimeter?`,
    answer_options: options,
    correct_answer: correctKey,
    learning_objective: "Calculate the perimeter of a rectangle",
    concept_tags: ["perimeter", "rectangle", "measurement"],
    explanation: {
      short: `P = 2 × (length + width) = 2 × (${length} + ${width}) = ${correct} cm.`,
      step_by_step: [
        "Perimeter is the total distance around the outside of a shape.",
        `For a rectangle: P = 2 × (length + width).`,
        `P = 2 × (${length} + ${width}) = ${correct} cm.`,
      ],
      why_wrong: Object.fromEntries(
        Object.entries(options)
          .filter(([k]) => k !== correctKey)
          .map(([k, v]) => [k, `${v} doesn't match P = 2(l + w) for these dimensions.`]),
      ),
      misconception: "Students sometimes confuse perimeter with area.",
      revision_tip: "Add all four sides, or use P = 2l + 2w.",
    },
  };
};

const areaTemplate: Template = (skill, difficulty, variant) => {
  const rng = seededRandom(`${skill.code}-area-${difficulty}-${variant}`);
  const length = 3 + Math.floor(rng() * (5 + difficulty));
  const width = 2 + Math.floor(rng() * (4 + difficulty));
  const correct = length * width;
  const { options, correctKey } = mcqOptions(correct, rng, "sq cm");
  return {
    ...buildBase(skill, difficulty),
    needs_visual: true,
    visual_note: `A rectangle with length ${length} cm and width ${width} cm.`,
    visual_svg: rectangleSvg(length, width),
    question_text: `A rectangle has a length of ${length} cm and a width of ${width} cm. What is its area?`,
    answer_options: options,
    correct_answer: correctKey,
    learning_objective: "Calculate the area of a rectangle",
    concept_tags: ["area", "rectangle", "measurement"],
    explanation: {
      short: `A = length × width = ${length} × ${width} = ${correct} sq cm.`,
      step_by_step: [
        "Area measures the space inside a 2D shape.",
        "For a rectangle: A = length × width.",
        `A = ${length} × ${width} = ${correct} sq cm.`,
      ],
      why_wrong: Object.fromEntries(
        Object.entries(options)
          .filter(([k]) => k !== correctKey)
          .map(([k, v]) => [k, `${v} isn't ${length} × ${width}.`]),
      ),
      revision_tip: "Multiply the two side lengths to get area.",
    },
  };
};

const multiplicationTemplate: Template = (skill, difficulty, variant) => {
  const rng = seededRandom(`${skill.code}-mul-${difficulty}-${variant}`);
  const spec = operandSpec(skill, difficulty, "*");
  const a = pick(rng, spec.a);
  const b = pick(rng, spec.b);
  const correct = a * b;
  const { options, correctKey } = mcqOptions(correct, rng);
  return {
    ...buildBase(skill, difficulty),
    question_text: `What is ${a} × ${b}?`,
    answer_options: options,
    correct_answer: correctKey,
    learning_objective: "Multiply whole numbers",
    concept_tags: ["multiplication", "whole numbers"],
    explanation: {
      short: `${a} × ${b} = ${correct}.`,
      step_by_step: [
        `Multiplication is repeated addition: ${a} × ${b} means adding ${a} a total of ${b} times.`,
        `${a} × ${b} = ${correct}.`,
      ],
      why_wrong: Object.fromEntries(
        Object.entries(options)
          .filter(([k]) => k !== correctKey)
          .map(([k, v]) => [k, `${v} is not the product of ${a} and ${b}.`]),
      ),
      revision_tip: "Use a times-table chart if you forget a fact.",
    },
  };
};

const divisionTemplate: Template = (skill, difficulty, variant) => {
  const rng = seededRandom(`${skill.code}-div-${difficulty}-${variant}`);
  // For division, treat operandSpec.a as the dividend cap and .b as the divisor cap.
  const spec = operandSpec(skill, difficulty, "/");
  const divisor = Math.max(2, pick(rng, spec.b));
  const quotient = Math.max(2, Math.min(12, pick(rng, { min: 2, max: Math.max(2, Math.floor(spec.a.max / divisor)) })));
  const dividend = divisor * quotient;
  const { options, correctKey } = mcqOptions(quotient, rng);
  return {
    ...buildBase(skill, difficulty),
    question_text: `What is ${dividend} ÷ ${divisor}?`,
    answer_options: options,
    correct_answer: correctKey,
    learning_objective: "Divide whole numbers",
    concept_tags: ["division", "whole numbers"],
    explanation: {
      short: `${dividend} ÷ ${divisor} = ${quotient}.`,
      step_by_step: [
        `Division asks: how many groups of ${divisor} fit into ${dividend}?`,
        `${divisor} × ${quotient} = ${dividend}, so ${dividend} ÷ ${divisor} = ${quotient}.`,
      ],
      why_wrong: Object.fromEntries(
        Object.entries(options)
          .filter(([k]) => k !== correctKey)
          .map(([k, v]) => [k, `${v} doesn't satisfy ${divisor} × answer = ${dividend}.`]),
      ),
      revision_tip: "Check by multiplying back: divisor × quotient should equal the dividend.",
    },
  };
};

const additionTemplate: Template = (skill, difficulty, variant) => {
  const rng = seededRandom(`${skill.code}-add-${difficulty}-${variant}`);
  const spec = operandSpec(skill, difficulty, "+");
  const a = pick(rng, spec.a);
  const b = pick(rng, spec.b);
  const correct = a + b;
  const { options, correctKey } = mcqOptions(correct, rng);
  return {
    ...buildBase(skill, difficulty),
    question_text: `What is ${a} + ${b}?`,
    answer_options: options,
    correct_answer: correctKey,
    learning_objective: "Add whole numbers",
    concept_tags: ["addition", "whole numbers"],
    explanation: {
      short: `${a} + ${b} = ${correct}.`,
      step_by_step: [
        "Line the numbers up by place value.",
        `Add column by column: ${a} + ${b} = ${correct}.`,
      ],
      why_wrong: Object.fromEntries(
        Object.entries(options)
          .filter(([k]) => k !== correctKey)
          .map(([k, v]) => [k, `${v} is not equal to ${a} + ${b}.`]),
      ),
      revision_tip: "Watch your carries when a column adds to 10 or more.",
    },
  };
};

const subtractionTemplate: Template = (skill, difficulty, variant) => {
  const rng = seededRandom(`${skill.code}-sub-${difficulty}-${variant}`);
  const spec = operandSpec(skill, difficulty, "-");
  let a = pick(rng, spec.a);
  let b = pick(rng, spec.b);
  if (b > a) [a, b] = [b, a];
  const correct = a - b;
  const { options, correctKey } = mcqOptions(correct, rng);
  return {
    ...buildBase(skill, difficulty),
    question_text: `What is ${a} − ${b}?`,
    answer_options: options,
    correct_answer: correctKey,
    learning_objective: "Subtract whole numbers",
    concept_tags: ["subtraction", "whole numbers"],
    explanation: {
      short: `${a} − ${b} = ${correct}.`,
      step_by_step: [
        "Line the numbers up by place value.",
        `Subtract column by column: ${a} − ${b} = ${correct}.`,
      ],
      why_wrong: Object.fromEntries(
        Object.entries(options)
          .filter(([k]) => k !== correctKey)
          .map(([k, v]) => [k, `${v} is not the correct difference.`]),
      ),
      revision_tip: "When a top digit is smaller, regroup from the next column.",
    },
  };
};

const fractionTemplate: Template = (skill, difficulty, variant) => {
  const rng = seededRandom(`${skill.code}-frac-${difficulty}-${variant}`);
  const denominator = 2 + Math.floor(rng() * 8);
  const a = 1 + Math.floor(rng() * (denominator - 1));
  const b = 1 + Math.floor(rng() * (denominator - 1));
  const numerator = a + b;
  const correctText = `${numerator}/${denominator}`;
  const distractors = [
    `${a + b}/${denominator * 2}`,
    `${a * b}/${denominator}`,
    `${Math.max(1, a - b)}/${denominator}`,
  ];
  const all = [correctText, ...distractors];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  const keys = ["A", "B", "C", "D"];
  const options: Record<string, string> = {};
  let correctKey = "A";
  all.forEach((v, idx) => {
    options[keys[idx]] = v;
    if (v === correctText) correctKey = keys[idx];
  });
  return {
    ...buildBase(skill, difficulty),
    question_text: `What is ${a}/${denominator} + ${b}/${denominator}?`,
    answer_options: options,
    correct_answer: correctKey,
    learning_objective: "Add fractions with like denominators",
    concept_tags: ["fractions", "like denominators"],
    explanation: {
      short: `${a}/${denominator} + ${b}/${denominator} = ${correctText}.`,
      step_by_step: [
        "When fractions share a denominator, add the numerators and keep the denominator.",
        `${a} + ${b} = ${numerator}, so the answer is ${correctText}.`,
      ],
      why_wrong: Object.fromEntries(
        Object.entries(options)
          .filter(([k]) => k !== correctKey)
          .map(([k, v]) => [k, `${v} doesn't match adding numerators with the same denominator.`]),
      ),
      revision_tip: "Don't add the denominators when they're already the same.",
    },
  };
};

// Skills whose name says "word problem" must actually read like one — a bare
// "3/4 + 3/4?" bound to a word-problems skill is the bug this fixes. Wraps a
// grade-appropriate computation in a real-world scenario and reports
// question_style: "word_problem" so the label matches the content.
const wordProblemTemplate: Template = (skill, difficulty, variant) => {
  const rng = seededRandom(`${skill.code}-word-${difficulty}-${variant}`);
  const scale = 1 + difficulty;
  const scenarios = [
    () => {
      const perBag = 3 + Math.floor(rng() * 4 * scale);
      const bags = 2 + Math.floor(rng() * 3 * scale);
      return {
        text: `A bakery puts ${perBag} muffins in each box. How many muffins are in ${bags} boxes?`,
        answer: perBag * bags,
        objective: "Solve a multiplication word problem",
        tags: ["word problem", "multiplication"],
        how: `${bags} boxes × ${perBag} muffins = ${perBag * bags}.`,
      };
    },
    () => {
      const start = 12 + Math.floor(rng() * 8 * scale);
      const given = 1 + Math.floor(rng() * (start - 1));
      return {
        text: `Maya has ${start} stickers. She gives ${given} to a friend. How many does she have left?`,
        answer: start - given,
        objective: "Solve a subtraction word problem",
        tags: ["word problem", "subtraction"],
        how: `${start} − ${given} = ${start - given}.`,
      };
    },
    () => {
      const friends = 2 + Math.floor(rng() * 3);
      const each = 2 + Math.floor(rng() * 5 * scale);
      return {
        text: `${friends} friends each read ${each} books over the summer. How many books did they read in total?`,
        answer: friends * each,
        objective: "Solve a multiplication word problem",
        tags: ["word problem", "multiplication"],
        how: `${friends} × ${each} = ${friends * each}.`,
      };
    },
  ];
  const s = scenarios[Math.floor(rng() * scenarios.length)]();
  const { options, correctKey } = mcqOptions(s.answer, rng);
  return {
    ...buildBase(skill, difficulty),
    question_style: "word_problem",
    question_text: s.text,
    answer_options: options,
    correct_answer: correctKey,
    learning_objective: s.objective,
    concept_tags: s.tags,
    explanation: {
      short: s.how,
      step_by_step: [
        "Read the problem and decide which operation it describes.",
        `Then compute: ${s.how}`,
      ],
      why_wrong: Object.fromEntries(
        Object.entries(options)
          .filter(([k]) => k !== correctKey)
          .map(([k, v]) => [k, `${v} doesn't match what the story describes.`]),
      ),
      revision_tip: "Underline the numbers and the question before solving.",
    },
  };
};

const integerTemplate: Template = (skill, difficulty, variant) => {
  const rng = seededRandom(`${skill.code}-int-${difficulty}-${variant}`);
  const a = -10 + Math.floor(rng() * 21);
  const b = -10 + Math.floor(rng() * 21);
  const correct = a + b;
  const { options, correctKey } = mcqOptions(correct, rng);
  return {
    ...buildBase(skill, difficulty),
    question_text: `What is (${a}) + (${b})?`,
    answer_options: options,
    correct_answer: correctKey,
    learning_objective: "Add positive and negative integers",
    concept_tags: ["integers", "addition", "signed numbers"],
    explanation: {
      short: `(${a}) + (${b}) = ${correct}.`,
      step_by_step: [
        "When signs match, add absolute values and keep the sign.",
        "When signs differ, subtract absolute values and keep the sign of the larger.",
        `Result: ${correct}.`,
      ],
      why_wrong: Object.fromEntries(
        Object.entries(options)
          .filter(([k]) => k !== correctKey)
          .map(([k, v]) => [k, `${v} doesn't follow the integer addition rules.`]),
      ),
      revision_tip: "Picture a number line: positives move right, negatives move left.",
    },
  };
};

const percentTemplate: Template = (skill, difficulty, variant) => {
  const rng = seededRandom(`${skill.code}-pct-${difficulty}-${variant}`);
  const whole = (1 + Math.floor(rng() * 9)) * 10;
  const percentChoices = [10, 20, 25, 50, 75];
  const pct = percentChoices[Math.floor(rng() * percentChoices.length)];
  const correct = Math.round((whole * pct) / 100);
  const { options, correctKey } = mcqOptions(correct, rng);
  return {
    ...buildBase(skill, difficulty),
    question_text: `What is ${pct}% of ${whole}?`,
    answer_options: options,
    correct_answer: correctKey,
    learning_objective: "Find a percent of a number",
    concept_tags: ["percent", "proportional reasoning"],
    explanation: {
      short: `${pct}% of ${whole} = ${correct}.`,
      step_by_step: [
        "Convert the percent to a decimal (or fraction).",
        `${pct}% = ${pct / 100}.`,
        `${pct / 100} × ${whole} = ${correct}.`,
      ],
      why_wrong: Object.fromEntries(
        Object.entries(options)
          .filter(([k]) => k !== correctKey)
          .map(([k, v]) => [k, `${v} doesn't equal ${pct / 100} × ${whole}.`]),
      ),
      revision_tip: "Replace 'of' with '×' once you've turned the percent into a decimal.",
    },
  };
};

// Picks a natural arithmetic question (×, ÷, +, −) varied by skill code so
// fallback questions still read like real math, not like "for practice on X".
const naturalArithmeticTemplate: Template = (skill, difficulty, variant) => {
  const rng = seededRandom(`${skill.code}-natural-${difficulty}-${variant}`);
  const ops = ["+", "−", "×"] as const;
  const op = ops[Math.floor(rng() * ops.length)];
  const internalOp = op === "+" ? "+" : op === "−" ? "-" : "*";
  const spec = operandSpec(skill, difficulty, internalOp);
  let a = pick(rng, spec.a);
  let b = pick(rng, spec.b);
  let correct: number;
  if (op === "+") correct = a + b;
  else if (op === "−") {
    if (b > a) [a, b] = [b, a];
    correct = a - b;
  } else {
    correct = a * b;
  }
  const { options, correctKey } = mcqOptions(correct, rng);
  return {
    ...buildBase(skill, difficulty),
    question_text: `What is ${a} ${op} ${b}?`,
    answer_options: options,
    correct_answer: correctKey,
    learning_objective: skill.name,
    concept_tags: [skill.topicGroup.name.toLowerCase(), "mental math"],
    explanation: {
      short: `${a} ${op} ${b} = ${correct}.`,
      step_by_step: [
        op === "×"
          ? "Multiplication is repeated addition; line up the factors carefully."
          : op === "−"
            ? "Subtract the smaller number from the larger, place value by place value."
            : "Add the numbers column by column, carrying when needed.",
        `${a} ${op} ${b} = ${correct}.`,
      ],
      why_wrong: Object.fromEntries(
        Object.entries(options)
          .filter(([k]) => k !== correctKey)
          .map(([k, v]) => [k, `${v} is not the correct value of ${a} ${op} ${b}.`]),
      ),
      revision_tip: "Estimate first to sanity-check your answer.",
    },
  };
};

export async function mockGenerateQuiz(req: GenerateQuizRequest): Promise<GenerateQuizResult> {
  const student = await prisma.student.findUniqueOrThrow({
    where: { id: req.studentId },
    include: {
      topicSelections: { include: { topicGroup: true } },
      conceptMastery: true,
    },
  });
  // Global Daily Challenge: build on the requested groups directly (already
  // validated grade-appropriate/active/unlocked by the caller) even if the child
  // hasn't enabled them — so the challenge can be the same across a grade.
  const globalTopic = req.allowAnyGradeTopic === true && (req.topicGroupIds?.length ?? 0) > 0;
  if (student.topicSelections.length === 0 && !globalTopic) {
    throw new Error("Student has no topic groups selected.");
  }

  // Manual builder / targeted tiles can restrict generation to a subset of the
  // student's topic groups; intersect so a client can never widen the pool past
  // what the parent enabled. Falls back to all enabled groups (adaptive default).
  const enabledGroupIds = student.topicSelections.map((s) => s.topicGroupId);
  const selectedGroupIds = globalTopic
    ? req.topicGroupIds!
    : req.topicGroupIds && req.topicGroupIds.length > 0
      ? enabledGroupIds.filter((id) => req.topicGroupIds!.includes(id))
      : enabledGroupIds;
  const quizDifficulty = req.difficultyOverride ?? student.currentDifficulty;
  // Filter inactive topic groups + skills so admin toggles take effect
  // immediately. For a global challenge, also pin to the student's grade
  // (defense-in-depth; the route already validated the group's grade).
  const skills = await prisma.skill.findMany({
    where: {
      topicGroupId: { in: selectedGroupIds },
      active: true,
      topicGroup: { active: true, ...(globalTopic ? { gradeLevel: student.grade } : {}) },
    },
    include: { topicGroup: true },
  });
  if (skills.length === 0) {
    // Nothing generatable for the requested pool — return empty so the caller
    // surfaces a clean "no questions" 400 instead of crashing.
    return { questions: [], difficulty: quizDifficulty };
  }

  const skillsByGroup = new Map<string, SkillRecord[]>();
  for (const s of skills) {
    const record: SkillRecord = {
      id: s.id,
      code: s.code,
      number: s.number,
      name: s.name,
      topicGroup: {
        letter: s.topicGroup.letter,
        name: s.topicGroup.name,
        gradeLevel: s.topicGroup.gradeLevel,
      },
    };
    const arr = skillsByGroup.get(s.topicGroup.letter) ?? [];
    arr.push(record);
    skillsByGroup.set(s.topicGroup.letter, arr);
  }

  const weakSkillIds = new Set(
    student.conceptMastery
      .filter(
        (p) =>
          p.remediationFlag ||
          (p.totalAttempts >= 2 && p.totalCorrect / p.totalAttempts < 0.5),
      )
      .map((p) => p.skillId),
  );

  const buckets = buildBuckets({
    skillsByGroup,
    weakSkillIds,
    totalQuestions: req.questionCount ?? 10,
  });

  const questions: GeneratedQuestion[] = [];
  let variantCounter = 0;
  // Ramp difficulty across the quiz so questions get progressively harder:
  // from one level below the quiz difficulty up to one above, clamped 1–5.
  // (Previously every question used the same flat difficulty.)
  const totalQ = buckets.reduce((sum, b) => sum + b.count, 0);
  const rampedDifficulty = (index: number): number => {
    if (totalQ <= 1) return Math.min(5, Math.max(1, quizDifficulty));
    const t = index / (totalQ - 1);
    return Math.min(5, Math.max(1, Math.round(quizDifficulty - 1 + t * 2)));
  };
  let qIndex = 0;
  for (const bucket of buckets) {
    const tpl = pickTemplate(bucket.skill);
    for (let i = 0; i < bucket.count; i++) {
      const q = tpl(bucket.skill, rampedDifficulty(qIndex), variantCounter++);
      q.weak_skill_targeted = bucket.weakTargeted;
      q.remediation_flag = student.conceptMastery.find(
        (p) => p.skillId === bucket.skill.id,
      )?.remediationFlag ?? false;
      questions.push(q);
      qIndex++;
    }
  }

  // Phase 6: the mock is the default generator, so it must exercise the
  // non-MCQ and visual render/grade paths. Deterministically (by position)
  // convert some questions to fill-in-the-blank. Conversion only happens
  // when the correct option's text is numeric (fill-in-the-blank is
  // numeric-only by decision).
  //
  // Geometry diagrams are now built inside the perimeter/area templates with
  // the real dimensions labelled, so there's no generic rectangle to bolt on
  // here anymore — this loop only handles the fill-in-the-blank conversion.
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (i % 3 === 1 && q.question_type === "mcq") {
      const correctText = q.answer_options[q.correct_answer] ?? "";
      const numeric = correctText.match(/-?\d+(?:\.\d+)?/)?.[0];
      if (numeric) {
        q.question_type = "fill_in_the_blank";
        q.correct_answer = numeric;
        q.answer_options = {};
        if (q.explanation.why_wrong) delete q.explanation.why_wrong;
      }
    }
  }

  let config: StudentConfigBlock | undefined;
  if (req.isFirstQuiz) {
    config = {
      config_type: "student_quiz_setup",
      student_grade: student.grade,
      configured_by: "parent",
      selected_topic_groups: student.topicSelections.map((s) => s.topicGroup.letter),
      selected_topic_names: student.topicSelections.map((s) => s.topicGroup.name),
      tutor_approved: student.tutorApproved,
      approval_required_for: ["grade_change"],
      starting_difficulty: student.currentDifficulty,
      adaptive_mode: true,
      notes: "Parent selected topics. Phase 1 auto-approves the configuration.",
    };
  }

  return { config, questions, difficulty: quizDifficulty };
}

// Standalone generator for Live Classroom: builds a question set for a grade
// + difficulty with no Student attached (live sessions aren't tied to one
// learner). Reuses the same skill pool, distribution and templates.
export async function mockGenerateByGrade(args: {
  grade: number;
  difficulty: number;
  count: number;
}): Promise<GeneratedQuestion[]> {
  const skills = await prisma.skill.findMany({
    where: {
      active: true,
      topicGroup: { active: true, gradeLevel: args.grade },
    },
    include: { topicGroup: true },
  });
  if (skills.length === 0) return [];

  const skillsByGroup = new Map<string, SkillRecord[]>();
  for (const s of skills) {
    const record: SkillRecord = {
      id: s.id,
      code: s.code,
      number: s.number,
      name: s.name,
      topicGroup: {
        letter: s.topicGroup.letter,
        name: s.topicGroup.name,
        gradeLevel: s.topicGroup.gradeLevel,
      },
    };
    const arr = skillsByGroup.get(s.topicGroup.letter) ?? [];
    arr.push(record);
    skillsByGroup.set(s.topicGroup.letter, arr);
  }

  const buckets = buildBuckets({
    skillsByGroup,
    weakSkillIds: new Set(),
    totalQuestions: args.count,
  });

  const out: GeneratedQuestion[] = [];
  let v = 0;
  for (const b of buckets) {
    const tpl = pickTemplate(b.skill);
    for (let i = 0; i < b.count; i++) {
      out.push(tpl(b.skill, args.difficulty, v++));
    }
  }
  return out.slice(0, args.count);
}

export function mockGenerateExplanation(): ValidatedExplanation {
  return {
    short: "Work through the calculation step by step to confirm the answer.",
    step_by_step: [
      "Read the question carefully and identify what is being asked.",
      "Work through the math step by step.",
      "Check the answer against the original question.",
    ],
    misconception: "Students often skip the check-back step and pick the first plausible answer.",
    revision_tip: "Re-read the question, restate it in your own words, then solve.",
  };
}

export function mockGenerateRemediation(args: {
  studentName: string;
  weakSkillCodes: string[];
}): ValidatedRemediation {
  return {
    summary: `${args.studentName} has been making steady progress. There are a few topics worth more practice this week.`,
    focus_skills:
      args.weakSkillCodes.length > 0
        ? args.weakSkillCodes.slice(0, 3).map((c) => `practice on skill ${c}`)
        : ["place value", "basic facts", "word problems"],
    encouragement:
      "Keep going! Every quiz is a chance to learn something new — mistakes are part of the practice.",
  };
}
