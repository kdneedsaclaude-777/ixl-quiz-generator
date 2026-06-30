import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Recent in-app notifications + unread count for the current user. Powers the
// bell dropdown. Scoped to the session user.
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, type: true, title: true, body: true, href: true, readAt: true, createdAt: true },
    }),
    prisma.notification.count({ where: { userId: session.user.id, readAt: null } }),
  ]);

  return NextResponse.json({ items, unread });
}
