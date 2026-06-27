"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CMIcon from "@/components/CMIcon";
import DiagnosticQuiz from "./DiagnosticQuiz";

type Group = { id: number; gradeLevel: number; letter: string; name: string; skillCount: number };

type Step = "setup" | "review" | "done";

export default function OnboardingForm({ groups }: { groups: Group[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [grade, setGrade] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [difficulty, setDifficulty] = useState(1);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [diagnosticHint, setDiagnosticHint] = useState<string | null>(null);
  const [diagnosticRan, setDiagnosticRan] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("setup");
  const [createdId, setCreatedId] = useState<number | null>(null);

  const gradeGroups = useMemo(() => groups.filter((g) => g.gradeLevel === grade), [groups, grade]);
  const allSelected = gradeGroups.length > 0 && gradeGroups.every((g) => selected.has(g.id));

  const chosen = useMemo(() => gradeGroups.filter((g) => selected.has(g.id)), [gradeGroups, selected]);
  const totalSkills = useMemo(() => chosen.reduce((sum, g) => sum + g.skillCount, 0), [chosen]);

  const doneHeadingRef = useRef<HTMLHeadingElement | null>(null);
  useEffect(() => {
    if (step === "done") doneHeadingRef.current?.focus();
  }, [step]);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) for (const g of gradeGroups) next.delete(g.id);
      else for (const g of gradeGroups) next.add(g.id);
      return next;
    });
  }

  function onDiagnosticComplete(suggested: number) {
    setDifficulty(suggested);
    setDiagnosticHint(`Suggested starting difficulty: Level ${suggested}.`);
    setDiagnosticRan(true);
  }

  // Network call: validates again, creates the student, and on success moves to
  // the "done" step (instead of navigating away).
  async function createStudent() {
    setError(null);
    if (!name.trim()) return setError("Enter the student's name.");
    if (selected.size === 0) return setError("Select at least one topic group.");
    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          grade,
          topicGroupIds: [...selected],
          startingDifficulty: difficulty,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to create student");
      }
      const { studentId } = await res.json();
      setCreatedId(studentId);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create student");
    } finally {
      setSubmitting(false);
    }
  }

  // The form submit acts as a step router: setup → review (no network), then
  // review → createStudent().
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step === "setup") {
      setError(null);
      if (!name.trim()) return setError("Enter the student's name.");
      if (selected.size === 0) return setError("Select at least one topic group.");
      setStep("review");
      return;
    }
    if (step === "review") {
      void createStudent();
    }
  }

  function resetForAnother() {
    setStep("setup");
    setName("");
    setSelected(new Set());
    setDifficulty(1);
    setDiagnosticHint(null);
    setDiagnosticRan(false);
    setCreatedId(null);
    setShowDiagnostic(false);
    setError(null);
  }

  const trimmedName = name.trim();

  // STEP 3 (done) renders outside the <form> so Enter can't re-submit.
  if (step === "done") {
    return (
      <div className="space-y-6 text-center">
        <div
          aria-hidden
          className="mx-auto grid h-16 w-16 place-items-center rounded-[20px]"
          style={{ background: "var(--cm-mint-soft)" }}
        >
          <CMIcon name="check" size={34} color="var(--cm-mint)" stroke={3} />
        </div>

        <div className="space-y-2">
          <h1
            ref={doneHeadingRef}
            tabIndex={-1}
            className="font-display text-[32px] leading-tight text-slate-900 outline-none"
          >
            {trimmedName || "Student"} is ready
          </h1>
          <p className="text-sm text-slate-500">
            Grade {grade} · {chosen.length} topic group{chosen.length === 1 ? "" : "s"} · {totalSkills} skill
            {totalSkills === 1 ? "" : "s"} enabled.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <span className="cm-pill indigo">Grade {grade}</span>
          <span className="cm-pill amber">{totalSkills} skill{totalSkills === 1 ? "" : "s"}</span>
          <span className="cm-pill mint">Level {difficulty}</span>
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => createdId != null && router.push(`/parent/child/${createdId}`)}
            className="cm-btn primary lg w-full justify-center"
          >
            Generate first quiz
            <CMIcon name="play" size={18} color="#fff" />
          </button>
          <button
            type="button"
            onClick={() => router.push("/parent/dashboard")}
            className="cm-btn ghost w-full justify-center"
          >
            Go to dashboard
          </button>
          <button
            type="button"
            onClick={resetForAnother}
            className="text-sm font-semibold"
            style={{ color: "var(--cm-blue)" }}
          >
            Add another child
          </button>
        </div>
      </div>
    );
  }

  const isSetup = step === "setup";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* progress */}
      <div className="flex items-center gap-2.5 pt-1">
        {!isSetup && (
          <button
            type="button"
            onClick={() => setStep("setup")}
            aria-label="Back to setup"
            className="grid h-7 w-7 place-items-center rounded-full"
          >
            <CMIcon name="chevronL" size={20} color="var(--slate-400)" />
          </button>
        )}
        <div
          className="cm-bar flex-1"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={2}
          aria-valuenow={isSetup ? 1 : 2}
        >
          <i style={{ width: isSetup ? "50%" : "100%" }} />
        </div>
        <span className="font-mono text-xs text-slate-500">{isSetup ? "1 of 2" : "2 of 2"}</span>
      </div>

      <span className="cm-pill indigo">{isSetup ? "Step 1 · Topics" : "Step 2 · Review"}</span>
      <h1 className="font-display text-[30px] leading-tight text-slate-900">
        {isSetup
          ? trimmedName
            ? `What should ${trimmedName} practice?`
            : "Set up a new student"
          : `${trimmedName || "Student"} — review & confirm`}
      </h1>

      {isSetup ? (
        <>
          <p className="text-sm text-slate-500">
            Pick the grade and topic groups you want enabled, then review before creating.
          </p>

          <div className="cm-card space-y-5 p-5">
            <div>
              <label htmlFor="name" className="cm-label">Student name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="cm-field"
                placeholder="e.g. Alex"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="grade" className="cm-label">Grade</label>
                <select
                  id="grade"
                  value={grade}
                  onChange={(e) => {
                    setGrade(parseInt(e.target.value, 10));
                    setSelected(new Set());
                    setDiagnosticHint(null);
                    setDiagnosticRan(false);
                  }}
                  className="cm-field"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((g) => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="difficulty" className="cm-label">Starting difficulty</label>
                <select
                  id="difficulty"
                  value={difficulty}
                  onChange={(e) => {
                    setDifficulty(parseInt(e.target.value, 10));
                    setDiagnosticRan(false);
                    setDiagnosticHint(null);
                  }}
                  className="cm-field"
                >
                  {[1, 2, 3, 4, 5].map((d) => (
                    <option key={d} value={d}>Level {d}</option>
                  ))}
                </select>
                {diagnosticHint && <p className="mt-1 text-xs font-medium" style={{ color: "var(--cm-mint)" }}>{diagnosticHint}</p>}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDiagnostic((s) => !s)}
                className="cm-pill indigo"
                style={{ cursor: "pointer", height: 30 }}
              >
                {showDiagnostic ? "Hide diagnostic" : "Take 3-question diagnostic"}
              </button>
              <span className="text-xs text-slate-500">Optional — auto-sets the starting difficulty.</span>
            </div>
            {showDiagnostic && <DiagnosticQuiz grade={grade} onComplete={onDiagnosticComplete} />}
          </div>

          {/* topic groups — design cards */}
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700">Topic groups · Grade {grade}</h2>
            <button
              type="button"
              onClick={toggleAll}
              disabled={gradeGroups.length === 0}
              className="text-xs font-semibold disabled:opacity-50"
              style={{ color: "var(--cm-blue)" }}
            >
              {allSelected ? "Clear all" : "Select all"}
            </button>
          </div>

          <div className="grid gap-2">
            {gradeGroups.length === 0 ? (
              <p className="rounded-[14px] border border-dashed border-slate-300 bg-white p-5 text-center text-sm text-slate-500">
                No topic groups for this grade yet.
              </p>
            ) : (
              gradeGroups.map((g) => {
                const picked = selected.has(g.id);
                return (
                  <button
                    type="button"
                    key={g.id}
                    onClick={() => toggle(g.id)}
                    className="flex items-center gap-3 rounded-[14px] bg-white p-3 text-left transition-shadow"
                    style={{
                      border: picked ? "1.5px solid var(--cm-blue)" : "1px solid var(--slate-200)",
                      boxShadow: picked ? "0 0 0 4px var(--cm-blue-50)" : "none",
                    }}
                  >
                    <span
                      className="grid h-8 w-8 place-items-center rounded-[9px] text-[13px] font-extrabold"
                      style={{
                        background: picked ? "var(--cm-blue)" : "var(--slate-100)",
                        color: picked ? "#fff" : "var(--slate-500)",
                      }}
                    >
                      {g.letter}
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-slate-900">{g.name}</span>
                      <span className="block text-xs text-slate-500">{g.skillCount} skill{g.skillCount === 1 ? "" : "s"}</span>
                    </span>
                    <span
                      className="grid h-[22px] w-[22px] place-items-center rounded-[7px]"
                      style={{
                        border: `1.5px solid ${picked ? "var(--cm-blue)" : "var(--slate-300)"}`,
                        background: picked ? "var(--cm-blue)" : "#fff",
                      }}
                    >
                      {picked && <CMIcon name="check" size={14} color="#fff" stroke={3} />}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {error && <p className="rounded-xl bg-cm-red-soft px-3 py-2 text-sm" style={{ color: "#B43326" }}>{error}</p>}

          <button type="submit" className="cm-btn primary lg w-full justify-center">
            Review setup
            <CMIcon name="arrow" size={18} color="#fff" />
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-slate-500">
            Check the details below, then create the student.
          </p>

          <div className="cm-card space-y-5 p-5">
            {/* identity tile */}
            <div className="flex items-center gap-3">
              <span
                className="grid h-14 w-14 place-items-center rounded-[18px] bg-white text-[22px] font-extrabold text-slate-900"
                style={{ border: "2px solid var(--cm-coral)" }}
              >
                {trimmedName ? trimmedName.charAt(0).toUpperCase() : "📘"}
              </span>
              <div className="flex-1">
                <div className="font-display text-[22px] leading-tight text-slate-900">{trimmedName || "Student"}</div>
                <div className="text-xs text-slate-500">Grade {grade} · IXL Ontario</div>
              </div>
              <button
                type="button"
                onClick={() => setStep("setup")}
                className="text-xs font-semibold"
                style={{ color: "var(--cm-blue)" }}
              >
                Edit
              </button>
            </div>

            {/* stat row */}
            <dl className="grid grid-cols-3 gap-2 text-center">
              <div>
                <dd className="font-display text-[26px] leading-none" style={{ color: "var(--cm-blue)" }}>{chosen.length}</dd>
                <dt className="mt-1 text-xs text-slate-500">Topics</dt>
              </div>
              <div>
                <dd className="font-display text-[26px] leading-none" style={{ color: "var(--cm-gold)" }}>{totalSkills}</dd>
                <dt className="mt-1 text-xs text-slate-500">Skills</dt>
              </div>
              <div>
                <dd className="font-display text-[26px] leading-none" style={{ color: "var(--cm-mint)" }}>Level {difficulty}</dd>
                <dt className="mt-1 text-xs text-slate-500">Starting difficulty</dt>
              </div>
            </dl>

            {diagnosticRan ? (
              <span className="cm-pill mint">Suggested by diagnostic</span>
            ) : (
              <span className="cm-pill">Set manually</span>
            )}

            {/* chosen topic groups (read-only, always-picked styling) */}
            <div className="space-y-2">
              <h2 className="text-sm font-bold text-slate-700">Chosen topic groups · Grade {grade}</h2>
              <div className="grid gap-2">
                {chosen.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center gap-3 rounded-[14px] bg-white p-3 text-left"
                    style={{
                      border: "1.5px solid var(--cm-blue)",
                      boxShadow: "0 0 0 4px var(--cm-blue-50)",
                    }}
                  >
                    <span
                      className="grid h-8 w-8 place-items-center rounded-[9px] text-[13px] font-extrabold"
                      style={{ background: "var(--cm-blue)", color: "#fff" }}
                    >
                      {g.letter}
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-semibold text-slate-900">{g.name}</span>
                      <span className="block text-xs text-slate-500">{g.skillCount} skill{g.skillCount === 1 ? "" : "s"}</span>
                    </span>
                    <span
                      className="grid h-[22px] w-[22px] place-items-center rounded-[7px]"
                      style={{ border: "1.5px solid var(--cm-blue)", background: "var(--cm-blue)" }}
                    >
                      <CMIcon name="check" size={14} color="#fff" stroke={3} />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-sm text-slate-500">
              {trimmedName || "Your student"} will be ready to practise right away.
            </p>
          </div>

          {error && <p className="rounded-xl bg-cm-red-soft px-3 py-2 text-sm" style={{ color: "#B43326" }}>{error}</p>}

          <div className="flex gap-2.5">
            <button type="button" onClick={() => setStep("setup")} className="cm-btn ghost flex-1 justify-center">
              Back
            </button>
            <button type="submit" disabled={submitting} className="cm-btn primary flex-[2] justify-center">
              {submitting ? "Creating…" : "Create student"}
              {!submitting && <CMIcon name="check" size={18} color="#fff" stroke={3} />}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
