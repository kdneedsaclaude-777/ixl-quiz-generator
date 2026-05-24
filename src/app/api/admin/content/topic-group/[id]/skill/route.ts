import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminForApi } from "@/lib/auth/admin";
import { auditLog } from "@/lib/audit";

type Body = { name?: string };

// Add a new Skill under an existing TopicGroup. Code + number are derived
// server-side from the group's letter and the highest existing number, so
// admins only type a name. Active=true so the quiz generator picks it up
// immediately (matches the "Active immediately" choice in the spec).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await getAdminForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id: idParam } = await params;
  const topicGroupId = parseInt(idParam, 10);
  if (!Number.isFinite(topicGroupId)) {
    return NextResponse.json({ error: "Invalid topic group id." }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as Body;
  const name = body.name?.trim();
  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Skill name must be at least 2 characters." }, { status: 400 });
  }
  if (name.length > 120) {
    return NextResponse.json({ error: "Skill name is too long (max 120)." }, { status: 400 });
  }

  const group = await prisma.topicGroup.findUnique({
    where: { id: topicGroupId },
    select: { id: true, letter: true, gradeLevel: true },
  });
  if (!group) return NextResponse.json({ error: "Topic group not found." }, { status: 404 });

  // Compute the next number slot. @@unique([topicGroupId, number]) means
  // gaps are fine — we just take max+1 so the new skill sorts to the end.
  const max = await prisma.skill.aggregate({
    where: { topicGroupId },
    _max: { number: true },
  });
  const nextNumber = (max._max.number ?? 0) + 1;
  const code = `${group.letter}.${nextNumber}`;

  const created = await prisma.skill.create({
    data: {
      topicGroupId,
      code,
      number: nextNumber,
      name,
      active: true,
    },
    select: { id: true, code: true, number: true, name: true, active: true },
  });

  await auditLog({
    actorId: auth.admin.userId,
    action: "create_skill",
    targetType: "Skill",
    targetId: String(created.id),
    metadata: { topicGroupId, gradeLevel: group.gradeLevel, code: created.code, name: created.name },
  });

  return NextResponse.json({ ok: true, skill: created });
}
