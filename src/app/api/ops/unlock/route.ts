import { NextResponse } from "next/server";
import { checkOpsCode, issueOpsToken, opsGateConfigured, OPS_COOKIE } from "@/lib/ops";
import { enforceRateLimit } from "@/lib/rate-limit";

type Body = { code?: string };

export async function POST(req: Request): Promise<Response> {
  // Tight brute-force limit — a handful of attempts per window.
  const limited = enforceRateLimit(req, "ops-unlock", 5, 10 * 60_000);
  if (limited) return limited;

  // Fail closed if the gate isn't configured on this deploy.
  if (!opsGateConfigured()) {
    return NextResponse.json({ error: "Unavailable." }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as Body;
  const ok = await checkOpsCode(body.code ?? "");
  if (!ok) {
    return NextResponse.json({ error: "Incorrect." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(OPS_COOKIE, issueOpsToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 2 * 60 * 60, // seconds
  });
  return res;
}
