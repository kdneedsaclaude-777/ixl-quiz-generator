import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Liveness/readiness probe for load balancers and uptime monitors. Returns 200
// only when the app can reach the database; 503 otherwise. No auth, no PII.
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "up" });
  } catch {
    return NextResponse.json({ status: "degraded", db: "down" }, { status: 503 });
  }
}
