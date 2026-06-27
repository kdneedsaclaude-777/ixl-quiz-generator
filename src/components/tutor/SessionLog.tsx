"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type SessionRow = {
  id: string;
  status: string;
  scheduledAt: string;
  durationMin: number;
  focus: string | null;
  notes: string | null;
};

type Props = { studentId: number; initialSessions: SessionRow[] };

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  cancelled: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
};

export default function SessionLog({ studentId, initialSessions }: Props) {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionRow[]>(initialSessions);
  const [editing, setEditing] = useState<SessionRow | null>(null);
  const [creating, setCreating] = useState(false);

  function onSaved(saved: SessionRow, isNew: boolean) {
    setSessions((prev) => (isNew ? [saved, ...prev] : prev.map((s) => (s.id === saved.id ? saved : s))));
    setEditing(null);
    setCreating(false);
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this session?")) return;
    const res = await fetch(`/api/tutor/sessions/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      router.refresh();
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Session log</h2>
        {!creating && !editing && (
          <button onClick={() => setCreating(true)} className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500">
            + Schedule / log session
          </button>
        )}
      </div>

      {(creating || editing) && (
        <SessionForm
          studentId={studentId}
          existing={editing}
          onSaved={onSaved}
          onCancel={() => { setCreating(false); setEditing(null); }}
        />
      )}

      {sessions.length === 0 && !creating ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No sessions yet. Schedule one or log a past session.</p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => (
            <li key={s.id} className="rounded-md border border-slate-200 p-3 dark:border-slate-700">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${STATUS_STYLES[s.status] ?? ""}`}>{s.status}</span>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{fmtDateTime(s.scheduledAt)}</span>
                    <span className="text-xs text-slate-400">· {s.durationMin} min</span>
                  </div>
                  {s.focus && <p className="mt-1 text-sm text-slate-700 dark:text-slate-200"><span className="font-medium">Focus:</span> {s.focus}</p>}
                  {s.notes && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{s.notes}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => { setEditing(s); setCreating(false); }} className="text-xs text-indigo-600 hover:underline dark:text-indigo-400">Edit</button>
                  <button onClick={() => remove(s.id)} className="text-xs text-rose-600 hover:underline dark:text-rose-400">Delete</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SessionForm({
  studentId, existing, onSaved, onCancel,
}: {
  studentId: number;
  existing: SessionRow | null;
  onSaved: (s: SessionRow, isNew: boolean) => void;
  onCancel: () => void;
}) {
  const [scheduledAt, setScheduledAt] = useState(
    existing ? toLocalInput(existing.scheduledAt) : toLocalInput(new Date().toISOString()),
  );
  const [durationMin, setDurationMin] = useState(existing?.durationMin ?? 30);
  const [status, setStatus] = useState(existing?.status ?? "scheduled");
  const [focus, setFocus] = useState(existing?.focus ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload = { scheduledAt: new Date(scheduledAt).toISOString(), durationMin, status, focus, notes };
    const url = existing ? `/api/tutor/sessions/${existing.id}` : `/api/tutor/students/${studentId}/sessions`;
    const res = await fetch(url, {
      method: existing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(data.error ?? "Failed to save."); return; }
    onSaved(data.session as SessionRow, !existing);
  }

  return (
    <form onSubmit={submit} className="mb-4 space-y-3 rounded-md border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-900 dark:bg-indigo-950/30">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
          Date / time
          <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
        </label>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
          Duration (min)
          <input type="number" min={5} max={480} value={durationMin} onChange={(e) => setDurationMin(parseInt(e.target.value, 10) || 30)} className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
        </label>
        <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100">
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
      </div>
      <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">
        Focus (what this session targets)
        <input type="text" value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. Long division, regrouping" className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
      </label>
      <label className="block text-xs font-medium text-slate-700 dark:text-slate-200">
        Notes / takeaways (visible to parent)
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="What you covered, how it went, what to practise next…" className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100" />
      </label>
      {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
          {busy ? "Saving…" : existing ? "Save changes" : "Create session"}
        </button>
        <button type="button" onClick={onCancel} className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700">Cancel</button>
      </div>
    </form>
  );
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
