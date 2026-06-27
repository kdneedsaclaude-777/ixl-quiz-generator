import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getParentForApi } from "@/lib/auth/server";

type Body = {
  windowStart?: string | null;
  windowEnd?: string | null;
  windowTimezone?: string | null;
  lockedTopicGroupIds?: number[];
};

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

// True if `tz` is an IANA timezone the runtime recognises.
function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getParentForApi();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id: idParam } = await params;
  const studentId = parseInt(idParam, 10);
  if (!Number.isFinite(studentId)) {
    return NextResponse.json({ error: "Invalid student id." }, { status: 400 });
  }

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student || (student.parentId !== auth.parent.userId && auth.parent.role !== "superadmin")) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  const body = (await req.json().catch(() => ({}))) as Body;

  const windowStart = body.windowStart || null;
  const windowEnd = body.windowEnd || null;
  if (windowStart && !HHMM.test(windowStart)) {
    return NextResponse.json({ error: "windowStart must be HH:MM." }, { status: 400 });
  }
  if (windowEnd && !HHMM.test(windowEnd)) {
    return NextResponse.json({ error: "windowEnd must be HH:MM." }, { status: 400 });
  }
  if ((windowStart && !windowEnd) || (!windowStart && windowEnd)) {
    return NextResponse.json({ error: "Provide both start and end, or neither." }, { status: 400 });
  }

  // Window times are wall-clock — store the timezone they were entered in so
  // the server enforces them in the parent's time, not its own (UTC).
  let windowTimezone: string | null = null;
  if (windowStart && windowEnd) {
    const tz = body.windowTimezone?.trim();
    if (tz) {
      if (!isValidTimezone(tz)) {
        return NextResponse.json({ error: "Invalid timezone." }, { status: 400 });
      }
      windowTimezone = tz;
    }
  }

  const lockedIds = Array.isArray(body.lockedTopicGroupIds)
    ? body.lockedTopicGroupIds.filter((n): n is number => Number.isInteger(n))
    : [];

  // Daily cap removed (unlimited generation) — always store null so any
  // previously-set cap is cleared. Column kept to avoid a destructive migration.
  await prisma.parentalSettings.upsert({
    where: { studentId },
    create: {
      studentId,
      maxQuizzesPerDay: null,
      windowStart,
      windowEnd,
      windowTimezone,
      lockedTopicGroupIds: JSON.stringify(lockedIds),
    },
    update: {
      maxQuizzesPerDay: null,
      windowStart,
      windowEnd,
      windowTimezone,
      lockedTopicGroupIds: JSON.stringify(lockedIds),
    },
  });

  return NextResponse.json({ ok: true });
}
