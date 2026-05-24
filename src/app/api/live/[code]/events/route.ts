import { subscribe, snapshot, getSession } from "@/lib/live/session-store";

export const dynamic = "force-dynamic";

// Server-Sent Events stream: every state change (join, answer, host advance)
// pushes a fresh snapshot to all connected host + participant clients.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
): Promise<Response> {
  const { code } = await params;
  if (!getSession(code)) {
    return new Response("session not found", { status: 404 });
  }
  // Players pass their participant token so the store can track presence
  // and remove them from the roster shortly after they disconnect. The host
  // omits the token, so they're not subject to presence cleanup.
  const participantToken =
    new URL(req.url).searchParams.get("token") ?? undefined;

  const encoder = new TextEncoder();
  let unsub: () => void = () => {};
  let keepAlive: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const send = (payload: string) => {
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          /* stream closed */
        }
      };
      // Initial state immediately, then live updates.
      send(`data: ${JSON.stringify(snapshot(code))}\n\n`);
      unsub = subscribe(code, send, { participantToken });
      // Comment ping keeps proxies from idling the connection out.
      keepAlive = setInterval(() => send(`: ping\n\n`), 20_000);
    },
    cancel() {
      unsub();
      if (keepAlive) clearInterval(keepAlive);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
