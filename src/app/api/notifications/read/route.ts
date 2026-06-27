import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Marks the current user's in-app notification(s) read. { id } marks one,
// { all: true } clears them all. Scoped to the session user — you can only
// clear your own.
export async function POST(req: Request): Promise<Response> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { id?: string; all?: boolean };
  const now = new Date();

  if (body.all) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, readAt: null },
      data: { readAt: now },
    });
  } else if (body.id) {
    await prisma.notification.updateMany({
      where: { id: body.id, userId: session.user.id },
      data: { readAt: now },
    });
  } else {
    return NextResponse.json({ error: "id or all required" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
