"use client";

import { useEffect, useRef, useState } from "react";

type Snapshot = {
  code: string;
  phase: "lobby" | "question" | "reveal" | "ended";
  index: number;
  total: number;
  participantCount: number;
  answeredCount: number;
  paused: boolean;
  endsAt: number | null;
  remainingMs: number;
  roster: { id: string; name: string }[];
  question: {
    prompt: string;
    options: Record<string, string>;
    unit: string;
    skillTitle: string;
    correct?: string;
  } | null;
  distribution: Record<string, number> | null;
  leaderboard: { name: string; score: number }[];
};

type ActiveRow = {
  code: string;
  hostName: string;
  phase: string;
  participantCount: number;
  index: number;
  total: number;
};

export default function HostConsole({ isSuperadmin }: { isSuperadmin: boolean }) {
  const [grade, setGrade] = useState(4);
  const [difficulty, setDifficulty] = useState(2);
  const [count, setCount] = useState(8);
  const [code, setCode] = useState<string | null>(null);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moderating, setModerating] = useState(false);
  const [moderateCode, setModerateCode] = useState("");
  // window.location is unavailable on the server. Read it post-mount in a
  // useEffect so SSR + first client render agree (was a hydration mismatch
  // when the page was viewed from another device).
  const [joinUrl, setJoinUrl] = useState("/live/join");
  useEffect(() => {
    setJoinUrl(`${window.location.origin}/live/join`);
  }, []);
  const [active, setActive] = useState<ActiveRow[]>([]);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!code) return;
    const es = new EventSource(`/api/live/${code}/events`);
    es.onmessage = (e) => {
      try {
        setSnap(JSON.parse(e.data) as Snapshot);
      } catch {
        /* keep-alive ping */
      }
    };
    esRef.current = es;
    return () => es.close();
  }, [code]);

  async function createSession() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/live/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade, difficulty, count }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Could not create session.");
      setModerating(false);
      setCode(j.code);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create session.");
    } finally {
      setBusy(false);
    }
  }

  async function loadActive() {
    try {
      const res = await fetch("/api/live/active", { cache: "no-store" });
      const j = await res.json();
      if (res.ok) setActive(j.sessions ?? []);
    } catch {
      /* ignore */
    }
  }

  function attach(c: string) {
    const clean = c.trim().toUpperCase();
    if (!clean) return;
    setModerating(true);
    setCode(clean);
  }

  async function host(action: string, participantId?: string) {
    if (!code) return;
    const res = await fetch(`/api/live/${code}/host`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, participantId }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "Action failed.");
    } else {
      setError(null);
    }
  }

  // ---- setup screen -----------------------------------------------------
  if (!code) {
    return (
      <main className="mx-auto max-w-lg space-y-6">
        <header className="text-center">
          <div className="flex justify-center">
            <span className="cm-pill coral">Host mode</span>
          </div>
          <h1 className="font-display mt-3 text-5xl leading-[1] tracking-tight text-slate-900 dark:text-slate-100">
            Host a Live Quiz
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Pick the level, then share the join code on screen.
          </p>
        </header>

        <div className="cm-card space-y-4 p-6">
          <Select label="Grade" value={grade} setValue={setGrade} opts={[1, 2, 3, 4, 5, 6, 7, 8]} />
          <Select label="Difficulty" value={difficulty} setValue={setDifficulty} opts={[1, 2, 3, 4, 5]} />
          <Select label="Questions" value={count} setValue={setCount} opts={[5, 8, 10, 15, 20]} />
          {error && (
            <p className="rounded-xl bg-cm-red-soft px-3 py-2 text-sm font-medium text-cm-red">{error}</p>
          )}
          <button
            onClick={createSession}
            disabled={busy}
            className="cm-btn coral lg w-full disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create session"}
          </button>
        </div>

        {isSuperadmin && (
          <div className="rounded-2xl border border-cm-gold bg-cm-gold-soft/50 p-6 dark:border-cm-gold/40 dark:bg-cm-gold/10">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-cm-gold">
              ⚙ Superadmin — moderate any session
            </h2>
            <div className="mt-3 flex gap-2">
              <input
                value={moderateCode}
                onChange={(e) => setModerateCode(e.target.value.toUpperCase())}
                placeholder="SESSION CODE"
                aria-label="Session code to moderate"
                maxLength={6}
                className="flex-1 rounded-xl border border-cm-gold/60 bg-white px-3 py-2 font-mono text-sm tracking-widest text-slate-900 dark:border-cm-gold/40 dark:bg-slate-800 dark:text-white"
              />
              <button
                onClick={() => attach(moderateCode)}
                className="rounded-xl bg-cm-gold px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
              >
                Moderate
              </button>
            </div>
            <button
              onClick={loadActive}
              className="mt-3 text-xs font-semibold text-cm-gold underline"
            >
              Refresh active sessions ({active.length})
            </button>
            <ul className="mt-2 space-y-1">
              {active.map((a) => (
                <li key={a.code}>
                  <button
                    onClick={() => attach(a.code)}
                    className="flex w-full items-center justify-between rounded-xl bg-white px-3 py-2 text-sm hover:bg-cm-gold-soft dark:bg-slate-800 dark:hover:bg-slate-700"
                  >
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{a.code}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {a.hostName} · {a.phase} · {a.participantCount} players
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    );
  }

  // ---- live screen ------------------------------------------------------
  const phase = snap?.phase ?? "lobby";

  return (
    <main className="mx-auto max-w-3xl space-y-5">
      <section className="rounded-2xl border-2 border-cm-blue bg-cm-blue-50 p-6 text-center dark:border-cm-blue/50 dark:bg-cm-blue/15">
        {moderating && (
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-cm-gold">
            ⚙ Moderating as superadmin
          </p>
        )}
        <p className="text-xs font-semibold uppercase tracking-wide text-cm-blue-600 dark:text-cm-blue-500">
          Join at {joinUrl} with code
        </p>
        <p className="font-mono mt-1 text-6xl font-bold tracking-[0.25em] text-cm-blue-600 dark:text-cm-blue-500">
          {code}
        </p>
        <p className="mt-2 text-sm text-cm-blue-600 dark:text-cm-blue-500">
          {snap?.participantCount ?? 0} joined
          {phase !== "lobby" && ` · Q${(snap?.index ?? 0) + 1}/${snap?.total ?? 0}`}
          {phase === "question" && ` · ${snap?.answeredCount ?? 0} answered`}
        </p>
      </section>

      {phase === "question" && snap && (
        <Countdown endsAt={snap.endsAt} paused={snap.paused} remainingMs={snap.remainingMs} />
      )}

      {snap?.question && phase !== "lobby" && (
        <section className="cm-card p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{snap.question.unit}</p>
          <p className="font-display mt-1 text-2xl leading-tight tracking-tight text-slate-900 dark:text-slate-100">
            {snap.question.prompt}
          </p>
          <div className="mt-3 space-y-2">
            {Object.entries(snap.question.options).map(([k, v]) => {
              const isCorrect = phase === "reveal" && snap.question?.correct === k;
              const picks = snap.distribution?.[k] ?? 0;
              const totalPicks = snap.distribution
                ? Object.values(snap.distribution).reduce((a, n) => a + n, 0)
                : 0;
              const pct = totalPicks > 0 ? Math.round((picks / totalPicks) * 100) : 0;
              return (
                <div
                  key={k}
                  className={`rounded-xl border px-3 py-2 text-sm ${
                    isCorrect
                      ? "border-cm-mint bg-cm-mint-soft text-slate-900 dark:bg-cm-mint/20 dark:text-cm-mint"
                      : "border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>
                      <span className="font-mono text-xs text-slate-500">{k}</span> {v}
                      {isCorrect && <span className="ml-2 font-semibold">✓</span>}
                    </span>
                    {phase === "reveal" && (
                      <span className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {picks} ({pct}%)
                      </span>
                    )}
                  </div>
                  {phase === "reveal" && (
                    <div className="cm-bar mt-1">
                      <i
                        style={{
                          width: `${pct}%`,
                          background: isCorrect ? "var(--cm-mint)" : "var(--cm-blue)",
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {error && (
        <p className="rounded-xl bg-cm-red-soft px-3 py-2 text-sm font-medium text-cm-red">{error}</p>
      )}

      {/* Flow controls */}
      <section className="flex flex-wrap gap-2">
        {phase === "lobby" && (
          <Ctl onClick={() => host("start")} disabled={(snap?.participantCount ?? 0) === 0}>
            Start quiz
          </Ctl>
        )}
        {phase === "question" && <Ctl onClick={() => host("reveal")}>Reveal answer</Ctl>}
        {phase === "reveal" && (
          <Ctl onClick={() => host("next")}>
            {(snap?.index ?? 0) + 1 < (snap?.total ?? 0) ? "Next question →" : "Finish"}
          </Ctl>
        )}
      </section>

      {/* Moderation controls — host or superadmin */}
      {phase !== "ended" && (
        <section className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Controls
          </span>
          {phase === "question" && (
            <>
              <Mod onClick={() => host(snap?.paused ? "resume" : "pause")}>
                {snap?.paused ? "▶ Resume" : "⏸ Pause"}
              </Mod>
              <Mod onClick={() => host("addtime")}>＋15s</Mod>
              <Mod onClick={() => host("skip")}>⏭ Skip</Mod>
            </>
          )}
          <Mod onClick={() => host("end")} danger>
            ■ End session
          </Mod>
        </section>
      )}

      {/* Roster with kick */}
      <section className="cm-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Players ({snap?.roster.length ?? 0})
        </h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {(snap?.roster ?? []).map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pl-3 pr-1 text-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <span className="text-slate-800 dark:text-slate-100">{p.name}</span>
              {phase !== "ended" && (
                <button
                  onClick={() => host("kick", p.id)}
                  aria-label={`Remove ${p.name}`}
                  title={`Remove ${p.name}`}
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-cm-red-soft text-xs font-bold text-cm-red hover:opacity-80"
                >
                  ×
                </button>
              )}
            </li>
          ))}
          {(snap?.roster ?? []).length === 0 && (
            <li className="text-sm text-slate-500 dark:text-slate-400">Waiting for players…</li>
          )}
        </ul>
      </section>

      {/* Leaderboard */}
      <section className="cm-card p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {phase === "ended" ? "🏆 Final results" : "Leaderboard"}
        </h2>
        <ol className="mt-3 space-y-1.5">
          {(snap?.leaderboard ?? []).map((p, i) => (
            <li
              key={p.name + i}
              className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm dark:bg-slate-900"
            >
              <span className="font-medium text-slate-800 dark:text-slate-100">
                {i + 1}. {p.name}
              </span>
              <span className="font-mono font-bold text-cm-blue-600 dark:text-cm-blue-500">{p.score}</span>
            </li>
          ))}
          {(snap?.leaderboard ?? []).length === 0 && (
            <li className="text-sm text-slate-500 dark:text-slate-400">No scores yet.</li>
          )}
        </ol>
      </section>
    </main>
  );
}

// Live countdown — ticks every 250ms off the absolute endsAt timestamp.
function Countdown({
  endsAt,
  paused,
  remainingMs,
}: {
  endsAt: number | null;
  paused: boolean;
  remainingMs: number;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [paused]);

  const ms = paused ? remainingMs : Math.max(0, (endsAt ?? now) - now);
  const secs = Math.ceil(ms / 1000);
  const low = secs <= 5;
  return (
    <div
      className={`font-mono rounded-2xl border-2 px-4 py-3 text-center text-3xl font-bold ${
        paused
          ? "border-cm-gold bg-cm-gold-soft text-cm-gold"
          : low
            ? "border-cm-red bg-cm-red-soft text-cm-red"
            : "border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
      }`}
    >
      {paused ? `⏸ Paused — ${secs}s left` : `⏱ ${secs}s`}
    </div>
  );
}

function Select({
  label, value, setValue, opts,
}: { label: string; value: number; setValue: (n: number) => void; opts: number[] }) {
  return (
    <label className="block text-sm">
      <span className="cm-label">{label}</span>
      <select
        value={value}
        onChange={(e) => setValue(parseInt(e.target.value, 10))}
        className="cm-field"
      >
        {opts.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

function Ctl({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} className="cm-btn coral disabled:opacity-50">
      {children}
    </button>
  );
}

function Mod({ onClick, danger, children }: { onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
        danger
          ? "border border-cm-red/40 bg-white text-cm-red hover:bg-cm-red-soft dark:bg-slate-800"
          : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
      }`}
    >
      {children}
    </button>
  );
}
