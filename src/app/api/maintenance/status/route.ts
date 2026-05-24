import { isMaintenanceModeOn } from "@/lib/maintenance";

// Lightweight status probe for the /maintenance page's auto-recovery poll.
// Returns { on: boolean } and never caches at the edge — the maintenance
// flag has its own short server-side cache, so this is cheap to hit.
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const on = await isMaintenanceModeOn();
  return new Response(JSON.stringify({ on }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}
