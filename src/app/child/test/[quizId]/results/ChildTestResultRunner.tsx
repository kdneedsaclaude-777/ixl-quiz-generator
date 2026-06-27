"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import CMIcon from "@/components/CMIcon";
import { formatClock } from "@/lib/domain/test-mode";
import type { ValidatedExplanation } from "@/lib/ai/validation";

type ReviewQuestion = {
  id: number;
  position: number;
  displayLabel: string;
  questionText: string;
  questionType: string;
  options: Record<string, string>;
  correctAnswer: string;
  selectedAnswer: string;
  isCorrect: boolean;
  visualSvg: string | null;
  visualNote: string | null;
  explanation: ValidatedExplanation | null;
};

type Props = {
  quizId: number;
  studentId: number;
  topic: string;
  pct: number;
  total: number;
  correct: number;
  wrong: number;
  blank: number;
  timeUsedSec: number;
  reviewUnlocked: boolean;
  parentName: string;
  // Per-question review, present only when the parent has unlocked review.
  review: ReviewQuestion[] | null;
};

// Screen E — graded test result. Dark→paper gradient header with the serif
// score reveal, a 4-up breakdown (correct/wrong/blank/time), and either a
// "locked" banner (default) or the full per-question explanation review once
// the parent unlocks it.
export default function ChildTestResultRunner({
  quizId,
  studentId,
  topic,
  pct,
  total,
  correct,
  wrong,
  blank,
  timeUsedSec,
  reviewUnlocked,
  parentName,
  review,
}: Props) {
  const [displayedPct, setDisplayedPct] = useState(0);

  // Count the headline percentage up in 700ms (matches the practice results).
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 700);
      setDisplayedPct(Math.round(pct * easeOut(t)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pct]);

  return (
    <main className="-mx-5 -mt-4">
      {/* gradient header + score reveal */}
      <div
        className="px-5 pb-8 pt-7 text-center text-white"
        style={{ background: "linear-gradient(180deg, #0F172A 0%, #1E293B 55%, var(--paper) 100%)" }}
      >
        <div className="flex items-center justify-center">
          <span
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-[.12em]"
            style={{ background: "rgba(255,255,255,.12)" }}
          >
            <CMIcon name="lock" size={11} color="#fff" /> REAL TEST · GRADED
          </span>
        </div>
        <div className="mt-6 text-xs font-bold tracking-[.12em] opacity-70">YOUR SCORE</div>
        <div className="font-display leading-none" style={{ fontSize: 96 }}>
          {displayedPct}
          <span style={{ fontSize: 44, opacity: 0.7 }}>%</span>
        </div>
        <div className="text-sm opacity-80">{topic} · Test</div>
      </div>

      <div className="space-y-4 px-5 pt-5">
        {/* breakdown card */}
        <section className="cm-card -mt-12 p-[18px] shadow-pop">
          <div className="grid grid-cols-4 text-center">
            <div>
              <div className="font-display text-[22px]" style={{ color: "var(--cm-mint)" }}>{correct}</div>
              <div className="text-[9px] font-bold text-slate-500">CORRECT</div>
            </div>
            <div className="border-l" style={{ borderColor: "var(--slate-200)" }}>
              <div className="font-display text-[22px]" style={{ color: "var(--cm-red)" }}>{wrong}</div>
              <div className="text-[9px] font-bold text-slate-500">WRONG</div>
            </div>
            <div className="border-l" style={{ borderColor: "var(--slate-200)" }}>
              <div className="font-display text-[22px]" style={{ color: "var(--cm-amber)" }}>{blank}</div>
              <div className="text-[9px] font-bold text-slate-500">BLANK</div>
            </div>
            <div className="border-l" style={{ borderColor: "var(--slate-200)" }}>
              <div className="font-display text-[22px]" style={{ color: "var(--ink)" }}>
                {formatClock(timeUsedSec)}
              </div>
              <div className="text-[9px] font-bold text-slate-500">TIME USED</div>
            </div>
          </div>

          {!reviewUnlocked && (
            <div
              className="mt-3.5 flex items-start gap-2.5 rounded-[12px] p-3"
              style={{ background: "var(--slate-50)", border: "1px solid var(--slate-200)" }}
            >
              <CMIcon name="lock" size={18} color="var(--slate-500)" />
              <div className="text-xs leading-relaxed text-slate-700">
                <strong className="text-slate-900">Answers are locked.</strong> Because this was a test,
                you won&apos;t see explanations until <strong>{parentName} unlocks review</strong>.
              </div>
            </div>
          )}
        </section>

        {/* unlocked review — per-question explanations */}
        {reviewUnlocked && review && (
          <section className="space-y-3">
            <div className="text-xs font-bold tracking-[.06em] text-slate-500">REVIEW · {total} QUESTIONS</div>
            {review.map((q, idx) => (
              <ReviewCard key={q.id} q={q} index={idx} />
            ))}
          </section>
        )}

        {/* CTAs */}
        <div className="grid grid-cols-2 gap-2.5 pb-2">
          <Link href="/child/home" className="cm-btn ghost lg justify-center bg-white">
            Back home
          </Link>
          <PracticeMissedButton studentId={studentId} />
        </div>
        <p className="text-center text-xs text-slate-400">Test #{quizId}</p>
      </div>
    </main>
  );
}

// Per-question review card — mirrors the explanation rendering style from the
// practice/quiz review (steps, why-wrong, misconception, tip).
function ReviewCard({ q, index }: { q: ReviewQuestion; index: number }) {
  const ex = q.explanation;
  return (
    <div
      className="rounded-[18px] border p-4"
      style={{
        borderColor: q.isCorrect ? "var(--cm-mint)" : "#FCA5A5",
        background: q.isCorrect ? "var(--cm-mint-soft)" : "var(--cm-rose-soft)",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-600">
          Question {index + 1} · {q.displayLabel}
        </span>
        <span
          className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
          style={{
            background: q.isCorrect ? "var(--cm-mint)" : "var(--cm-red)",
            color: "#fff",
          }}
        >
          <CMIcon name={q.isCorrect ? "check" : "x"} size={11} color="#fff" stroke={3} />
          {q.isCorrect ? "Correct" : q.selectedAnswer.trim() === "" ? "Blank" : "Wrong"}
        </span>
      </div>

      <p className="mt-2 text-[15px] font-semibold text-slate-900">{q.questionText}</p>

      {/* answers */}
      <div className="mt-2.5 flex flex-wrap gap-2 text-[13px]">
        <span className="rounded-lg bg-white px-2.5 py-1 text-slate-700">
          Your answer: <strong>{q.selectedAnswer.trim() === "" ? "—" : displayAnswer(q, q.selectedAnswer)}</strong>
        </span>
        {!q.isCorrect && (
          <span
            className="rounded-lg px-2.5 py-1"
            style={{ background: "var(--cm-mint-soft)", color: "#047857" }}
          >
            Correct: <strong>{displayAnswer(q, q.correctAnswer)}</strong>
          </span>
        )}
      </div>

      {/* explanation */}
      {ex && (
        <div className="mt-3 space-y-2 text-[13px] text-slate-700">
          {q.isCorrect ? (
            <p className="rounded-lg bg-white/70 px-3 py-2">{ex.short}</p>
          ) : (
            <div className="rounded-lg bg-white/70 px-3 py-2">
              <div className="font-bold text-slate-900">How to solve it</div>
              <ol className="mt-1 list-decimal space-y-1 pl-5">
                {ex.step_by_step.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          )}
          {!q.isCorrect && ex.misconception && (
            <p className="rounded-lg px-3 py-2" style={{ background: "var(--cm-amber-soft)", color: "#92400E" }}>
              <span className="font-semibold">Common mix-up:</span> {ex.misconception}
            </p>
          )}
          {!q.isCorrect && ex.revision_tip && (
            <p className="rounded-lg px-3 py-2" style={{ background: "var(--cm-blue-50)", color: "var(--cm-blue)" }}>
              <span className="font-semibold">Try this next:</span> {ex.revision_tip}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// For MCQ show "B · 5⁄8", otherwise the raw value.
function displayAnswer(q: ReviewQuestion, key: string): string {
  if (q.questionType === "mcq") {
    const text = q.options[key];
    return text ? `${key} · ${text}` : key;
  }
  return key;
}

function PracticeMissedButton({ studentId }: { studentId: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, mode: "practice", questionCount: 10 }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Couldn't start practice.");
      }
      const { quizId } = await res.json();
      window.location.href = `/child/quiz/${quizId}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start practice.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={start}
        disabled={loading}
        className="cm-btn lg w-full justify-center disabled:opacity-50"
        style={{ background: "var(--cm-blue)", color: "#fff" }}
      >
        {loading ? "Loading…" : "Practice the misses"}
      </button>
      {error && <p className="mt-1 text-xs text-rose-700">{error}</p>}
    </div>
  );
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
