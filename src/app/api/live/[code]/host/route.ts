import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hostAction } from "@/lib/live/session-store";

export const dynamic = "force-dynamic";

const ACTIONS = [
  "start",
  "reveal",
  "next",
  "skip",
  "end",
  "pause",
  "resume",
  "addtime",
  "kick",
] as const;
type Action = (typeof ACTIONS)[number];

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
): Promise<Response> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return json({ error: "Not authenticated." }, 401);

  const { code } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    participantId?: string;
  };
  const action = body.action as Action | undefined;
  if (!action || !ACTIONS.includes(action)) {
    return json({ error: "Invalid action." }, 400);
  }

  // hostAction enforces "session creator OR superadmin". Superadmins can
  // moderate any running session for oversight.
  const isSuperadmin = session.user.role === "superadmin";
  const result = hostAction(
    code,
    session.user.id,
    isSuperadmin,
    action,
    body.participantId,
  );
  return json(result, result.ok ? 200 : 403);
}
