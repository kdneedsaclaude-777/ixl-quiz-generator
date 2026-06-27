"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Initial = {
  maxQuizzesPerDay: number | null;
  windowStart: string;
  windowEnd: string;
  lockedTopicGroupIds: number[];
};

export default function ParentalControlsForm({
  studentId,
  initial,
  topicGroups,
}: {
  studentId: number;
  initial: Initial;
  topicGroups: { id: number; letter: string; name: string }[];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [windowStart, setWindowStart] = useState(initial.windowStart);
  const [windowEnd, setWindowEnd] = useState(initial.windowEnd);
  const [locked, setLocked] = useState<Set<number>>(new Set(initial.lockedTopicGroupIds));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Resolved on the client only (server tz differs → would hydrate-mismatch).
  const [tz, setTz] = useState("");
  useEffect(() => setTz(Intl.DateTimeFormat().resolvedOptions().timeZone), []);

  function toggle(id: number) {
    setLocked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const body = {
        windowStart: windowStart || null,
        windowEnd: windowEnd || null,
        // Capture the browser's IANA timezone so the server enforces the
        // window in the parent's local time, not its own (UTC).
        windowTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        lockedTopicGroupIds: [...locked],
      };
      const res = await fetch(`/api/parent/child/${studentId}/parental-settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? "Save failed.");
      setSaved(true);
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="cm-card p-[18px]">
      <h3 className="text-[15px] font-bold text-slate-900">Parental controls</h3>
      <p className="mt-1 text-xs text-slate-500">
        Limits apply to quiz generation. Empty fields mean &ldquo;no limit&rdquo;.
      </p>

      <form onSubmit={onSubmit} className="mt-4 space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ws" className="block text-sm font-medium text-slate-900 dark:text-slate-100">Practice window start</label>
            <input
              id="ws"
              type="time"
              value={windowStart}
              onChange={(e) => setWindowStart(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-500 dark:bg-slate-700 dark:text-white"
            />
          </div>
          <div>
            <label htmlFor="we" className="block text-sm font-medium text-slate-900 dark:text-slate-100">Practice window end</label>
            <input
              id="we"
              type="time"
              value={windowEnd}
              onChange={(e) => setWindowEnd(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-500 dark:bg-slate-700 dark:text-white"
            />
          </div>
        </div>
        {tz && (
          <p className="-mt-2 text-xs text-slate-500 dark:text-slate-400">
            Window times use your timezone:{" "}
            <span className="font-medium text-slate-700 dark:text-slate-300">{tz}</span>
          </p>
        )}

        <fieldset>
          <legend className="text-sm font-medium text-slate-900 dark:text-slate-100">Lock topics (hide from your child)</legend>
          {topicGroups.length === 0 ? (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">No topic groups selected yet.</p>
          ) : (
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {topicGroups.map((g) => (
                <label key={g.id} className="flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 text-sm text-slate-900 hover:bg-slate-50 dark:text-slate-100 dark:hover:bg-slate-800">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={locked.has(g.id)}
                    onChange={() => toggle(g.id)}
                  />
                  <span>{g.name}</span>
                </label>
              ))}
            </div>
          )}
        </fieldset>

        {error && <p className="rounded bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-200">{error}</p>}
        {saved && <p className="rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">Saved.</p>}

        <button type="submit" disabled={saving} className="cm-btn primary disabled:opacity-50">
          {saving ? "Saving…" : "Save parental controls"}
        </button>
      </form>
    </section>
  );
}
