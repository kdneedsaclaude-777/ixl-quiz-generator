// ─────────────────────────────────────────────────────────────────────────
// Holiday events calendar (pure — no DB, fully unit-testable).
//
// Each holiday is dormant until its date window arrives. During the window a
// themed currency is earnable, a limited-time shop opens, and a hidden holiday
// badge becomes earnable. Everything is gated through `activeHoliday(date)` so
// nothing leaks before the day — the surprise stays intact.
//
// Concept Mastery is part-Canadian, part-Indian, so Canada Day and India's
// Independence Day sit alongside the internationally-celebrated holidays.
// Gradients (background themes) are reserved for the two national days.
// ─────────────────────────────────────────────────────────────────────────

export type CosmeticType = "avatar" | "banner" | "gradient";

export type ShopItem = {
  id: string; // globally unique (prefixed by holiday)
  type: CosmeticType;
  name: string;
  cost: number; // in the holiday's currency
  // For avatar: an emoji. For banner/gradient: a CSS background value.
  value: string;
};

export type Holiday = {
  id: string;
  name: string;
  // Short, professional one-liner shown on the themed home banner.
  tagline: string;
  currency: { id: string; name: string; icon: string };
  // The hidden badge earned by completing this holiday's challenge.
  badgeCode: string;
  // Currency awarded: per completed quiz during the window, and the bonus for
  // finishing the holiday challenge specifically.
  perQuiz: number;
  challengeBonus: number;
  // Accent color for the themed banner (kept subtle/professional).
  accent: string;
  items: ShopItem[];
};

// Inclusive date window [start, end] for a holiday in a given year, expressed
// as UTC dates so activation is consistent for everyone.
export type HolidayWindow = { start: Date; end: Date };

function utcDate(year: number, month1: number, day: number): Date {
  // month1 is 1-based for readability.
  return new Date(Date.UTC(year, month1 - 1, day, 0, 0, 0, 0));
}

// Western (Gregorian) Easter Sunday via the Anonymous Gregorian algorithm.
export function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return utcDate(year, month, day);
}

// Anchor date for a holiday in a given year. Fixed-date holidays are trivial;
// Easter is computed.
function anchorDate(holidayId: string, year: number): Date {
  switch (holidayId) {
    case "new_year":
      return utcDate(year, 1, 1);
    case "easter":
      return easterSunday(year);
    case "canada_day":
      return utcDate(year, 7, 1);
    case "india_independence":
      return utcDate(year, 8, 15);
    case "halloween":
      return utcDate(year, 10, 31);
    case "christmas":
      return utcDate(year, 12, 25);
    default:
      return utcDate(year, 1, 1);
  }
}

// Window padding (days before/after the anchor) so each event is a real but
// LIMITED window rather than a single hour.
const WINDOW: Record<string, { before: number; after: number }> = {
  new_year: { before: 1, after: 1 }, // Dec 31 – Jan 2
  easter: { before: 1, after: 1 }, // Sat – Mon
  canada_day: { before: 0, after: 1 }, // Jul 1 – 2
  india_independence: { before: 0, after: 1 }, // Aug 15 – 16
  halloween: { before: 1, after: 0 }, // Oct 30 – 31
  christmas: { before: 1, after: 1 }, // Dec 24 – 26
};

// ── The catalog ────────────────────────────────────────────────────────────
export const HOLIDAYS: Holiday[] = [
  {
    id: "new_year",
    name: "New Year",
    tagline: "A fresh start — celebrate the new year.",
    currency: { id: "sparkle", name: "Sparkles", icon: "✨" },
    badgeCode: "holiday_new_year",
    perQuiz: 5,
    challengeBonus: 20,
    accent: "#5C7BAE",
    items: [
      { id: "new_year_avatar_party", type: "avatar", name: "Party Popper", cost: 20, value: "🎉" },
      { id: "new_year_avatar_star", type: "avatar", name: "Shooting Star", cost: 30, value: "🌟" },
      { id: "new_year_banner_fireworks", type: "banner", name: "Fireworks Banner", cost: 40, value: "linear-gradient(90deg,#1e293b,#5C7BAE,#1e293b)" },
    ],
  },
  {
    id: "easter",
    name: "Easter",
    tagline: "Egg-cellent practice this Easter.",
    currency: { id: "egg", name: "Easter Eggs", icon: "🥚" },
    badgeCode: "holiday_easter",
    perQuiz: 5,
    challengeBonus: 20,
    accent: "#9C6ADE",
    items: [
      { id: "easter_avatar_bunny", type: "avatar", name: "Spring Bunny", cost: 20, value: "🐰" },
      { id: "easter_avatar_chick", type: "avatar", name: "Little Chick", cost: 25, value: "🐣" },
      { id: "easter_banner_pastel", type: "banner", name: "Pastel Banner", cost: 40, value: "linear-gradient(90deg,#FBCFE8,#DDD6FE,#BBF7D0)" },
    ],
  },
  {
    id: "canada_day",
    name: "Canada Day",
    tagline: "Happy Canada Day! 🍁",
    currency: { id: "maple", name: "Maple Leaves", icon: "🍁" },
    badgeCode: "holiday_canada_day",
    perQuiz: 5,
    challengeBonus: 20,
    accent: "#C25F5F",
    items: [
      { id: "canada_avatar_leaf", type: "avatar", name: "Maple Leaf", cost: 20, value: "🍁" },
      { id: "canada_banner_flag", type: "banner", name: "True North Banner", cost: 40, value: "linear-gradient(90deg,#D80621,#ffffff,#D80621)" },
      { id: "canada_gradient", type: "gradient", name: "Canada Day Theme", cost: 60, value: "linear-gradient(135deg,#D80621 0%,#ffffff 50%,#D80621 100%)" },
    ],
  },
  {
    id: "india_independence",
    name: "India Independence Day",
    tagline: "Celebrating India's Independence Day. 🇮🇳",
    currency: { id: "tricolour", name: "Tricolour Tokens", icon: "🪷" },
    badgeCode: "holiday_india_independence",
    perQuiz: 5,
    challengeBonus: 20,
    accent: "#E8A317",
    items: [
      { id: "india_avatar_lotus", type: "avatar", name: "Lotus", cost: 20, value: "🪷" },
      { id: "india_banner_tricolour", type: "banner", name: "Tricolour Banner", cost: 40, value: "linear-gradient(90deg,#FF9933,#ffffff,#138808)" },
      { id: "india_gradient", type: "gradient", name: "Tricolour Theme", cost: 60, value: "linear-gradient(135deg,#FF9933 0%,#ffffff 50%,#138808 100%)" },
    ],
  },
  {
    id: "halloween",
    name: "Halloween",
    tagline: "Spooky season — treat yourself to some practice.",
    currency: { id: "pumpkin", name: "Pumpkins", icon: "🎃" },
    badgeCode: "holiday_halloween",
    perQuiz: 5,
    challengeBonus: 20,
    accent: "#E67514",
    items: [
      { id: "halloween_avatar_pumpkin", type: "avatar", name: "Jack-o'-lantern", cost: 20, value: "🎃" },
      { id: "halloween_avatar_ghost", type: "avatar", name: "Friendly Ghost", cost: 25, value: "👻" },
      { id: "halloween_banner_night", type: "banner", name: "Midnight Banner", cost: 40, value: "linear-gradient(90deg,#1a1030,#E67514,#1a1030)" },
    ],
  },
  {
    id: "christmas",
    name: "Christmas",
    tagline: "Season's greetings — happy holidays!",
    currency: { id: "tree", name: "Christmas Trees", icon: "🎄" },
    badgeCode: "holiday_christmas",
    perQuiz: 5,
    challengeBonus: 20,
    accent: "#2E7D53",
    items: [
      { id: "christmas_avatar_tree", type: "avatar", name: "Christmas Tree", cost: 20, value: "🎄" },
      { id: "christmas_avatar_snow", type: "avatar", name: "Snowman", cost: 25, value: "⛄" },
      { id: "christmas_banner_festive", type: "banner", name: "Festive Banner", cost: 40, value: "linear-gradient(90deg,#B3122B,#2E7D53,#B3122B)" },
    ],
  },
];

const HOLIDAY_BY_ID = new Map(HOLIDAYS.map((h) => [h.id, h]));
export function holidayById(id: string | null | undefined): Holiday | null {
  return id ? HOLIDAY_BY_ID.get(id) ?? null : null;
}

// The window for a holiday in a given year (anchor ± padding), as UTC dates.
export function holidayWindow(holidayId: string, year: number): HolidayWindow {
  const anchor = anchorDate(holidayId, year);
  const pad = WINDOW[holidayId] ?? { before: 0, after: 0 };
  const start = new Date(anchor);
  start.setUTCDate(start.getUTCDate() - pad.before);
  const end = new Date(anchor);
  end.setUTCDate(end.getUTCDate() + pad.after);
  return { start, end };
}

// The holiday whose window contains `now` (UTC day granularity), or null.
// Checks this year and the adjacent years so New Year (which spans Dec→Jan)
// resolves correctly near the boundary.
export function activeHoliday(now: Date = new Date()): Holiday | null {
  const t = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const year = now.getUTCFullYear();
  for (const h of HOLIDAYS) {
    for (const y of [year - 1, year, year + 1]) {
      const w = holidayWindow(h.id, y);
      if (t >= Date.UTC(w.start.getUTCFullYear(), w.start.getUTCMonth(), w.start.getUTCDate()) &&
          t <= Date.UTC(w.end.getUTCFullYear(), w.end.getUTCMonth(), w.end.getUTCDate())) {
        return h;
      }
    }
  }
  return null;
}

export function shopItemById(itemId: string): { holiday: Holiday; item: ShopItem } | null {
  for (const h of HOLIDAYS) {
    const item = h.items.find((i) => i.id === itemId);
    if (item) return { holiday: h, item };
  }
  return null;
}
