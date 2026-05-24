import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  loadQuizExportData,
  quizToPdf,
  quizToXlsx,
} from "@/lib/export/quiz-export";

// pdfkit/exceljs are Node-only (streams, zlib, font files).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Can the current session see this quiz?
//  - superadmin: any quiz
//  - orgadmin: quizzes for students in their org
//  - parent: their own children's quizzes
//  - student: their own quizzes
//  - tutor: quizzes for students assigned to them
async function canAccessQuiz(
  userId: string,
  role: string,
  orgId: string | null,
  quizId: number,
): Promise<boolean> {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    select: { student: { select: { id: true, orgId: true, parentId: true, userId: true } } },
  });
  if (!quiz) return false;
  const s = quiz.student;
  if (role === "superadmin") return true;
  if (role === "orgadmin") return s.orgId !== null && s.orgId === orgId;
  if (role === "parent") return s.parentId === userId;
  if (role === "student") return s.userId === userId;
  if (role === "tutor") {
    const link = await prisma.tutorAssignment.findUnique({
      where: { tutorId_studentId: { tutorId: userId, studentId: s.id } },
      select: { id: true },
    });
    return Boolean(link);
  }
  return false;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Not authenticated." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id: idParam } = await params;
  const quizId = parseInt(idParam, 10);
  if (!Number.isFinite(quizId)) {
    return new Response(JSON.stringify({ error: "Invalid quiz id." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const format = url.searchParams.get("format") === "xlsx" ? "xlsx" : "pdf";
  const mode = url.searchParams.get("mode") === "report" ? "report" : "worksheet";

  const ok = await canAccessQuiz(
    session.user.id,
    session.user.role,
    session.user.orgId ?? null,
    quizId,
  );
  if (!ok) {
    return new Response(JSON.stringify({ error: "Not found." }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const data = await loadQuizExportData(quizId, { withAnswers: mode === "report" });
  if (!data) {
    return new Response(JSON.stringify({ error: "Not found." }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const tag = data.withAnswers ? "report" : "worksheet";
  if (format === "xlsx") {
    const buf = await quizToXlsx(data);
    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="quiz-${quizId}-${tag}.xlsx"`,
      },
    });
  }
  const buf = await quizToPdf(data);
  return new Response(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="quiz-${quizId}-${tag}.pdf"`,
    },
  });
}
