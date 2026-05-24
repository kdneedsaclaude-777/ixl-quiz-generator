import { submitAnswer } from "@/lib/live/session-store";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
): Promise<Response> {
  const { code } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    token?: string;
    choice?: string;
  };
  const result = submitAnswer(code, body.token ?? "", body.choice ?? "");
  return new Response(JSON.stringify(result), {
    status: result.ok ? 200 : 400,
    headers: { "Content-Type": "application/json" },
  });
}
