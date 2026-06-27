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

  const inputCls =
    "mt-1 w-full rounded-lg border px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#A5B4FC]/40";
  return (
    <div className="mt-3 space-y-3">
      <label className="block text-sm">
        <span className="font-medium text-[color:var(--shell-text)]">App name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
          style={{ borderColor: "var(--shell-border)", background: "rgba(255,255,255,.05)" }}
        />
      </label>
      <label className="block text-sm">
        <span className="font-medium text-[color:var(--shell-text)]">Tagline</span>
        <input
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          className={inputCls}
          style={{ borderColor: "var(--shell-border)", background: "rgba(255,255,255,.05)" }}
        />
      </label>
      {error && <p className="rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(194,95,95,.15)", color: "#FCA5A5" }}>{error}</p>}
      {saved && <p className="rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(78,159,123,.15)", color: "#86EFAC" }}>Saved.</p>}
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="rounded-full bg-[#6366F1] px-5 py-2 text-sm font-semibold text-white hover:bg-[#4F46E5] disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
