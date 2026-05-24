import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Remove the verified phone (and any pending verification). Used by the
// "Remove number" button in account settings.
export async function DELETE(): Promise<Response> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Not authenticated." }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { phone: null, phoneVerified: null },
    }),
    prisma.phoneVerification.deleteMany({ where: { userId: session.user.id } }),
  ]);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
