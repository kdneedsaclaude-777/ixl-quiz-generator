// In-memory Live Classroom session registry. Correct for a single instance
// (the demo / one Next process); for multi-instance this would move behind
// Redis pub/sub with the same function surface. Sessions are ephemeral.

export type LivePhase = "lobby" | "question" | "reveal" | "ended";

export type LiveQuestion = {
  prompt: string;
  options: Record<string, string>;
  correct: string; // option key — never sent to clients mid-question
  unit: string;
  skillTitle: string;
};

export type Participant = {
  token: string; // secret, held by the player
  id: string; // public short id — used for roster display + kick
  name: string;
  score: number;
  answered: Map<number, { choice: string; correct: boolean }>;
  // Presence tracking. liveConnections counts open SSE streams for this
  // participant (a kid with two tabs has 2). On 0 we schedule a grace-period
  // removal — short enough that the host sees them vanish, long enough that
  // a refresh or 2s network blip doesn't kick them.
  liveConnections: number;
  disconnectTimer: ReturnType<typeof setTimeout> | null;
};

type Subscriber = (payload: string) => void;

export type LiveSession = {
  code: string;
  hostUserId: string;
  hostName: string;
  questions: LiveQuestion[];
  index: number; // -1 in lobby; 0-based once started
  phase: LivePhase;
  questionMs: number; // duration of the CURRENT question (extended by add-time)
  questionStartedAt: number; // epoch ms; shifts forward on resume
  paused: boolean;
  pausedAt: number; // epoch ms when the pause began (0 when running)
  revealTimer: ReturnType<typeof setTimeout> | null;
  participants: Map<string, Participant>; // keyed by secret token
  subscribers: Set<Subscriber>;
  createdAt: number;
};

export const DEFAULT_QUESTION_MS = 25_000;
export const ADD_TIME_MS = 15_000;

// ---- pure helpers (unit-tested, no shared state) -----------------------

// Kahoot-style: a correct answer is 500 pts + up to 500 for speed; wrong is 0.
export function scoreAnswer(
  correct: boolean,
  elapsedMs: number,
  limitMs: number = DEFAULT_QUESTION_MS,
): number {
  if (!correct) return 0;
  const frac = Math.min(1, Math.max(0, elapsedMs / Math.max(1, limitMs)));
  return 500 + Math.round(500 * (1 - frac));
}

export function leaderboard(
  participants: Iterable<Participant>,
  top = 10,
): { name: string; score: number }[] {
  return [...participants]
    .map((p) => ({ name: p.name, score: p.score }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, top);
}

// Allowed host transitions. Returns the next phase/index or null if invalid.
export function nextPhase(
  current: LivePhase,
  action: "start" | "reveal" | "next" | "skip" | "end",
  index: number,
  total: number,
): { phase: LivePhase; index: number } | null {
  if (action === "end") return { phase: "ended", index };
  if (action === "start" && current === "lobby" && total > 0)
    return { phase: "question", index: 0 };
  if (action === "reveal" && current === "question")
    return { phase: "reveal", index };
  if (action === "next" && current === "reveal") {
    return index + 1 < total
      ? { phase: "question", index: index + 1 }
      : { phase: "ended", index };
  }
  // Skip jumps straight past the live question without revealing it.
  if (action === "skip" && current === "question") {
    return index + 1 < total
      ? { phase: "question", index: index + 1 }
      : { phase: "ended", index };
  }
  return null;
}

// Remaining ms on the current question, accounting for a pause.
export function remainingMs(s: LiveSession, now: number): number {
  if (s.phase !== "question") return 0;
  const reference = s.paused ? s.pausedAt : now;
  return Math.max(0, s.questionStartedAt + s.questionMs - reference);
}

// Per-option pick counts for a question index.
export function distributionFor(
  s: LiveSession,
  index: number,
): Record<string, number> {
  const out: Record<string, number> = {};
  const q = s.questions[index];
  if (q) for (const k of Object.keys(q.options)) out[k] = 0;
  for (const p of s.participants.values()) {
    const a = p.answered.get(index);
    if (a && a.choice in out) out[a.choice] += 1;
  }
  return out;
}

function randomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/I/1
  let c = "";
  for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
}
function randomToken(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}
function randomId(): string {
  return Math.random().toString(36).slice(2, 8);
}

// ---- the registry -------------------------------------------------------

// Pinned to globalThis so every API route bundle (and HMR reload in dev)
// shares ONE registry — a plain module-level Map gets re-instantiated per
// route bundle in Next, which would make sessions vanish between requests.
const globalForLive = globalThis as unknown as {
  __liveSessions?: Map<string, LiveSession>;
};
const sessions: Map<string, LiveSession> =
  globalForLive.__liveSessions ?? (globalForLive.__liveSessions = new Map());

const SESSION_TTL_MS = 3 * 60 * 60 * 1000;

function prune(): void {
  const now = Date.now();
  for (const [code, s] of sessions) {
    if (now - s.createdAt > SESSION_TTL_MS) {
      if (s.revealTimer) clearTimeout(s.revealTimer);
      sessions.delete(code);
    }
  }
}

export function createSession(args: {
  hostUserId: string;
  hostName: string;
  questions: LiveQuestion[];
}): LiveSession {
  prune();
  let code = randomCode();
  while (sessions.has(code)) code = randomCode();
  const session: LiveSession = {
    code,
    hostUserId: args.hostUserId,
    hostName: args.hostName,
    questions: args.questions,
    index: -1,
    phase: "lobby",
    questionMs: DEFAULT_QUESTION_MS,
    questionStartedAt: 0,
    paused: false,
    pausedAt: 0,
    revealTimer: null,
    participants: new Map(),
    subscribers: new Set(),
    createdAt: Date.now(),
  };
  sessions.set(code, session);
  return session;
}

export function getSession(code: string): LiveSession | undefined {
  return sessions.get(code?.toUpperCase?.() ?? code);
}

// Superadmin oversight: list every running session.
export function listSessions(): {
  code: string;
  hostName: string;
  phase: LivePhase;
  participantCount: number;
  index: number;
  total: number;
}[] {
  return [...sessions.values()].map((s) => ({
    code: s.code,
    hostName: s.hostName,
    phase: s.phase,
    participantCount: s.participants.size,
    index: s.index,
    total: s.questions.length,
  }));
}

// Late join allowed any time before the session ends — latecomers simply
// start at 0 and miss the questions already played.
export function joinSession(
  code: string,
  name: string,
): { ok: true; token: string; id: string } | { ok: false; error: string } {
  const s = getSession(code);
  if (!s) return { ok: false, error: "Session not found." };
  if (s.phase === "ended") return { ok: false, error: "This session has ended." };
  const clean = name.trim().slice(0, 24);
  if (!clean) return { ok: false, error: "Enter a name." };
  const token = randomToken();
  const id = randomId();
  s.participants.set(token, {
    token,
    id,
    name: clean,
    score: 0,
    answered: new Map(),
    liveConnections: 0,
    disconnectTimer: null,
  });
  broadcast(s);
  return { ok: true, token, id };
}

export function submitAnswer(
  code: string,
  token: string,
  choice: string,
): { ok: boolean; error?: string } {
  const s = getSession(code);
  if (!s) return { ok: false, error: "Session not found." };
  if (s.phase !== "question") return { ok: false, error: "Not accepting answers." };
  if (s.paused) return { ok: false, error: "The game is paused." };
  const p = s.participants.get(token);
  if (!p) return { ok: false, error: "You are not in this session." };
  if (p.answered.has(s.index)) return { ok: true }; // first answer locks in
  const q = s.questions[s.index];
  const correct = choice === q.correct;
  p.answered.set(s.index, { choice, correct });
  p.score += scoreAnswer(correct, Date.now() - s.questionStartedAt, s.questionMs);

  // Auto-reveal the moment everyone has answered (don't make the host wait).
  const everyone =
    s.participants.size > 0 &&
    [...s.participants.values()].every((x) => x.answered.has(s.index));
  if (everyone) {
    revealNow(s);
  } else {
    broadcast(s);
  }
  return { ok: true };
}

// --- timer plumbing ------------------------------------------------------

function clearRevealTimer(s: LiveSession): void {
  if (s.revealTimer) {
    clearTimeout(s.revealTimer);
    s.revealTimer = null;
  }
}

function scheduleReveal(s: LiveSession, delayMs: number): void {
  clearRevealTimer(s);
  const forIndex = s.index;
  s.revealTimer = setTimeout(() => {
    // Only fire if still the same live question.
    if (s.phase === "question" && s.index === forIndex && !s.paused) {
      revealNow(s);
    }
  }, Math.max(0, delayMs));
}

function revealNow(s: LiveSession): void {
  clearRevealTimer(s);
  s.phase = "reveal";
  s.paused = false;
  s.pausedAt = 0;
  broadcast(s);
}

function beginQuestion(s: LiveSession, index: number): void {
  s.phase = "question";
  s.index = index;
  s.questionMs = DEFAULT_QUESTION_MS;
  s.questionStartedAt = Date.now();
  s.paused = false;
  s.pausedAt = 0;
  scheduleReveal(s, s.questionMs);
}

// host = the session creator; superadmins may moderate ANY session.
export function hostAction(
  code: string,
  userId: string,
  isSuperadmin: boolean,
  action: "start" | "reveal" | "next" | "skip" | "end" | "pause" | "resume" | "addtime" | "kick",
  participantId?: string,
): { ok: boolean; error?: string } {
  const s = getSession(code);
  if (!s) return { ok: false, error: "Session not found." };
  if (s.hostUserId !== userId && !isSuperadmin) {
    return { ok: false, error: "Only the host or a superadmin can do that." };
  }

  // Moderation actions that don't move the phase.
  if (action === "pause") {
    if (s.phase !== "question" || s.paused)
      return { ok: false, error: "Nothing to pause." };
    s.paused = true;
    s.pausedAt = Date.now();
    clearRevealTimer(s);
    broadcast(s);
    return { ok: true };
  }
  if (action === "resume") {
    if (!s.paused) return { ok: false, error: "The game isn't paused." };
    const pausedFor = Date.now() - s.pausedAt;
    s.questionStartedAt += pausedFor; // keeps elapsed/scoring honest
    s.paused = false;
    s.pausedAt = 0;
    scheduleReveal(s, remainingMs(s, Date.now()));
    broadcast(s);
    return { ok: true };
  }
  if (action === "addtime") {
    if (s.phase !== "question") return { ok: false, error: "No live question." };
    s.questionMs += ADD_TIME_MS;
    if (!s.paused) scheduleReveal(s, remainingMs(s, Date.now()));
    broadcast(s);
    return { ok: true };
  }
  if (action === "kick") {
    const entry = [...s.participants.entries()].find(
      ([, p]) => p.id === participantId,
    );
    if (!entry) return { ok: false, error: "Player not found." };
    s.participants.delete(entry[0]);
    broadcast(s);
    return { ok: true };
  }

  // Phase transitions.
  const t = nextPhase(s.phase, action, s.index, s.questions.length);
  if (!t) return { ok: false, error: "Invalid action for the current phase." };
  if (t.phase === "question") {
    beginQuestion(s, t.index);
  } else {
    clearRevealTimer(s);
    s.phase = t.phase;
    s.index = t.index;
    s.paused = false;
    s.pausedAt = 0;
  }
  broadcast(s);
  return { ok: true };
}

// How long to wait after the last SSE stream for a participant closes before
// we remove them from the roster. Short enough that the host sees ghosts
// vanish quickly, long enough to survive a page refresh or brief disconnect.
const PARTICIPANT_GRACE_MS = 8_000;

// `participantToken` ties the SSE subscriber to a participant so we can
// detect when they disconnect. Host subscribers omit it.
export function subscribe(
  code: string,
  fn: Subscriber,
  opts: { participantToken?: string } = {},
): () => void {
  const s = getSession(code);
  if (!s) return () => {};
  s.subscribers.add(fn);

  const p = opts.participantToken
    ? s.participants.get(opts.participantToken)
    : undefined;
  if (p) {
    p.liveConnections += 1;
    if (p.disconnectTimer) {
      clearTimeout(p.disconnectTimer);
      p.disconnectTimer = null;
    }
  }

  return () => {
    s.subscribers.delete(fn);
    if (!p) return;
    p.liveConnections = Math.max(0, p.liveConnections - 1);
    if (p.liveConnections === 0) {
      // Schedule removal; cleared if they reconnect within the grace window.
      p.disconnectTimer = setTimeout(() => {
        // Re-check the session + participant still exist and they really
        // haven't reconnected before pulling them.
        const cur = getSession(code);
        const stillP = cur?.participants.get(p.token);
        if (cur && stillP && stillP.liveConnections === 0) {
          cur.participants.delete(p.token);
          broadcast(cur);
        }
      }, PARTICIPANT_GRACE_MS);
    }
  };
}

// Public, role-safe view. The correct answer + distribution are only included
// once the host moves to "reveal" — never while the question is live.
export function snapshot(code: string): unknown {
  const s = getSession(code);
  if (!s) return { error: "not_found" };
  const now = Date.now();
  const q = s.index >= 0 ? s.questions[s.index] : null;
  const answeredCount =
    q && s.index >= 0
      ? [...s.participants.values()].filter((p) => p.answered.has(s.index)).length
      : 0;
  return {
    code: s.code,
    phase: s.phase,
    index: s.index,
    total: s.questions.length,
    participantCount: s.participants.size,
    answeredCount,
    paused: s.paused,
    // Countdown: clients render from endsAt; when paused they use remainingMs.
    endsAt: s.phase === "question" ? s.questionStartedAt + s.questionMs : null,
    remainingMs: remainingMs(s, now),
    roster: [...s.participants.values()].map((p) => ({ id: p.id, name: p.name })),
    question: q
      ? {
          prompt: q.prompt,
          options: q.options,
          unit: q.unit,
          skillTitle: q.skillTitle,
          correct: s.phase === "reveal" ? q.correct : undefined,
        }
      : null,
    distribution: s.phase === "reveal" && s.index >= 0 ? distributionFor(s, s.index) : null,
    leaderboard: leaderboard(s.participants.values()),
  };
}

function broadcast(s: LiveSession): void {
  const payload = `data: ${JSON.stringify(snapshot(s.code))}\n\n`;
  for (const fn of s.subscribers) {
    try {
      fn(payload);
    } catch {
      s.subscribers.delete(fn);
    }
  }
}

// Test hook.
export function _resetSessions(): void {
  for (const s of sessions.values()) if (s.revealTimer) clearTimeout(s.revealTimer);
  sessions.clear();
}
