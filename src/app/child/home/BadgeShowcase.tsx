// Renders earned vs locked badges side-by-side. Locked ones appear in grayscale
// so the kid can see what's possible to earn next.

export type ChildHomeBadge = {
  code: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: Date;
};

const ALL_BADGE_CODES = [
  "first_quiz",
  "perfect_score",
  "hot_streak",
  "topic_master",
  "speed_demon",
  "comeback_kid",
  "dedicated",
];

const LOCKED_META: Record<string, { name: string; description: string; icon: string }> = {
  first_quiz: { name: "First Quiz", description: "Complete your first quiz.", icon: "🎯" },
  perfect_score: { name: "Perfect Score", description: "Score 100% on a quiz.", icon: "💯" },
  hot_streak: { name: "Hot Streak", description: "5 quizzes in a row above 80%.", icon: "🔥" },
  topic_master: { name: "Topic Master", description: "Score 100% on a topic 3 times.", icon: "🏆" },
  speed_demon: { name: "Speed Demon", description: "Finish a quiz in under 3 minutes.", icon: "⚡" },
  comeback_kid: { name: "Comeback Kid", description: "Bounce back from a tough topic.", icon: "🌟" },
  dedicated: { name: "Dedicated", description: "Practice 7 days in a row.", icon: "📅" },
};

export default function BadgeShowcase({ earned }: { earned: ChildHomeBadge[] }) {
  const earnedSet = new Map(earned.map((b) => [b.code, b]));
  return (
    <section className="rounded-2xl border-2 border-amber-200 bg-white p-5 shadow-sm dark:border-amber-800/50 dark:bg-slate-800">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-300">Badges</h2>
      <ul className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
        {ALL_BADGE_CODES.map((code) => {
          const earnedBadge = earnedSet.get(code);
          const meta = earnedBadge ?? LOCKED_META[code];
          return (
            <li
              key={code}
              className={`flex flex-col items-center gap-1 rounded-xl p-2 text-center ${
                earnedBadge
                  ? "border border-amber-300 bg-amber-50 dark:border-amber-700/50 dark:bg-amber-950/40"
                  : "border border-slate-200 bg-slate-50 opacity-50 dark:border-slate-500 dark:bg-slate-700/40"
              }`}
              title={meta?.description}
            >
              <span className={`text-3xl ${earnedBadge ? "" : "grayscale"}`} aria-hidden>{meta?.icon ?? "❔"}</span>
              <span className="text-[11px] font-semibold text-amber-900 dark:text-amber-100">{meta?.name ?? code}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
