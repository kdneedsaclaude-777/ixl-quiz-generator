import { joinSession } from "@/lib/live/session-store";

export const dynamic = "force-dynamic";

// Open join — participants don't need an account (classroom / demo style).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
): Promise<Response> {
  const { code } = await params;
  const body = (await req.json().catch(() => ({}))) as { name?: string };
  const result = joinSession(code, body.name ?? "");
  if (!result.ok) {
    return new Response(JSON.stringify({ error: result.error }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ token: result.token, id: result.id }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
