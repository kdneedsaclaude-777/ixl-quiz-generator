"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AppSettingsForm({ initial }: { initial: { appName: string; appTagline: string } }) {
  const router = useRouter();
  const [name, setName] = useState(initial.appName);
  const [tagline, setTagline] = useState(initial.appTagline);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await Promise.all([
        fetch("/api/admin/feature-flags/app_name", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: true, value: name }),
        }).then((r) => { if (!r.ok) throw new Error("name save failed"); }),
        fetch("/api/admin/feature-flags/app_tagline", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enabled: true, value: tagline }),
        }).then((r) => { if (!r.ok) throw new Error("tagline save failed"); }),
      ]);
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 space-y-3">
      <label className="block text-sm">
        <span className="text-slate-300">App name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded border border-slate-500 bg-slate-700 px-3 py-2 text-sm text-white"
        />
      </label>
      <label className="block text-sm">
        <span className="text-slate-300">Tagline</span>
        <input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          className="mt-1 w-full rounded border border-slate-500 bg-slate-700 px-3 py-2 text-sm text-white"
        />
      </label>
      {error && <p className="rounded bg-rose-950/60 px-3 py-2 text-sm text-rose-200">{error}</p>}
      {saved && <p className="rounded bg-emerald-950/60 px-3 py-2 text-sm text-emerald-200">Saved.</p>}
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
