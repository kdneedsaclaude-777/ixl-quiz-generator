import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, resetRateLimit, clientIp } from "@/lib/rate-limit";

beforeEach(() => resetRateLimit());

describe("rateLimit", () => {
  it("allows up to the limit then blocks within the window", () => {
    const t0 = 1_000_000;
    expect(rateLimit("k", 3, 60_000, t0)).toMatchObject({ ok: true, remaining: 2 });
    expect(rateLimit("k", 3, 60_000, t0 + 1)).toMatchObject({ ok: true, remaining: 1 });
    expect(rateLimit("k", 3, 60_000, t0 + 2)).toMatchObject({ ok: true, remaining: 0 });
    const blocked = rateLimit("k", 3, 60_000, t0 + 3);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("resets after the window elapses", () => {
    const t0 = 2_000_000;
    rateLimit("w", 1, 10_000, t0);
    expect(rateLimit("w", 1, 10_000, t0 + 5_000).ok).toBe(false);
    expect(rateLimit("w", 1, 10_000, t0 + 10_000).ok).toBe(true);
  });

  it("tracks keys independently", () => {
    const t0 = 3_000_000;
    rateLimit("a", 1, 10_000, t0);
    expect(rateLimit("a", 1, 10_000, t0).ok).toBe(false);
    expect(rateLimit("b", 1, 10_000, t0).ok).toBe(true);
  });

  it("retryAfterSec reflects time left in the window", () => {
    const t0 = 4_000_000;
    rateLimit("r", 1, 30_000, t0);
    const r = rateLimit("r", 1, 30_000, t0 + 5_000);
    expect(r.ok).toBe(false);
    expect(r.retryAfterSec).toBe(25); // ceil((30000-5000)/1000)
  });
});

describe("clientIp", () => {
  it("takes the first x-forwarded-for entry", () => {
    const req = new Request("http://x", {
      headers: { "x-forwarded-for": "203.0.113.5, 70.41.3.18" },
    });
    expect(clientIp(req)).toBe("203.0.113.5");
  });
  it("falls back to x-real-ip then 'unknown'", () => {
    expect(
      clientIp(new Request("http://x", { headers: { "x-real-ip": "10.0.0.2" } })),
    ).toBe("10.0.0.2");
    expect(clientIp(new Request("http://x"))).toBe("unknown");
  });
});
