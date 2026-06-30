import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Save (POST) or remove (DELETE) the current user's Web Push subscription.
type SubBody = { endpoint?: string; keys?: { p256dh?: string; auth?: string } };

export async function POST(req: Request): Promise<Response> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const sub = (await req.json().catch(() => null)) as SubBody | null;
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });
  }
  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    create: { userId: session.user.id, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    update: { userId: session.user.id, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request): Promise<Response> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { endpoint?: string };
  if (body.endpoint) {
    await prisma.pushSubscription.deleteMany({ where: { endpoint: body.endpoint, userId: session.user.id } });
  }
  return NextResponse.json({ ok: true });
}
