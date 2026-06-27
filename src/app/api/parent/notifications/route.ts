import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getParentForApi } from "@/lib/auth/server";

type Body = {
  emailEveryQuiz?: boolean;
  weeklyDigest?: boolean;
  alertBelowScorePct?: number;
  alertNoPracticeDays?: number;
  streakReminder?: boolean;
};

export async function PATCH(req: Request): Promise<Response> {
  const auth = await getParentForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = (await req.json().catch(() => ({}))) as Body;
  const score = Math.max(0, Math.min(100, body.alertBelowScorePct ?? 60));
  const days = Math.max(1, Math.min(30, body.alertNoPracticeDays ?? 7));
  const streakReminder = body.streakReminder ?? true;

  await prisma.notificationSettings.upsert({
    where: { userId: auth.parent.userId },
    create: {
      userId: auth.parent.userId,
      emailEveryQuiz: !!body.emailEveryQuiz,
      weeklyDigest: !!body.weeklyDigest,
      alertBelowScorePct: score,
      alertNoPracticeDays: days,
      streakReminder: !!streakReminder,
    },
    update: {
      emailEveryQuiz: !!body.emailEveryQuiz,
      weeklyDigest: !!body.weeklyDigest,
      alertBelowScorePct: score,
      alertNoPracticeDays: days,
      streakReminder: !!streakReminder,
    },
  });

  return NextResponse.json({ ok: true });
}
