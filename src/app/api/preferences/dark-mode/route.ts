import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

type Body = { darkMode?: boolean };

// Persists the dark-mode preference. Anonymous users still rely on localStorage
// (no row to write); logged-in users get DB persistence + an immediate
// localStorage write client-side so the next reload picks it up before the
// session round-trip completes.
export async function PATCH(req: Request): Promise<Response> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ ok: true, persisted: false });

  const body = (await req.json().catch(() => ({}))) as Body;
  if (typeof body.darkMode !== "boolean") {
    return NextResponse.json({ error: "darkMode must be a boolean." }, { status: 400 });
  }
  await prisma.user.update({
    where: { id: session.user.id },
    data: { darkMode: body.darkMode },
  });
  return NextResponse.json({ ok: true, persisted: true });
}
