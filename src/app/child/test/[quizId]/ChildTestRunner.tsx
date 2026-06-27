"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import CMIcon from "@/components/CMIcon";
import { isFreeInputType } from "@/lib/domain/grading";
import { TEST_TIMER_DANGER_SEC, formatClock } from "@/lib/domain/test-mode";

type TestQuestion = {
  id: number;
  questionText: string;
  questionType: string;
  answerOptions: Record<string, string>;
  displayLabel: string;
  position: number;
};

type View = "intake" | "taking" | "navigator" | "confirm";

// Proctored "Real test" runner. Restrained black-on-white UX vs. the practice
// runner: a visible countdown, NO immediate feedback / explanations, flag +
// navigator, and a server-authoritative submit. The intake screen renders
// first ("not started"); the timer only begins once the student taps Start.
export default function ChildTestRunner({
  quizId,
  studentName,
  topic,
  questions,
  timeLimitSec,
  flaggedQuestionIds,
  alreadyStarted = false,
  initialRemainingSec,
}: {
  quizId: number;
  studentName: string;
  topic: string;
  questions: TestQuestion[];
  timeLimitSec: number;
  flaggedQuestionIds: number[];
  // When the test was already started (server testStartedAt set), skip the
  // intake and resume the countdown at the real remaining time so a page
  // reload can't reset the clock.
  alreadyStarted?: boolean;
  initialRemainingSec?: number;
}) {
  const router = useRouter();
  const total = questions.length;

  const [view, setView] = useState<View>(alreadyStarted ? "taking" : "intake");
  const [idx, setIdx] = useState(0);
  // answer value per question id ("" = blank). For MCQ this is the option key;
  // for free-input it's the typed string.
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Set<number>>(() => new Set(flaggedQuestionIds));
  const [remaining, setRemaining] = useState(initialRemainingSec ?? timeLimitSec);
  const [error, setError] = useState<string | null>(null);

  // finish() must be idempotent: the countdown auto-submit and the manual
  // submit can race. A ref guard ensures the POST fires at most once.
  const submittedRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  const current = questions[idx];

  const answeredCount = useMemo(
    () => questions.filter((q) => (answers[q.id] ?? "").trim() !== "").length,
    [answers, questions],
  );
  const blankCount = total - answeredCount;

  // ── submit (idempotent) ────────────────────────────────────────────────
  const finish = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const payload: Record<string, string> = {};
      for (const [qid, val] of Object.entries(answers)) {
        if ((val ?? "").trim() !== "") payload[qid] = val;
      }
      const timeUsedSec = Math.max(0, timeLimitSec - remaining);
      const res = await fetch(`/api/quiz/${quizId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: payload,
          flaggedQuestionIds: [...flagged],
          timeUsedSec,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Couldn't submit your test.");
      }
      router.push(`/child/test/${quizId}/results`);
    } catch (e) {
      // Allow a retry: clear the guard so the student can submit again.
      submittedRef.current = false;
      setSubmitting(false);
      setError(e instanceof Error ? e.message : "Couldn't submit your test.");
    }
  }, [answers, flagged, quizId, remaining, router, timeLimitSec]);

  // ── countdown (only while in the test, not on intake) ───────────────────
  const started = view !== "intake";
  useEffect(() => {
    if (!started) return;
    if (remaining <= 0) {
      void finish();
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [started, remaining, finish]);

  async function start() {
    // Best-effort: stamp the real start time server-side so timeUsedSec is
    // authoritative even if the tab was opened long before tapping Start.
    try {
      await fetch(`/api/quiz/${quizId}/start`, { method: "POST" });
    } catch {
      // Non-fatal; submit still bounds the time by startedAt.
    }
    setView("taking");
  }

  function setAnswer(qid: number, value: string) {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  }

  function toggleFlag(qid: number) {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(qid)) next.delete(qid);
      else next.add(qid);
      return next;
    });
  }

  const danger = remaining <= TEST_TIMER_DANGER_SEC;

  // ── A · INTAKE ──────────────────────────────────────────────────────────
  if (view === "intake") {
    return (
      <Intake
        topic={topic}
        studentName={studentName}
        total={total}
        timeLimitSec={timeLimitSec}
        onStart={start}
      />
    );
  }

  // Shared screens B/C run on top of the taking state.
  return (
    <main className="flex min-h-[calc(100vh-7rem)] flex-col bg-white">
      {/* header */}
      <div className="flex items-center gap-2.5 pt-1.5">
        <CMIcon name="lock" size={18} color="var(--slate-700)" />
        <div>
          <div className="text-[10px] font-extrabold tracking-[.14em]" style={{ color: "var(--cm-red)" }}>
            REAL TEST
          </div>
          <div className="text-[11px] font-semibold text-slate-500">
            Question {idx + 1} of {total}
          </div>
        </div>
        <div className="flex-1" />
        {flagged.size > 0 && (
          <span className="cm-pill amber" style={{ height: 22, fontSize: 11 }}>
            ⚑ {flagged.size}
          </span>
        )}
        <button
          type="button"
          onClick={() => setView(view === "navigator" ? "taking" : "navigator")}
          aria-label="Jump to a question"
          className="grid h-8 w-8 place-items-center rounded-lg"
          style={{ background: "var(--slate-100)" }}
        >
          <CMIcon name="grid" size={16} color="var(--slate-700)" />
        </button>
        <div
          className="font-mono flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-extrabold"
          style={{
            background: danger ? "var(--cm-red-soft)" : "var(--slate-100)",
            color: danger ? "#9F1239" : "var(--ink)",
          }}
        >
          <CMIcon name="clock" size={14} color={danger ? "#9F1239" : "var(--slate-700)"} />
          {formatClock(remaining)}
        </div>
      </div>

      {view === "navigator" ? (
        <Navigator
          questions={questions}
          answers={answers}
          flagged={flagged}
          current={idx}
          onJump={(i) => {
            setIdx(i);
            setView("taking");
          }}
          onKeepGoing={() => setView("taking")}
          onSubmit={() => setView("confirm")}
        />
      ) : (
        <TakingBody
          current={current}
          idx={idx}
          total={total}
          questions={questions}
          answers={answers}
          flagged={flagged}
          onPick={(key) => setAnswer(current.id, key)}
          onType={(val) => setAnswer(current.id, val)}
          onToggleFlag={() => toggleFlag(current.id)}
          onPrev={() => setIdx((i) => Math.max(0, i - 1))}
          onNext={() => {
            if (idx === total - 1) setView("confirm");
            else setIdx((i) => Math.min(total - 1, i + 1));
          }}
        />
      )}

      {error && (
        <p className="mt-3 rounded-xl bg-rose-100 px-3 py-2 text-sm text-rose-800">{error}</p>
      )}

      {/* D · SUBMIT-CONFIRM bottom sheet */}
      {view === "confirm" && (
        <SubmitConfirm
          answered={answeredCount}
          flagged={flagged.size}
          blank={blankCount}
          remainingLabel={formatClock(remaining)}
          submitting={submitting}
          onSubmit={finish}
          onClose={() => setView("taking")}
        />
      )}
    </main>
  );
}

// ── A · INTAKE ─────────────────────────────────────────────────────────────
function Intake({
  topic,
  studentName,
  total,
  timeLimitSec,
  onStart,
}: {
  topic: string;
  studentName: string;
  total: number;
  timeLimitSec: number;
  onStart: () => void | Promise<void>;
}) {
  const clock = formatClock(timeLimitSec);
  const rules: [string, string, string][] = [
    ["clock", `You have ${clock}`, "Timer starts when you tap Start."],
    ["eye", "No hints, no explanations", "You'll only see your score at the end."],
    ["target", "You can flag & come back", "Use the navigator to skip and return."],
    ["lock", "Submit when you're done", "You can't change answers after submit."],
  ];
  return (
    <main className="flex min-h-[calc(100vh-7rem)] flex-col bg-white">
      <div className="flex items-center justify-between pt-1.5">
        <button
          type="button"
          onClick={() => history.back()}
          aria-label="Leave"
          className="text-slate-400 hover:text-slate-600"
        >
          <CMIcon name="x" size={22} color="currentColor" />
        </button>
        <span
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-[.12em]"
          style={{ background: "var(--cm-rose-soft)", color: "#9F1239" }}
        >
          <CMIcon name="lock" size={11} color="#9F1239" /> REAL TEST
        </span>
      </div>

      <div className="mt-7">
        <div className="text-xs font-semibold text-slate-500">REAL TEST · TIMED</div>
        <h1 className="font-display mt-1.5 text-[38px] leading-[1.05] tracking-tight text-slate-900">
          Ready for your {topic} test, {studentName}?
        </h1>
      </div>

      {/* quiz stat card */}
      <div
        className="mt-5 rounded-[20px] p-[18px]"
        style={{ background: "var(--paper)", border: "1px solid var(--slate-200)" }}
      >
        <div className="grid grid-cols-3 text-center">
          <div>
            <div className="font-display text-[22px]" style={{ color: "var(--ink)" }}>{total}</div>
            <div className="text-[10px] font-semibold text-slate-500">QUESTIONS</div>
          </div>
          <div className="border-x" style={{ borderColor: "var(--slate-200)" }}>
            <div className="font-display text-[22px]" style={{ color: "var(--ink)" }}>{clock}</div>
            <div className="text-[10px] font-semibold text-slate-500">TIMER</div>
          </div>
          <div>
            <div className="font-display text-[22px]" style={{ color: "var(--cm-red)" }}>1</div>
            <div className="text-[10px] font-semibold text-slate-500">ATTEMPT</div>
          </div>
        </div>
      </div>

      {/* rules */}
      <div className="mt-[18px]">
        <div className="mb-2 text-xs font-bold tracking-[.06em] text-slate-500">HOW THIS TEST WORKS</div>
        <div className="grid gap-2.5">
          {rules.map(([icon, title, desc], k) => (
            <div key={k} className="flex items-start gap-3">
              <div
                className="grid h-8 w-8 flex-none place-items-center rounded-[10px]"
                style={{ background: "var(--slate-100)" }}
              >
                <CMIcon name={icon} size={16} color="var(--slate-700)" />
              </div>
              <div>
                <div className="text-[13px] font-bold text-slate-900">{title}</div>
                <div className="mt-px text-xs text-slate-500">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1" />

      <button
        type="button"
        onClick={() => void onStart()}
        className="cm-btn dark lg mt-[18px] w-full"
      >
        Start test · {clock} <CMIcon name="arrow" size={18} color="#fff" />
      </button>
    </main>
  );
}

// ── B · TAKING BODY ──────────────────────────────────────────────────────────
function TakingBody({
  current,
  idx,
  total,
  questions,
  answers,
  flagged,
  onPick,
  onType,
  onToggleFlag,
  onPrev,
  onNext,
}: {
  current: TestQuestion;
  idx: number;
  total: number;
  questions: TestQuestion[];
  answers: Record<number, string>;
  flagged: Set<number>;
  onPick: (key: string) => void;
  onType: (val: string) => void;
  onToggleFlag: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const isTyped = isFreeInputType(current.questionType);
  const myValue = answers[current.id] ?? "";
  const isFlagged = flagged.has(current.id);

  return (
    <>
      {/* progress dots */}
      <div className="mt-3.5 flex gap-1">
        {questions.map((q, i) => {
          const answered = (answers[q.id] ?? "").trim() !== "";
          const bg =
            i === idx
              ? "var(--ink)"
              : flagged.has(q.id)
                ? "var(--cm-amber)"
                : answered
                  ? "var(--slate-700)"
                  : "var(--slate-200)";
          return <div key={q.id} className="h-1.5 flex-1 rounded-full" style={{ background: bg }} />;
        })}
      </div>

      {/* question */}
      <div className="font-display mt-6 text-[26px] leading-[1.2] tracking-tight text-slate-900">
        {current.questionText}
      </div>

      {/* answer area — neutral, no green/red, no explanations */}
      {isTyped ? (
        <div className="mt-[18px]">
          <input
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={myValue}
            onChange={(e) => onType(e.target.value)}
            placeholder="Type your answer"
            className="w-full rounded-2xl border-2 px-4 py-4 text-lg font-semibold text-slate-900 outline-none"
            style={{ borderColor: myValue.trim() !== "" ? "var(--ink)" : "var(--slate-200)" }}
          />
        </div>
      ) : (
        <div className="mt-[18px] grid gap-2.5">
          {Object.entries(current.answerOptions).map(([key, text]) => {
            const selected = myValue === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onPick(key)}
                className="flex items-center gap-3 rounded-[14px] bg-white px-4 py-3.5 text-left"
                style={{ border: selected ? "2px solid var(--ink)" : "1px solid var(--slate-200)" }}
              >
                <span
                  className="grid h-[30px] w-[30px] place-items-center rounded-lg text-[13px] font-extrabold"
                  style={{
                    background: selected ? "var(--ink)" : "var(--slate-100)",
                    color: selected ? "#fff" : "var(--slate-700)",
                  }}
                >
                  {key}
                </span>
                <span className="text-[17px] font-semibold text-slate-900">{text}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex-1" />

      {/* bottom row — Flag · Previous · Next */}
      <div className="mt-[18px] grid gap-2" style={{ gridTemplateColumns: "44px 1fr 1fr" }}>
        <button
          type="button"
          onClick={onToggleFlag}
          title="Flag for review"
          aria-pressed={isFlagged}
          className="grid place-items-center rounded-[14px] border-2"
          style={{
            height: 56,
            borderColor: isFlagged ? "var(--cm-amber)" : "var(--slate-200)",
            background: isFlagged ? "var(--cm-amber-soft)" : "transparent",
          }}
        >
          <CMIcon name="star" size={18} color={isFlagged ? "#92400E" : "var(--slate-700)"} />
        </button>
        <button
          type="button"
          onClick={onPrev}
          disabled={idx === 0}
          className="cm-btn ghost lg rounded-[14px] disabled:opacity-40"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={onNext}
          className="cm-btn lg rounded-[14px]"
          style={{ background: "var(--ink)", color: "#fff" }}
        >
          {idx === total - 1 ? "Review" : "Next"}{" "}
          <CMIcon name="arrow" size={16} color="#fff" />
        </button>
      </div>
      <div className="mt-2.5 text-center text-[11px] text-slate-500">
        Tap the grid icon to jump to any question
      </div>
    </>
  );
}

// ── C · NAVIGATOR ────────────────────────────────────────────────────────────
function Navigator({
  questions,
  answers,
  flagged,
  current,
  onJump,
  onKeepGoing,
  onSubmit,
}: {
  questions: TestQuestion[];
  answers: Record<number, string>;
  flagged: Set<number>;
  current: number;
  onJump: (i: number) => void;
  onKeepGoing: () => void;
  onSubmit: () => void;
}) {
  const answered = questions.filter((q) => (answers[q.id] ?? "").trim() !== "").length;
  const toGo = questions.length - answered;

  return (
    <>
      <div className="mt-6">
        <div className="font-display text-[26px] tracking-tight text-slate-900">Jump to a question</div>
        <div className="mt-1 text-[13px] text-slate-500">
          {answered} answered · {flagged.size} flagged · {toGo} to go
        </div>
      </div>

      <div
        className="mt-[18px] grid gap-2.5 rounded-[18px] p-[18px]"
        style={{
          gridTemplateColumns: "repeat(5, 1fr)",
          background: "var(--paper)",
          border: "1px solid var(--slate-200)",
        }}
      >
        {questions.map((q, i) => {
          const isAnswered = (answers[q.id] ?? "").trim() !== "";
          const isFlag = flagged.has(q.id);
          const isCurrent = i === current;
          const border = isCurrent
            ? "2px solid var(--cm-blue)"
            : isFlag
              ? "2px solid var(--cm-amber)"
              : isAnswered
                ? "2px solid var(--ink)"
                : "1px solid var(--slate-200)";
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => onJump(i)}
              className="relative grid aspect-square place-items-center rounded-[14px] text-lg font-extrabold"
              style={{
                background: isAnswered && !isFlag ? "var(--ink)" : "#fff",
                color: isAnswered && !isFlag ? "#fff" : "var(--ink)",
                border,
              }}
            >
              {i + 1}
              {isFlag && (
                <span className="absolute right-1.5 top-1.5">
                  <CMIcon name="star" size={11} color="var(--cm-amber)" />
                </span>
              )}
              {isAnswered && !isFlag && (
                <span className="absolute right-1.5 top-1.5">
                  <CMIcon name="check" size={11} color="#fff" stroke={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* legend */}
      <div className="mt-3.5 flex flex-wrap gap-3.5 text-[11px] text-slate-700">
        {(
          [
            ["var(--ink)", "Answered"],
            ["#fff", "Not yet"],
            ["var(--cm-amber)", "Flagged ★"],
            ["var(--cm-blue)", "Current"],
          ] as [string, string][]
        ).map(([c, l], i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span
              className="h-3 w-3 rounded"
              style={{ background: c, border: "1px solid var(--slate-300)" }}
            />
            {l}
          </div>
        ))}
      </div>

      <div className="flex-1" />

      <div className="mt-[18px] grid grid-cols-2 gap-2.5">
        <button type="button" onClick={onKeepGoing} className="cm-btn ghost lg rounded-[14px]">
          Keep going
        </button>
        <button
          type="button"
          onClick={onSubmit}
          className="cm-btn lg rounded-[14px]"
          style={{ background: "var(--cm-red)", color: "#fff" }}
        >
          Submit test
        </button>
      </div>
    </>
  );
}

// ── D · SUBMIT-CONFIRM (bottom sheet) ────────────────────────────────────────
function SubmitConfirm({
  answered,
  flagged,
  blank,
  remainingLabel,
  submitting,
  onSubmit,
  onClose,
}: {
  answered: number;
  flagged: number;
  blank: number;
  remainingLabel: string;
  submitting: boolean;
  onSubmit: () => void | Promise<void>;
  onClose: () => void;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Esc closes; focus trap inside the sheet. Move focus to the primary button.
  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    const sheet = sheetRef.current;
    const focusables = () =>
      Array.from(
        sheet?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
    focusables()[0]?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const items = focusables();
        if (items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prevFocus?.focus?.();
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      style={{ background: "rgba(15,23,42,.55)" }}
      onClick={onClose}
    >
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Submit your test"
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-[24px] bg-white px-[22px] pb-6 pt-5"
        style={{ boxShadow: "0 -20px 60px rgba(0,0,0,.2)" }}
      >
        <div className="mx-auto mb-[18px] h-[5px] w-11 rounded-[3px]" style={{ background: "var(--slate-200)" }} />

        <div className="text-center">
          <div
            className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-[18px]"
            style={{ background: "var(--cm-rose-soft)" }}
          >
            <CMIcon name="lock" size={26} color="var(--cm-red)" />
          </div>
          <div className="font-display text-[26px] tracking-tight text-slate-900">Submit your test?</div>
          <div className="mt-1.5 text-[13px] leading-relaxed text-slate-500">
            Once you submit, you can&apos;t change any answers.
          </div>
        </div>

        {/* summary tiles */}
        <div
          className="mt-[18px] grid grid-cols-3 rounded-[16px] p-3.5 text-center"
          style={{ background: "var(--paper)", border: "1px solid var(--slate-200)" }}
        >
          <div>
            <div className="font-display text-2xl" style={{ color: "var(--cm-mint)" }}>{answered}</div>
            <div className="text-[10px] font-bold text-slate-500">ANSWERED</div>
          </div>
          <div className="border-x" style={{ borderColor: "var(--slate-200)" }}>
            <div className="font-display text-2xl" style={{ color: "var(--cm-amber)" }}>{flagged}</div>
            <div className="text-[10px] font-bold text-slate-500">FLAGGED</div>
          </div>
          <div>
            <div className="font-display text-2xl" style={{ color: "var(--cm-red)" }}>{blank}</div>
            <div className="text-[10px] font-bold text-slate-500">BLANK</div>
          </div>
        </div>

        {blank > 0 && (
          <div
            className="mt-3 flex items-center gap-2.5 rounded-[12px] p-3 text-xs"
            style={{ background: "var(--cm-amber-soft)", border: "1px solid rgba(232,163,23,.4)", color: "#92400E" }}
          >
            <CMIcon name="bell" size={16} color="#92400E" />
            <span>
              <strong>
                {blank} {blank === 1 ? "question is" : "questions are"} blank.
              </strong>{" "}
              Blank counts as wrong.
            </span>
          </div>
        )}

        <div className="mt-4 grid gap-2.5">
          <button
            type="button"
            onClick={() => void onSubmit()}
            disabled={submitting}
            className="cm-btn lg w-full disabled:opacity-50"
            style={{ background: "var(--cm-red)", color: "#fff" }}
          >
            {submitting ? "Submitting…" : "Submit test now"}
          </button>
          <button type="button" onClick={onClose} disabled={submitting} className="cm-btn ghost lg w-full">
            Go back · {remainingLabel} left
          </button>
        </div>
      </div>
    </div>
  );
}
