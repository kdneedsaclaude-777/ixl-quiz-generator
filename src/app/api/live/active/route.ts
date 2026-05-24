import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listSessions } from "@/lib/live/session-store";

export const dynamic = "force-dynamic";

// Superadmin oversight: every running live session, so a superadmin can pick
// one to moderate without needing the join code.
export async function GET(): Promise<Response> {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "superadmin") {
    return new Response(JSON.stringify({ error: "Superadmin only." }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ sessions: listSessions() }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
