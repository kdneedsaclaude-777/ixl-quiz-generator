import type { PrismaClient } from "@prisma/client";

type VideoSeed = {
  subject: string;
  gradeMin: number;
  gradeMax: number;
  topicGroupLetter: string;
  skillCode: string | null;
  title: string;
  provider: string;
  url: string;
  description: string;
  qualityScore: number;
};

// 20 Khan Academy video references covering the topic groups used by the
// adaptive engine. URLs are real Khan Academy course/topic URLs; quality 9
// reflects KA's curated content depth.
const KA = "Khan Academy";
const VIDEOS: VideoSeed[] = [
  // Fractions G4–G5
  { subject: "math", gradeMin: 4, gradeMax: 5, topicGroupLetter: "N", skillCode: null, title: "Equivalent fractions", provider: KA, url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-fractions-2/imp-equivalent-fractions/v/equivalent-fractions", description: "Visual intro to equivalent fractions using fraction bars and number lines.", qualityScore: 9 },
  { subject: "math", gradeMin: 4, gradeMax: 5, topicGroupLetter: "N", skillCode: null, title: "Comparing fractions", provider: KA, url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-fractions-2/imp-comparing-fractions-2/v/comparing-fractions-with-different-denominators", description: "Compare fractions with unlike denominators using benchmarks.", qualityScore: 9 },

  // Multiplication / division G4–G5
  { subject: "math", gradeMin: 4, gradeMax: 5, topicGroupLetter: "E", skillCode: null, title: "Multi-digit multiplication", provider: KA, url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-multiply-by-1-digit-numbers", description: "Standard algorithm for multi-digit multiplication with worked examples.", qualityScore: 9 },
  { subject: "math", gradeMin: 4, gradeMax: 5, topicGroupLetter: "H", skillCode: null, title: "Long division", provider: KA, url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-division/imp-multi-digit-division-no-remainders/v/long-division-without-remainder", description: "Step-by-step long division of multi-digit numbers.", qualityScore: 9 },

  // Decimals G5–G6
  { subject: "math", gradeMin: 5, gradeMax: 6, topicGroupLetter: "G", skillCode: null, title: "Intro to decimals", provider: KA, url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-decimal-place-value", description: "Reading, writing, and comparing decimals to thousandths.", qualityScore: 9 },
  { subject: "math", gradeMin: 5, gradeMax: 6, topicGroupLetter: "I", skillCode: null, title: "Adding & subtracting decimals", provider: KA, url: "https://www.khanacademy.org/math/cc-fifth-grade-math/imp-add-and-subtract-decimals", description: "Aligning place values to add and subtract decimal numbers.", qualityScore: 9 },

  // Integers G6–G7
  { subject: "math", gradeMin: 6, gradeMax: 7, topicGroupLetter: "C", skillCode: null, title: "Intro to negative numbers", provider: KA, url: "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-negative-numbers", description: "Negative numbers on the number line and in real-world contexts.", qualityScore: 9 },
  { subject: "math", gradeMin: 7, gradeMax: 7, topicGroupLetter: "C", skillCode: null, title: "Adding & subtracting integers", provider: KA, url: "https://www.khanacademy.org/math/cc-7th-grade-math/cc-7th-negative-numbers-add-and-subtract", description: "Rules and number-line models for integer addition and subtraction.", qualityScore: 9 },

  // Percentages G6–G8
  { subject: "math", gradeMin: 6, gradeMax: 8, topicGroupLetter: "Q", skillCode: null, title: "Intro to percents", provider: KA, url: "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-rates-and-percentages/cc-6th-percentages", description: "Convert between fractions, decimals, and percents; percent of a number.", qualityScore: 9 },
  { subject: "math", gradeMin: 7, gradeMax: 8, topicGroupLetter: "K", skillCode: null, title: "Percent change", provider: KA, url: "https://www.khanacademy.org/math/cc-seventh-grade-math/cc-7th-fractions-decimals-percentages/cc-7th-percent-word-problems", description: "Percent increase, decrease, tax, tip, and discount problems.", qualityScore: 9 },

  // Algebra / equations G6–G8
  { subject: "math", gradeMin: 6, gradeMax: 8, topicGroupLetter: "X", skillCode: null, title: "One-step equations", provider: KA, url: "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-equations-and-inequalities", description: "Solve one-step equations with addition, subtraction, multiplication, division.", qualityScore: 9 },
  { subject: "math", gradeMin: 7, gradeMax: 8, topicGroupLetter: "X", skillCode: null, title: "Two-step equations", provider: KA, url: "https://www.khanacademy.org/math/cc-seventh-grade-math/cc-7th-equations-expressions/cc-7th-two-step-equations-intro", description: "Solving two-step linear equations and word-problem applications.", qualityScore: 9 },
  { subject: "math", gradeMin: 8, gradeMax: 8, topicGroupLetter: "X", skillCode: null, title: "Equations with variables on both sides", provider: KA, url: "https://www.khanacademy.org/math/cc-eighth-grade-math/cc-8th-solving-equations", description: "Solve linear equations with variables on both sides and special solutions.", qualityScore: 9 },

  // Geometry / measurement G4–G6
  { subject: "math", gradeMin: 4, gradeMax: 6, topicGroupLetter: "S", skillCode: null, title: "Area & perimeter", provider: KA, url: "https://www.khanacademy.org/math/cc-fourth-grade-math/imp-measurement-and-data-2/imp-area-and-perimeter", description: "Area and perimeter of rectangles, including word problems.", qualityScore: 9 },
  { subject: "math", gradeMin: 6, gradeMax: 6, topicGroupLetter: "DD", skillCode: null, title: "Area of triangles & quadrilaterals", provider: KA, url: "https://www.khanacademy.org/math/cc-sixth-grade-math/cc-6th-geometry-topic", description: "Compute area of triangles, parallelograms, and trapezoids.", qualityScore: 9 },

  // Pythagorean theorem G8
  { subject: "math", gradeMin: 8, gradeMax: 8, topicGroupLetter: "S", skillCode: "S.1", title: "Intro to the Pythagorean theorem", provider: KA, url: "https://www.khanacademy.org/math/cc-eighth-grade-math/cc-8th-geometry/cc-8th-pythagorean-theorem", description: "Use a^2 + b^2 = c^2 to find missing sides of right triangles.", qualityScore: 9 },
  { subject: "math", gradeMin: 8, gradeMax: 8, topicGroupLetter: "S", skillCode: "S.5", title: "Pythagorean theorem word problems", provider: KA, url: "https://www.khanacademy.org/math/cc-eighth-grade-math/cc-8th-geometry/cc-8th-pythagorean-theorem-application", description: "Apply the Pythagorean theorem to real-world geometry problems.", qualityScore: 9 },

  // Linear functions G8
  { subject: "math", gradeMin: 8, gradeMax: 8, topicGroupLetter: "Z", skillCode: null, title: "Linear functions", provider: KA, url: "https://www.khanacademy.org/math/cc-eighth-grade-math/cc-8th-linear-equations-functions", description: "Slope, intercepts, and graphing linear functions.", qualityScore: 9 },

  // Proportional relationships G7–G8
  { subject: "math", gradeMin: 7, gradeMax: 8, topicGroupLetter: "M", skillCode: null, title: "Proportional relationships", provider: KA, url: "https://www.khanacademy.org/math/cc-seventh-grade-math/cc-7th-ratio-proportion", description: "Identify and use constants of proportionality from tables, graphs, and equations.", qualityScore: 9 },
  { subject: "math", gradeMin: 7, gradeMax: 8, topicGroupLetter: "L", skillCode: null, title: "Unit rates & ratios", provider: KA, url: "https://www.khanacademy.org/math/cc-seventh-grade-math/cc-7th-ratio-proportion/cc-7th-unit-rates", description: "Compute unit rates and compare ratios across contexts.", qualityScore: 9 },
];

export async function seedVideoResources(prisma: PrismaClient): Promise<number> {
  await prisma.videoResource.deleteMany({});
  await prisma.videoResource.createMany({ data: VIDEOS });
  return VIDEOS.length;
}
