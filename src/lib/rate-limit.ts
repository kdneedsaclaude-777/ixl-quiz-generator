// Fixed-window in-memory rate limiter. Correct for a single instance; for
// multi-instance/serverless, swap the Map for Redis behind the same
// `rateLimit()` signature (call sites won't change). The clock is injectable
// so the window logic is deterministically unit-testable.

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
};

// Opportunistic prune so the Map can't grow unbounded under many distinct
// keys (e.g. per-IP). Cheap: only sweeps when the store gets large.
function maybePrune(now: number): void {
  if (store.size < 5_000) return;
  for (const [k, b] of store) {
    if (now >= b.resetAt) store.delete(k);
  }
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  maybePrune(now);
  const b = store.get(key);

  if (!b || now >= b.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterSec: 0 };
  }

  if (b.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((b.resetAt - now) / 1000)),
    };
  }

  b.count += 1;
  return { ok: true, remaining: limit - b.count, retryAfterSec: 0 };
}

// Test/maintenance hook.
export function resetRateLimit(key?: string): void {
  if (key) store.delete(key);
  else store.clear();
}

// Best-effort client IP from common proxy headers.
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

// Convenience: enforce a limit for `${bucket}:${ip}` and return a ready 429
// Response when exceeded, or null to continue.
export function enforceRateLimit(
  req: Request,
  bucket: string,
  limit: number,
  windowMs: number,
): Response | null {
  const result = rateLimit(`${bucket}:${clientIp(req)}`, limit, windowMs);
  if (result.ok) return null;
  return new Response(
    JSON.stringify({ error: "Too many requests. Please slow down." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfterSec),
      },
    },
  );
}
