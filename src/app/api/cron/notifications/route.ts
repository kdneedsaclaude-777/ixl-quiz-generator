import { NextResponse } from "next/server";
import { runScheduledNotifications } from "@/lib/notifications";
import { enforceRateLimit } from "@/lib/rate-limit";

// Scheduled notification dispatch: weekly digests + inactivity alerts.
// Idempotent (deduped via NotificationLog) so it's safe to call repeatedly.
//
// Protected by CRON_SECRET. In Phase 9 this is wired to a real cron/webhook;
// for now it can be triggered manually:
//   curl -X POST localhost:3000/api/cron/notifications \
//     -H "Authorization: Bearer $CRON_SECRET"
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail closed when unconfigured
  const header = req.headers.get("authorization") ?? "";
  const bearer = header.startsWith("Bearer ") ? header.slice(7) : "";
  const url = new URL(req.url);
  const queryToken = url.searchParams.get("token") ?? "";
  return bearer === secret || queryToken === secret;
}

export async function POST(req: Request): Promise<Response> {
  const limited = enforceRateLimit(req, "cron", 10, 60_000);
  if (limited) return limited;
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const summary = await runScheduledNotifications();
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    console.error("[cron] notifications run failed", err);
    return NextResponse.json({ error: "Run failed" }, { status: 500 });
  }
}
