"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import CMIcon from "@/components/CMIcon";

type Student = { id: number; name: string; grade: number; parentName: string | null };
type Status = "idle" | "importing" | "done" | "error";
type Result = { quizId: number; count: number; studentId: number };

function extractQuestions(payload: unknown): unknown[] | null {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object" && Array.isArray((payload as { questions?: unknown[] }).questions)) {
    return (payload as { questions: unknown[] }).questions;
  }
  return null;
}

// Dark-shell admin tool: the PDF generator is embedded in an iframe (served from
// /pdf-question-generator.html). Its "Send to app" postMessages questions up to
// this page, which imports them as a quiz for the selected student. A paste-JSON
// fallback is included for resilience.
export default function AdminImportClient({ students }: { students: Student[] }) {
  const [studentId, setStudentId] = useState<number | null>(students[0]?.id ?? null);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pasted, setPasted] = useState("");
  const [captured, setCaptured] = useState(false);
  const [showPaste, setShowPaste] = useState(false);

  const sidRef = useRef<number | null>(studentId);
  useEffect(() => { sidRef.current = studentId; }, [studentId]);

  const importQuestions = useCallback(async (questions: unknown[]) => {
    const sid = sidRef.current;
    if (!sid) { setError("Pick a student first."); setStatus("error"); return; }
    if (!questions.length) { setError("No questions found in the payload."); setStatus("error"); return; }
    setStatus("importing");
    setError(null);
    try {
      const res = await fetch("/api/quiz/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: sid, questions }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Import failed.");
      setResult({ quizId: data.quizId, count: data.count, studentId: sid });
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
      setStatus("error");
    }
  }, []);

  // Same-window CustomEvent + iframe/window postMessage.
  useEffect(() => {
    const onCustom = (e: Event) => {
      const qs = extractQuestions((e as CustomEvent).detail);
      if (qs) { setCaptured(true); void importQuestions(qs); }
    };
    const onMessage = (e: MessageEvent) => {
      const d = e.data;
      if (!d || typeof d !== "object" || d.type !== "cmQuestionsReady") return;
      const qs = extractQuestions(d.questions ?? d.detail ?? d.payload);
      if (qs) { setCaptured(true); void importQuestions(qs); }
    };
    window.addEventListener("cmQuestionsReady", onCustom as EventListener);
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("cmQuestionsReady", onCustom as EventListener);
      window.removeEventListener("message", onMessage);
    };
  }, [importQuestions]);

  function importPasted() {
    setError(null);
    let parsed: unknown;
    try { parsed = JSON.parse(pasted); }
    catch { setError("That isn't valid JSON. Paste the generator's “Copy JSON” output."); setStatus("error"); return; }
    const qs = extractQuestions(parsed);
    if (!qs) { setError("Couldn't find a questions array in that JSON."); setStatus("error"); return; }
    void importQuestions(qs);
  }

  const selected = students.find((s) => s.id === studentId);
  const dot = status === "done" ? "var(--cm-mint)" : status === "importing" ? "var(--cm-gold)" : "#A5B4FC";

  return (
    <div className="space-y-4 text-[color:var(--shell-text)]">
      <div>
        <div className="text-xs font-semibold tracking-wide text-[color:var(--shell-muted)]">CONTENT TOOLS</div>
        <h1 className="font-display mt-1 text-4xl leading-none text-white">Import questions</h1>
        <p className="mt-2 text-sm text-[color:var(--shell-muted)]">
          Generate questions from a PDF, then send them into the app as a ready-to-play quiz for any student.
        </p>
      </div>

      {students.length === 0 ? (
        <p className="rounded-2xl border p-6 text-center text-sm" style={{ background: "var(--shell-card)", borderColor: "var(--shell-border)" }}>
          No students exist yet.
        </p>
      ) : (
        <>
          {/* Assign-to + status */}
          <div className="rounded-2xl border p-4" style={{ background: "var(--shell-card)", borderColor: "var(--shell-border)" }}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex-1">
                <label htmlFor="student" className="mb-1.5 block text-xs font-semibold text-[color:var(--shell-muted)]">
                  CREATE THE QUIZ FOR
                </label>
                <select
                  id="student"
                  value={studentId ?? ""}
                  onChange={(e) => setStudentId(Number(e.target.value))}
                  className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                  style={{ background: "rgba(255,255,255,.05)", border: "1px solid var(--shell-border)" }}
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id} style={{ color: "#0F172A" }}>
                      {s.name} · G{s.grade}{s.parentName ? ` · ${s.parentName}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: dot }} aria-hidden />
                <span className="text-[color:var(--shell-muted)]">
                  {status === "importing" ? "Importing…" : status === "done" ? "Imported" : captured ? "Received" : "Waiting for Send to app"}
                </span>
              </div>
            </div>
          </div>

          {/* Embedded generator */}
          <div className="overflow-hidden rounded-2xl border" style={{ borderColor: "var(--shell-border)" }}>
            <iframe
              src="/pdf-question-generator.html"
              title="PDF Question Generator"
              className="w-full"
              style={{ height: 760, border: "none", background: "#FAFAF7" }}
            />
          </div>
          <p className="text-xs text-[color:var(--shell-muted)]">
            Inside the generator, upload a PDF, generate, then click <span className="font-semibold text-white">Send to app</span> —
            it lands here automatically for <span className="font-semibold text-white">{selected?.name ?? "the selected student"}</span>.
          </p>

          {/* Paste fallback */}
          <div className="rounded-2xl border p-4" style={{ background: "var(--shell-card)", borderColor: "var(--shell-border)" }}>
            <button
              type="button"
              onClick={() => setShowPaste((v) => !v)}
              className="flex w-full items-center justify-between text-sm font-semibold text-white"
            >
              <span>Paste JSON instead</span>
              <CMIcon name={showPaste ? "chevron" : "chevron"} size={16} color="var(--shell-muted)" />
            </button>
            {showPaste && (
              <div className="mt-3">
                <textarea
                  value={pasted}
                  onChange={(e) => setPasted(e.target.value)}
                  rows={5}
                  placeholder='{"questions":[ … ]}'
                  className="w-full rounded-lg px-3 py-2 font-mono text-xs text-white outline-none"
                  style={{ background: "rgba(255,255,255,.05)", border: "1px solid var(--shell-border)", resize: "vertical", minHeight: 110 }}
                />
                <button
                  type="button"
                  onClick={importPasted}
                  disabled={status === "importing" || !pasted.trim() || !studentId}
                  className="mt-3 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: "var(--cm-blue)" }}
                >
                  {status === "importing" ? "Creating…" : "Create quiz"}
                </button>
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(194,95,95,.15)", color: "#FCA5A5" }}>{error}</p>
          )}

          {status === "done" && result && (
            <div className="rounded-2xl border p-4" style={{ background: "rgba(78,159,123,.12)", borderColor: "rgba(78,159,123,.4)" }}>
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl" style={{ background: "rgba(255,255,255,.08)" }} aria-hidden>
                  <CMIcon name="check" size={22} color="var(--cm-mint)" stroke={3} />
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-extrabold text-white">
                    {result.count} question{result.count === 1 ? "" : "s"} imported
                  </h2>
                  <p className="text-xs text-[color:var(--shell-muted)]">
                    A practice quiz is ready for {selected?.name ?? "the student"}.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/quiz/${result.quizId}?studentId=${result.studentId}`}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
                  style={{ background: "var(--cm-blue)" }}
                >
                  Open the quiz
                </Link>
                <Link
                  href={`/admin/students`}
                  className="rounded-lg px-4 py-2 text-sm font-semibold"
                  style={{ background: "rgba(255,255,255,.06)", color: "var(--shell-text)", border: "1px solid var(--shell-border)" }}
                >
                  Back to students
                </Link>
                <button
                  type="button"
                  onClick={() => { setStatus("idle"); setResult(null); setPasted(""); setCaptured(false); }}
                  className="rounded-lg px-4 py-2 text-sm font-semibold"
                  style={{ background: "rgba(255,255,255,.06)", color: "var(--shell-text)", border: "1px solid var(--shell-border)" }}
                >
                  Import more
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
