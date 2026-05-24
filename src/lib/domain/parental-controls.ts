// Pure logic for parental-control enforcement. No DB calls, no I/O.
// Caller passes settings + clock + counters; gets back a decision.

export type ParentalSettingsView = {
  maxQuizzesPerDay: number | null;
  windowStart: string | null; // "HH:MM" 24h, wall-clock in windowTimezone
  windowEnd: string | null;
  windowTimezone: string | null; // IANA name, e.g. "America/New_York"
  lockedTopicGroupIds: number[]; // already parsed
};

export type PracticeDecision = {
  allowed: boolean;
  reason?: "outside_window" | "daily_limit_reached";
  detail?: string;
  windowStart?: string;
  windowEnd?: string;
};

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

function parseHHMM(s: string): number | null {
  const m = HHMM.exec(s);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

// Wall-clock minutes-since-midnight for `date` AS OBSERVED in `tz`. This is
// the fix for the timezone bug: comparing a window against the server's local
// clock fired it hours off; we instead read the hour/minute in the parent's
// own timezone. Falls back to UTC if `tz` is not a valid IANA name.
export function minutesOfDayInTz(date: Date, tz: string): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23", // 00–23, never "24"
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(date);
    let hh = 0;
    let mm = 0;
    for (const p of parts) {
      if (p.type === "hour") hh = parseInt(p.value, 10);
      else if (p.type === "minute") mm = parseInt(p.value, 10);
    }
    return hh * 60 + mm;
  } catch {
    return date.getUTCHours() * 60 + date.getUTCMinutes();
  }
}

// Returns true if `now` falls in the [start, end) window, where the window
// times are wall-clock in `tz`. Supports wrap-around windows (e.g. 22:00–02:00)
// by treating end<start as crossing midnight.
export function isWithinWindow(
  start: string,
  end: string,
  now: Date,
  tz = "UTC",
): boolean {
  const s = parseHHMM(start);
  const e = parseHHMM(end);
  if (s === null || e === null) return true; // malformed → don't block
  const cur = minutesOfDayInTz(now, tz);
  if (s === e) return false; // empty window
  if (s < e) return cur >= s && cur < e;
  return cur >= s || cur < e;
}

export function isPracticeAllowedNow(
  settings: ParentalSettingsView | null,
  quizzesToday: number,
  now: Date = new Date(),
): PracticeDecision {
  if (!settings) return { allowed: true };

  if (settings.windowStart && settings.windowEnd) {
    // Window times are wall-clock in the parent's saved timezone. Legacy rows
    // with no timezone fall back to UTC.
    const tz = settings.windowTimezone || "UTC";
    if (!isWithinWindow(settings.windowStart, settings.windowEnd, now, tz)) {
      return {
        allowed: false,
        reason: "outside_window",
        detail: `Practice is allowed between ${settings.windowStart} and ${settings.windowEnd}${
          settings.windowTimezone ? ` (${settings.windowTimezone})` : ""
        }.`,
        windowStart: settings.windowStart,
        windowEnd: settings.windowEnd,
      };
    }
  }

  if (typeof settings.maxQuizzesPerDay === "number" && quizzesToday >= settings.maxQuizzesPerDay) {
    return {
      allowed: false,
      reason: "daily_limit_reached",
      detail: `Today's quiz limit (${settings.maxQuizzesPerDay}) has been reached.`,
    };
  }

  return { allowed: true };
}

// Removes locked topic-group IDs from a list of available ones.
export function topicsAvailable(allTopicGroupIds: number[], lockedIds: number[]): number[] {
  if (lockedIds.length === 0) return allTopicGroupIds;
  const locked = new Set(lockedIds);
  return allTopicGroupIds.filter((id) => !locked.has(id));
}

// Parses the JSON-serialised lockedTopicGroupIds field defensively.
export function parseLockedTopicGroupIds(json: string | null | undefined): number[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((x): x is number => typeof x === "number" && Number.isFinite(x));
    }
    return [];
  } catch {
    return [];
  }
}
