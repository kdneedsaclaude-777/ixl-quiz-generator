import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";
import type { ValidatedExplanation } from "@/lib/ai/validation";

export type QuizExportQuestion = {
  position: number;
  unit: string;
  skillTitle: string;
  questionText: string;
  questionType: string;
  options: Record<string, string>;
  correctAnswer: string;
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  explanationShort: string;
};

export type QuizExportData = {
  quizId: number;
  studentName: string;
  grade: number;
  difficulty: number;
  status: string;
  score: number | null;
  completedAt: Date | null;
  // worksheet = blank (questions only); report = answers + score + explanation.
  withAnswers: boolean;
  questions: QuizExportQuestion[];
};

// Loads and normalizes a quiz for export. `withAnswers` is forced false when
// the quiz isn't completed (a report needs real attempts).
export async function loadQuizExportData(
  quizId: number,
  opts: { withAnswers: boolean },
): Promise<QuizExportData | null> {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      student: { select: { name: true, grade: true } },
      questions: {
        orderBy: { position: "asc" },
        include: {
          skill: { include: { topicGroup: true } },
          attempts: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });
  if (!quiz) return null;

  const withAnswers = opts.withAnswers && quiz.status === "completed";

  return {
    quizId: quiz.id,
    studentName: quiz.student.name,
    grade: quiz.student.grade,
    difficulty: quiz.difficulty,
    status: quiz.status,
    score: quiz.score,
    completedAt: quiz.completedAt,
    withAnswers,
    questions: quiz.questions.map((q) => {
      const attempt = q.attempts[0] ?? null;
      let explanationShort = "";
      try {
        explanationShort = (JSON.parse(q.explanationJson) as ValidatedExplanation).short ?? "";
      } catch {
        /* explanation is best-effort in exports */
      }
      return {
        position: q.position + 1,
        unit: q.skill.topicGroup.name,
        skillTitle: q.skill.name,
        questionText: q.questionText,
        questionType: q.questionType,
        options: JSON.parse(q.answerOptionsJson) as Record<string, string>,
        correctAnswer: q.correctAnswer,
        selectedAnswer: attempt?.selectedAnswer ?? null,
        isCorrect: attempt ? attempt.isCorrect : null,
        explanationShort,
      };
    }),
  };
}

function metaLine(d: QuizExportData): string {
  const parts = [
    `Student: ${d.studentName}`,
    `Grade ${d.grade}`,
    `Difficulty ${d.difficulty}`,
  ];
  if (d.withAnswers && d.score !== null) parts.push(`Score: ${Math.round(d.score)}%`);
  return parts.join("  ·  ");
}

export function quizToPdf(d: QuizExportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text(
      `Quiz #${d.quizId} — ${d.withAnswers ? "Report" : "Worksheet"}`,
    );
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor("#555").text(metaLine(d));
    doc.moveDown(1);
    doc.fillColor("#000");

    d.questions.forEach((q) => {
      doc.fontSize(12).fillColor("#000").text(
        `${q.position}. ${q.questionText}`,
        { continued: false },
      );
      doc.fontSize(9).fillColor("#777").text(`${q.unit} — ${q.skillTitle}`);
      doc.fillColor("#000").fontSize(11);

      const optionKeys = Object.keys(q.options);
      if (optionKeys.length > 0) {
        optionKeys.forEach((k) => {
          const mark =
            d.withAnswers && k === q.correctAnswer
              ? " ✓"
              : d.withAnswers && k === q.selectedAnswer
                ? " ✗ (your answer)"
                : "";
          doc.text(`   ${k}. ${q.options[k]}${mark}`);
        });
      } else if (!d.withAnswers) {
        doc.fillColor("#999").text("   Answer: ______________________");
        doc.fillColor("#000");
      }

      if (d.withAnswers) {
        doc.moveDown(0.2);
        doc.fontSize(10).fillColor(q.isCorrect ? "#15803d" : "#b91c1c").text(
          q.isCorrect
            ? "Correct"
            : `Incorrect — correct answer: ${q.correctAnswer}` +
                (q.selectedAnswer ? `  (you: ${q.selectedAnswer})` : ""),
        );
        if (q.explanationShort) {
          doc.fontSize(9).fillColor("#444").text(q.explanationShort);
        }
        doc.fillColor("#000");
      }
      doc.moveDown(0.8);
    });

    doc.end();
  });
}

export async function quizToXlsx(d: QuizExportData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "QuizSpark";
  const ws = wb.addWorksheet(`Quiz ${d.quizId}`);

  ws.addRow([`Quiz #${d.quizId} — ${d.withAnswers ? "Report" : "Worksheet"}`]);
  ws.addRow([metaLine(d)]);
  ws.addRow([]);

  const header = ["#", "Unit", "Skill", "Question", "Options"];
  if (d.withAnswers) header.push("Correct", "Student answer", "Result", "Explanation");
  const headerRow = ws.addRow(header);
  headerRow.font = { bold: true };

  for (const q of d.questions) {
    const optionsText = Object.entries(q.options)
      .map(([k, v]) => `${k}. ${v}`)
      .join("\n");
    const row: (string | number)[] = [
      q.position,
      q.unit,
      q.skillTitle,
      q.questionText,
      optionsText,
    ];
    if (d.withAnswers) {
      row.push(
        q.correctAnswer,
        q.selectedAnswer ?? "",
        q.isCorrect == null ? "—" : q.isCorrect ? "Correct" : "Incorrect",
        q.explanationShort,
      );
    }
    ws.addRow(row);
  }

  ws.columns.forEach((col, i) => {
    col.width = i === 3 ? 60 : i === 4 ? 30 : 18;
    col.alignment = { vertical: "top", wrapText: true };
  });

  // exceljs returns an ArrayBuffer-like; normalize to a Node Buffer.
  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out as ArrayBuffer);
}
