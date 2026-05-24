"use client";

import { use, useEffect, useRef, useState } from "react";

type Snapshot = {
  phase: "lobby" | "question" | "reveal" | "ended";
  index: number;
  total: number;
  participantCount: number;
  paused: boolean;
  endsAt: number | null;
  remainingMs: number;
  roster: { id: string; name: string }[];
  question: {
    prompt: string;
    options: Record<string, string>;
    unit: string;
    correct?: string;
  } | null;
  distribution: Record<string, number> | null;
  leaderboard: { name: string; score: number }[];
};

export default function LivePlayPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [kicked, setKicked] = useState(false);
  const lastIndex = useRef(-1);

  // Read token + id from sessionStorage AND open the SSE stream in one effect,
  // so the EventSource URL carries the token. The server uses that token to
  // track presence — closing the tab causes a clean disconnect, which removes
  // the player from the host's roster (after a short grace window).
  useEffect(() => {
    const tok = sessionStorage.getItem(`live:${code}`);
    setToken(tok);
    setMyId(sessionStorage.getItem(`live:${code}:id`));
    const url = tok
      ? `/api/live/${code}/events?token=${encodeURIComponent(tok)}`
      : `/api/live/${code}/events`;
    const es = new EventSource(url);
    es.onmessage = (e) => {
      try {
        setSnap(JSON.parse(e.data) as Snapshot);
      } catch {
        /* keep-alive ping */
      }
    };
    return () => es.close();
  }, [code]);

  // New question → clear my pick.
  useEffect(() => {
    if (snap && snap.index !== lastIndex.current) {
      lastIndex.current = snap.index;
      setPicked(null);
    }
  }, [snap]);

  // Kick detection: once we know our id, if we drop out of the roster while
  // the session is still live, we've been removed.
  useEffect(() => {
    if (!snap || !myId || snap.phase === "ended") return;
    if (snap.roster.length > 0 && !snap.roster.some((r) => r.id === myId)) {
      setKicked(true);
    }
  }, [snap, myId]);

  async function answer(choice: string) {
    if (picked || !token) return;
    setPicked(choice);
    await fetch(`/api/live/${code}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, choice }),
    });
  }

  if (kicked) {
    return (
      <Centered>
        <p className="text-2xl font-extrabold text-rose-700 dark:text-rose-300">
          You&apos;ve been removed
        </p>
        <p className="mt-2 text-amber-800 dark:text-amber-200">
          The host removed you from this session.
        </p>
      </Centered>
    );
  }
  if (!snap) return <Centered>Connecting…</Centered>;
  if (!token) {
    return (
      <Centered>
        <p>You haven&apos;t joined this session.</p>
        <a href={`/live/join?code=${code}`} className="mt-3 inline-block font-bold text-amber-700 underline">
          Join now →
        </a>
      </Centered>
    );
  }

  if (snap.phase === "lobby") {
    return (
      <Centered>
        <p className="text-2xl font-extrabold text-amber-900 dark:text-amber-100">You&apos;re in! 🎉</p>
        <p className="mt-2 text-amber-800 dark:text-amber-200">
          {snap.participantCount} players waiting. The host will start soon…
        </p>
      </Centered>
    );
  }

  if (snap.phase === "ended") {
    const top = snap.leaderboard.slice(0, 5);
    return (
      <main className="mx-auto max-w-md space-y-4 pt-10 text-center">
        <h1 className="text-3xl font-extrabold text-amber-900 dark:text-amber-100">🏆 Final results</h1>
        <ol className="space-y-2">
          {top.map((p, i) => (
            <li
              key={p.name + i}
              className="flex items-center justify-between rounded-xl border-2 border-amber-200 bg-white px-4 py-3 text-lg dark:border-amber-800/50 dark:bg-amber-950/20"
            >
              <span className="font-bold text-slate-800 dark:text-slate-100">
                {["🥇", "🥈", "🥉"][i] ?? `${i + 1}.`} {p.name}
              </span>
              <span className="font-extrabold text-amber-700 dark:text-amber-300">{p.score}</span>
            </li>
          ))}
        </ol>
      </main>
    );
  }

  // question / reveal
  const q = snap.question!;
  const revealed = snap.phase === "reveal";
  const totalPicks = snap.distribution
    ? Object.values(snap.distribution).reduce((a, n) => a + n, 0)
    : 0;

  return (
    <main className="mx-auto max-w-md space-y-4 pt-6">
      <div className="text-center text-sm font-semibold text-amber-700 dark:text-amber-300">
        Question {snap.index + 1} of {snap.total}
      </div>

      {!revealed && (
        <PlayerCountdown endsAt={snap.endsAt} paused={snap.paused} remainingMs={snap.remainingMs} />
      )}

      <h1 className="text-center text-2xl font-extrabold text-slate-900 dark:text-slate-100">{q.prompt}</h1>

      <div className="grid grid-cols-1 gap-3">
        {Object.entries(q.options).map(([k, v]) => {
          const isCorrect = revealed && q.correct === k;
          const isMine = picked === k;
          const picks = snap.distribution?.[k] ?? 0;
          const pct = totalPicks > 0 ? Math.round((picks / totalPicks) * 100) : 0;
          const tone = revealed
            ? isCorrect
              ? "border-emerald-500 bg-emerald-50 text-emerald-900"
              : isMine
                ? "border-rose-500 bg-rose-50 text-rose-900"
                : "border-amber-200 bg-white text-slate-500"
            : isMine
              ? "border-amber-500 bg-amber-100 text-amber-900"
              : "border-amber-200 bg-white text-slate-900 hover:border-amber-400";
          return (
            <button
              key={k}
              disabled={!!picked || revealed || snap.paused}
              onClick={() => answer(k)}
              className={`rounded-2xl border-2 px-4 py-4 text-left text-lg font-semibold disabled:cursor-default ${tone}`}
            >
              <div className="flex items-center justify-between">
                <span>
                  <span className="mr-2 font-mono text-base text-amber-700">{k}</span>
                  {v}
                  {revealed && isCorrect && <span className="ml-2">✓</span>}
                </span>
                {revealed && <span className="text-sm font-bold">{pct}%</span>}
              </div>
              {revealed && (
                <div className="mt-2 h-2 w-full rounded-full bg-black/10">
                  <div
                    className={`h-full rounded-full ${isCorrect ? "bg-emerald-500" : "bg-amber-400"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {snap.paused && !revealed && (
        <p className="rounded-xl bg-amber-100 px-4 py-3 text-center text-sm font-bold text-amber-900">
          ⏸ The host paused the game…
        </p>
      )}
      {picked && !revealed && !snap.paused && (
        <p className="text-center text-sm font-semibold text-amber-700 dark:text-amber-300">
          Answer locked in — hang tight! ⏳
        </p>
      )}
    </main>
  );
}

function PlayerCountdown({
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
  return (
    <div
      className={`mx-auto w-20 rounded-full py-1 text-center text-lg font-extrabold ${
        secs <= 5 && !paused
          ? "bg-rose-100 text-rose-700"
          : "bg-amber-100 text-amber-800"
      }`}
    >
      {secs}s
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center justify-center pt-20 text-center">
      {children}
    </main>
  );
}
