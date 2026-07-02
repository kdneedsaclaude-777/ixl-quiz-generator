import { prisma } from "@/lib/db";
import { HOLIDAYS, activeHoliday, type Holiday } from "@/lib/domain/holidays";

// Defensive key/value access for the ops console. Every read is wrapped so a
// missing OwnerSetting table (before the migration lands on a DB) degrades to
// defaults instead of throwing — the rest of the app never depends on it.

export type HolidayOverride = "auto" | "on" | "off";

function holidayKey(id: string): string {
  return `holiday.override.${id}`;
}

export async function getAllOwnerSettings(): Promise<Record<string, string>> {
  try {
    const rows = await prisma.ownerSetting.findMany();
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch {
    return {};
  }
}

export async function setOwnerSetting(key: string, value: string): Promise<boolean> {
  try {
    await prisma.ownerSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
    return true;
  } catch {
    return false;
  }
}

export function holidayOverrideFrom(settings: Record<string, string>, id: string): HolidayOverride {
  const v = settings[holidayKey(id)];
  return v === "on" || v === "off" ? v : "auto";
}

export async function setHolidayOverride(id: string, value: HolidayOverride): Promise<boolean> {
  return setOwnerSetting(holidayKey(id), value);
}

// The holiday that should currently be live, combining the real calendar with
// any owner override (force-on wins for preview; force-off disables). When more
// than one is forced on, the first in catalog order wins.
export async function resolveActiveHoliday(now: Date = new Date()): Promise<Holiday | null> {
  const settings = await getAllOwnerSettings();
  const forcedOn = HOLIDAYS.find((h) => holidayOverrideFrom(settings, h.id) === "on");
  if (forcedOn) return forcedOn;
  const natural = activeHoliday(now);
  if (natural && holidayOverrideFrom(settings, natural.id) === "off") return null;
  return natural;
}
