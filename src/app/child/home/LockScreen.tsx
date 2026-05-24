// Shown when parental controls block practice (window or daily limit).

type Props = {
  reason: "outside_window" | "daily_limit_reached";
  detail?: string;
  windowStart?: string;
  windowEnd?: string;
  childName: string;
};

export default function LockScreen({ reason, detail, windowStart, childName }: Props) {
  if (reason === "outside_window") {
    return (
      <main className="space-y-6 py-10 text-center">
        <div className="text-7xl">🕐</div>
        <h1 className="text-3xl font-extrabold text-amber-900 dark:text-amber-100">Hi {childName}!</h1>
        <p className="text-lg text-amber-800 dark:text-amber-200">Come back at {windowStart} to practice!</p>
        <p className="mx-auto max-w-sm text-sm text-amber-700 dark:text-amber-300">{detail}</p>
      </main>
    );
  }
  return (
    <main className="space-y-6 py-10 text-center">
      <div className="text-7xl">✅</div>
      <h1 className="text-3xl font-extrabold text-amber-900 dark:text-amber-100">All done for today!</h1>
      <p className="text-lg text-amber-800 dark:text-amber-200">{detail}</p>
      <p className="mx-auto max-w-sm text-sm text-amber-700 dark:text-amber-300">See you tomorrow, {childName}!</p>
    </main>
  );
}
