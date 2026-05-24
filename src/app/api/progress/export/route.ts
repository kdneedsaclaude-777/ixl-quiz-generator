import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildStudentProgress } from "@/lib/progress";
import { canAccessStudent } from "@/lib/auth/can-access-student";
import { toCsv, csvResponse } from "@/lib/csv";

export const dynamic = "force-dynamic";

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Filename-safe slug: "Ben #2" → "ben-2". Keeps the download name tidy and
// ASCII so a plain `Content-Disposition: ... filename="..."` works everywhere.
function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "student"
  );
}

// Self-service data portability. Any role that can see a student can download
// that student's progress — JSON (full dataset) or CSV (quiz-history table).
export async function GET(req: Request): Promise<Response> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return json({ error: "Not authenticated." }, 401);

  const url = new URL(req.url);
  const studentId = parseInt(url.searchParams.get("studentId") ?? "", 10);
  const format = url.searchParams.get("format") === "csv" ? "csv" : "json";
  if (!Number.isFinite(studentId)) return json({ error: "Invalid studentId." }, 400);

  const allowed = await canAccessStudent(
    session.user.id,
    session.user.role,
    session.user.orgId ?? null,
    studentId,
  );
  if (!allowed) return json({ error: "Not found." }, 404);

  const progress = await buildStudentProgress(studentId);
  if (!progress) return json({ error: "Not found." }, 404);

  // Download name: e.g. "ben-progress-2026-05-20.csv". The server header is
  // what names the file — the frontend just needs a plain <a href> (no
  // `download` attribute required; Content-Disposition: attachment drives it).
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const baseName = `${slugify(progress.studentName)}-progress-${today}`;

  if (format === "csv") {
    // One row per quiz — the same shape the in-app Quiz History table shows.
    const quizzes = await prisma.quiz.findMany({
      where: { studentId },
      orderBy: [{ completedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        status: true,
        score: true,
        difficulty: true,
        completedAt: true,
        createdAt: true,
        questions: {
          select: {
            skill: { select: { topicGroup: { select: { name: true } } } },
          },
        },
      },
    });

    const headers = [
      "Quiz #",
      "Date",
      "Status",
      "Score %",
      "Difficulty",
      "Questions",
      "Topics",
    ];
    const rows: unknown[][] = quizzes.map((q) => {
      const when = q.completedAt ?? q.createdAt;
      const topics = [
        ...new Set(q.questions.map((qq) => qq.skill.topicGroup.name)),
      ].sort();
      return [
        q.id,
        when.toISOString().slice(0, 10),
        q.status,
        typeof q.score === "number" ? Math.round(q.score) : "",
        q.difficulty,
        q.questions.length,
        topics.join("; "),
      ];
    });

    // csvResponse() sets: Content-Disposition: attachment; filename="<name>"
    return csvResponse(`${baseName}.csv`, toCsv(headers, rows));
  }

  return new Response(JSON.stringify(progress, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${baseName}.json"`,
    },
  });
}
