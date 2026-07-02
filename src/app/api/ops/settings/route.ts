import { NextResponse } from "next/server";
import { isOpsUnlocked } from "@/lib/ops";
import { HOLIDAYS } from "@/lib/domain/holidays";
import {
  getAllOwnerSettings,
  holidayOverrideFrom,
  setHolidayOverride,
  resolveActiveHoliday,
  type HolidayOverride,
} from "@/lib/owner-settings";

async function guard(): Promise<boolean> {
  return isOpsUnlocked();
}

export async function GET(): Promise<Response> {
  if (!(await guard())) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const settings = await getAllOwnerSettings();
  const active = await resolveActiveHoliday();
  return NextResponse.json({
    holidays: HOLIDAYS.map((h) => ({
      id: h.id,
      name: h.name,
      currency: `${h.currency.icon} ${h.currency.name}`,
      override: holidayOverrideFrom(settings, h.id),
    })),
    activeHolidayId: active?.id ?? null,
  });
}

type PostBody = { holidayId?: string; override?: string };

export async function POST(req: Request): Promise<Response> {
  if (!(await guard())) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = (await req.json().catch(() => ({}))) as PostBody;
  const holidayId = body.holidayId ?? "";
  const override = body.override ?? "";
  if (!HOLIDAYS.some((h) => h.id === holidayId)) {
    return NextResponse.json({ error: "Unknown holiday." }, { status: 400 });
  }
  if (!["auto", "on", "off"].includes(override)) {
    return NextResponse.json({ error: "Bad value." }, { status: 400 });
  }
  const ok = await setHolidayOverride(holidayId, override as HolidayOverride);
  if (!ok) {
    return NextResponse.json({ error: "Storage not ready (migration pending)." }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
