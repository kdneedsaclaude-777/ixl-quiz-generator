import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminForApi } from "@/lib/auth/admin";
import { toCsv, csvResponse } from "@/lib/csv";

// Streams one of four pre-built datasets as CSV. Streaming-in-memory is
// fine at our scale (<100k rows); larger needs would warrant a chunked
// streaming response.
export async function GET(req: Request): Promise<Response> {
  const auth = await getAdminForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(req.url);
  const dataset = url.searchParams.get("dataset") ?? "";
  switch (dataset) {
    case "heatmap":
      return exportHeatmap();
    case "difficulty":
      return exportDifficulty();
    case "dropoff":
      return exportDropOff();
    case "quizzes":
      return exportQuizzes();
    default:
      return NextResponse.json({ error: "Unknown dataset." }, { status: 400 });
  }
}

async function exportHeatmap(): Promise<Response> {
  const mastery = await prisma.conceptMastery.findMany({
    where: { totalAttempts: { gt: 0 } },
    include: {
      student: { select: { grade: true } },
      skill: { select: { topicGroup: { select: { letter: true, name: true } } } },
    },
  });
  type Agg = { sum: number; total: number; name: string };
  const agg = new Map<string, Agg>();
  for (const m of mastery) {
    const k = `${m.student.grade}-${m.skill.topicGroup.letter}`;
    const cur = agg.get(k) ?? { sum: 0, total: 0, name: m.skill.topicGroup.name };
    cur.sum += m.totalCorrect;
    cur.total += m.totalAttempts;
    agg.set(k, cur);
  }
  const rows = [...agg.entries()].map(([k, v]) => {
    const [grade, letter] = k.split("-");
    return [grade, letter, v.name, v.total, v.sum, Math.round((v.sum / v.total) * 100)];
  });
  return csvResponse(
    `heatmap-${Date.now()}.csv`,
    toCsv(["grade", "topic_letter", "topic_name", "attempts", "correct", "accuracy_pct"], rows),
  );
}

async function exportDifficulty(): Promise<Response> {
  const quizzes = await prisma.quiz.findMany({
    where: { status: "completed", score: { not: null } },
    select: { difficulty: true, score: true, student: { select: { grade: true } } },
  });
  type Agg = { sum: number; n: number };
  const agg = new Map<string, Agg>();
  for (const q of quizzes) {
    const k = `${q.student.grade}-${q.difficulty}`;
    const cur = agg.get(k) ?? { sum: 0, n: 0 };
    cur.sum += q.score ?? 0;
    cur.n += 1;
    agg.set(k, cur);
  }
  const rows = [...agg.entries()].map(([k, v]) => {
    const [grade, difficulty] = k.split("-");
    return [grade, difficulty, v.n, Math.round(v.sum / v.n)];
  });
  return csvResponse(
    `difficulty-curve-${Date.now()}.csv`,
    toCsv(["grade", "difficulty", "quizzes", "avg_score_pct"], rows),
  );
}

async function exportDropOff(): Promise<Response> {
  const since = new Date();
  since.setDate(since.getDate() - 29);
  since.setHours(0, 0, 0, 0);
  const recent = await prisma.quiz.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true, completedAt: true, status: true },
  });
  const map = new Map<string, { started: number; completed: number }>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    map.set(d.toISOString().slice(0, 10), { started: 0, completed: 0 });
  }
  for (const q of recent) {
    const sk = q.createdAt.toISOString().slice(0, 10);
    const cur = map.get(sk);
    if (cur) cur.started += 1;
    if (q.status === "completed" && q.completedAt) {
      const ck = q.completedAt.toISOString().slice(0, 10);
      const c2 = map.get(ck);
      if (c2) c2.completed += 1;
    }
  }
  const rows = [...map.entries()].map(([day, v]) => [day, v.started, v.completed, v.started === 0 ? 0 : Math.round((v.completed / v.started) * 100)]);
  return csvResponse(
    `dropoff-${Date.now()}.csv`,
    toCsv(["day", "started", "completed", "completion_pct"], rows),
  );
}

async function exportQuizzes(): Promise<Response> {
  const quizzes = await prisma.quiz.findMany({
    where: { status: "completed" },
    orderBy: { completedAt: "desc" },
    select: {
      id: true,
      difficulty: true,
      score: true,
      createdAt: true,
      completedAt: true,
      student: { select: { name: true, grade: true } },
    },
  });
  const rows = quizzes.map((q) => [
    q.id,
    q.student.name,
    q.student.grade,
    q.difficulty,
    q.score !== null ? Math.round(q.score) : "",
    q.createdAt.toISOString(),
    q.completedAt?.toISOString() ?? "",
  ]);
  return csvResponse(
    `quizzes-${Date.now()}.csv`,
    toCsv(["quiz_id", "student_name", "grade", "difficulty", "score_pct", "started_at", "completed_at"], rows),
  );
}
