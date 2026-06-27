import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireTutorSession } from "@/lib/auth/server";
import { validateTutorSession } from "@/lib/domain/tutor-sessions";

// PATCH  /api/tutor/sessions/[id]  → update own session
// DELETE /api/tutor/sessions/[id]  → delete own session

async function loadOwned(id: string, tutorId: string) {
  const row = await prisma.tutorSession.findUnique({ where: { id } });
  if (!row || row.tutorId !== tutorId) return null;
  return row;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await requireTutorSession();
  const { id } = await params;
  const row = await loadOwned(id, session.userId);
  if (!row) return NextResponse.json({ error: "Session not found." }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const result = validateTutorSession(body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const updated = await prisma.tutorSession.update({
    where: { id },
    data: {
      scheduledAt: result.value.scheduledAt,
      durationMin: result.value.durationMin,
      focus: result.value.focus,
      notes: result.value.notes,
      status: result.value.status,
    },
  });
  return NextResponse.json({ ok: true, session: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await requireTutorSession();
  const { id } = await params;
  const row = await loadOwned(id, session.userId);
  if (!row) return NextResponse.json({ error: "Session not found." }, { status: 404 });

  await prisma.tutorSession.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
