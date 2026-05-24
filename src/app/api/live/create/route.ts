import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { mockGenerateByGrade } from "@/lib/ai/mock";
import { createSession, type LiveQuestion } from "@/lib/live/session-store";

export const dynamic = "force-dynamic";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Any authenticated user can host a live session (teacher, tutor, parent).
export async function POST(req: Request): Promise<Response> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return json({ error: "Not authenticated." }, 401);

  const body = (await req.json().catch(() => ({}))) as {
    grade?: number;
    difficulty?: number;
    count?: number;
  };
  const grade = Math.min(8, Math.max(1, Math.round(body.grade ?? 4)));
  const difficulty = Math.min(5, Math.max(1, Math.round(body.difficulty ?? 2)));
  const count = Math.min(20, Math.max(3, Math.round(body.count ?? 8)));

  const generated = await mockGenerateByGrade({ grade, difficulty, count });
  if (generated.length === 0) {
    return json({ error: "No active content for that grade." }, 400);
  }

  const questions: LiveQuestion[] = generated.map((q) => ({
    prompt: q.question_text,
    options: q.answer_options,
    correct: q.correct_answer,
    unit: q.topic_group_name,
    skillTitle: q.skill_name,
  }));

  const s = createSession({
    hostUserId: session.user.id,
    hostName: session.user.name ?? "Host",
    questions,
  });
  return json({ code: s.code, total: questions.length });
}
