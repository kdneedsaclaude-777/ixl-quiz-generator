import { resolveActiveStudent } from "@/lib/active-child";
import { prisma } from "@/lib/db";
import {
  BADGE_CATALOG,
  CATEGORY_META,
  type BadgeCategory,
} from "@/lib/domain/badge-catalog";

export const metadata = { title: "Badges — QuizSpark" };

// Full badge board. Every badge is shown grouped by category. A locked badge
// keeps its identity — the real (dimmed) icon, its name, its category, and a
// concrete "how to unlock" line — instead of an anonymous lock/??? mystery.
// Earned badges light up with their earn date. All from real DB data.
export default async function ChildBadgesPage() {
  const { student: child } = await resolveActiveStudent();
  const earned = await prisma.studentBadge.findMany({
    where: { studentId: child.id },
    include: { badge: true },
  });
  const earnedMap = new Map(earned.map((b) => [b.badgeCode, b]));
  const earnedCount = BADGE_CATALOG.filter((c) => earnedMap.has(c.code)).length;

  // Group the catalog by category, preserving catalog order.
  const order: BadgeCategory[] = ["milestone", "levels", "mastery", "tests", "speed", "consistency"];
  const byCategory = order
    .map((cat) => ({ cat, items: BADGE_CATALOG.filter((b) => b.category === cat) }))
    .filter((g) => g.items.length > 0);

  return (
    <main className="space-y-6">
      <header className="pt-2">
        <h1 className="font-display text-4xl leading-tight text-slate-900">Badges</h1>
        <p className="mt-1 text-sm text-slate-500">
          {earnedCount} of {BADGE_CATALOG.length} earned — keep practising to collect them all!
        </p>
      </header>

      {byCategory.map(({ cat, items }) => (
        <section key={cat}>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            {CATEGORY_META[cat].label}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {items.map((def) => {
              const got = earnedMap.get(def.code);
              return (
                <div
                  key={def.code}
                  className={`rounded-2xl border p-4 text-center ${
                    got ? "border-cm-gold/40 bg-cm-gold-soft" : "border-slate-200 bg-white"
                  }`}
                  aria-label={
                    got
                      ? `${def.name} — earned`
                      : `${def.name} — locked. ${def.unlock}`
                  }
                >
                  <div
                    className={`mx-auto mb-2 grid h-14 w-14 place-items-center rounded-2xl text-3xl ${
                      got ? "bg-white/70" : "bg-slate-100"
                    }`}
                  >
                    {/* Real icon either way — locked just dims it, preserving
                        the badge's identity so it reads as a goal, not a mystery. */}
                    <span aria-hidden className={got ? "" : "opacity-40 grayscale"}>
                      {def.icon}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">{def.name}</div>
                  <div className="mt-1 flex justify-center">
                    <span
                      className={`cm-pill ${CATEGORY_META[def.category].pill}`}
                      style={got ? undefined : { opacity: 0.7 }}
                    >
                      {CATEGORY_META[def.category].label}
                    </span>
                  </div>
                  {got ? (
                    <div className="mt-1.5 text-[11px] font-medium text-amber-700">
                      Earned {got.earnedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  ) : (
                    <div className="mt-1.5 text-[11px] leading-snug text-slate-500">
                      🔑 {def.unlock}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
