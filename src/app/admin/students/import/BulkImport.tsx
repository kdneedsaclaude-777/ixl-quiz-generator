"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type RowPlan = {
  rowNumber: number;
  name: string;
  grade: number;
  parentEmail: string;
  difficulty: number;
  withLogin: boolean;
  ok: boolean;
  problems: string[];
};

type PreviewResp = { total: number; validCount: number; invalidCount: number; rows: RowPlan[] };

const TEMPLATE =
  "name,grade,parentEmail,difficulty,loginEmail,loginPassword\n" +
  "Ada Lovelace,4,parent@demo.local,2,,\n" +
  "Alan Turing,6,parent@demo.local,3,alan@demo.local,Student1234!";

export default function BulkImport() {
  const router = useRouter();
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<PreviewResp | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ created: number; skipped: number } | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsv(await file.text());
    setPreview(null);
    setDone(null);
  }

  async function runPreview() {
    setBusy(true); setError(null); setDone(null);
    try {
      const res = await fetch("/api/admin/students/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, mode: "preview" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Preview failed.");
      setPreview(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preview failed.");
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    if (!preview || preview.validCount === 0) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/admin/students/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, mode: "commit" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed.");
      setDone({ created: data.created, skipped: data.skipped });
      setPreview(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4 text-[color:var(--shell-text)]">
      <div className="rounded-2xl border p-4" style={{ background: "var(--shell-card)", borderColor: "var(--shell-border)" }}>
        <h2 className="mb-1 text-sm font-bold text-white">CSV format</h2>
        <p className="mb-2 text-xs text-[color:var(--shell-muted)]">
          Required: <code className="font-mono text-[#A5B4FC]">name</code>, <code className="font-mono text-[#A5B4FC]">grade</code> (1–8), <code className="font-mono text-[#A5B4FC]">parentEmail</code> (existing parent).
          Optional: <code className="font-mono text-[#A5B4FC]">difficulty</code> (1–5), <code className="font-mono text-[#A5B4FC]">loginEmail</code> + <code className="font-mono text-[#A5B4FC]">loginPassword</code> to provision a student login.
        </p>
        <pre className="overflow-x-auto rounded-lg p-2.5 font-mono text-xs text-[color:var(--shell-text)]" style={{ background: "rgba(255,255,255,.04)", border: "1px solid var(--shell-border)" }}>{TEMPLATE}</pre>
      </div>

      <div className="rounded-2xl border p-4" style={{ background: "var(--shell-card)", borderColor: "var(--shell-border)" }}>
        <div className="mb-2 flex items-center gap-3">
          <input type="file" accept=".csv,text/csv" onChange={onFile} className="text-sm text-[color:var(--shell-muted)] file:mr-3 file:rounded-full file:border-0 file:bg-[#6366F1] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white" />
          <span className="text-xs text-[color:var(--shell-muted)]">or paste below</span>
        </div>
        <textarea
          value={csv}
          onChange={(e) => { setCsv(e.target.value); setPreview(null); setDone(null); }}
          rows={8}
          placeholder={TEMPLATE}
          className="w-full rounded-lg border p-2.5 font-mono text-xs text-white placeholder:text-[color:var(--shell-muted)] focus:outline-none focus:ring-2 focus:ring-[#A5B4FC]/40"
          style={{ borderColor: "var(--shell-border)", background: "rgba(255,255,255,.05)" }}
        />
        <div className="mt-2 flex gap-2">
          <button onClick={runPreview} disabled={busy || !csv.trim()} className="rounded-full bg-[#6366F1] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#4F46E5] disabled:opacity-50">
            {busy ? "Working…" : "Preview"}
          </button>
          {preview && preview.validCount > 0 && (
            <button onClick={commit} disabled={busy} className="rounded-full px-4 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50" style={{ background: "var(--cm-mint)" }}>
              Import {preview.validCount} student{preview.validCount === 1 ? "" : "s"}
            </button>
          )}
        </div>
      </div>

      {error && <p className="rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(194,95,95,.15)", color: "#FCA5A5" }}>{error}</p>}

      {done && (
        <p className="rounded-xl px-3 py-2 text-sm" style={{ background: "rgba(78,159,123,.15)", color: "#86EFAC" }}>
          ✓ Imported {done.created} student{done.created === 1 ? "" : "s"}.{done.skipped > 0 ? ` Skipped ${done.skipped} invalid row(s).` : ""}
        </p>
      )}

      {preview && (
        <div className="rounded-2xl border p-4" style={{ background: "var(--shell-card)", borderColor: "var(--shell-border)" }}>
          <p className="mb-3 text-sm text-[color:var(--shell-text)]">
            {preview.total} row(s): <span className="font-semibold" style={{ color: "var(--cm-mint)" }}>{preview.validCount} valid</span>
            {preview.invalidCount > 0 && <span className="font-semibold" style={{ color: "#FCA5A5" }}> · {preview.invalidCount} invalid</span>}
          </p>
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid items-center gap-2 px-1 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--shell-muted)]" style={{ gridTemplateColumns: "40px 36px 1.4fr 60px 1.6fr 70px 1.4fr", borderBottom: "1px solid var(--shell-border)" }}>
                <span>#</span>
                <span></span>
                <span>Name</span>
                <span>Grade</span>
                <span>Parent</span>
                <span>Login?</span>
                <span>Problems</span>
              </div>
              {preview.rows.map((r) => (
                <div key={r.rowNumber} className="grid items-center gap-2 px-1 py-1.5 text-sm" style={{ gridTemplateColumns: "40px 36px 1.4fr 60px 1.6fr 70px 1.4fr", borderBottom: "1px solid var(--shell-border)" }}>
                  <span className="font-mono text-[color:var(--shell-muted)]">{r.rowNumber}</span>
                  <span>{r.ok ? "✅" : "❌"}</span>
                  <span className="text-white">{r.name || "—"}</span>
                  <span className="font-mono text-xs">{r.grade || "—"}</span>
                  <span className="truncate font-mono text-xs text-[color:var(--shell-muted)]">{r.parentEmail || "—"}</span>
                  <span className="text-xs">{r.withLogin ? "yes" : "—"}</span>
                  <span className="text-xs" style={{ color: "#FCA5A5" }}>{r.problems.join("; ")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
