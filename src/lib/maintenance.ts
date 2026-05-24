import { prisma } from "@/lib/db";

// Reads the maintenance_mode feature flag. Cached briefly (5s) to avoid
// hammering the DB on every page render.
let cached: { value: boolean; expiresAt: number } | null = null;
const TTL_MS = 5 * 1000;

export async function isMaintenanceModeOn(): Promise<boolean> {
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.value;
  const flag = await prisma.featureFlag.findUnique({ where: { key: "maintenance_mode" } });
  const value = Boolean(flag?.enabled);
  cached = { value, expiresAt: now + TTL_MS };
  return value;
}

// Test hook: clear cache so a freshly toggled flag is visible immediately.
export function clearMaintenanceCache(): void {
  cached = null;
}
