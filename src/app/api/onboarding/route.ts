import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getParentForApi } from "@/lib/auth/server";
import { canAddChild, getUserPlan, logPaywallEvent } from "@/lib/plan";

type Body = {
  name?: string;
  grade?: number;
  topicGroupIds?: number[];
  startingDifficulty?: number;
};

export async function POST(req: Request): Promise<Response> {
  const auth = await getParentForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (auth.parent.role !== "parent") {
    return NextResponse.json({ error: "Only parents can create students." }, { status: 403 });
  }
  if (!auth.parent.emailVerified) {
    return NextResponse.json({ error: "Verify your email before adding a child." }, { status: 403 });
  }

  // Freemium gate: free plan includes a single child; more requires QuizSpark Plus.
  const plan = await getUserPlan(auth.parent.userId);
  const childGate = await canAddChild(auth.parent.userId, plan);
  if (!childGate.allowed) {
    void logPaywallEvent(auth.parent.userId, childGate.reason);
    return NextResponse.json({ error: childGate.error, reason: childGate.reason, upgrade: true }, { status: childGate.status });
  }

  const body = (await req.json()) as Body;
  const { name, grade, topicGroupIds, startingDifficulty = 1 } = body;

  if (!name || !grade || !topicGroupIds || topicGroupIds.length === 0) {
    return NextResponse.json(
      { error: "name, grade, and at least one topicGroupId are required" },
      { status: 400 },
    );
  }
  if (grade < 1 || grade > 8) {
    return NextResponse.json({ error: "grade must be between 1 and 8" }, { status: 400 });
  }

  const groups = await prisma.topicGroup.findMany({
    where: { id: { in: topicGroupIds }, gradeLevel: grade },
  });
  if (groups.length !== topicGroupIds.length) {
    return NextResponse.json(
      { error: "One or more topic groups do not match the selected grade" },
      { status: 400 },
    );
  }

  const student = await prisma.student.create({
    data: {
      name,
      grade,
      currentDifficulty: Math.max(1, Math.min(5, startingDifficulty)),
      tutorApproved: true,
      parentId: auth.parent.userId,
      // New students inherit the parent's tenant.
      orgId: auth.parent.orgId,
      topicSelections: { create: topicGroupIds.map((id) => ({ topicGroupId: id })) },
    },
  });

  return NextResponse.json({ studentId: student.id });
}
