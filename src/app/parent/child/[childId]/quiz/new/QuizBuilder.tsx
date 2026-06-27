"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CMIcon from "@/components/CMIcon";
import { studentEmoji } from "@/lib/student-emoji";

type PreviewRow = {
  code: string;
  name: string;
  weak: boolean;
  adjacent: boolean;
  count: number;
};
type Preview = {
  rows: PreviewRow[];
  weighting: { weak: number; adjacent: number; other: number };
  adaptive: boolean;
};

type Group = {
  id: number;
  letter: string;
  name: string;
  skillCount: number;
  weakCount: number;
  locked: boolean;
};

type Student = {
  id: number;
  name: string;
  grade: number;
  currentDifficulty: number;
};

type Mode = "practice" | "test";

const QUESTION_CHIPS = [5, 10, 15, 20, 25] as const;
// Three friendly levels mapped onto the engine's 1–5 difficulty scale.
const DIFFICULTY_LEVELS = [
  { value: 1, label: "Easy" },
  { value: 3, label: "Medium" },
  { value: 5, label: "Hard" },
] as const;
// Snap the student's current (1–5) difficulty to the nearest of the 3 levels.
function snapDifficulty(d: number): number {
  return d <= 2 ? 1 : d <= 4 ? 3 : 5;
}

export default function QuizBuilder({
  student,
  groups,
  defaultSelectedIds,
  defaultDifficulty,
  level,
  initialPreview,
}: {
  student: Student;
  groups: Group[];
  defaultSelectedIds: number[];
  defaultDifficulty: number;
  level: number;
  initialPreview: Preview;
}) {
  const router = useRouter();

  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<number>>(
    () => new Set(defaultSelectedIds),
  );
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [difficulty, setDifficulty] = useState<number>(snapDifficulty(defaultDifficulty));
  const [mode, setMode] = useState<Mode>("practice");

  const [preview, setPreview] = useState<Preview>(initialPreview);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleGroup(g: Group) {
    if (g.locked) return;
    setSelectedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(g.id)) next.delete(g.id);
      else next.add(g.id);
      return next;
    });
  }

  // ── Live preview: debounced POST on every state change ──────────────────
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reqIdRef = useRef(0);

  const runPreview = useCallback(() => {
    const ids = [...selectedGroupIds];
    if (ids.length === 0) {
      setPreview({ rows: [], weighting: { weak: 60, adjacent: 25, other: 15 }, adaptive: false });
      setPreviewLoading(false);
      return;
    }
    const myReq = ++reqIdRef.current;
    setPreviewLoading(true);
    fetch("/api/quiz/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: student.id,
        topicGroupIds: ids,
        questionCount,
        difficulty,
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("preview failed");
        return (await res.json()) as Preview;
      })
      .then((data) => {
        // Drop stale responses so the rail always reflects the latest state.
        if (myReq !== reqIdRef.current) return;
        setPreview(data);
        setPreviewLoading(false);
      })
      .catch(() => {
        if (myReq !== reqIdRef.current) return;
        setPreviewLoading(false);
      });
  }, [selectedGroupIds, questionCount, difficulty, student.id]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(runPreview, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [runPreview]);

  const hasRows = preview.rows.length > 0;
  const noTopics = selectedGroupIds.size === 0;
  const canGenerate = !submitting && hasRows && !noTopics;

  async function onGenerate() {
    if (!canGenerate) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          questionCount,
          topicGroupIds: [...selectedGroupIds],
          difficulty,
          mode,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to generate quiz");
      }
      const data = (await res.json()) as { quizId: number };
      router.push(`/quiz/${data.quizId}?studentId=${student.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate quiz");
      setSubmitting(false);
    }
  }

  const emoji = studentEmoji(student.id);

  return (
    <div className="space-y-4 pb-28 lg:pb-0">
      {/* breadcrumb + header */}
      <div className="flex items-center gap-1.5 text-[13px] text-slate-500">
        <Link href="/parent/children" className="hover:text-slate-700">Children</Link>
        <CMIcon name="chevron" size={14} color="var(--slate-400)" />
        <Link href={`/parent/child/${student.id}`} className="hover:text-slate-700">{student.name}</Link>
        <CMIcon name="chevron" size={14} color="var(--slate-400)" />
        <span className="font-semibold text-slate-900">New quiz</span>
      </div>

      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {student.name} · Grade {student.grade}
        </div>
        <h1 className="font-display mt-1 text-[34px] leading-none text-slate-900">Build a new quiz</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* ── LEFT: builder ─────────────────────────────────────────── */}
        <div className="space-y-4">
          {/* (a) Assign to */}
          <section>
            <div className="cm-label">Assign to</div>
            <div className="cm-card flex items-center gap-3 p-3">
              <div
                className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[22px]"
                style={{ border: "2px solid var(--cm-coral)" }}
                aria-hidden
              >
                {emoji}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900">{student.name}</div>
                <div className="text-xs text-slate-500">Grade {student.grade} · Level {level}</div>
              </div>
            </div>
          </section>

          {/* (b) Topics */}
          <section>
            <div className="flex items-baseline justify-between">
              <div className="cm-label mb-0">
                Topics <span className="font-normal text-slate-400">· choose any</span>
              </div>
              <span className="text-xs font-semibold" style={{ color: "var(--cm-blue)" }}>
                {selectedGroupIds.size} selected
              </span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2.5">
              {groups.map((g) => {
                const on = selectedGroupIds.has(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    aria-disabled={g.locked || undefined}
                    aria-label={`${g.letter} ${g.name}, ${g.skillCount} skills, ${g.weakCount} weak${g.locked ? ", locked" : ""}`}
                    disabled={g.locked}
                    onClick={() => toggleGroup(g)}
                    className="relative rounded-2xl bg-white p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      border: on ? "2px solid var(--cm-blue)" : "1px solid var(--slate-200)",
                      boxShadow: on ? "0 0 0 4px var(--cm-blue-50)" : undefined,
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className="grid h-6 w-6 place-items-center rounded-lg text-[11px] font-extrabold text-white"
                        style={{ background: "var(--cm-blue)", opacity: on ? 1 : 0.4 }}
                        aria-hidden
                      >
                        {g.letter}
                      </div>
                      {g.locked ? (
                        <CMIcon name="lock" size={15} color="var(--slate-400)" />
                      ) : on ? (
                        <span
                          className="grid h-[18px] w-[18px] place-items-center rounded-full"
                          style={{ background: "var(--cm-blue)" }}
                          aria-hidden
                        >
                          <CMIcon name="check" size={12} color="#fff" stroke={3} />
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 text-xs font-bold leading-tight text-slate-900">{g.name}</div>
                    <div className="mt-0.5 text-[10px] text-slate-500">
                      {g.skillCount} skills{g.weakCount > 0 ? ` · ${g.weakCount} weak` : ""}
                    </div>
                  </button>
                );
              })}
            </div>
            {groups.length === 0 && (
              <p className="mt-2 text-sm text-slate-500">No active topic groups for this grade.</p>
            )}
          </section>

          {/* (c) Questions */}
          <section className="cm-card p-4">
            <div className="flex items-center justify-between">
              <div className="cm-label mb-0">Questions</div>
              <div className="font-display text-[28px] leading-none" style={{ color: "var(--cm-blue)" }}>
                {questionCount}
              </div>
            </div>
            <div role="radiogroup" aria-label="Question count" className="mt-3 flex flex-wrap gap-2">
              {QUESTION_CHIPS.map((n) => {
                const on = questionCount === n;
                return (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setQuestionCount(n)}
                    className="rounded-full px-3.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{
                      background: on ? "var(--cm-blue)" : "var(--slate-100)",
                      color: on ? "#fff" : "var(--slate-700)",
                    }}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            <input
              type="range"
              min={5}
              max={25}
              step={5}
              value={questionCount}
              aria-label="Question count slider"
              onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
              className="mt-4 w-full accent-[color:var(--cm-blue)]"
            />
          </section>

          {/* (d) Difficulty */}
          <section className="cm-card p-4">
            <div className="cm-label">Difficulty</div>
            <div role="radiogroup" aria-label="Difficulty" className="grid grid-cols-3 gap-1.5">
              {DIFFICULTY_LEVELS.map(({ value, label }) => {
                const on = difficulty === value;
                return (
                  <button
                    key={label}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={label}
                    onClick={() => setDifficulty(value)}
                    className="rounded-xl px-1 py-2.5 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{
                      background: on ? "var(--cm-blue)" : "#fff",
                      color: on ? "#fff" : "var(--ink)",
                      border: on ? "none" : "1px solid var(--slate-200)",
                    }}
                  >
                    <div className="text-sm font-extrabold">{label}</div>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500">
              <CMIcon name="target" size={12} color="var(--slate-400)" />
              <span>Higher means tougher questions — the engine keeps adapting as {student.name} answers.</span>
            </div>
          </section>

          {/* (e) Mode */}
          <section>
            <div className="cm-label">Mode</div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {([
                { value: "test" as Mode, emoji: "🎓", title: "Real test", desc: "Answers + score revealed at the end. No hints." },
                { value: "practice" as Mode, emoji: "📚", title: "Practice", desc: "Step-by-step explanation after each wrong answer." },
              ]).map((m) => {
                const sel = mode === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    role="radio"
                    aria-checked={sel}
                    aria-label={m.title}
                    onClick={() => setMode(m.value)}
                    className="cm-card flex gap-3 p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{
                      border: sel ? "2px solid var(--cm-blue)" : "1px solid var(--slate-200)",
                      boxShadow: sel ? "0 0 0 4px var(--cm-blue-50)" : undefined,
                    }}
                  >
                    <div
                      className="grid h-12 w-12 place-items-center rounded-xl text-2xl"
                      style={{ background: sel ? "var(--cm-blue-50)" : "var(--slate-100)" }}
                      aria-hidden
                    >
                      {m.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="text-base font-extrabold text-slate-900">{m.title}</div>
                        {sel && <span className="cm-pill indigo" style={{ height: 20, fontSize: 10 }}>Selected</span>}
                      </div>
                      <div className="mt-1 text-[13px] leading-snug text-slate-500">{m.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Desktop CTA */}
          <div className="hidden lg:flex lg:items-center lg:gap-3">
            <button
              type="button"
              onClick={onGenerate}
              disabled={!canGenerate}
              className="cm-btn primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Generating…" : "Generate & assign"}
              <CMIcon name="spark" size={16} color="#fff" />
            </button>
            <Link href={`/parent/child/${student.id}`} className="cm-btn ghost">Cancel</Link>
            {error && <p className="text-sm" style={{ color: "var(--cm-coral)" }}>{error}</p>}
          </div>
        </div>

        {/* ── RIGHT: live preview rail ──────────────────────────────── */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <PreviewRail
            preview={preview}
            loading={previewLoading}
            questionCount={questionCount}
            studentName={student.name}
            noTopics={noTopics}
          />
          {/* Mobile inline error lives next to the sticky CTA below */}
        </aside>
      </div>

      {/* Mobile sticky CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        {error && <p className="mb-2 text-xs" style={{ color: "var(--cm-coral)" }}>{error}</p>}
        <button
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate}
          className="cm-btn primary w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Generating…" : "Generate & assign"}
          <CMIcon name="spark" size={16} color="#fff" />
        </button>
      </div>
    </div>
  );
}

function PreviewRail({
  preview,
  loading,
  questionCount,
  studentName,
  noTopics,
}: {
  preview: Preview;
  loading: boolean;
  questionCount: number;
  studentName: string;
  noTopics: boolean;
}) {
  const { rows, weighting, adaptive } = preview;
  return (
    <div className="cm-card p-[18px]" aria-live="polite">
      <div className="text-xs font-bold uppercase tracking-wide text-slate-400">Live preview</div>
      <div className="mt-1 mb-3.5 text-sm text-slate-500">
        {questionCount} questions · weighted by {studentName}&apos;s weak skills
      </div>

      {noTopics ? (
        <p className="rounded-xl bg-slate-50 px-3 py-4 text-center text-sm text-slate-500">
          Pick at least one topic to preview the quiz.
        </p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl px-3 py-4 text-center text-sm" style={{ color: "var(--cm-coral)" }}>
          {loading ? "Building preview…" : "No questions can be generated for these topics. Try another."}
        </p>
      ) : (
        <div className="grid gap-2">
          {rows.map((s, i) => (
            <div
              key={`${s.code}-${i}`}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
              style={{ background: "var(--slate-50)" }}
            >
              <div
                className="font-mono rounded-md border bg-white px-1.5 py-0.5 text-[11px] font-bold"
                style={{ color: "var(--cm-blue)", borderColor: "var(--cm-blue-100)" }}
              >
                {s.code}
              </div>
              <div className="min-w-0 flex-1 truncate text-[13px] font-semibold text-slate-900">{s.name}</div>
              {s.weak && <span className="cm-pill coral" style={{ height: 20, padding: "0 7px", fontSize: 10 }}>weak</span>}
              {!s.weak && s.adjacent && <span className="cm-pill" style={{ height: 20, padding: "0 7px", fontSize: 10 }}>adj</span>}
              <div className="text-xs font-bold text-slate-500">×{s.count}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 rounded-2xl p-3.5" style={{ background: "var(--cm-blue-50)" }}>
        <div className="mb-1.5 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--cm-blue)" }}>
          Weighting
        </div>
        <div className="text-[13px] text-slate-700">
          {weighting.weak}% weak · {weighting.adjacent}% adjacent · {weighting.other}% other
        </div>
        <div className="mt-1 text-[13px] text-slate-700">
          Adaptive <strong>{adaptive ? "on" : "off"}</strong>
        </div>
      </div>
    </div>
  );
}
